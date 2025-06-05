import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThirdwebProfiles } from './useThirdwebProfiles';
import { useAuth } from './useAuth';
import { useProfiles } from './useProfiles';

/**
 * Hook to automatically link social accounts after login
 */
export function useAutoLinkSocial() {
  const { isAuthenticated } = useAuth();
  const { activeProfile } = useProfiles();
  const { linkSocialProfile, linkTelegramProfile } = useThirdwebProfiles();
  const hasChecked = useRef(false);

  useEffect(() => {
    const checkAndLinkPendingSocial = async () => {
      // Only run once per session when authenticated with an active profile
      if (!isAuthenticated || !activeProfile || hasChecked.current) {
        return;
      }

      try {
        // Check for pending social link
        const pendingData = await AsyncStorage.getItem('pending_social_link');
        if (!pendingData) {
          return;
        }

        const { strategy, timestamp } = JSON.parse(pendingData);
        
        // Only process if link was marked within last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        if (timestamp < fiveMinutesAgo) {
          console.log('⏰ Pending social link expired, clearing...');
          await AsyncStorage.removeItem('pending_social_link');
          return;
        }

        console.log(`🔗 Auto-linking ${strategy} account to profile ${activeProfile.name}...`);
        
        // Mark as checked to prevent multiple attempts
        hasChecked.current = true;
        
        // Clear the pending link first
        await AsyncStorage.removeItem('pending_social_link');
        
        // Perform the auto-link based on strategy
        try {
          if (strategy === 'telegram') {
            await linkTelegramProfile();
          } else {
            await linkSocialProfile(strategy);
          }
          console.log(`✅ Successfully auto-linked ${strategy} to profile`);
        } catch (linkError: any) {
          console.error(`❌ Failed to auto-link ${strategy}:`, linkError);
          // Don't throw - user can manually link later
        }
        
      } catch (error) {
        console.error('❌ Error checking for pending social link:', error);
      }
    };

    // Small delay to ensure wallet is fully connected
    const timer = setTimeout(checkAndLinkPendingSocial, 2000);
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, activeProfile?.id, linkSocialProfile, linkTelegramProfile]);

  // Reset the check flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasChecked.current = false;
    }
  }, [isAuthenticated]);
}

export default useAutoLinkSocial;
