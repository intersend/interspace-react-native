import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleOneTapSignIn,
  isSuccessResponse,
  isNoSavedCredentialFoundResponse,
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
    GoogleOneTapSignIn.configure({ webClientId: 'autoDetect' });
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
        await GoogleOneTapSignIn.checkPlayServices();
        const result = await GoogleOneTapSignIn.signIn();
        if (isNoSavedCredentialFoundResponse(result)) {
          const explicit = await GoogleOneTapSignIn.presentExplicitSignIn();
          if (!isSuccessResponse(explicit)) throw new Error('Google login cancelled');
          providerToken = explicit.data.idToken ?? '';
        } else if (isSuccessResponse(result)) {
          providerToken = result.data.idToken ?? '';
        } else {
          throw new Error('Google login failed');
        }
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
    const sdk = new MetaMaskSDK({ openDeeplink: (link: string) => {
      // eslint-disable-next-line no-console
      console.log('Open MetaMask link:', link);
    }});
    const provider = sdk.getProvider();
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    const address = accounts[0];
    const message = 'Sign in to Interspace';
    const signature = (await provider.request({ method: 'personal_sign', params: [message, address] })) as string;
    return { address, signature };
  };

  const connectCoinbase = async () => {
    const coinbase = new CoinbaseWalletSDK({ appName: 'Interspace' });
    const provider = coinbase.makeWeb3Provider('https://mainnet.infura.io/v3/', 1);
    const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
    const address = accounts[0];
    const message = 'Sign in to Interspace';
    const signature = (await provider.request({ method: 'personal_sign', params: [message, address] })) as string;
    return { address, signature };
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
    const connector = new WalletConnect({ uri });
    await connector.connect();
    const address = connector.accounts[0];
    const message = 'Sign in to Interspace';
    const signature = await connector.signPersonalMessage([address, message]);
    await login({ strategy: 'wallet', walletAddress: address, signature }, onSuccess);
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
