import { useState, useEffect, useCallback } from 'react';
import { useProfiles } from './useProfiles';
import { orbyService } from '../services/orby';
import { UnifiedBalance } from '../types/orby';

export function useOrbyBalance() {
  const { activeProfile } = useProfiles();
  const [balance, setBalance] = useState<UnifiedBalance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!activeProfile?.id) {
      setBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const unifiedBalance = await orbyService.getUnifiedBalance(activeProfile.id);
      setBalance(unifiedBalance);
    } catch (err: any) {
      console.error('Failed to fetch unified balance:', err);
      setError(err.message || 'Failed to load balance');
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const refresh = useCallback(() => {
    return fetchBalance();
  }, [fetchBalance]);

  // Helper to get specific token balance
  const getTokenBalance = useCallback(
    (symbol: string) => {
      if (!balance) return null;
      return balance.tokens.find(t => t.symbol === symbol);
    },
    [balance]
  );

  // Helper to get total balance for a specific chain
  const getChainBalance = useCallback(
    (chainId: number) => {
      if (!balance) return '0';
      
      let totalUsd = 0;
      balance.tokens.forEach(token => {
        const chainBalance = token.balancesPerChain.find(b => b.chainId === chainId);
        if (chainBalance) {
          const tokenUsdValue = parseFloat(token.totalUsdValue);
          const tokenTotal = parseFloat(token.totalAmount);
          const chainAmount = parseFloat(chainBalance.amount);
          const chainUsdValue = (chainAmount / tokenTotal) * tokenUsdValue;
          totalUsd += chainUsdValue;
        }
      });
      
      return totalUsd.toFixed(2);
    },
    [balance]
  );

  return {
    balance,
    isLoading,
    error,
    refresh,
    getTokenBalance,
    getChainBalance,
  };
}
