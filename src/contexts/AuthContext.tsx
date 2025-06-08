import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Keychain from 'react-native-keychain';
import * as Passkey from 'react-native-passkey';
import { apiService } from '../services/api';
import { User, WalletConnectConfig, UseAuthReturn } from '../types';

const AUTH_SESSION_KEY = 'interspace_session';

interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  deviceId: string;
  createdAt: string;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue extends UseAuthReturn {}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';

  useEffect(() => {
    apiService.setAuthExpiredHandler(() => logout());
  }, []);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState('loading');
      const sessionData = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionData) {
        setAuthState('unauthenticated');
        return;
      }
      const session: AuthSession = JSON.parse(sessionData);
      if (Date.now() > session.expiresAt) {
        await clearAllAuthData();
        setAuthState('unauthenticated');
        return;
      }
      const valid = await validateSession(session);
      if (!valid) {
        await clearAllAuthData();
        setAuthState('unauthenticated');
        return;
      }
      setUser(session.user);
      setAuthState('authenticated');
    } catch {
      await clearAllAuthData();
      setAuthState('unauthenticated');
    }
  };

  const validateSession = async (session: AuthSession): Promise<boolean> => {
    try {
      await Keychain.setGenericPassword('token', session.accessToken, { service: 'interspace_access_token' });
      await Keychain.setGenericPassword('refresh', session.refreshToken, { service: 'interspace_refresh_token' });
      const refreshed = await apiService.refreshToken();
      if (refreshed) return true;
      await apiService.getProfiles();
      return true;
    } catch {
      return false;
    }
  };

  const login = async (config: WalletConnectConfig, onSuccess?: () => void): Promise<void> => {
    try {
      setAuthState('loading');
      setError(null);
      let providerToken = '';
      if (config.strategy === 'google') {
        const result = await Google.logInAsync({
          clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
          scopes: ['profile', 'email'],
        });
        if (result.type !== 'success') throw new Error('Google login cancelled');
        providerToken = result.idToken || '';
      } else if (config.strategy === 'apple') {
        const res = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });
        providerToken = res.identityToken || '';
      } else if (config.strategy === 'passkey') {
        const cred = await Passkey.create({ challenge: 'authenticate', user: { id: 'user', name: 'interspace' } });
        const signRes = await Passkey.sign({ credentialId: cred.id, challenge: 'authenticate' });
        providerToken = signRes.signature;
      } else if (config.strategy === 'email') {
        if (!config.verificationCode) throw new Error('Verification code required');
        providerToken = config.verificationCode;
      }

      const authResponse = await apiService.authenticate({
        authToken: providerToken,
        authStrategy: config.strategy,
        email: config.email,
      });

      const userData: User = {
        id: extractUserIdFromToken(authResponse.accessToken),
        email: config.email,
        walletAddress: undefined,
        isGuest: false,
        authStrategies: [config.strategy],
        profilesCount: 0,
        linkedAccountsCount: 0,
        activeDevicesCount: 1,
        socialAccounts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const session: AuthSession = {
        user: userData,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        expiresAt: Date.now() + authResponse.expiresIn * 1000,
        deviceId: 'mobile_device',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      await Keychain.setGenericPassword('token', authResponse.accessToken, { service: 'interspace_access_token' });
      await Keychain.setGenericPassword('refresh', authResponse.refreshToken, { service: 'interspace_refresh_token' });
      apiService.setAccessToken(authResponse.accessToken);

      setUser(userData);
      setAuthState('authenticated');
      onSuccess?.();
    } catch (err: any) {
      await handleAuthError(err);
      throw err;
    }
  };

  const loginWithWallet = async (wallet: any, onSuccess?: () => void) => {
    const config: WalletConnectConfig = {
      strategy: 'wallet',
      wallet,
    };
    await login(config, onSuccess);
  };

  const loginWithWalletConnect = async (uri: string, onSuccess?: () => void) => {
    const wallet = createWallet('walletConnect' as any, { uri });
    const config: WalletConnectConfig = {
      strategy: 'wallet',
      wallet,
      walletConnectUri: uri,
    };
    await login(config, onSuccess);
  };

  const connectWallet = async (config: WalletConnectConfig) => {
    if (config.strategy === 'wallet' && config.testWallet) {
      // Test wallet authentication with SIWE
      return await connectTestWallet(config);
    } else if (config.strategy === 'wallet' && config.wallet) {
      // External wallet authentication with SIWE
      return await connectExternalWallet(config);
    } else {
      // In-app wallet authentication
      return await connectInAppWallet(config);
    }
  };

  const connectTestWallet = async (config: WalletConnectConfig) => {
    const testWallet = config.testWallet!;
    console.log('🧪 Authenticating test wallet with SIWE:', testWallet.address);

    // Create account from private key
    const testAccount = privateKeyToAccount({
      client,
      privateKey: testWallet.privateKey,
    });

    // Generate SIWE payload
    const payload = await thirdwebAuth.generatePayload({
      address: testAccount.address,
      chainId: DEFAULT_CHAIN.id,
    });

    // Sign the message
    const message = `${payload.domain} wants you to sign in with your Ethereum account:\n${payload.address}\n\n${payload.statement || 'Sign in to Interspace'}\n\nURI: ${payload.uri}\nVersion: ${payload.version}\nChain ID: ${payload.chain_id}\nNonce: ${payload.nonce}\nIssued At: ${payload.issued_at}`;
    
    const signature = await testAccount.signMessage({ message });
    console.log('✅ SIWE signature completed for test wallet');

    // Don't use guest wallet for session management as it persists across users
    // Instead, use the test wallet directly with external wallet strategy
    const wallet = await connect(async () => {
      // Create a wallet instance from the test wallet
      const testWalletInstance = createWallet('io.metamask');
      
      // Inject the test account into the wallet
      (testWalletInstance as any)._testAccount = testAccount;
      (testWalletInstance as any).getAccount = () => testAccount;
      
      return testWalletInstance;
    });

    if (!wallet) throw new Error('Failed to connect test wallet session');

    return {
      wallet,
      authToken: `siwe_${signature}_${Date.now()}`,
      walletAddress: testAccount.address,
    };
  };

  const connectExternalWallet = async (config: WalletConnectConfig) => {
    console.log('👛 Connecting external wallet...');
    
    // Declare wallet variable outside try block so it's accessible in catch
    let wallet;
    
    try {
      wallet = await connect(async () => {
        const extWallet = config.wallet!;
        await extWallet.connect({
          client,
          chain: config.chain || DEFAULT_CHAIN,
        });
        return extWallet;
      });

      if (!wallet) throw new Error('Failed to connect external wallet');
      
      const account = wallet.getAccount();
      if (!account) throw new Error('Failed to get wallet account');

      // Generate SIWE payload with more user-friendly message
      const payload = await thirdwebAuth.generatePayload({
        address: account.address,
        chainId: DEFAULT_CHAIN.id,
        // Statement is added in the message formatting below
      });

      // Format the message for better readability on mobile with custom statement
      const message = `${payload.domain} wants you to sign in with your Ethereum account:
${payload.address}

Sign in to Interspace Wallet to access your SmartProfiles and apps

URI: ${payload.uri}
Version: ${payload.version}
Chain ID: ${payload.chain_id}
Nonce: ${payload.nonce}
Issued At: ${payload.issued_at}`;
      
      console.log('🔏 Requesting signature for SIWE message...');
      
      // Add timeout handling for signing
      const signPromise = account.signMessage({ message });
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error("Signing request timed out after 60 seconds")), 60000)
      );
      
      const signature = await Promise.race([signPromise, timeoutPromise]);

      // Verify signature
      console.log('✅ Signature received, verifying...');
      const verifiedPayload = await thirdwebAuth.verifyPayload({ payload, signature });
      if (!verifiedPayload.valid) {
        throw new Error('SIWE signature verification failed');
      }

      console.log('✅ External wallet SIWE completed successfully');

      return {
        wallet,
        authToken: `siwe_${signature}_${Date.now()}`,
        walletAddress: account.address,
      };
    } catch (error: any) {
      console.error('❌ SIWE authentication failed:', error);
      
      // Store wallet reference for cleanup
      let walletToDisconnect = wallet;
      
      // Disconnect wallet on error to clean up state
      if (walletToDisconnect) {
        try {
          console.log('🔌 Disconnecting wallet after error');
          disconnect(walletToDisconnect);
        } catch (disconnectError) {
          console.warn('⚠️ Failed to disconnect wallet after error:', disconnectError);
        }
      }
      
      // Enhance error message for common issues
      if (error.message?.includes('User rejected')) {
        throw new Error('You cancelled the signature request');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Signature request timed out. Please try again');
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again');
      }
      
      throw error;
    }
  };

  const connectInAppWallet = async (config: WalletConnectConfig) => {
    console.log('📱 Connecting in-app wallet...');

    // Declare wallet variable outside try block so it's accessible in catch
    let wallet;
    
    try {
      wallet = await connect(async () => {
        // Create in-app wallet with enhanced configuration for social logins
        const inAppOptions: any = {};
        
        // For social logins, add passkeyDomain for React Native
        if ([
          'google',
          'apple',
          'facebook',
          'x',
          'discord',
          'telegram',
          'twitch',
          'farcaster',
          'github',
          'line',
          'coinbase',
          'steam',
          'backend',
        ].includes(config.strategy)) {
          inAppOptions.auth = {
            options: [config.strategy],
            passkeyDomain: "interspace.app", // Required for React Native
            redirectUrl: "interspace://" // For deep linking back to app
          };
        }
        
        const inApp = inAppWallet(inAppOptions);

        if (config.strategy === 'email') {
          if (!config.email || !config.verificationCode) {
            throw new Error('Email and verification code required');
          }
          await inApp.connect({
            client,
            strategy: 'email',
            email: config.email,
            verificationCode: config.verificationCode,
          });
        } else if (config.strategy === 'passkey') {
          console.log('🔄 Connecting with passkey strategy...');
          const stored = await hasStoredPasskey(client);
          await inApp.connect({
            client,
            strategy: 'passkey',
            type: stored ? 'sign-in' : 'sign-up',
          });
        } else {
          console.log(`🔄 Connecting with ${config.strategy} strategy...`);
          await inApp.connect({
            client,
            strategy: config.strategy as any,
          });
        }

        // Log wallet details for debugging
        console.log('🔍 Wallet object keys:', Object.keys(inApp));
        console.log('🔍 Wallet details:', {
          user: (inApp as any).user,
          _user: (inApp as any)._user,
          getUserDetails: typeof (inApp as any).getUserDetails,
          getUser: typeof (inApp as any).getUser,
        });

        return inApp;
      });

      if (!wallet) throw new Error('Failed to connect in-app wallet');
      
      const account = wallet.getAccount();
      if (!account) throw new Error('Failed to get wallet account');

      // Extract social profile for social logins
      let socialProfile = config.socialProfile;
      if ([
        'google',
        'apple',
        'facebook',
        'x',
        'discord',
        'telegram',
        'twitch',
        'farcaster',
        'github',
        'line',
        'coinbase',
        'steam',
        'backend',
      ].includes(config.strategy)) {
        try {
          // Try multiple methods to get user details
          const userDetails = (wallet as any).getUserDetails?.() || 
                            (wallet as any).getUser?.() || 
                            (wallet as any).user || 
                            (wallet as any)._user;
          
          console.log(`🔍 Raw ${config.strategy} user details:`, userDetails);
          
          if (userDetails) {
            socialProfile = {
              id: userDetails.id || userDetails.sub || userDetails.userId || account.address,
              email: userDetails.email,
              name: userDetails.name || userDetails.displayName || userDetails.username,
              picture: userDetails.picture || userDetails.avatar || userDetails.profileImage,
              username: userDetails.username,
              ...userDetails,
            };
          } else {
            // If no user details available, create minimal profile
            console.log(`⚠️ No user details found for ${config.strategy}, creating minimal profile`);
            socialProfile = {
              id: account.address,
              name: config.strategy,
              strategy: config.strategy,
            };
          }
          
          console.log(`📱 Extracted ${config.strategy} profile:`, socialProfile);
        } catch (error) {
          console.warn('⚠️ Failed to extract social profile:', error);
          // Create minimal profile on error
          socialProfile = {
            id: account.address,
            name: config.strategy,
            strategy: config.strategy,
          };
        }
      }

      // Always pass socialProfile for social strategies
      if (
        socialProfile ||
        [
          'google',
          'apple',
          'facebook',
          'x',
          'discord',
          'telegram',
          'twitch',
          'farcaster',
          'github',
          'line',
          'coinbase',
          'steam',
          'backend',
        ].includes(config.strategy)
      ) {
        config.socialProfile = socialProfile || {
          id: account.address,
          name: config.strategy,
          strategy: config.strategy,
        };
        console.log('📤 Passing social profile to backend:', config.socialProfile);
      }

      return {
        wallet,
        authToken: `inapp_${config.strategy}_${account.address}_${Date.now()}`,
        walletAddress: account.address,
      };
    } catch (error: any) {
      console.error(`❌ ${config.strategy} authentication failed:`, error);
      
      // Disconnect wallet on error to clean up state
      if (wallet) {
        try {
          console.log('🔌 Disconnecting wallet after error');
          disconnect(wallet);
        } catch (disconnectError) {
          console.warn('⚠️ Failed to disconnect wallet after error:', disconnectError);
        }
      }
      
      // Enhance error message for common issues
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        throw new Error(`${config.strategy} authentication was cancelled`);
      } else if (error.message?.includes('timeout')) {
        throw new Error(`${config.strategy} authentication timed out. Please try again`);
      } else if (error.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again');
      }
      
      throw error;
    }
  };

  const handleSmartProfileSetup = async (config: WalletConnectConfig, walletAddress: string, wallet?: any) => {
    try {
      console.log('🔧 Setting up SmartProfiles...');

      // Get existing profiles
      const profiles = await apiService.getProfiles();
      let targetProfileId: string;
      let activeProfile: any = null;

      if (profiles.length === 0) {
        // Create default profile for new user
        console.log('🆕 Creating default profile for new user...');
        
        // Create profile through the backend
        const defaultProfile = await apiService.createProfile('Main Profile');
        targetProfileId = defaultProfile.id;
        activeProfile = defaultProfile;
        
        // For social logins, use the social wallet as the profile wallet
        if ([
          'google',
          'apple',
          'facebook',
          'x',
          'discord',
          'telegram',
          'twitch',
          'farcaster',
          'github',
          'line',
          'coinbase',
          'steam',
          'backend',
        ].includes(config.strategy) && wallet) {
          console.log(`📱 Using ${config.strategy} wallet as profile session wallet`);
          await createProfileWallet(defaultProfile, wallet, config.strategy);
        } else {
          // Create guest wallet for the profile
          await createProfileWallet(defaultProfile);
        }
        
        // For new users, auto-link their wallet to the new profile
        if ((config.strategy === 'wallet' || config.testWallet) && walletAddress) {
          console.log('🔗 Auto-linking wallet to new user\'s profile...');
          try {
            await apiService.linkAccount(targetProfileId, {
              address: walletAddress,
              walletType: detectWalletType(config.wallet || config.testWallet?.wallet),
              customName: config.testWallet ? 'Test Wallet' : 'Primary Wallet',
              isPrimary: true
            });
            console.log('✅ Wallet auto-linked to new profile');
          } catch (linkError) {
            console.warn('⚠️ Auto-linking failed for new user:', linkError);
          }
        }
        
        // Activate the profile
        await apiService.activateProfile(targetProfileId);
      } else {
        // Existing user - find active profile
        activeProfile = profiles.find(p => p.isActive);
        
        // Check if wallet is already linked to ANY profile
        console.log('🔍 Checking if wallet is already linked to any profile...');
        
        let walletAlreadyLinked = false;
        let linkedToProfileName = '';
        let linkedProfileId = '';
        
        if ((config.strategy === 'wallet' || config.testWallet) && walletAddress) {
          // Check ALL profiles to see if this wallet is already linked
          for (const profile of profiles) {
            try {
              const linkedAccounts = await apiService.getLinkedAccounts(profile.id);
              const existingAccount = linkedAccounts.find(account => 
                account.address.toLowerCase() === walletAddress.toLowerCase()
              );
              
              if (existingAccount) {
                walletAlreadyLinked = true;
                linkedToProfileName = profile.name;
                linkedProfileId = profile.id;
                console.log(`✅ Wallet already linked to profile: ${profile.name}`);
                
                // If wallet is linked to a profile, make that profile active
                if (!profile.isActive) {
                  console.log(`🔄 Activating profile "${profile.name}" since user signed in with its linked wallet`);
                  await apiService.activateProfile(profile.id);
                  activeProfile = profile;
                }
                break;
              }
            } catch (checkError) {
              console.warn(`⚠️ Failed to check accounts for profile ${profile.name}:`, checkError);
            }
          }
          
          if (!walletAlreadyLinked) {
            console.log('❌ Wallet not linked to any profile - NOT auto-linking for existing user');
            // For existing users, we don't auto-link to prevent the issue
            // Users must manually link wallets to profiles
          } else {
            console.log(`✅ Wallet is already properly linked to "${linkedToProfileName}"`);
          }
        }
      }

      // Connect to the active profile's wallet
      if (activeProfile) {
        await connectToProfileWallet(activeProfile.id);
      }

      console.log('✅ SmartProfile setup completed');
    } catch (error) {
      console.warn('⚠️ SmartProfile setup failed, but login continues:', error);
    }
  };

  const createProfileWallet = async (profile: any, existingWallet?: any, strategy?: string) => {
    try {
      console.log('🔧 Setting up wallet for profile:', profile.name);
      
      // Create profile-scoped storage to ensure wallet isolation
      const profileStoragePrefix = `profile_${profile.id}_`;
      const profileScopedStorage = {
        getItem: async (key: string) => {
          return AsyncStorage.getItem(profileStoragePrefix + key);
        },
        setItem: async (key: string, value: string) => {
          return AsyncStorage.setItem(profileStoragePrefix + key, value);
        },
        removeItem: async (key: string) => {
          return AsyncStorage.removeItem(profileStoragePrefix + key);
        },
      };
      
      let profileWallet;
      let walletAddress;
      let walletStrategy = strategy || 'guest';
      
      if (
        existingWallet &&
        strategy &&
        [
          'google',
          'apple',
          'facebook',
          'x',
          'discord',
          'telegram',
          'twitch',
          'farcaster',
          'github',
          'line',
          'coinbase',
          'steam',
          'backend',
        ].includes(strategy)
      ) {
        // Use the existing social wallet as the profile wallet
        console.log(`📱 Using existing ${strategy} wallet for profile`);
        profileWallet = existingWallet;
        const account = profileWallet.getAccount();
        if (!account) {
          throw new Error('Failed to get wallet account');
        }
        walletAddress = account.address;
      } else {
        // Create a new guest wallet for the profile
        console.log('👻 Creating guest wallet for profile');
        profileWallet = inAppWallet({
          storage: profileScopedStorage,
        });
        
        await profileWallet.connect({
          client,
          strategy: 'guest',
        });
        
        const account = profileWallet.getAccount();
        if (!account) {
          throw new Error('Failed to get guest wallet account');
        }
        walletAddress = account.address;
      }
      
      console.log(`✅ Profile wallet ready: ${walletAddress} (${walletStrategy})`);
      
      // Store the wallet association with the profile
      const walletKey = `profile_wallet_${profile.id}`;
      await AsyncStorage.setItem(walletKey, JSON.stringify({
        profileId: profile.id,
        walletAddress: walletAddress,
        strategy: walletStrategy,
        storagePrefix: profileStoragePrefix,
        createdAt: new Date().toISOString(),
      }));
      
      console.log('💾 Wallet association stored for profile:', profile.name);
      
      // Don't disconnect - keep it connected for the session
      
    } catch (walletError: any) {
      console.error('⚠️ Failed to setup wallet for profile:', walletError);
      throw walletError;
    }
  };

  const connectToProfileWallet = async (profileId: string) => {
    try {
      const walletKey = `profile_wallet_${profileId}`;
      const walletData = await AsyncStorage.getItem(walletKey);
      
      if (walletData) {
        const { walletAddress, storagePrefix, strategy } = JSON.parse(walletData);
        console.log(`🔄 Connecting to profile wallet: ${walletAddress} (${strategy})`);
        
        // Disconnect any existing wallet
        if (activeWallet) {
          console.log('🔌 Disconnecting current wallet...');
          disconnect(activeWallet);
        }
        
        // Create profile-scoped storage for this profile
        const profileScopedStorage = {
          getItem: async (key: string) => {
            return AsyncStorage.getItem(storagePrefix + key);
          },
          setItem: async (key: string, value: string) => {
            return AsyncStorage.setItem(storagePrefix + key, value);
          },
          removeItem: async (key: string) => {
            return AsyncStorage.removeItem(storagePrefix + key);
          },
        };
        
        // Connect to the profile's wallet with its unique storage
        const profileWallet = inAppWallet({
          storage: profileScopedStorage,
        });
        
        // Connect based on the wallet's strategy
        await connect(async () => {
          // For all wallet types, connect with the stored strategy
          // Thirdweb will restore the connection from storage
          await profileWallet.connect({
            client,
            strategy: strategy as any,
          });
          return profileWallet;
        });
        
        console.log('✅ Connected to profile wallet');
        
        // Store the active profile's wallet info for linking
        await AsyncStorage.setItem('active_profile_wallet', JSON.stringify({
          profileId,
          walletAddress,
          storagePrefix,
          strategy,
        }));
      } else {
        console.warn('⚠️ No wallet data found for profile:', profileId);
      }
    } catch (walletError) {
      console.error('⚠️ Failed to connect to profile wallet:', walletError);
    }
  };

  const detectWalletType = (wallet: any): 'metamask' | 'coinbase' | 'walletconnect' | 'ledger' | 'safe' => {
    if (!wallet) return 'metamask';
    
    if (wallet._testAccount) return 'metamask';
    
    const walletId = wallet.id || wallet.walletId;
    if (walletId) {
      if (walletId.includes('metamask')) return 'metamask';
      if (walletId.includes('coinbase')) return 'coinbase';
      if (walletId.includes('walletconnect')) return 'walletconnect';
      if (walletId.includes('ledger')) return 'ledger';
      if (walletId.includes('safe')) return 'safe';
    }
    
    return 'metamask';
  };

  const logout = async (onComplete?: () => void): Promise<void> => {
    try {
      await apiService.logout();
    } catch {}
    await clearAllAuthData();
    setUser(null);
    setAuthState('unauthenticated');
    onComplete?.();
  };

  const clearAllAuthData = async () => {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    await Keychain.resetGenericPassword({ service: 'interspace_access_token' });
    await Keychain.resetGenericPassword({ service: 'interspace_refresh_token' });
  };

  const handleAuthError = async (error: any) => {
    await clearAllAuthData();
    setError(error.message || 'Authentication failed');
    setUser(null);
    setAuthState('unauthenticated');
  };

  const sendVerificationCode = async (_: 'email', contact: string): Promise<void> => {
    try {
      setError(null);
      await apiService.sendVerificationCode(contact);
    } catch (error: any) {
      setError(error.message || 'Failed to send verification code');
      throw error;
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      const refreshed = await apiService.refreshToken();
      if (!refreshed) {
        await logout();
      }
    } catch {
      await logout();
    }
  };

  const extractUserIdFromToken = (token: string): string => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.userId || token;
    } catch {
      return token;
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithWallet,
    loginWithWalletConnect,
    logout,
    refreshAuth,
    sendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
