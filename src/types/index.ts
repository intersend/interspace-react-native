// Core Interspace Types

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  isGuest: boolean;
  authStrategies: string[];
  profilesCount: number;
  linkedAccountsCount: number;
  activeDevicesCount: number;
  socialAccounts: SocialAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface SmartProfile {
  id: string;
  name: string;
  isActive: boolean;
  sessionWalletAddress: string;
  linkedAccountsCount: number;
  appsCount: number;
  foldersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedAccount {
  id: string;
  address: string;
  walletType: 'metamask' | 'coinbase' | 'walletconnect' | 'ledger' | 'safe' | 'embedded';
  customName?: string;
  isPrimary: boolean;
  chainId?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BookmarkedApp {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  position: number;
  folderId?: string;
  category?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  position: number;
  isPublic: boolean;
  shareableId?: string;
  shareableUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  hash: string;
  chainId: number;
  fromAddress: string;
  toAddress: string;
  value: string;
  gasUsed?: string;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  blockTimestamp?: string;
  routingType?: 'direct' | 'session_wallet' | 'batch';
  sourceAccount?: string;
  sessionWallet?: string;
  targetApp?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  decimals: number;
  balance: string;
  value: string;
  change24h: string;
  iconUrl?: string;
}

export interface SocialAccount {
  id: string;
  provider:
    | 'farcaster'
    | 'telegram'
    | 'x'
    | 'twitch'
    | 'discord'
    | 'github'
    | 'google'
    | 'apple'
    | 'facebook'
    | 'line'
    | 'coinbase'
    | 'steam'
    | 'email'
    | 'passkey';
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy alias for compatibility
export type SocialProfile = SocialAccount;

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface WalletProfileInfo {
  isLinked: boolean;
  profileId?: string;
  profileName?: string;
  isActive?: boolean;
  linkedAccount?: LinkedAccount;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  walletProfileInfo?: WalletProfileInfo;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Wallet & Thirdweb Types
export interface TestWallet {
  address: string;
  privateKey: string;
  wallet: any;
  mnemonic?: string;
}

export interface WalletConnectConfig {
  strategy:
    | 'guest'
    | 'email'
    | 'passkey'
    | 'wallet'
    | 'google'
    | 'apple'
    | 'facebook'
    | 'x'
    | 'discord'
    | 'telegram'
    | 'twitch'
    | 'farcaster'
    | 'github'
    | 'line'
    | 'coinbase'
    | 'steam'
    | 'backend';
  email?: string;
  verificationCode?: string;
  wallet?: any;
  chain?: any;
  testWallet?: TestWallet;
  walletConnectUri?: string;
  walletAddress?: string;
  signature?: string;
  // Social authentication data
  socialProvider?: string;
  socialProfile?: {
    id: string;
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: any;
  };
}

export interface SmartAccountConfig {
  chain: any;
  sponsorGas: boolean;
  bundlerUrl?: string;
  paymasterUrl?: string;
}

// Device & Security Types
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'ios' | 'android' | 'web';
  fingerprint?: string;
}

export interface StorageKeys {
  ACCESS_TOKEN: 'interspace_access_token';
  REFRESH_TOKEN: 'interspace_refresh_token';
  USER_DATA: 'interspace_user_data';
  ACTIVE_PROFILE: 'interspace_active_profile';
  DEVICE_INFO: 'interspace_device_info';
  WALLET_DATA: 'interspace_wallet_data';
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

export interface AppError extends Error {
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
}

// Navigation Types
export type RootStackParamList = {
  '(tabs)': undefined;
  '+not-found': undefined;
};

export type TabParamList = {
  apps: undefined;
  profiles: undefined;
  wallet: undefined;
};

// Hook Return Types
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (config: WalletConnectConfig, onSuccess?: () => void) => Promise<void>;
  loginWithWallet: (wallet: any, onSuccess?: () => void) => Promise<void>;
  loginWithWalletConnect: (uri: string, onSuccess?: () => void) => Promise<void>;
  logout: (onComplete?: () => void) => Promise<void>;
  refreshAuth: () => Promise<void>;
  sendVerificationCode: (strategy: 'email', contact: string) => Promise<void>;
}

export interface UseProfilesReturn {
  profiles: SmartProfile[];
  activeProfile: SmartProfile | null;
  isLoading: boolean;
  error: string | null;
  createProfile: (name: string, currentUserEOA?: string) => Promise<SmartProfile>;
  updateProfile: (id: string, data: Partial<SmartProfile>) => Promise<SmartProfile>;
  deleteProfile: (id: string) => Promise<void>;
  activateProfile: (id: string) => Promise<void>; // Legacy compatibility
  switchToProfile: (id: string) => Promise<void>; // New preferred method
  refreshProfiles: () => void;
}

export interface UseWalletReturn {
  balance: string;
  tokens: Token[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  sendTransaction: (to: string, amount: string, token?: string) => Promise<string>;
  refreshBalances: () => Promise<void>;
}
