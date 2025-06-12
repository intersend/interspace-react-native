import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
  isErrorWithCode,
  isCancelledResponse,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Keychain from 'react-native-keychain';
import * as Passkey from 'react-native-passkey';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import MetaMaskSDK from '@metamask/sdk';
import CoinbaseWalletSDK from '@coinbase/wallet-mobile-sdk';
import WalletConnect from '@walletconnect/react-native-dapp';
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
    // Configure Google Sign-In with comprehensive options
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '', // Required for idToken
      scopes: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'], // Default scopes
      offlineAccess: true, // For refresh tokens
      hostedDomain: '', // No domain restriction
      forceCodeForRefreshToken: false, // Android-specific
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, // iOS-specific client ID
      profileImageSize: 120, // Profile image size
    });
  }, []);

  useEffect(() => {
    initializeAuth();
  }, []);

  const getDeviceInfo = async () => {
    const deviceId =
      Platform.OS === 'android'
        ? (await Application.getAndroidId()) || 'unknown-android'
        : (await Application.getIosIdForVendorAsync()) || 'unknown-ios';

    return {
      deviceId,
      deviceName: `${Platform.OS} Device`,
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
    } as const;
  };

  const initializeAuth = async () => {
    try {
      setAuthState('loading');
      const sessionData = await AsyncStorage.getItem(AUTH_SESSION_KEY);
      if (!sessionData) {
        // Check if user has previously signed in with Google
        if (GoogleSignin.hasPreviousSignIn()) {
          try {
            // Try to sign in silently
            const response = await GoogleSignin.signInSilently();
            if (response.type === 'success') {
              // Successfully signed in silently
              const { data } = response;
              if (data.idToken) {
                // Auto-login with Google
                await login({ strategy: 'google', email: data.user.email });
                return;
              }
            } else if (response.type === 'noSavedCredentialFound') {
              // No saved credentials, user needs to sign in manually
            }
          } catch (error) {
            // Silent sign-in failed, continue with normal flow
          }
        }
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
      await Keychain.setGenericPassword('token', session.accessToken, {
        service: 'interspace_access_token',
      });
      await Keychain.setGenericPassword('refresh', session.refreshToken, {
        service: 'interspace_refresh_token',
      });

      if (session.user.isGuest) {
        return true;
      }

      const refreshed = await apiService.refreshToken();
      if (refreshed) return true;
      await apiService.getProfiles();
      return true;
    } catch {
      return false;
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

  const login = async (config: WalletConnectConfig, onSuccess?: () => void): Promise<void> => {
    try {
      setAuthState('loading');
      setError(null);

      let providerToken = '';
      let walletAddress: string | undefined;

      if (config.strategy === 'guest') {
        const device = await getDeviceInfo();
        const userData: User = {
          id: `guest-${Date.now()}`,
          isGuest: true,
          authStrategies: ['guest'],
          email: undefined,
          walletAddress: undefined,
          profilesCount: 0,
          linkedAccountsCount: 0,
          activeDevicesCount: 1,
          socialAccounts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const session: AuthSession = {
          user: userData,
          accessToken: 'guest-access-token',
          refreshToken: 'guest-refresh-token',
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          deviceId: device.deviceId,
          createdAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
        await Keychain.setGenericPassword('token', session.accessToken, {
          service: 'interspace_access_token',
        });
        await Keychain.setGenericPassword('refresh', session.refreshToken, {
          service: 'interspace_refresh_token',
        });
        apiService.setAccessToken(session.accessToken);

        setUser(userData);
        setAuthState('authenticated');
        onSuccess?.();
        return;
      }

      if (config.strategy === 'google') {
        try {
          // Check if Google Play Services are available (Android only)
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          
          // Attempt to sign in
          const response = await GoogleSignin.signIn();
          
          if (isSuccessResponse(response)) {
            // Successfully signed in
            const { data } = response;
            if (data.idToken) {
              providerToken = data.idToken;
              // Extract email from user data if available
              if (data.user.email && !config.email) {
                config.email = data.user.email;
              }
            } else {
              throw new Error('No ID token received from Google Sign-In');
            }
          } else if (isCancelledResponse(response)) {
            // User cancelled the sign-in
            throw new Error('Google Sign-In was cancelled');
          } else {
            throw new Error('Google Sign-In failed');
          }
        } catch (error) {
          if (isErrorWithCode(error)) {
            switch (error.code) {
              case statusCodes.IN_PROGRESS:
                throw new Error('Google Sign-In is already in progress');
              case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                throw new Error('Google Play Services are not available or outdated');
              default:
                throw new Error(`Google Sign-In error: ${error.message}`);
            }
          } else {
            throw error;
          }
        }
      } else if (config.strategy === 'apple') {
        const res = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });
        providerToken = res.identityToken || '';
      } else if (config.strategy === 'passkey') {
        // Passkey authentication - simplified for now
        // TODO: Implement proper passkey authentication
        throw new Error('Passkey authentication not yet implemented');
      } else if (config.strategy === 'email') {
        if (!config.verificationCode) throw new Error('Verification code required');
        providerToken = config.verificationCode;
      } else if (config.strategy === 'wallet') {
        if (!config.signature || !config.walletAddress) throw new Error('Missing wallet signature');
        providerToken = config.signature;
        walletAddress = config.walletAddress;
      } else {
        throw new Error('Unsupported login strategy');
      }

      const device = await getDeviceInfo();
      const authResponse = await apiService.authenticate({
        authToken: providerToken,
        authStrategy: config.strategy,
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        walletAddress,
      });

      const userData: User = {
        id: extractUserIdFromToken(authResponse.accessToken),
        email: config.email,
        walletAddress,
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
        deviceId: device.deviceId,
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

  const connectMetaMask = async () => {
    const sdk = new MetaMaskSDK({ 
      openDeeplink: (link: string) => {
        // eslint-disable-next-line no-console
        console.log('Open MetaMask link:', link);
      },
      dappMetadata: {
        name: 'Interspace',
        url: 'https://interspace.app',
      }
    });
    const provider = sdk.getProvider();
    if (!provider) {
      throw new Error('MetaMask provider not available');
    }
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    const address = accounts[0];
    const message = 'Sign in to Interspace';
    const signature = (await provider.request({ method: 'personal_sign', params: [message, address] })) as string;
    return { address, signature };
  };

  const connectCoinbase = async () => {
    // TODO: Implement Coinbase Wallet SDK for React Native
    // The current SDK is not compatible with React Native
    throw new Error('Coinbase wallet connection not yet implemented for React Native');
  };

  const loginWithWallet = async (wallet: 'metamask' | 'coinbase' | 'rainbow', onSuccess?: () => void) => {
    let result;
    if (wallet === 'metamask') {
      result = await connectMetaMask();
    } else if (wallet === 'coinbase') {
      result = await connectCoinbase();
    } else {
      throw new Error('Unsupported wallet');
    }
    await login({ strategy: 'wallet', walletAddress: result.address, signature: result.signature }, onSuccess);
  };

  const loginWithWalletConnect = async (uri: string, onSuccess?: () => void) => {
    // TODO: Implement WalletConnect v2 for React Native
    // The current import is for v1 which may not be compatible
    throw new Error('WalletConnect not yet implemented for React Native');
  };

  const logout = async (onComplete?: () => void): Promise<void> => {
    try {
      await apiService.logout();
    } catch {}
    
    // Sign out from Google if user was signed in with Google
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
      }
    } catch {
      // Ignore Google sign-out errors
    }
    
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

  const handleAuthError = async (err: any) => {
    await clearAllAuthData();
    setError(err.message || 'Authentication failed');
    setUser(null);
    setAuthState('unauthenticated');
  };

  const sendVerificationCode = async (_: 'email', contact: string): Promise<void> => {
    try {
      setError(null);
      await apiService.sendVerificationCode(contact);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
      throw err;
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
