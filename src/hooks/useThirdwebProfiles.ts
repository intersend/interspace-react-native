import { useCallback } from 'react';
import { 
  useLinkProfile, 
  useProfiles as useThirdwebProfilesBase,
  useUnlinkProfile,
  useSocialProfiles 
} from 'thirdweb/react';
import { createWallet, inAppWallet } from 'thirdweb/wallets';
import { preAuthenticate, hasStoredPasskey, getProfiles } from 'thirdweb/wallets/in-app';
import { client, DEFAULT_CHAIN } from '../../constants/thirdweb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

export interface UseThirdwebProfilesReturn {
  // Thirdweb linked profiles (social accounts)
  thirdwebProfiles: any[];
  isLoadingProfiles: boolean;
  
  // Social profiles for external EOAs
  socialProfiles: any[];
  isLoadingSocialProfiles: boolean;
  
  // Link/unlink social accounts (Enhanced with all supported strategies)
  linkSocialProfile: (strategy: string) => Promise<void>;
  unlinkSocialProfile: (profile: any) => Promise<void>;
  
  // Link/unlink wallets
  linkWalletProfile: (walletId: string) => Promise<void>;
  
  // Link email with verification
  linkEmailProfile: (email: string, verificationCode: string) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  
  // Enhanced auth methods
  linkPasskeyProfile: () => Promise<void>;
  checkPasskeySupport: () => Promise<boolean>;
  linkTelegramProfile: () => Promise<void>;
  linkFarcasterProfile: () => Promise<void>;
  linkLineProfile: () => Promise<void>;
  
  // Get social profiles for an address
  getSocialProfilesForAddress: (address: string) => any[];
  
  // Supported strategies list
  getSupportedStrategies: () => string[];
}

