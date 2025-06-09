import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Wallet } from 'ethers';
import { TestWallet } from '../types';

export interface TestTransaction {
  id: string;
  to: string;
  from: string;
  value: string;
  data?: string;
  gasLimit: string;
  gasPrice: string;
  network: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  hash?: string;
}

export interface SIWERequest {
  id: string;
  domain: string;
  address: string;
  statement?: string;
  nonce: string;
  timestamp: number;
  chainId: number;
}

export interface PendingRequest {
  id: string;
  type: 'transaction' | 'siwe';
  data: TestTransaction | SIWERequest;
  resolve: (result: any) => void;
  reject: (error: any) => void;
}

const STORAGE_KEYS = {
  TEST_WALLETS: 'interspace_test_wallets',
  ACTIVE_TEST_WALLET: 'interspace_active_test_wallet',
  TEST_TRANSACTIONS: 'interspace_test_transactions',
} as const;

export function useTestWallet() {
  const [testWallets, setTestWallets] = useState<TestWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<TestWallet | null>(null);
  const [transactions, setTransactions] = useState<TestTransaction[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check if we're in development mode. `__DEV__` is a React Native global
  // that is only true in dev builds. We rely on it to disable all test wallet
  // functionality in production.
  const isDevelopment = __DEV__ && process.env.NODE_ENV === 'development';

  // Create wallet instance for external authentication
  const createWalletInstance = useCallback((testWallet: TestWallet) => {
    try {
      // Create an ethers wallet instance
      const wallet = new Wallet(testWallet.privateKey);
      (wallet as any).getAccount = () => ({
        address: wallet.address,
        signMessage: ({ message }: { message: string }) => wallet.signMessage(message),
      });
      (wallet as any).connect = async () => wallet;
      (wallet as any).disconnect = async () => {};
      
      console.log('🔗 Created wallet instance for test wallet:', testWallet.address);
      return wallet;
    } catch (error) {
      console.error('Failed to create wallet instance:', error);
      throw error;
    }
  }, []);

  // Initialize test wallets from storage
  useEffect(() => {
    if (isDevelopment) {
      loadTestWallets();
      loadTransactions();
    }
  }, [isDevelopment, createWalletInstance]);

  const loadTestWallets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TEST_WALLETS);
      if (stored) {
        const wallets = JSON.parse(stored);
        
        // Recreate wallet instances for loaded wallets
        const walletsWithInstances = wallets.map((wallet: TestWallet) => {
          if (!wallet.wallet) {
            // Recreate wallet instance if it doesn't exist
            const walletInstance = createWalletInstance(wallet);
            return { ...wallet, wallet: walletInstance };
          }
          return wallet;
        });
        
        setTestWallets(walletsWithInstances);

        // Load active wallet
        const activeId = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_TEST_WALLET);
        if (activeId) {
          const active = walletsWithInstances.find((w: TestWallet) => w.address === activeId);
          if (active) {
            setActiveWallet(active);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load test wallets:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TEST_TRANSACTIONS);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load test transactions:', error);
    }
  };

  const saveTestWallets = async (wallets: TestWallet[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_WALLETS, JSON.stringify(wallets));
    } catch (error) {
      console.error('Failed to save test wallets:', error);
    }
  };

  const saveTransactions = async (txs: TestTransaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TEST_TRANSACTIONS, JSON.stringify(txs));
    } catch (error) {
      console.error('Failed to save transactions:', error);
    }
  };

  // Generate a random private key
  const generatePrivateKey = (): string => {
    const array = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return '0x' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  // Create a new test wallet
  const createTestWallet = useCallback(async (name?: string): Promise<TestWallet> => {
    try {
      const privateKey = generatePrivateKey();
      const account = new Wallet(privateKey);

      // Create wallet instance for external authentication
      const walletInstance = createWalletInstance({
        address: account.address,
        privateKey,
        wallet: null,
        mnemonic: undefined,
      });

      const testWallet: TestWallet = {
        address: account.address,
        privateKey,
        wallet: walletInstance, // Store the wallet instance
        mnemonic: undefined,
      };

      const walletWithName = {
        ...testWallet,
        name: name || `Test Wallet ${testWallets.length + 1}`,
        createdAt: new Date().toISOString(),
      };

      const updatedWallets = [...testWallets, walletWithName as TestWallet];
      setTestWallets(updatedWallets);
      await saveTestWallets(updatedWallets);

      console.log('🧪 Created new test wallet:', account.address);
      return testWallet;
    } catch (error) {
      console.error('Failed to create test wallet:', error);
      throw error;
    }
  }, [testWallets, createWalletInstance]);

  // Set active test wallet
  const setActiveTestWallet = useCallback(async (wallet: TestWallet) => {
    setActiveWallet(wallet);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_TEST_WALLET, wallet.address);
    console.log('🎯 Active test wallet:', wallet.address);
  }, []);

  // Delete test wallet
  const deleteTestWallet = useCallback(async (address: string) => {
    const updatedWallets = testWallets.filter(w => w.address !== address);
    setTestWallets(updatedWallets);
    await saveTestWallets(updatedWallets);

    if (activeWallet?.address === address) {
      const newActiveWallet = updatedWallets[0] || null;
      setActiveWallet(newActiveWallet);
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_TEST_WALLET, 
        newActiveWallet?.address || ''
      );
      console.log('🔄 Active wallet updated to:', newActiveWallet?.address || 'none');
    }

    console.log('🗑️ Deleted test wallet:', address);
  }, [testWallets, activeWallet]);

  // Send transaction request
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    data?: string
  ): Promise<string> => {
    if (!activeWallet) {
      throw new Error('No active test wallet');
    }

    return new Promise((resolve, reject) => {
      const transaction: TestTransaction = {
        id: Date.now().toString(),
        to,
        from: activeWallet.address,
        value,
        data,
        gasLimit: '21000',
        gasPrice: '20000000000', // 20 gwei
        network: 'Base Sepolia',
        status: 'pending',
        timestamp: Date.now(),
      };

      const request: PendingRequest = {
        id: transaction.id,
        type: 'transaction',
        data: transaction,
        resolve,
        reject,
      };

      setPendingRequests(prev => [...prev, request]);
      setIsModalOpen(true);
    });
  }, [activeWallet]);

  // Sign SIWE message
  const signSIWE = useCallback(async (
    domain: string,
    statement?: string,
    nonce?: string,
    chainId?: number
  ): Promise<string> => {
    if (!activeWallet) {
      throw new Error('No active test wallet');
    }

    return new Promise((resolve, reject) => {
      const siweRequest: SIWERequest = {
        id: Date.now().toString(),
        domain,
        address: activeWallet.address,
        statement,
        nonce: nonce || Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        chainId: chainId || 84532, // Base Sepolia
      };

      const request: PendingRequest = {
        id: siweRequest.id,
        type: 'siwe',
        data: siweRequest,
        resolve,
        reject,
      };

      setPendingRequests(prev => [...prev, request]);
      setIsModalOpen(true);
    });
  }, [activeWallet]);

  // Approve request
  const approveRequest = useCallback(async (requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      if (request.type === 'transaction') {
        const tx = request.data as TestTransaction;
        
        // Simulate transaction confirmation
        const confirmedTx = {
          ...tx,
          status: 'confirmed' as const,
          hash: `0x${Math.random().toString(16).substring(2)}`,
        };

        const updatedTransactions = [...transactions, confirmedTx];
        setTransactions(updatedTransactions);
        await saveTransactions(updatedTransactions);

        request.resolve(confirmedTx.hash);
      } else if (request.type === 'siwe') {
        const siwe = request.data as SIWERequest;
        
        // Create a mock signature
        const signature = `0x${Math.random().toString(16).substring(2)}`;
        request.resolve(signature);
      }

      // Remove request
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error) {
      request.reject(error);
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    }
  }, [pendingRequests, transactions]);

  // Reject request
  const rejectRequest = useCallback((requestId: string) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    request.reject(new Error('User rejected request'));
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  }, [pendingRequests]);

  // Clear all transactions
  const clearTransactions = useCallback(async () => {
    setTransactions([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.TEST_TRANSACTIONS);
  }, []);

  return {
    // State
    isDevelopment,
    testWallets,
    activeWallet,
    transactions,
    pendingRequests,
    isModalOpen,

    // Actions
    createTestWallet,
    setActiveTestWallet,
    deleteTestWallet,
    sendTransaction,
    signSIWE,
    approveRequest,
    rejectRequest,
    clearTransactions,
    setIsModalOpen,
    loadTestWallets, // Expose reload function

    // Computed
    hasActiveWallet: !!activeWallet,
    pendingCount: pendingRequests.length,
  };
}

export default useTestWallet;
