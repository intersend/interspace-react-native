import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IOSColors } from '@/src/constants/IOSColors';

interface IOSAssetIconProps {
  symbol: string;
  chainName?: string;
  size?: number;
}

const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'USDC': '#2775CA',
    'USDT': '#26A17B',
    'DAI': '#F5AC37',
    'MATIC': '#8247E5',
    'BNB': '#F3BA2F',
    'AVAX': '#E84142',
    'SOL': '#00FFA3',
    'ARB': '#28A0F0',
    'OP': '#FF0420',
  };
  return colors[symbol.toUpperCase()] || IOSColors.systemBlue;
};

const getChainIcon = (chainName?: string): string => {
  if (!chainName) return '';
  
  const chainIcons: Record<string, string> = {
    'ethereum': 'Ξ',
    'polygon': 'P',
    'arbitrum': 'A',
    'optimism': 'O',
    'base': 'B',
    'avalanche': 'A',
    'bsc': 'B',
  };
  
  return chainIcons[chainName.toLowerCase()] || chainName.charAt(0).toUpperCase();
};

const getChainColor = (chainName?: string): string => {
  if (!chainName) return IOSColors.systemGray;
  
  const chainColors: Record<string, string> = {
    'ethereum': '#627EEA',
    'polygon': '#8247E5',
    'arbitrum': '#28A0F0',
    'optimism': '#FF0420',
    'base': '#0052FF',
    'avalanche': '#E84142',
    'bsc': '#F3BA2F',
  };
  
  return chainColors[chainName.toLowerCase()] || IOSColors.systemGray;
};

export const IOSAssetIcon: React.FC<IOSAssetIconProps> = ({ 
  symbol, 
  chainName,
  size = 40 
}) => {
  const badgeSize = size * 0.4;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Main Token Icon */}
      <View 
        style={[
          styles.tokenIcon, 
          { 
            width: size, 
            height: size,
            backgroundColor: getTokenColor(symbol),
          }
        ]}
      >
        <Text 
          style={[
            styles.tokenSymbol,
            { fontSize: size * 0.4 }
          ]}
        >
          {symbol.charAt(0)}
        </Text>
      </View>
      
      {/* Chain Badge */}
      {chainName && chainName.toLowerCase() !== 'ethereum' && (
        <View 
          style={[
            styles.chainBadge,
            {
              width: badgeSize,
              height: badgeSize,
              backgroundColor: getChainColor(chainName),
            }
          ]}
        >
          <Text style={[styles.chainIcon, { fontSize: badgeSize * 0.6 }]}>
            {getChainIcon(chainName)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  tokenIcon: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chainBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: IOSColors.systemBackground,
  },
  chainIcon: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