export function useThirdwebProfiles(externalAddress?: string): UseThirdwebProfilesReturn {
  // Get linked profiles for current wallet
  const { data: thirdwebProfiles = [], isLoading: isLoadingProfiles } = useThirdwebProfilesBase({
    client,
  });

  // Get social profiles for external address
  const { data: socialProfiles = [], isLoading: isLoadingSocialProfiles } = useSocialProfiles({
    client,
    address: externalAddress,
  });

  // Link/unlink mutations
  const { mutateAsync: linkProfile } = useLinkProfile();
  const { mutateAsync: unlinkProfile } = useUnlinkProfile();

  // Link social profile (Discord, Google, etc.)
  const linkSocialProfile = useCallback(async (strategy: string) => {
    try {
      console.log(`🔗 Linking ${strategy} profile...`);
      
      // Get the active profile ID from storage
      const activeProfileData = await AsyncStorage.getItem('active_profile_wallet');
      if (!activeProfileData) {
        throw new Error('No active profile found. Please select a profile first.');
      }
      
      const { profileId } = JSON.parse(activeProfileData);
      console.log(`🔗 Linking to profile ID: ${profileId}`);
      
      // Link the social profile using the profile's wallet context
      await linkProfile({
        client,
        strategy: strategy as any,
      });
      
      console.log(`✅ ${strategy} profile linked successfully`);
      
      // Sync with backend - get all linked profiles and sync them
      try {
        console.log(`🔄 Syncing ${strategy} profile with backend...`);
        
        // Get all profiles linked to this wallet
        const profiles = await getProfiles({ client });
        
        // Format profiles for backend sync
        const thirdwebProfiles = profiles.map(p => ({
          type: p.type,
          details: {
            ...p.details,
            // Map common fields - use any to handle dynamic social profile data
            username: (p.details as any).username || (p.details as any).displayName || (p.details as any).name,
            displayName: (p.details as any).displayName || (p.details as any).name,
            avatarUrl: (p.details as any).avatarUrl || (p.details as any).picture || (p.details as any).avatar,
          }
        }));
        
        // Sync all profiles with backend
        await apiService.syncSocialProfiles(profileId, thirdwebProfiles);
        
        console.log(`✅ ${strategy} profile synced with SmartProfile`);
      } catch (syncError) {
        console.error('⚠️ Failed to sync with backend:', syncError);
        // Continue - profile is linked to wallet at least
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to link ${strategy} profile:`, error);
      
      // Check if it's the "no user logged in" error
      if (error.message?.includes('no user logged in') || error.message?.includes('Failed to link account')) {
        throw new Error(
          `Profile wallet not connected. Please switch profiles or restart the app to connect the profile wallet.`
        );
      }
      
      throw new Error(`Failed to link ${strategy} account: ${error.message}`);
    }
  }, [linkProfile]);

  // Unlink social profile
  const unlinkSocialProfile = useCallback(async (profile: any) => {
    try {
      console.log('🔓 Unlinking profile:', profile.type);
      
      await unlinkProfile({
        client,
        profileToUnlink: profile,
      });
      
      console.log('✅ Profile unlinked successfully');
    } catch (error: any) {
      console.error('❌ Failed to unlink profile:', error);
      throw new Error(`Failed to unlink ${profile.type} account: ${error.message}`);
    }
  }, [unlinkProfile]);

  // Link wallet profile
  const linkWalletProfile = useCallback(async (walletId: string) => {
    try {
      console.log(`🔗 Linking ${walletId} wallet...`);
      
      const wallet = createWallet(walletId as any);
      
      await linkProfile({
        client,
        strategy: 'wallet',
        wallet,
        chain: DEFAULT_CHAIN,
      });
      
      console.log(`✅ ${walletId} wallet linked successfully`);
    } catch (error: any) {
      console.error(`❌ Failed to link ${walletId} wallet:`, error);
      throw new Error(`Failed to link ${walletId} wallet: ${error.message}`);
    }
  }, [linkProfile]);

  // Send email verification
  const sendEmailVerification = useCallback(async (email: string) => {
    try {
      console.log('📧 Sending email verification...');
      
      await preAuthenticate({
        client,
        strategy: 'email',
        email,
      });
      
      console.log('✅ Email verification sent');
    } catch (error: any) {
      console.error('❌ Failed to send email verification:', error);
      throw new Error(`Failed to send email verification: ${error.message}`);
    }
  }, []);


  // Link email profile with verification
  const linkEmailProfile = useCallback(async (email: string, verificationCode: string) => {
    try {
      console.log('📧 Linking email profile...');
      
      await linkProfile({
        client,
        strategy: 'email',
        email,
        verificationCode,
      });
      
      console.log('✅ Email profile linked successfully');
    } catch (error: any) {
      console.error('❌ Failed to link email profile:', error);
      throw new Error(`Failed to link email: ${error.message}`);
    }
  }, [linkProfile]);


  // Check if device supports passkeys
  const checkPasskeySupport = useCallback(async (): Promise<boolean> => {
    try {
      const hasPasskey = await hasStoredPasskey(client);
      console.log('🔐 Passkey support check:', hasPasskey);
      return hasPasskey;
    } catch (error: any) {
      console.error('❌ Failed to check passkey support:', error);
      return false;
    }
  }, []);

  // Link passkey profile
  const linkPasskeyProfile = useCallback(async () => {
    try {
      console.log('🔐 Linking passkey profile...');
      
      const hasPasskey = await hasStoredPasskey(client);
      
      await linkProfile({
        client,
        strategy: 'passkey',
        type: hasPasskey ? 'sign-in' : 'sign-up',
      });
      
      console.log('✅ Passkey profile linked successfully');
    } catch (error: any) {
      console.error('❌ Failed to link passkey profile:', error);
      throw new Error(`Failed to link passkey: ${error.message}`);
    }
  }, [linkProfile]);

  // Link Telegram profile
  const linkTelegramProfile = useCallback(async () => {
    try {
      console.log('📱 Linking Telegram profile...');
      
      await linkProfile({
        client,
        strategy: 'telegram',
      });
      
      console.log('✅ Telegram profile linked successfully');
    } catch (error: any) {
      console.error('❌ Failed to link Telegram profile:', error);
      throw new Error(`Failed to link Telegram: ${error.message}`);
    }
  }, [linkProfile]);

  // Link Farcaster profile
  const linkFarcasterProfile = useCallback(async () => {
    try {
      console.log('🎭 Linking Farcaster profile...');
      
      await linkProfile({
        client,
        strategy: 'farcaster',
      });
      
      console.log('✅ Farcaster profile linked successfully');
    } catch (error: any) {
      console.error('❌ Failed to link Farcaster profile:', error);
      throw new Error(`Failed to link Farcaster: ${error.message}`);
    }
  }, [linkProfile]);

  // Link Line profile
  const linkLineProfile = useCallback(async () => {
    try {
      console.log('💚 Linking Line profile...');
      
      await linkProfile({
        client,
        strategy: 'line',
      });
      
      console.log('✅ Line profile linked successfully');
    } catch (error: any) {
      console.error('❌ Failed to link Line profile:', error);
      throw new Error(`Failed to link Line: ${error.message}`);
    }
  }, [linkProfile]);

  // Get supported authentication strategies
  const getSupportedStrategies = useCallback((): string[] => {
    return [
      // Social strategies
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
      
      // Communication strategies
      'email',
      
      // Advanced strategies
      'passkey',
      'wallet',
      'guest',
      
      // Enterprise strategies (if needed)
      'jwt',
      'auth_endpoint',
    ];
  }, []);

  // Get social profiles for a specific address
  const getSocialProfilesForAddress = useCallback((address: string) => {
    // This would need to be implemented with a separate query
    // For now, return empty array
    return [];
  }, []);

  return {
    // Data
    thirdwebProfiles,
    isLoadingProfiles,
    socialProfiles,
    isLoadingSocialProfiles,
    
    // Social linking
    linkSocialProfile,
    unlinkSocialProfile,
    
    // Wallet linking
    linkWalletProfile,
    
    // Email linking
    linkEmailProfile,
    sendEmailVerification,
    
    // Enhanced auth methods
    linkPasskeyProfile,
    checkPasskeySupport,
    linkTelegramProfile,
    linkFarcasterProfile,
    linkLineProfile,
    
    // Utilities
    getSocialProfilesForAddress,
    getSupportedStrategies,
  };
}

export default useThirdwebProfiles;
