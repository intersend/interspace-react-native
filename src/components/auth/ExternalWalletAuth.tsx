import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { createWallet } from 'thirdweb/wallets';
import { useWalletInfo, useWalletImage } from 'thirdweb/react';
import { Colors, SpaceTokens } from '../../../constants/Colors';
import { WalletConnectConfig } from '../../types';
import { DEFAULT_TESTNET_CHAIN } from '../../../constants/thirdweb';

interface ExternalWalletAuthProps {
  onLogin: (config: WalletConnectConfig) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  isPopular?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'io.metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Most popular Ethereum wallet',
    isPopular: true,
  },
  {
    id: 'com.coinbase.wallet',
    name: 'Coinbase Wallet',
    icon: '🔵',
    description: 'Secure wallet by Coinbase',
    isPopular: true,
  },
  {
    id: 'com.trustwallet.app',
    name: 'Trust Wallet',
    icon: '🛡️',
    description: 'Multi-blockchain wallet',
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    description: 'Fun and simple Ethereum wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Connect any compatible wallet',
  },
  {
    id: 'safe',
    name: 'Safe (Gnosis Safe)',
    icon: '🔐',
    description: 'Multi-signature smart wallet',
  },
];

export default function ExternalWalletAuth({ 
  onLogin, 
  onBack, 
  isLoading 
}: ExternalWalletAuthProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleWalletSelect = async (walletOption: WalletOption) => {
    try {
      setSelectedWallet(walletOption.id);
      setConnecting(true);

      console.log('🔗 Connecting to wallet:', walletOption.name);

      // Create the wallet instance
      const wallet = createWallet(walletOption.id as any);

      // Prepare the wallet configuration
      const config: WalletConnectConfig = {
        strategy: 'wallet',
        wallet: wallet,
        chain: DEFAULT_TESTNET_CHAIN, // Use testnet for testing
      };

      // Attempt to connect
      await onLogin(config);

      console.log('✅ Wallet connected successfully:', walletOption.name);
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to connect to wallet';
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Connection was cancelled';
      } else if (error.message?.includes('No wallet found')) {
        errorMessage = `${walletOption.name} wallet not found. Please install it first.`;
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setConnecting(false);
      setSelectedWallet(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View 
          style={styles.backButton}
          onTouchEnd={onBack}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </View>
        <Text style={styles.title}>Connect Wallet</Text>
        <Text style={styles.subtitle}>
          Choose your preferred wallet to connect
        </Text>
      </View>

      {/* Wallet Options */}
      <View style={styles.walletList}>
        {WALLET_OPTIONS.map((wallet) => (
          <WalletOptionButton
            key={wallet.id}
            wallet={wallet}
            onPress={() => handleWalletSelect(wallet)}
            isConnecting={connecting && selectedWallet === wallet.id}
            disabled={connecting}
          />
        ))}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔒 Safe & Secure</Text>
        <Text style={styles.infoText}>
          Your wallet stays on your device. We never store your private keys.
        </Text>
      </View>

      {/* Global loading overlay */}
      {(isLoading || connecting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>
            {connecting ? 'Connecting to wallet...' : 'Signing in...'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface WalletOptionButtonProps {
  wallet: WalletOption;
  onPress: () => void;
  isConnecting: boolean;
  disabled: boolean;
}

function WalletOptionButton({ 
  wallet, 
  onPress, 
  isConnecting, 
  disabled 
}: WalletOptionButtonProps) {
  return (
    <View 
      style={[
        styles.walletButton,
        wallet.isPopular && styles.walletButtonPopular,
        disabled && styles.walletButtonDisabled,
      ]}
      onTouchEnd={disabled ? undefined : onPress}
    >
      <View style={styles.walletButtonContent}>
        <View style={styles.walletIconContainer}>
          <Text style={styles.walletIcon}>{wallet.icon}</Text>
          {wallet.isPopular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>Popular</Text>
            </View>
          )}
        </View>
        
        <View style={styles.walletTextContainer}>
          <Text style={[
            styles.walletName,
            disabled && styles.walletNameDisabled
          ]}>
            {wallet.name}
          </Text>
          <Text style={[
            styles.walletDescription,
            disabled && styles.walletDescriptionDisabled
          ]}>
            {wallet.description}
          </Text>
        </View>

        {isConnecting && (
          <ActivityIndicator 
            size="small" 
            color={Colors.dark.tint} 
            style={styles.walletLoader}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    lineHeight: 22,
  },
  walletList: {
    flex: 1,
    gap: 12,
  },
  walletButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  walletButtonPopular: {
    borderColor: Colors.dark.tint,
    borderWidth: 1.5,
  },
  walletButtonDisabled: {
    opacity: 0.6,
  },
  walletButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  walletIcon: {
    fontSize: 32,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.dark.tint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: Colors.dark.textInverted,
    fontSize: 10,
    fontWeight: '600',
  },
  walletTextContainer: {
    flex: 1,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  walletNameDisabled: {
    color: Colors.dark.subtext,
  },
  walletDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 18,
  },
  walletDescriptionDisabled: {
    color: Colors.dark.icon,
  },
  walletLoader: {
    marginLeft: 12,
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});
