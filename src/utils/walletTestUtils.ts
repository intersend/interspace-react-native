import { privateKeyToAccount } from 'thirdweb/wallets';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { client, DEFAULT_TESTNET_CHAIN } from '../../constants/silencelabs';

/**
 * Generate a random private key for testing
 */
function generatePrivateKey(): string {
  // Generate 32 random bytes for private key
  const array = new Uint8Array(32);
  
  // Use crypto.getRandomValues if available (web), otherwise use Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to hex string
  return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export interface TestWallet {
  address: string;
  privateKey: string;
  wallet: any;
  mnemonic?: string;
}

export interface TestWalletOptions {
  chainId?: number;
  name?: string;
  saveToStorage?: boolean;
}

/**
 * Generate a new test wallet with private key for automated testing
 */
export async function generateTestWallet(
  options: TestWalletOptions = {}
): Promise<TestWallet> {
  try {
    console.log('🧪 Generating new test wallet...');

    // Generate a new private key
    const privateKey = generatePrivateKey();
    
    // Create account from private key
    const account = privateKeyToAccount({
      client,
      privateKey,
    });

    // Create wallet from private key
    const wallet = createWallet('io.metamask'); // Using MetaMask as default for testing
    
    const testWallet: TestWallet = {
      address: account.address,
      privateKey,
      wallet,
    };

    console.log('✅ Test wallet generated:', {
      address: testWallet.address,
      name: options.name || 'Test Wallet',
    });

    // Optionally save to storage for reuse
    if (options.saveToStorage) {
      await saveTestWallet(testWallet, options.name);
    }

    return testWallet;
  } catch (error) {
    console.error('❌ Failed to generate test wallet:', error);
    throw new Error(`Failed to generate test wallet: ${error}`);
  }
}

/**
 * Create a wallet from existing private key for testing
 */
export async function createWalletFromPrivateKey(
  privateKey: string,
  options: TestWalletOptions = {}
): Promise<TestWallet> {
  try {
    console.log('🔑 Creating wallet from private key...');

    // Create account from existing private key
    const account = privateKeyToAccount({
      client,
      privateKey,
    });

    // Create wallet
    const wallet = createWallet('io.metamask');
    
    const testWallet: TestWallet = {
      address: account.address,
      privateKey,
      wallet,
    };

    console.log('✅ Wallet created from private key:', {
      address: testWallet.address,
    });

    return testWallet;
  } catch (error) {
    console.error('❌ Failed to create wallet from private key:', error);
    throw new Error(`Failed to create wallet from private key: ${error}`);
  }
}

/**
 * Save test wallet to async storage for reuse
 */
export async function saveTestWallet(
  testWallet: TestWallet,
  name: string = 'default'
): Promise<void> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const storageKey = `interspace_test_wallet_${name}`;
    const walletData = {
      address: testWallet.address,
      privateKey: testWallet.privateKey,
      mnemonic: testWallet.mnemonic,
      createdAt: new Date().toISOString(),
    };

    await AsyncStorage.default.setItem(storageKey, JSON.stringify(walletData));
    console.log(`💾 Test wallet saved as "${name}"`);
  } catch (error) {
    console.error('❌ Failed to save test wallet:', error);
  }
}

/**
 * Load test wallet from async storage
 */
export async function loadTestWallet(name: string = 'default'): Promise<TestWallet | null> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const storageKey = `interspace_test_wallet_${name}`;
    const walletDataString = await AsyncStorage.default.getItem(storageKey);
    
    if (!walletDataString) {
      console.log(`📭 No test wallet found with name "${name}"`);
      return null;
    }

    const walletData = JSON.parse(walletDataString);
    
    // Recreate wallet from stored private key
    const testWallet = await createWalletFromPrivateKey(walletData.privateKey);
    testWallet.mnemonic = walletData.mnemonic;

    console.log(`📂 Test wallet loaded: "${name}" - ${testWallet.address}`);
    return testWallet;
  } catch (error) {
    console.error('❌ Failed to load test wallet:', error);
    return null;
  }
}

/**
 * List all saved test wallets
 */
export async function listTestWallets(): Promise<string[]> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const keys = await AsyncStorage.default.getAllKeys();
    const testWalletKeys = keys
      .filter(key => key.startsWith('interspace_test_wallet_'))
      .map(key => key.replace('interspace_test_wallet_', ''));

    console.log('📋 Available test wallets:', testWalletKeys);
    return testWalletKeys;
  } catch (error) {
    console.error('❌ Failed to list test wallets:', error);
    return [];
  }
}

/**
 * Delete a test wallet from storage
 */
export async function deleteTestWallet(name: string): Promise<void> {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    
    const storageKey = `interspace_test_wallet_${name}`;
    await AsyncStorage.default.removeItem(storageKey);
    
    console.log(`🗑️ Test wallet "${name}" deleted`);
  } catch (error) {
    console.error('❌ Failed to delete test wallet:', error);
  }
}

/**
 * Get wallet info for testing without creating full wallet
 */
export function getWalletInfo(testWallet: TestWallet) {
  return {
    address: testWallet.address,
    shortAddress: `${testWallet.address.slice(0, 6)}...${testWallet.address.slice(-4)}`,
    privateKey: testWallet.privateKey,
    hasPrivateKey: !!testWallet.privateKey,
    hasMnemonic: !!testWallet.mnemonic,
  };
}

/**
 * Fund test wallet with testnet tokens (for development)
 */
export async function requestTestnetTokens(
  testWallet: TestWallet,
  chainId: number = DEFAULT_TESTNET_CHAIN.id
): Promise<void> {
  console.log('🚰 Requesting testnet tokens for:', testWallet.address);
  
  // This would typically make requests to faucets
  // For now, just log the request
  console.log(`💧 Visit faucet to get testnet tokens for chain ${chainId}:`);
  
  switch (chainId) {
    case 11155111: // Sepolia
      console.log(`🔗 Sepolia Faucet: https://sepoliafaucet.com/`);
      break;
    case 80001: // Mumbai
      console.log(`🔗 Mumbai Faucet: https://faucet.polygon.technology/`);
      break;
    case 421614: // Arbitrum Sepolia
      console.log(`🔗 Arbitrum Sepolia: https://faucet.arbitrum.io/`);
      break;
    case 84532: // Base Sepolia
      console.log(`🔗 Base Sepolia: https://faucet.quicknode.com/base/sepolia`);
      break;
    default:
      console.log(`🔗 Find faucet for chain ${chainId}`);
  }
}

/**
 * Validate wallet private key format
 */
export function validatePrivateKey(privateKey: string): boolean {
  try {
    // Basic validation - private key should be 64 hex characters (32 bytes)
    const cleanKey = privateKey.replace('0x', '');
    if (cleanKey.length !== 64) {
      return false;
    }
    
    // Check if it's valid hex
    const isHex = /^[a-fA-F0-9]+$/.test(cleanKey);
    return isHex;
  } catch {
    return false;
  }
}

export default {
  generateTestWallet,
  createWalletFromPrivateKey,
  saveTestWallet,
  loadTestWallet,
  listTestWallets,
  deleteTestWallet,
  getWalletInfo,
  requestTestnetTokens,
  validatePrivateKey,
};
