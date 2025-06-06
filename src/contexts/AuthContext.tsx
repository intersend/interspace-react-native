import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnect, useActiveWallet, useDisconnect, useActiveAccount } from 'thirdweb/react';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { preAuthenticate, hasStoredPasskey } from 'thirdweb/wallets/in-app';
import { createAuth } from 'thirdweb/auth';
import { privateKeyToAccount } from 'thirdweb/wallets';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { client, DEFAULT_CHAIN } from '../../constants/thirdweb';
import { apiService } from '../services/api';
import { User, WalletConnectConfig, UseAuthReturn } from '../types';
import { useProfileWallet } from './ProfileWalletContext';

// Create Thirdweb Auth instance for SIWE
const thirdwebAuth = createAuth({
  domain: 'localhost',
  client,
});

// Single storage key for entire authentication session
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

interface AuthContextValue extends UseAuthReturn {
  // Additional context-specific methods if needed
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Thirdweb hooks
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const activeWallet = useActiveWallet();
  const activeAccount = useActiveAccount();

  // Derived states
  const isAuthenticated = authState === 'authenticated';
  const isLoading = authState === 'loading';

  // Set up auth expiration handler
  useEffect(() => {
    // Register the auth expiration handler with API service
    apiService.setAuthExpiredHandler(() => {
      console.log('🔐 Auth expired, triggering logout...');
      logout();
    });
  }, []);

  // Initialize authentication on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  // Monitor wallet disconnection for non-guest users
  useEffect(() => {
    if (authState === 'authenticated' && user && !user.isGuest && !activeWallet) {
      console.log('🔌 External wallet disconnected, logging out non-guest user');
      logout();
    }
  }, [activeWallet, authState, user]);

  const initializeAuth = async () => {
    try {
      console.log('🚀 Initializing authentication...');
      setAuthState('loading');
      setError(null);

      // Try to load session from storage
      const sessionData = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionData) {
        console.log('📭 No stored session found');
        setAuthState('unauthenticated');
        return;
      }

      const session: AuthSession = JSON.parse(sessionData);
      console.log('💾 Found stored session for user:', session.user.id);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        console.log('⏰ Session expired, clearing storage');
        await clearAllAuthData();
        setAuthState('unauthenticated');
        return;
      }

      // Validate session with backend
      console.log('🔍 Validating session with backend...');
      const isValid = await validateSession(session);
      
      if (!isValid) {
        console.log('❌ Session validation failed, clearing storage');
        await clearAllAuthData();
        setAuthState('unauthenticated');
        return;
      }

      // Session is valid, restore user state
      console.log('✅ Session validated, restoring user state');
      setUser(session.user);
      setAuthState('authenticated');
      
