import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UnifiedBalance as UnifiedBalanceType } from '../../types/orby';
import { IOSColors, IOSTypography, IOSLayout } from '@/src/constants/IOSColors';

const { width: screenWidth } = Dimensions.get('window');

interface UnifiedBalanceProps {
  balance: UnifiedBalanceType | null;
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export default function UnifiedBalance({
  balance,
  isLoading,
  error,
  onRefresh,
}: UnifiedBalanceProps) {
  const formatUsdValue = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatChange = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getUniqueChainCount = (balance: UnifiedBalanceType): number => {
    const chains = new Set<number>();
    balance.tokens?.forEach(token => {
      token.balancesPerChain?.forEach(b => chains.add(b.chainId));
    });
    return chains.size;
  };

  if (isLoading && !balance) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={IOSColors.systemBlue} />
      </View>
    );
  }

  if (error && !balance) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onRefresh}
      >
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Failed to load balance</Text>
        <Text style={styles.errorSubtext}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }

  const totalUsd = balance ? formatUsdValue(balance.totalUsdValue) : '$0.00';

  const change24h = React.useMemo(() => {
    if (!balance) return 0;
    const total = parseFloat(balance.totalUsdValue);
    if (!total) return 0;
    const weighted = balance.tokens.reduce((sum, t) => {
      const tokenUsd = parseFloat(t.totalUsdValue);
      const pct = parseFloat((t as any).change24h || '0');
      return sum + tokenUsd * pct;
    }, 0);
    return weighted / total;
  }, [balance]);

  const distribution = React.useMemo(() => {
    if (!balance || balance.tokens.length === 0) return 0;
    const total = parseFloat(balance.totalUsdValue);
    if (!total) return 0;
    const largest = Math.max(...balance.tokens.map(t => parseFloat(t.totalUsdValue)));
    return (largest / total) * 100;
  }, [balance]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Balance</Text>
      <Text style={styles.amount}>{totalUsd}</Text>
      
      {/* Portfolio Distribution Bar */}
      <View style={styles.portfolioBar}>
        <LinearGradient
          colors={['#0A84FF', '#5E5CE6', '#BF5AF2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.portfolioBarFill, { width: `${distribution}%` }]}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[
            styles.statValue,
            { color: change24h >= 0 ? IOSColors.systemGreen : IOSColors.systemRed }
          ]}>
            {formatChange(change24h)}
          </Text>
          <Text style={styles.statLabel}>24h Change</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {balance?.tokens?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Assets</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {balance ? getUniqueChainCount(balance) : 0}
          </Text>
          <Text style={styles.statLabel}>Chains</Text>
        </View>
      </View>

      {/* Gas Status Indicator */}
      {balance?.gasAnalysis && (
        <View style={styles.gasStatus}>
          <View style={styles.gasIndicator}>
            <View
              style={[
                styles.gasIndicatorDot,
                {
                  backgroundColor:
                    balance.gasAnalysis.nativeGasAvailable?.some(g => g.isEnoughForTx)
                      ? IOSColors.systemGreen
                      : IOSColors.systemOrange,
                },
              ]}
            />
            <Text style={styles.gasIndicatorText}>
              {balance.gasAnalysis.nativeGasAvailable?.some(g => g.isEnoughForTx)
                ? 'Gas available'
                : `Gas via ${balance.gasAnalysis.suggestedGasToken?.symbol || 'USDC'}`}
            </Text>
          </View>
        </View>
      )}

      {/* Refresh Indicator */}
      {isLoading && balance && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color={IOSColors.systemBlue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  label: {
    ...IOSTypography.footnote,
    color: IOSColors.secondaryLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: IOSColors.label,
    letterSpacing: -1,
    marginBottom: 20,
  },
  portfolioBar: {
    width: screenWidth - (IOSLayout.screenPadding * 4),
    height: 8,
    backgroundColor: IOSColors.systemFill,
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  portfolioBarFill: {
    height: '100%',
    width: '100%',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    ...IOSTypography.headline,
    color: IOSColors.label,
    marginBottom: 4,
  },
  statLabel: {
    ...IOSTypography.caption1,
    color: IOSColors.secondaryLabel,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: IOSColors.separator,
  },
  gasStatus: {
    marginTop: 20,
  },
  gasIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: IOSColors.tertiarySystemFill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gasIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  gasIndicatorText: {
    ...IOSTypography.caption1,
    color: IOSColors.secondaryLabel,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    ...IOSTypography.body,
    fontWeight: '600',
    color: IOSColors.label,
    marginBottom: 4,
  },
  errorSubtext: {
    ...IOSTypography.footnote,
    color: IOSColors.secondaryLabel,
  },
  refreshIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});
