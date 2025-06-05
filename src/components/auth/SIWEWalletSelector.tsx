import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import { useTestWallet } from '../../hooks/useTestWallet';
import { useAuth } from '../../hooks/useAuth';
import { TestWallet, WalletConnectConfig } from '../../types';

interface SIWEWalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SIWEWalletSelector({ 
  visible, 
  onClose, 
  onSuccess 
}: SIWEWalletSelectorProps) {
  const { testWallets, createTestWallet, setActiveTestWallet } = useTestWallet();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      const newWallet = await createTestWallet();
      await setActiveTestWallet(newWallet);
      // Auto-select the new wallet
      setSelectedWallet(newWallet.address);
    } catch (error) {
      Alert.alert('Error', 'Failed to create test wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelection = (wallet: TestWallet) => {
    setSelectedWallet(wallet.address);
  };

  const handleSIWEAuthentication = async () => {
    const wallet = testWallets.find(w => w.address === selectedWallet);
    if (!wallet) {
      Alert.alert('Error', 'Please select a wallet first');
      return;
    }

    try {
      setIsLoading(true);
      
      // Set as active test wallet
      await setActiveTestWallet(wallet);
      
      console.log('🔐 Starting SIWE authentication with wallet:', wallet.address);
      
      // Perform SIWE authentication
      const config: WalletConnectConfig = {
        strategy: 'wallet',
        testWallet: wallet,
      };
      
      await login(config, onSuccess);
      
      // Close modal on success
      onClose();
    } catch (error: any) {
      console.error('❌ SIWE authentication failed:', error);
      Alert.alert('Authentication Failed', error.message || 'Failed to authenticate with SIWE');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>🔐 Sign in with SIWE</Text>
          <View style={styles.devBadge}>
            <Text style={styles.devBadgeText}>DEV ONLY</Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          <Text style={styles.subtitle}>
            Select a test wallet to authenticate with Sign-In with Ethereum (SIWE)
          </Text>

          {/* Create Wallet Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateWallet}
            disabled={isLoading}
          >
            <View style={styles.createButtonContent}>
              {isLoading && !selectedWallet ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.createButtonIcon}>+</Text>
              )}
              <Text style={styles.createButtonText}>
                {isLoading && !selectedWallet ? 'Creating...' : 'Create New Test Wallet'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Wallet List */}
          {testWallets.map((wallet) => (
            <TouchableOpacity
              key={wallet.address}
              style={[
                styles.walletCard,
                selectedWallet === wallet.address && styles.selectedWalletCard
              ]}
              onPress={() => handleWalletSelection(wallet)}
              disabled={isLoading}
            >
              <View style={styles.walletContent}>
                <View style={styles.walletHeader}>
                  <View style={styles.selectionIndicator}>
                    {selectedWallet === wallet.address ? (
                      <View style={styles.selectedDot} />
                    ) : (
                      <View style={styles.unselectedDot} />
                    )}
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletName}>
                      {(wallet as any).name || 'Test Wallet'}
                    </Text>
                    <Text style={styles.walletAddress}>
                      {formatAddress(wallet.address)}
                    </Text>
                  </View>
                  <Text style={styles.walletIcon}>🧪</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {testWallets.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔐</Text>
              <Text style={styles.emptyStateText}>No test wallets available</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first test wallet to authenticate with SIWE
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.authButton,
              (!selectedWallet || isLoading) && styles.authButtonDisabled
            ]}
            onPress={handleSIWEAuthentication}
            disabled={!selectedWallet || isLoading}
          >
            <View style={styles.authButtonContent}>
              {isLoading && selectedWallet ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.authButtonIcon}>🔐</Text>
              )}
              <Text style={styles.authButtonText}>
                {isLoading && selectedWallet ? 'Authenticating...' : 'Authenticate with SIWE'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Apple.Spacing.large,
    paddingVertical: Apple.Spacing.medium,
    paddingTop: 60,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Apple.Colors.separator,
  },
  closeButton: {
    width: Apple.TouchTargets.minimum,
    height: Apple.TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Apple.Colors.secondarySystemFill,
    borderRadius: Apple.Radius.tight,
  },
  closeButtonText: {
    color: Apple.Colors.systemBlue,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: Apple.Typography.title2.fontSize,
    fontWeight: Apple.Typography.title2.fontWeight,
    color: Apple.Colors.label,
    textAlign: 'center',
  },
  devBadge: {
    paddingHorizontal: Apple.Spacing.small,
    paddingVertical: Apple.Spacing.micro,
    backgroundColor: Apple.Colors.systemOrange,
    borderRadius: Apple.Radius.tight,
  },
  devBadgeText: {
    fontSize: Apple.Typography.caption2.fontSize,
    fontWeight: '700',
    color: Apple.Colors.systemBackground,
  },
  content: {
    flex: 1,
    padding: Apple.Spacing.large,
  },
  subtitle: {
    fontSize: Apple.Typography.body.fontSize,
    color: Apple.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Apple.Spacing.xxlarge,
  },
  createButton: {
    backgroundColor: Apple.Colors.systemBlue,
    borderRadius: Apple.Radius.medium,
    marginBottom: Apple.Spacing.large,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Apple.Spacing.medium,
  },
  createButtonIcon: {
    fontSize: 20,
    color: Apple.Colors.systemBackground,
    marginRight: Apple.Spacing.small,
  },
  createButtonText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '600',
    color: Apple.Colors.systemBackground,
  },
  walletCard: {
    backgroundColor: Apple.Colors.secondarySystemBackground,
    borderRadius: Apple.Radius.medium,
    marginBottom: Apple.Spacing.medium,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedWalletCard: {
    borderColor: Apple.Colors.systemBlue,
    backgroundColor: Apple.Colors.systemBlue + '10',
  },
  walletContent: {
    padding: Apple.Spacing.medium,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectionIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Apple.Colors.systemBlue,
    marginRight: Apple.Spacing.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Apple.Colors.systemBlue,
  },
  unselectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'transparent',
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '600',
    color: Apple.Colors.label,
    marginBottom: Apple.Spacing.micro,
  },
  walletAddress: {
    fontSize: Apple.Typography.callout.fontSize,
    fontFamily: 'monospace',
    color: Apple.Colors.secondaryLabel,
  },
  walletIcon: {
    fontSize: 24,
    marginLeft: Apple.Spacing.small,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Apple.Spacing.xxxlarge,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Apple.Spacing.medium,
  },
  emptyStateText: {
    fontSize: Apple.Typography.headline.fontSize,
    fontWeight: '600',
    color: Apple.Colors.secondaryLabel,
    marginBottom: Apple.Spacing.small,
  },
  emptyStateSubtext: {
    fontSize: Apple.Typography.body.fontSize,
    color: Apple.Colors.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    padding: Apple.Spacing.large,
    paddingBottom: Apple.Spacing.xxlarge,
  },
  authButton: {
    backgroundColor: Apple.Colors.systemBlue,
    borderRadius: Apple.Radius.medium,
  },
  authButtonDisabled: {
    backgroundColor: Apple.Colors.systemGray4,
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Apple.Spacing.medium,
  },
  authButtonIcon: {
    fontSize: 20,
    marginRight: Apple.Spacing.small,
  },
  authButtonText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '600',
    color: Apple.Colors.systemBackground,
  },
});