      // Reconnect to active profile's wallet
      try {
        console.log('🔄 Reconnecting to active profile wallet...');
        const profiles = await apiService.getProfiles();
        const activeProfile = profiles.find(p => p.isActive);
        
        if (activeProfile) {
          await connectToProfileWallet(activeProfile.id);
          console.log('✅ Reconnected to active profile wallet');
        }
      } catch (walletError) {
        console.warn('⚠️ Failed to reconnect to profile wallet:', walletError);
        // Continue - user is authenticated even if wallet reconnection fails
      }

    } catch (error) {
      console.error('❌ Auth initialization failed:', error);
      await clearAllAuthData();
      setAuthState('unauthenticated');
    }
  };

  const validateSession = async (session: AuthSession): Promise<boolean> => {
    try {
      // Set tokens for API service
      await AsyncStorage.setItem('interspace_access_token', session.accessToken);
      await AsyncStorage.setItem('interspace_refresh_token', session.refreshToken);

      // Try to refresh token or fetch user data
      const refreshed = await apiService.refreshToken();
      if (refreshed) {
        console.log('✅ Token refreshed successfully');
        return true;
      }

      // If refresh failed, try to get profiles (validates token)
      const profiles = await apiService.getProfiles();
      console.log('✅ Session validated with profiles check');
      return true;

    } catch (error) {
      console.log('❌ Session validation failed:', error);
      return false;
    }
  };

  const login = async (config: WalletConnectConfig, onSuccess?: () => void): Promise<void> => {
    try {
      console.log('🔐 Starting login with strategy:', config.strategy);
      setAuthState('loading');
      setError(null);

      // CRITICAL: Clear any existing Thirdweb data to prevent cross-user contamination
      console.log('🧹 Clearing existing wallet data before new authentication...');
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        const walletKeys = allKeys.filter(key => 
          key.includes('thirdweb') || 
          key.includes('tw-') || 
          key.includes('in-app-wallet') ||
          key.includes('guest') ||
          key.includes('embedded-wallet')
        );
        
        if (walletKeys.length > 0) {
          console.log(`🧹 Clearing ${walletKeys.length} wallet-related keys before auth`);
          await AsyncStorage.multiRemove(walletKeys);
        }
      } catch (error) {
        console.warn('⚠️ Failed to clear wallet data before auth:', error);
      }

      // Step 1: Connect wallet via Thirdweb
      const { wallet, authToken, walletAddress } = await connectWallet(config);
      console.log('✅ Wallet connected:', walletAddress);

      // Step 2: Authenticate with backend (device info handled internally)
      console.log('🌐 Authenticating with backend...');
      const authResponse = await apiService.authenticate({
        authToken,
        authStrategy: config.strategy,
        walletAddress,
        email: config.email,
        verificationCode: config.verificationCode,
        socialProvider: config.socialProvider,
        socialProfile: config.socialProfile,
      });

      console.log('✅ Backend authentication successful');

      // Step 4: Create user object
      const userData: User = {
        id: extractUserIdFromToken(authResponse.accessToken),
        walletAddress,
        isGuest: config.strategy === 'guest' || !!config.testWallet,
        authStrategies: [config.strategy],
        email: config.email,
        profilesCount: 0, // Will be updated after profile setup
        linkedAccountsCount: 0, // Will be updated after profile setup
        activeDevicesCount: 1, // Current device
        socialAccounts: [], // Will be populated if needed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Step 5: Store session data
      const session: AuthSession = {
        user: userData,
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
        expiresAt: Date.now() + (authResponse.expiresIn * 1000),
        deviceId: 'mobile_device',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      await AsyncStorage.setItem('interspace_access_token', authResponse.accessToken);
      await AsyncStorage.setItem('interspace_refresh_token', authResponse.refreshToken);

      console.log('💾 Session stored successfully');

      // Step 6: Handle SmartProfile creation and linking (pass wallet for social logins)
      await handleSmartProfileSetup(config, walletAddress, wallet);

      // No need for auto-linking - social wallet IS the profile wallet now

      // Step 7: Set authenticated state with immediate propagation
      setUser(userData);
      setAuthState('authenticated');
      
      // Force immediate state propagation
      console.log('🎉 Login completed successfully');
      console.log('🔄 Final auth state - isAuthenticated should now be true');
      console.log('👤 User set:', !!userData);
      console.log('📊 Auth state set to: authenticated');

      // ONLY call success callback after complete successful authentication
      console.log('🚀 Calling success callback to force UI update');
      onSuccess?.();

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      await handleAuthError(error);
      throw error;
    }
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
        const inApp = inAppWallet();
        await inApp.connect({
          client,
          strategy: 'wallet',
          wallet: config.wallet,
          chain: config.chain || DEFAULT_CHAIN,
        });
        return inApp;
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
      console.log('🚪 Starting logout...');

      // Disconnect wallet
      if (activeWallet) {
        disconnect(activeWallet);
      }

      // Call backend logout
      try {
        await apiService.logout();
      } catch (error) {
        console.warn('⚠️ Backend logout failed, continuing with local cleanup');
      }

      // Clear all auth data
      await clearAllAuthData();

      // Reset state with forced propagation
      setUser(null);
      setError(null);
      setAuthState('unauthenticated');

      console.log('✅ Logout completed');
      console.log('🔄 Auth state reset to unauthenticated');
      console.log('👤 User cleared');

      // Call completion callback
      onComplete?.();
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Force cleanup even if something fails
      await clearAllAuthData();
      setUser(null);
      setError(null);
      setAuthState('unauthenticated');
      onComplete?.();
    }
  };

  const clearAllAuthData = async () => {
    console.log('🧹 Clearing all authentication data...');
    
    // Remove all auth-related storage
    const keysToRemove = [
      AUTH_SESSION_KEY,
      'interspace_access_token',
      'interspace_refresh_token',
      'interspace_user_data',
      'interspace_active_profile',
      'interspace_auth_state',
      'interspace_profiles_cache',
      'interspace_linked_accounts_cache',
    ];

    // Also clear ALL Thirdweb wallet data to prevent cross-user contamination
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const thirdwebKeys = allKeys.filter(key => 
        key.includes('thirdweb') || 
        key.includes('tw-') || 
        key.includes('in-app-wallet') ||
        key.includes('guest') ||
        key.includes('embedded-wallet') ||
        key.includes('profile_wallet_')
      );
      
      if (thirdwebKeys.length > 0) {
        console.log(`🧹 Clearing ${thirdwebKeys.length} Thirdweb-related keys`);
        await AsyncStorage.multiRemove(thirdwebKeys);
      }
    } catch (error) {
      console.warn('⚠️ Failed to clear Thirdweb data:', error);
    }

    await AsyncStorage.multiRemove(keysToRemove);
    console.log('✅ All auth data cleared');
  };

  const handleAuthError = async (error: any) => {
    console.error('🚨 Authentication error, clearing all data:', error);
    
    // Disconnect wallet
    if (activeWallet) {
      disconnect(activeWallet);
    }

    // Clear all data
    await clearAllAuthData();

    // Set error state
    setError(error.message || 'Authentication failed');
    setUser(null);
    setAuthState('unauthenticated');
  };

  const sendVerificationCode = async (
    strategy: 'email',
    contact: string
  ): Promise<void> => {
    try {
      setError(null);
      
      await preAuthenticate({
        client,
        strategy: 'email',
        email: contact,
      });
      
      console.log(`✅ Verification code sent to ${contact}`);
    } catch (error: any) {
      console.error('❌ Failed to send verification code:', error);
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
    } catch (error) {
      console.error('❌ Auth refresh failed:', error);
      await logout();
    }
  };

  const extractUserIdFromToken = (token: string): string => {
    try {
      // Simple JWT decode (just for user ID, not for security)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.userId || token;
    } catch {
      return token; // Fallback to token itself
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshAuth,
    sendVerificationCode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
