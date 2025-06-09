import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { SocialAccount } from '../types';

interface UseUserSocialAccountsReturn {
  socialAccounts: SocialAccount[];
  isLoading: boolean;
  error: string | null;
  linkAccount: (
    provider: string,
    oauthCode: string,
    redirectUri?: string
  ) => Promise<SocialAccount>;
  unlinkAccount: (socialAccountId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserSocialAccounts(): UseUserSocialAccountsReturn {
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const accounts = await apiService.getUserSocialAccounts();
      setSocialAccounts(accounts);
    } catch (err: any) {
      console.error('Failed to fetch social accounts:', err);
      setError(err.message || 'Failed to load social accounts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const linkAccount = useCallback(
    async (
      provider: string,
      oauthCode: string,
      redirectUri?: string
    ): Promise<SocialAccount> => {
      try {
        setError(null);
        const account = await apiService.linkUserSocialAccount({
          provider,
          oauthCode,
          redirectUri,
        });
        setSocialAccounts(prev => [...prev, account]);
        return account;
      } catch (err: any) {
        console.error('Failed to link social account:', err);
        setError(err.message || 'Failed to link social account');
        throw err;
      }
    },
    []
  );

  const unlinkAccount = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      await apiService.unlinkUserSocialAccount(id);
      setSocialAccounts(prev => prev.filter(acc => acc.id !== id));
    } catch (err: any) {
      console.error('Failed to unlink social account:', err);
      setError(err.message || 'Failed to unlink social account');
      throw err;
    }
  }, []);

  const refresh = useCallback(fetchAccounts, [fetchAccounts]);

  return {
    socialAccounts,
    isLoading,
    error,
    linkAccount,
    unlinkAccount,
    refresh,
  };
}

export default useUserSocialAccounts;
