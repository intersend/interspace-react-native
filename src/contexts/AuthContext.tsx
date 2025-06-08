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
