import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { 
  ApiResponse, 
  AuthResponse, 
  User,
  SmartProfile, 
  LinkedAccount, 
  BookmarkedApp, 
  Folder, 
  Transaction,
  DeviceInfo as DeviceInfoType,
  ApiError,
  SocialAccount
} from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
const disableWalletApis = process.env.EXPO_PUBLIC_DISABLE_WALLET_APIS === 'true';

class ApiService {
  private baseURL: string;
  private accessToken: string | null = null;
  private onAuthExpired?: () => void;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.loadStoredToken();
  }

  // Set auth expiration handler
  public setAuthExpiredHandler(handler: () => void) {
    this.onAuthExpired = handler;
  }

  // Token Management
  private async loadStoredToken() {
    try {
      const creds = await Keychain.getGenericPassword({
        service: 'interspace_access_token',
      });
      this.accessToken = creds ? creds.password : null;
    } catch (error) {
      console.error('Failed to load stored token:', error);
      this.accessToken = null;
    }
  }

  public setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      Keychain.setGenericPassword('token', token, {
        service: 'interspace_access_token',
      });
    } else {
      Keychain.resetGenericPassword({ service: 'interspace_access_token' });
    }
  }

  // Device Info Helper
  private async getDeviceInfo(): Promise<DeviceInfoType> {
    let deviceId: string;
    
    if (Platform.OS === 'android') {
      deviceId = await Application.getAndroidId() || 'unknown-android';
    } else {
      deviceId = await Application.getIosIdForVendorAsync() || 'unknown-ios';
    }
    
    return {
      deviceId,
      deviceName: `${Platform.OS} Device`,
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
    };
  }

  // HTTP Client
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error: ApiError = {
          code: data.code || 'API_ERROR',
          message: data.message || 'An error occurred',
          statusCode: response.status,
          details: data.details,
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw {
          code: 'NETWORK_ERROR',
          message: error.message,
          statusCode: 0,
        } as ApiError;
      }
      throw error;
    }
  }

  // Auto-refresh token on 401
  private async requestWithRefresh<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      return await this.request<T>(endpoint, options);
    } catch (error: any) {
      if (error.statusCode === 401) {
        // Try to refresh token
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request
          return await this.request<T>(endpoint, options);
        }
      }
      throw error;
    }
  }

  // Authentication
  async authenticate(authData: {
    authToken: string;
    authStrategy: string;
    deviceId: string;
    deviceName: string;
    deviceType: 'ios' | 'android' | 'web';
    walletAddress?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/authenticate', {
      method: 'POST',
      body: JSON.stringify(authData),
    });

    if (response.success && response.data.accessToken) {
      this.setAccessToken(response.data.accessToken);
      await Keychain.setGenericPassword('refresh', response.data.refreshToken, {
        service: 'interspace_refresh_token',
      });
    }

    return response.data;
  }

  async sendVerificationCode(email: string): Promise<void> {
    await this.request('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async sendEmailCode(email: string): Promise<void> {
    await this.request('/auth/send-email-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async refreshToken(): Promise<boolean> {
    try {
      await this.loadStoredToken();
      const creds = await Keychain.getGenericPassword({
        service: 'interspace_refresh_token',
      });
      const refreshToken = creds ? creds.password : null;
      if (!refreshToken) return false;

      const response = await this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.data.accessToken) {
        this.setAccessToken(response.data.accessToken);
        await Keychain.setGenericPassword('refresh', response.data.refreshToken, {
          service: 'interspace_refresh_token',
        });
        return true;
      }
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      
      // Handle 401 - refresh token expired
      if (error.statusCode === 401) {
        console.log('🔐 Refresh token expired, clearing auth data');
        
        // Clear all tokens
        this.setAccessToken(null);
        await Keychain.resetGenericPassword({ service: 'interspace_refresh_token' });
        await AsyncStorage.removeItem('interspace_user_data');
        
        // Notify auth context about expiration
        if (this.onAuthExpired) {
          console.log('📢 Notifying auth context about session expiration');
          this.onAuthExpired();
        }
      }
    }
    
    return false;
  }

  async logout(): Promise<void> {
    try {
      await this.loadStoredToken();
      const creds = await Keychain.getGenericPassword({
        service: 'interspace_refresh_token',
      });
      const refreshToken = creds ? creds.password : null;
      if (refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.setAccessToken(null);
      await Keychain.resetGenericPassword({ service: 'interspace_refresh_token' });
      await AsyncStorage.removeItem('interspace_user_data');
    }
  }

  async getAuthMe(): Promise<User> {
    await this.loadStoredToken();
    const response = await this.requestWithRefresh<User>('/auth/me');
    return response.data;
  }

  // SmartProfiles
  async getProfiles(): Promise<SmartProfile[]> {
    const response = await this.requestWithRefresh<SmartProfile[]>('/profiles');
    return response.data;
  }

  async createProfile(name: string): Promise<SmartProfile> {
    const response = await this.requestWithRefresh<SmartProfile>('/profiles', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return response.data;
  }

  async getProfile(id: string): Promise<SmartProfile> {
    const response = await this.requestWithRefresh<SmartProfile>(`/profiles/${id}`);
    return response.data;
  }

  async updateProfile(id: string, data: Partial<SmartProfile>): Promise<SmartProfile> {
    const response = await this.requestWithRefresh<SmartProfile>(`/profiles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteProfile(id: string): Promise<void> {
    await this.requestWithRefresh(`/profiles/${id}`, {
      method: 'DELETE',
    });
  }

  async activateProfile(id: string): Promise<void> {
    await this.requestWithRefresh(`/profiles/${id}/activate`, {
      method: 'POST',
    });
  }

  // Linked Accounts
  async getLinkedAccounts(profileId: string): Promise<LinkedAccount[]> {
    const response = await this.requestWithRefresh<LinkedAccount[]>(`/profiles/${profileId}/accounts`);
    return response.data;
  }

  async linkAccount(profileId: string, accountData: {
    address: string;
    walletType: string;
    customName?: string;
    isPrimary?: boolean;
  }): Promise<LinkedAccount> {
    const response = await this.requestWithRefresh<LinkedAccount>(`/profiles/${profileId}/accounts`, {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
    return response.data;
  }

  async updateLinkedAccount(accountId: string, data: Partial<LinkedAccount>): Promise<LinkedAccount> {
    const response = await this.requestWithRefresh<LinkedAccount>(`/accounts/${accountId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async unlinkAccount(accountId: string): Promise<void> {
    await this.requestWithRefresh(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  }

  async setPrimaryAccount(accountId: string): Promise<void> {
    await this.requestWithRefresh(`/accounts/${accountId}/primary`, {
      method: 'POST',
    });
  }

  // Find which profile owns a specific EOA address
  async findProfileByEOA(address: string): Promise<{
    profileId: string;
    profileName: string;
    isActive: boolean;
    linkedAccount: LinkedAccount;
  } | null> {
    try {
      const response = await this.requestWithRefresh<{
        profileId: string;
        profileName: string;
        isActive: boolean;
        linkedAccount: LinkedAccount;
      } | null>(`/accounts/search?address=${address}`);
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist yet, return null
      if (error.statusCode === 404) {
        console.log('📝 Backend endpoint /accounts/search not implemented yet');
        return null;
      }
      throw error;
    }
  }

  // Apps
  async getApps(profileId: string): Promise<BookmarkedApp[]> {
    const response = await this.requestWithRefresh<BookmarkedApp[]>(`/profiles/${profileId}/apps`);
    return response.data;
  }

  async bookmarkApp(profileId: string, appData: {
    name: string;
    url: string;
    iconUrl?: string;
    folderId?: string;
    position: number;
  }): Promise<BookmarkedApp> {
    const response = await this.requestWithRefresh<BookmarkedApp>(`/profiles/${profileId}/apps`, {
      method: 'POST',
      body: JSON.stringify(appData),
    });
    return response.data;
  }

  async updateApp(appId: string, data: Partial<BookmarkedApp>): Promise<BookmarkedApp> {
    const response = await this.requestWithRefresh<BookmarkedApp>(`/apps/${appId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteApp(appId: string): Promise<void> {
    await this.requestWithRefresh(`/apps/${appId}`, {
      method: 'DELETE',
    });
  }

  async reorderApps(appIds: string[], folderId?: string): Promise<void> {
    await this.requestWithRefresh('/apps/reorder', {
      method: 'POST',
      body: JSON.stringify({ appIds, folderId }),
    });
  }

  // Folders
  async getFolders(profileId: string): Promise<Folder[]> {
    const response = await this.requestWithRefresh<Folder[]>(`/profiles/${profileId}/folders`);
    return response.data;
  }

  async createFolder(profileId: string, folderData: {
    name: string;
    color: string;
    position: number;
  }): Promise<Folder> {
    const response = await this.requestWithRefresh<Folder>(`/profiles/${profileId}/folders`, {
      method: 'POST',
      body: JSON.stringify(folderData),
    });
    return response.data;
  }

  async updateFolder(folderId: string, data: Partial<Folder>): Promise<Folder> {
    const response = await this.requestWithRefresh<Folder>(`/folders/${folderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async deleteFolder(folderId: string): Promise<void> {
    await this.requestWithRefresh(`/folders/${folderId}`, {
      method: 'DELETE',
    });
  }

  async shareFolder(folderId: string): Promise<{ shareableId: string; shareableUrl: string }> {
    const response = await this.requestWithRefresh<{ shareableId: string; shareableUrl: string }>(`/folders/${folderId}/share`, {
      method: 'POST',
    });
    return response.data;
  }

  // User Management
  async getCurrentUser(): Promise<User> {
    const response = await this.requestWithRefresh<User>('/users/me');
    return response.data;
  }

  // User Social Accounts (New user-level endpoints)
  async getUserSocialAccounts(): Promise<SocialAccount[]> {
    const response = await this.requestWithRefresh<SocialAccount[]>('/users/me/social-accounts');
    return response.data;
  }

  async linkUserSocialAccount(data: {
    provider: string;
    oauthCode: string;
    redirectUri?: string;
  }): Promise<SocialAccount> {
    const response = await this.requestWithRefresh<SocialAccount>('/users/me/social-accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  }

  async unlinkUserSocialAccount(socialAccountId: string): Promise<void> {
    await this.requestWithRefresh(`/users/me/social-accounts/${socialAccountId}`, {
      method: 'DELETE',
    });
  }

  async getTransactions(profileId: string): Promise<Transaction[]> {
    const response = await this.requestWithRefresh<Transaction[]>(
      `/profiles/${profileId}/transactions`
    );
    return response.data;
  }

  async getLinkAuthUrl(provider: string, redirectUri: string): Promise<{ authUrl: string }> {
    const response = await this.requestWithRefresh<{ authUrl: string }>(
      '/auth/link-auth',
      {
        method: 'POST',
        body: JSON.stringify({ provider, redirectUri }),
      }
    );
    return response.data;
  }

  // Session Wallet Management
  async getSessionWalletToken(profileId: string): Promise<{ token: string }> {
    if (disableWalletApis) {
      console.log('🚫 Wallet APIs disabled, returning dummy token');
      return { token: 'dummy-token' };
    }
    const response = await this.requestWithRefresh<{ token: string }>(
      `/profiles/${profileId}/session-wallet/token`
    );
    return response.data;
  }

  async finalizeSessionWallet(
    profileId: string,
    keyShare: string
  ): Promise<{ address: string }> {
    if (disableWalletApis) {
      console.log('🚫 Wallet APIs disabled, returning dummy address');
      return { address: '0x0000000000000000000000000000000000000000' };
    }
    const response = await this.requestWithRefresh<{ address: string }>(
      `/profiles/${profileId}/session-wallet`,
      {
        method: 'POST',
        body: JSON.stringify({ keyShare }),
      }
    );
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
