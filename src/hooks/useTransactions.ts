import { useCallback, useEffect, useState } from 'react';
import { useProfiles } from './useProfiles';
import { apiService } from '../services/api';
import { Transaction } from '../types';

export function useTransactions() {
  const { activeProfile } = useProfiles();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!activeProfile?.id) {
      setTransactions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getTransactions(activeProfile.id);
      setTransactions(data);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(fetchTransactions, [fetchTransactions]);

  return { transactions, isLoading, error, refresh };
}

export default useTransactions;
