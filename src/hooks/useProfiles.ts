import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { SmartProfile, UseProfilesReturn } from '../types';
import { useProfileWallet } from '../contexts/ProfileWalletContext';

export function useProfiles(): UseProfilesReturn {
  const [profiles, setProfiles] = useState<SmartProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<SmartProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { createProfileWallet, switchProfileWallet } = useProfileWallet();

  // Fetch profiles from backend
  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profilesData = await apiService.getProfiles();
      
      // Auto-create "Main Profile" if user has no profiles
      let finalProfiles = profilesData;
        if (profilesData.length === 0) {
          console.log('🆕 No profiles found, auto-creating Main Profile...');
          try {
            const newProfile = await apiService.createProfile('Main Profile');
            // Auto-activate the first profile
            await apiService.activateProfile(newProfile.id);
            finalProfiles = [{ ...newProfile, isActive: true }];
            console.log('✅ Auto-created and activated Main Profile:', newProfile.id);
          } catch (createError: any) {
            console.error('❌ Failed to auto-create profile:', createError);
            // Continue with empty profiles if creation fails
          }
        } else {
          // Ensure at least one profile is active (fix for returning users)
          const hasActiveProfile = profilesData.some(p => p.isActive);
          if (!hasActiveProfile && profilesData.length > 0) {
            console.log('🔄 No active profile found, activating first profile...');
            try {
              await apiService.activateProfile(profilesData[0].id);
              finalProfiles = profilesData.map((p, index) => ({
                ...p,
                isActive: index === 0
              }));
              console.log('✅ Activated first profile:', profilesData[0].name);
            } catch (activateError: any) {
              console.error('❌ Failed to activate first profile:', activateError);
              finalProfiles = profilesData;
            }
          } else {
            finalProfiles = profilesData;
          }
        }
        
        setProfiles(finalProfiles);
        
        // Find and set active profile (should always have one now)
        const active = finalProfiles.find(p => p.isActive) || finalProfiles[0] || null;
        setActiveProfile(active);
      
      console.log('✅ Profiles loaded:', finalProfiles.length, '- Active:', active?.name);
    } catch (err: any) {
      console.error('❌ Failed to fetch profiles:', err);
      setError(err.message || 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new profile with persistent guest wallet
  const createProfile = useCallback(async (name: string, currentUserEOA?: string): Promise<SmartProfile> => {
    try {
      setError(null);
      console.log('🆕 Creating new profile:', name);
      
      // Step 1: Check if current user's EOA is linked to any existing profile
      let shouldCreateEmbeddedWallet = false;
      if (currentUserEOA) {
        try {
          console.log('🔍 Checking if EOA is linked to any profile:', currentUserEOA);
          
          // Check all existing profiles to see if this EOA is already linked
          let eoaAlreadyLinked = false;
          for (const profile of profiles) {
            try {
              const existingAccounts = await apiService.getLinkedAccounts(profile.id);
              const isLinked = existingAccounts.some(account => 
                account.address.toLowerCase() === currentUserEOA.toLowerCase()
              );
              if (isLinked) {
                eoaAlreadyLinked = true;
                console.log('✅ EOA already linked to profile:', profile.name);
                break;
              }
            } catch (checkError) {
              console.warn('⚠️ Failed to check accounts for profile:', profile.id);
            }
          }
          
          if (!eoaAlreadyLinked) {
            console.log('🆕 EOA not linked to any profile, will create embedded wallet');
            shouldCreateEmbeddedWallet = true;
          } else {
            console.log('🔗 EOA already linked, skipping embedded wallet creation');
          }
        } catch (checkError) {
          console.warn('⚠️ Failed to check EOA linkage, defaulting to create embedded wallet');
          shouldCreateEmbeddedWallet = true;
        }
      } else {
        console.log('🤷‍♂️ No current user EOA provided, will create embedded wallet');
        shouldCreateEmbeddedWallet = true;
      }
      
      // Step 2: Create backend profile (ERC-7702 proxy)
      const newProfile = await apiService.createProfile(name);
      console.log('✅ Backend profile created:', newProfile.id);
      
      // Step 3: Create a guest wallet for this profile with unique storage
      try {
        const walletAddress = await createProfileWallet(newProfile.id);
        console.log('✅ Profile wallet created:', walletAddress);
      } catch (walletError: any) {
        console.error('⚠️ Failed to create guest wallet for profile:', walletError);
        // Continue without wallet - user can still link external wallets
      }
      
      // Step 4: Add to local state
      setProfiles(prev => [...prev, newProfile]);
      
      console.log('🎉 Profile creation completed:', newProfile.name);
      return newProfile;
    } catch (err: any) {
      console.error('❌ Failed to create profile:', err);
      setError(err.message || 'Failed to create profile');
      throw err;
    }
  }, [profiles, createProfileWallet]);

  // Update profile
  const updateProfile = useCallback(async (
    id: string, 
    data: Partial<SmartProfile>
  ): Promise<SmartProfile> => {
    try {
      setError(null);
      
      const updatedProfile = await apiService.updateProfile(id, data);
      
      // Update local state
      setProfiles(prev => prev.map(p => 
        p.id === id ? updatedProfile : p
      ));
      
      // Update active profile if it was the one being updated
      if (activeProfile?.id === id) {
        setActiveProfile(updatedProfile);
      }
      
      console.log('✅ Profile updated:', updatedProfile.name);
      return updatedProfile;
    } catch (err: any) {
      console.error('❌ Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  }, [activeProfile]);

  // Delete profile
  const deleteProfile = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await apiService.deleteProfile(id);
      
      // Remove from local state
      setProfiles(prev => prev.filter(p => p.id !== id));
      
      // If deleted profile was active, set new active profile
      if (activeProfile?.id === id) {
        const remaining = profiles.filter(p => p.id !== id);
        setActiveProfile(remaining[0] || null);
      }
      
      console.log('✅ Profile deleted');
    } catch (err: any) {
      console.error('❌ Failed to delete profile:', err);
      setError(err.message || 'Failed to delete profile');
      throw err;
    }
  }, [activeProfile, profiles]);

  // Switch to profile (renamed from activate)
  const switchToProfile = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      await apiService.activateProfile(id);
      
      // Update local state - deactivate all others, activate selected
      setProfiles(prev => prev.map(p => ({
        ...p,
        isActive: p.id === id
      })));
      
      // Set as active profile
      const newActiveProfile = profiles.find(p => p.id === id);
      if (newActiveProfile) {
        setActiveProfile({ ...newActiveProfile, isActive: true });
      }
      
      // Switch to the profile's wallet
      try {
        await switchProfileWallet(id);
        console.log('✅ Switched to profile wallet');
      } catch (walletError) {
        console.error('⚠️ Failed to switch wallet context:', walletError);
        // Continue - profile is switched in backend even if wallet switch fails
      }
      
      console.log('✅ Switched to profile:', newActiveProfile?.name);
    } catch (err: any) {
      console.error('❌ Failed to switch profile:', err);
      setError(err.message || 'Failed to switch profile');
      throw err;
    }
  }, [profiles, switchProfileWallet]);

  // Keep legacy activateProfile for backward compatibility
  const activateProfile = switchToProfile;

  // Refresh profiles
  const refreshProfiles = useCallback(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Initialize on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    activeProfile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    activateProfile, // Legacy compatibility
    switchToProfile, // New preferred method
    refreshProfiles,
  };
}

export default useProfiles;
