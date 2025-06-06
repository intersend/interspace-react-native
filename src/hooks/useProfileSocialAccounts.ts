import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useProfileSocialAccounts(profileId: string | undefined) {
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfileSocialAccounts = useCallback(async () => {
    if (!profileId) {
      setSocialAccounts([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`🔍 Fetching social accounts for profile: ${profileId}`);

      // Get the wallet data for this profile
      const walletKey = `profile_wallet_${profileId}`;
      const walletData = await AsyncStorage.getItem(walletKey);
      
      if (!walletData) {
        console.log('⚠️ No wallet data found for profile');
        setSocialAccounts([]);
        return;
      }

      const { strategy } = JSON.parse(walletData);
      
      // If it's a social wallet, show that social account
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
      ].includes(strategy)) {
        console.log(`📱 Profile uses ${strategy} wallet`);
        // For social wallets, the wallet itself IS the social account
        setSocialAccounts([{
          type: strategy,
          details: {
            strategy: strategy,
            displayName: strategy.charAt(0).toUpperCase() + strategy.slice(1),
          }
        }]);
      } else {
        // Guest wallet - no social accounts
        setSocialAccounts([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch profile social accounts:', error);
      setSocialAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchProfileSocialAccounts();
  }, [fetchProfileSocialAccounts]);

  return {
    socialAccounts,
    isLoading,
    refetch: fetchProfileSocialAccounts
  };
}
