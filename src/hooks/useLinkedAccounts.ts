import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { LinkedAccount } from '../types';

interface UseLinkedAccountsReturn {
  accounts: LinkedAccount[];
  isLoading: boolean;
  error: string | null;
  linkAccount: (profileId: string, accountData: {
    address: string;
    walletType: string;
    customName?: string;
    isPrimary?: boolean;
  }) => Promise<LinkedAccount>;
  updateAccount: (accountId: string, data: Partial<LinkedAccount>) => Promise<LinkedAccount>;
  unlinkAccount: (accountId: string) => Promise<void>;
  setPrimaryAccount: (accountId: string) => Promise<void>;
  refreshAccounts: (profileId: string) => Promise<void>;
  getCachedAccounts: (profileId: string) => LinkedAccount[];
}

export function useLinkedAccounts(profileId?: string): UseLinkedAccountsReturn {
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for storing accounts per profile to prevent loss on profile switching
  const accountsCache = useRef<Map<string, LinkedAccount[]>>(new Map());
  const previousProfileId = useRef<string | undefined>(undefined);

  // Fetch linked accounts for a profile
  const fetchAccounts = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const accountsData = await apiService.getLinkedAccounts(id);
      setAccounts(accountsData);
      
      console.log('✅ Linked accounts loaded:', accountsData.length);
    } catch (err: any) {
      console.error('❌ Failed to fetch linked accounts:', err);
      setError(err.message || 'Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Link new account to profile
  const linkAccount = useCallback(async (
    profileId: string,
    accountData: {
      address: string;
      walletType: string;
      customName?: string;
      isPrimary?: boolean;
    }
  ): Promise<LinkedAccount> => {
    try {
      setError(null);
      
      const newAccount = await apiService.linkAccount(profileId, accountData);
      
      // Add to local state
      setAccounts(prev => [...prev, newAccount]);
      
      console.log('✅ Account linked:', newAccount.address);
      return newAccount;
    } catch (err: any) {
      console.error('❌ Failed to link account:', err);
      setError(err.message || 'Failed to link account');
      throw err;
    }
  }, []);

  // Update account details
  const updateAccount = useCallback(async (
    accountId: string,
    data: Partial<LinkedAccount>
  ): Promise<LinkedAccount> => {
    try {
      setError(null);
      
      const updatedAccount = await apiService.updateLinkedAccount(accountId, data);
      
      // Update local state
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? updatedAccount : acc
      ));
      
      console.log('✅ Account updated:', updatedAccount.address);
      return updatedAccount;
    } catch (err: any) {
      console.error('❌ Failed to update account:', err);
      setError(err.message || 'Failed to update account');
      throw err;
    }
  }, []);

  // Unlink account from profile
  const unlinkAccount = useCallback(async (accountId: string): Promise<void> => {
    try {
      setError(null);
      
      // Find the account being removed
      const accountToRemove = accounts.find(acc => acc.id === accountId);
      
      // Call backend to unlink (backend handles complete removal if last profile)
      await apiService.unlinkAccount(accountId);
      
      // If this was a wallet-type account (EOA), also unlink from Thirdweb
      if (accountToRemove && accountToRemove.walletType) {
        try {
          console.log('🔓 Unlinking wallet from Thirdweb SDK:', accountToRemove.address);
          
          // Import Thirdweb utilities
          const { getProfiles } = await import('thirdweb/wallets/in-app');
          const { client } = await import('../../constants/silencelabs');
          const { useUnlinkProfile } = await import('thirdweb/react');
          
          // Get all linked profiles from Thirdweb
          const thirdwebProfiles = await getProfiles({ client });
          
          // Find the wallet profile to unlink
          const walletProfile = thirdwebProfiles.find(p => 
            p.type === 'wallet' && 
            p.details.address?.toLowerCase() === accountToRemove.address.toLowerCase()
          );
          
          if (walletProfile) {
            console.log('🔍 Found wallet profile in Thirdweb, unlinking...');
            // Note: This is a simplified approach. In a real implementation,
            // you'd need to properly handle the unlinking through the hook
            console.log('⚠️ Wallet profile found but auto-unlinking not implemented yet');
            // TODO: Implement proper Thirdweb unlinking when the wallet is removed from all profiles
          }
        } catch (thirdwebError) {
          console.warn('⚠️ Failed to unlink from Thirdweb:', thirdwebError);
          // Continue - backend removal succeeded
        }
      }
      
      // Remove from local state
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      console.log('✅ Account unlinked from backend');
    } catch (err: any) {
      console.error('❌ Failed to unlink account:', err);
      setError(err.message || 'Failed to unlink account');
      throw err;
    }
  }, [accounts]);

  // Set account as primary
  const setPrimaryAccount = useCallback(async (accountId: string): Promise<void> => {
    try {
      setError(null);
      
      await apiService.setPrimaryAccount(accountId);
      
      // Update local state - set all to non-primary, then set selected as primary
      setAccounts(prev => prev.map(acc => ({
        ...acc,
        isPrimary: acc.id === accountId
      })));
      
      console.log('✅ Primary account set');
    } catch (err: any) {
      console.error('❌ Failed to set primary account:', err);
      setError(err.message || 'Failed to set primary account');
      throw err;
    }
  }, []);

  // Refresh accounts
  const refreshAccounts = useCallback(async (id: string) => {
    await fetchAccounts(id);
  }, [fetchAccounts]);

  // Get cached accounts for a specific profile
  const getCachedAccounts = useCallback((id: string): LinkedAccount[] => {
    return accountsCache.current.get(id) || [];
  }, []);

  // Auto-fetch when profileId changes with improved caching
  useEffect(() => {
    if (profileId) {
      // Always cache current accounts before switching (if we have a previous profile)
      if (previousProfileId.current && previousProfileId.current !== profileId && accounts.length > 0) {
        console.log('💾 Caching accounts for profile:', previousProfileId.current, 'Count:', accounts.length);
        accountsCache.current.set(previousProfileId.current, [...accounts]);
      }
      
      // Check if we have cached accounts for the new profile
      const cachedAccounts = accountsCache.current.get(profileId);
      if (cachedAccounts && cachedAccounts.length > 0) {
        console.log('📋 Loading cached accounts for profile:', profileId, 'Count:', cachedAccounts.length);
        setAccounts([...cachedAccounts]); // Create new array to trigger re-render
        setIsLoading(false);
        setError(null);
        
        // Update previous profile ID
        previousProfileId.current = profileId;
      } else {
        console.log('🔍 No cached accounts, fetching for profile:', profileId);
        // Update previous profile ID before fetching
        previousProfileId.current = profileId;
        fetchAccounts(profileId);
      }
    } else {
      // Cache current accounts before clearing
      if (previousProfileId.current && accounts.length > 0) {
        console.log('💾 Caching accounts before clearing:', previousProfileId.current, 'Count:', accounts.length);
        accountsCache.current.set(previousProfileId.current, [...accounts]);
      }
      setAccounts([]);
      previousProfileId.current = undefined;
    }
  }, [profileId, fetchAccounts]);

  // Also cache accounts whenever they change (for active profile)
  useEffect(() => {
    if (previousProfileId.current && accounts.length > 0) {
      console.log('💾 Auto-caching accounts for active profile:', previousProfileId.current, 'Count:', accounts.length);
      accountsCache.current.set(previousProfileId.current, [...accounts]);
    }
  }, [accounts]);

  return {
    accounts,
    isLoading,
    error,
    linkAccount,
    updateAccount,
    unlinkAccount,
    setPrimaryAccount,
    refreshAccounts,
    getCachedAccounts,
  };
}

export default useLinkedAccounts;
