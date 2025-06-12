import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { WalletConnectConfig } from '../../types';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth to access loginWithWallet
import AuthMethodButton from './AuthMethodButton'; // Import AuthMethodButton from its new location

interface ExternalWalletAuthProps {
  onLogin: (config: WalletConnectConfig) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export default function ExternalWalletAuth({ onLogin, onBack, isLoading }: ExternalWalletAuthProps) {
  const { loginWithWallet } = useAuth(); // Access loginWithWallet from AuthContext

  const handleWalletLogin = async (walletType: 'metamask' | 'coinbase') => {
    try {
      // Call the loginWithWallet function from AuthContext
      await loginWithWallet(walletType);
      // onLogin will be called by AuthContext after successful wallet login
    } catch (error: any) {
      console.error(`Failed to connect to ${walletType}:`, error);
      // Error handling is already in AuthContext, but can add more specific UI feedback here if needed
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Your Wallet</Text>
      <Text style={styles.subtitle}>
        Choose your preferred wallet to sign in or link your account.
      </Text>

      <View style={styles.methodsGrid}>
        <AuthMethodButton
          title="MetaMask"
          icon="🦊"
          description="Connect with MetaMask"
          onPress={() => handleWalletLogin('metamask')}
          disabled={isLoading}
        />
        <AuthMethodButton
          title="Coinbase Wallet"
          icon="👛"
          description="Connect with Coinbase Wallet"
          onPress={() => handleWalletLogin('coinbase')}
          disabled={isLoading}
        />
        {/* Add other wallet options here if needed */}
      </View>

      <TouchableOpacity onPress={onBack} style={styles.backButton} disabled={isLoading}>
        <Text style={styles.backButtonText}>← Back to Login Methods</Text>
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Connecting Wallet...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  methodsGrid: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backButtonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 12,
  },
});