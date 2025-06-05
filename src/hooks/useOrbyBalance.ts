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
      
      // Fallback to mock data if backend not ready
      if (err.statusCode === 404) {
        setBalance({
          totalUsdValue: '12,345.67',
          tokens: [
            {
              symbol: 'ETH',
              name: 'Ethereum',
              totalAmount: '3240000000000000000', // 3.24 ETH
              totalUsdValue: '8567.45',
              decimals: 18,
              balancesPerChain: [
                {
                  chainId: 1,
                  chainName: 'Ethereum',
                  amount: '2240000000000000000',
                  tokenAddress: '0x0000000000000000000000000000000000000000',
                  nativeToken: true,
                },
                {
                  chainId: 137,
                  chainName: 'Polygon',
                  amount: '1000000000000000000',
                  tokenAddress: '0x0000000000000000000000000000000000000000',
                  nativeToken: true,
                },
              ],
            },
            {
              symbol: 'USDC',
              name: 'USD Coin',
              totalAmount: '2500000000', // 2500 USDC
              totalUsdValue: '2500.00',
              decimals: 6,
              balancesPerChain: [
                {
                  chainId: 1,
                  chainName: 'Ethereum',
                  amount: '1500000000',
                  tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                },
                {
                  chainId: 137,
                  chainName: 'Polygon',
                  amount: '1000000000',
                  tokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                },
              ],
            },
          ],
          gasAnalysis: {
            suggestedGasToken: {
              symbol: 'USDC',
              chainId: 137,
              score: 95,
              estimatedCost: '0.50',
            },
            nativeGasAvailable: [
              {
                chainId: 1,
                chainName: 'Ethereum',
                amount: '10000000000000000', // 0.01 ETH
                symbol: 'ETH',
                isEnoughForTx: false,
              },
              {
                chainId: 137,
                chainName: 'Polygon',
                amount: '0',
                symbol: 'MATIC',
                isEnoughForTx: false,
              },
            ],
            alternativeGasTokens: [
              {
                symbol: 'ETH',
                chainId: 1,
                available: true,
                estimatedCost: '0.75',
              },
            ],
          },
        });
      }
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
