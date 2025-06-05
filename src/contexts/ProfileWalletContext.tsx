import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { inAppWallet, type Wallet } from 'thirdweb/wallets';
import { useSetActiveWallet, useActiveWallet, useDisconnect } from 'thirdweb/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from '../../constants/thirdweb';

interface ProfileWalletContextValue {
  switchProfileWallet: (profileId: string) => Promise<void>;
  createProfileWallet: (profileId: string) => Promise<string>;
  currentProfileWallet: Wallet | null;
}

const ProfileWalletContext = createContext<ProfileWalletContextValue | null>(null);

interface ProfileWalletProviderProps {
  children: ReactNode;
}

export function ProfileWalletProvider({ children }: ProfileWalletProviderProps) {
  const setActiveWallet = useSetActiveWallet();
  const activeWallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const [currentProfileWallet, setCurrentProfileWallet] = useState<Wallet | null>(null);
  
  // Keep track of wallet instances per profile
  const profileWallets = useRef<Map<string, Wallet>>(new Map());

  const createProfileWallet = useCallback(async (profileId: string): Promise<string> => {
    try {
      console.log('👻 Creating guest wallet for profile:', profileId);
      
      // Create profile-scoped storage to ensure wallet isolation
      const profileStoragePrefix = `profile_${profileId}_`;
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
      
      // Create a new in-app wallet with guest strategy and profile-scoped storage
      const profileWallet = inAppWallet({
        storage: profileScopedStorage,
      });
      
      await profileWallet.connect({
        client,
        strategy: 'guest',
      });
      
      // Get the wallet address
      const account = profileWallet.getAccount();
      if (!account) {
        throw new Error('Failed to get guest wallet account');
      }
      
      console.log('✅ Guest wallet created with isolated storage:', account.address);
      
      // Store the wallet instance
      profileWallets.current.set(profileId, profileWallet);
      
      // Store the wallet association with the profile
      const walletKey = `profile_wallet_${profileId}`;
      await AsyncStorage.setItem(walletKey, JSON.stringify({
        profileId: profileId,
        walletAddress: account.address,
        strategy: 'guest',
        storagePrefix: profileStoragePrefix,
        createdAt: new Date().toISOString(),
      }));
      
      console.log('💾 Wallet association stored for profile:', profileId);
      
      // Disconnect after creation (will reconnect when switching)
      await profileWallet.disconnect();
      
      return account.address;
    } catch (error) {
      console.error('⚠️ Failed to create profile wallet:', error);
      throw error;
    }
  }, []);

  const switchProfileWallet = useCallback(async (profileId: string): Promise<void> => {
    try {
      const walletKey = `profile_wallet_${profileId}`;
      const walletData = await AsyncStorage.getItem(walletKey);
      
      if (!walletData) {
        console.warn('⚠️ No wallet data found for profile:', profileId);
        return;
      }
      
      const { walletAddress, storagePrefix, strategy } = JSON.parse(walletData);
      console.log(`🔄 Switching to profile wallet: ${walletAddress} (${strategy})`);
      
      // Disconnect current wallet if any
      if (activeWallet) {
        console.log('🔌 Disconnecting current wallet...');
        try {
          await disconnect(activeWallet);
        } catch (error) {
          console.warn('⚠️ Error disconnecting wallet:', error);
        }
      }
      
      // Check if we already have a wallet instance for this profile
      let profileWallet = profileWallets.current.get(profileId);
      
      if (!profileWallet) {
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
        
        // Create the wallet instance with profile-scoped storage
        profileWallet = inAppWallet({
          storage: profileScopedStorage,
        });
        
        // Store the instance
        profileWallets.current.set(profileId, profileWallet);
      }
      
      // Connect to the profile's wallet with the correct strategy
      console.log(`🔐 Connecting with strategy: ${strategy}`);
      
      // For social wallets, we need to restore the existing connection
      // For guest wallets, we reconnect with guest strategy
      if (['google', 'apple', 'facebook', 'discord', 'telegram'].includes(strategy)) {
        // Social wallets should auto-restore from storage
        await profileWallet.connect({
          client,
          // Thirdweb should restore the social connection from storage
        });
      } else {
        // Guest or other strategies
        await profileWallet.connect({
          client,
          strategy: strategy as any,
        });
      }
      
      // Set it as the active wallet
      await setActiveWallet(profileWallet);
      setCurrentProfileWallet(profileWallet);
      
      console.log('✅ Connected to profile wallet and set as active');
      
      // Store the active profile's wallet info for linking
      await AsyncStorage.setItem('active_profile_wallet', JSON.stringify({
        profileId,
        walletAddress,
        storagePrefix,
        strategy,
      }));
      
    } catch (error) {
      console.error('⚠️ Failed to switch wallet context:', error);
      throw error;
    }
  }, [activeWallet, disconnect, setActiveWallet]);

  const value: ProfileWalletContextValue = {
    switchProfileWallet,
    createProfileWallet,
    currentProfileWallet,
  };

  return (
    <ProfileWalletContext.Provider value={value}>
      {children}
    </ProfileWalletContext.Provider>
  );
}

export function useProfileWallet() {
  const context = useContext(ProfileWalletContext);
  if (!context) {
    throw new Error('useProfileWallet must be used within a ProfileWalletProvider');
  }
  return context;
}
