import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Apple } from '@/constants/AppleDesign';
import { Ionicons } from '@expo/vector-icons';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import { SmartProfile, LinkedAccount } from '@/src/types';
import { useLinkedAccounts } from '@/src/hooks/useLinkedAccounts';
import { useTestWallet } from '@/src/hooks/useTestWallet';
import { useProfiles } from '@/src/hooks/useProfiles';
import { useWalletImage } from 'thirdweb/react';
import * as Clipboard from 'expo-clipboard';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

interface ProfileDetailScreenProps {
  visible: boolean;
  profile: SmartProfile;
  onClose: () => void;
  onSetActive: () => void;
  onDelete: () => void;
}

const AccountRow: React.FC<{
  account: LinkedAccount;
  isPrimary: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
}> = ({ account, isPrimary, onSetPrimary, onDelete }) => {
  const { data: walletImage } = useWalletImage(account.walletType as any);
  
  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => {
        hapticTrigger('impactMedium');
        onDelete();
      }}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  const getWalletIcon = (walletType: string) => {
    switch (walletType) {
      case 'metamask':
        return '🦊';
      case 'coinbase':
        return '🪙';
      case 'walletconnect':
        return '🔗';
      default:
        return '👛';
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={styles.accountRow}
        onPress={() => {
          if (!isPrimary) {
            hapticTrigger('selection');
            onSetPrimary();
          }
        }}
      >
        <View style={styles.accountIcon}>
          <Text style={styles.accountIconText}>{getWalletIcon(account.walletType || '')}</Text>
        </View>
        
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>
            {account.customName || account.walletType || 'External Wallet'}
          </Text>
          <Text style={styles.accountAddress}>{formatAddress(account.address)}</Text>
        </View>
        
        {isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryBadgeText}>Primary</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );
};

export default function ProfileDetailScreen({
  visible,
  profile,
  onClose,
  onSetActive,
  onDelete,
}: ProfileDetailScreenProps) {
  const {
    accounts,
    linkAccount,
    unlinkAccount,
    setPrimaryAccount,
    refreshAccounts,
  } = useLinkedAccounts(profile.id);
  
  const { updateProfile } = useProfiles();
  const testWallet = useTestWallet();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);

  useEffect(() => {
    if (visible) {
      refreshAccounts(profile.id);
    }
  }, [visible, profile.id]);

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(profile.sessionWalletAddress);
    hapticTrigger('notificationSuccess');
    Alert.alert('Copied', 'Session wallet address copied to clipboard');
  };

  const handleRename = async () => {
    if (editedName.trim() && editedName !== profile.name) {
      try {
        await updateProfile(profile.id, { name: editedName.trim() });
        hapticTrigger('notificationSuccess');
      } catch (error) {
        Alert.alert('Error', 'Failed to rename profile');
      }
    }
    setIsEditingName(false);
  };

  const handleAddAccount = () => {
    const options = ['Cancel'];
    
    if (testWallet.isDevelopment && testWallet.testWallets.length > 0) {
      testWallet.testWallets.forEach((wallet: any) => {
        const walletName = (wallet as any).name || 'Test Wallet';
        options.push(`🧪 ${walletName} (${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)})`);
      });
    }
    
    options.push('🦊 MetaMask', '🔗 WalletConnect');
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
          title: 'Add Account',
          message: 'Choose a wallet to link',
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) return;
          
          const testWalletCount = testWallet.testWallets.length;
          
          if (buttonIndex <= testWalletCount) {
            const selectedWallet = testWallet.testWallets[buttonIndex - 1];
            try {
              await linkAccount(profile.id, {
                address: selectedWallet.address,
                walletType: 'metamask',
                customName: (selectedWallet as any).name || `Test Wallet`,
                isPrimary: accounts.length === 0,
              });
              hapticTrigger('notificationSuccess');
              refreshAccounts(profile.id);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to link account');
            }
          } else {
            Alert.alert('Coming Soon', 'External wallet integration will be available soon');
          }
        }
      );
    }
  };

  const handleDeleteAccount = (account: LinkedAccount) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount(account.id);
              hapticTrigger('notificationSuccess');
              refreshAccounts(profile.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>PROFILE INFORMATION</Text>
              <View style={styles.sectionContent}>
                {/* Profile Name */}
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => setIsEditingName(true)}
                >
                  <Text style={styles.infoLabel}>Name</Text>
                  <View style={styles.infoValue}>
                    <Text style={styles.infoValueText}>{profile.name}</Text>
                    <Ionicons name="chevron-forward" size={16} color={Apple.Colors.tertiaryLabel} />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.separator} />
                
                {/* Session Wallet */}
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={handleCopyAddress}
                >
                  <Text style={styles.infoLabel}>Session Wallet</Text>
                  <View style={styles.infoValue}>
                    <Text style={styles.addressText}>
                      {profile.sessionWalletAddress.slice(0, 6)}...{profile.sessionWalletAddress.slice(-4)}
                    </Text>
                    <Ionicons name="copy-outline" size={16} color={Apple.Colors.systemBlue} />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.separator} />
                
                {/* Active Status */}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <TouchableOpacity
                    style={[styles.statusButton, profile.isActive && styles.activeStatusButton]}
                    onPress={() => !profile.isActive && onSetActive()}
                    disabled={profile.isActive}
                  >
                    <Text style={[styles.statusButtonText, profile.isActive && styles.activeStatusButtonText]}>
                      {profile.isActive ? 'Active' : 'Set as Active'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Linked Accounts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>LINKED ACCOUNTS</Text>
              <View style={styles.sectionContent}>
                {accounts.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No accounts linked</Text>
                  </View>
                ) : (
                  accounts.map((account, index) => (
                    <React.Fragment key={account.id}>
                      {index > 0 && <View style={styles.separator} />}
                      <AccountRow
                        account={account}
                        isPrimary={account.isPrimary}
                        onSetPrimary={() => {
                          setPrimaryAccount(account.id);
                          refreshAccounts(profile.id);
                        }}
                        onDelete={() => handleDeleteAccount(account)}
                      />
                    </React.Fragment>
                  ))
                )}
              </View>
              
              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={handleAddAccount}
              >
                <Ionicons name="add-circle" size={22} color={Apple.Colors.systemBlue} />
                <Text style={styles.addAccountButtonText}>Add Account</Text>
              </TouchableOpacity>
            </View>

            {/* Actions Section */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDelete}
              >
                <Text style={styles.deleteButtonText}>Delete Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Apple.Colors.separator,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Apple.Colors.systemBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  section: {
    marginTop: 35,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    color: Apple.Colors.secondaryLabel,
    marginLeft: 20,
    marginBottom: 8,
    letterSpacing: -0.08,
  },
  sectionContent: {
    backgroundColor: Apple.Colors.secondarySystemGroupedBackground,
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  infoLabel: {
    fontSize: 17,
    color: Apple.Colors.label,
  },
  infoValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValueText: {
    fontSize: 17,
    color: Apple.Colors.secondaryLabel,
  },
  addressText: {
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: Apple.Colors.secondaryLabel,
  },
  separator: {
    height: 0.5,
    backgroundColor: Apple.Colors.separator,
    marginLeft: 16,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Apple.Colors.systemBlue,
  },
  activeStatusButton: {
    backgroundColor: Apple.Colors.systemGreen,
  },
  statusButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'white',
  },
  activeStatusButtonText: {
    color: 'white',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Apple.Colors.secondarySystemGroupedBackground,
    minHeight: 60,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Apple.Colors.tertiarySystemGroupedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '400',
    color: Apple.Colors.label,
    marginBottom: 2,
  },
  accountAddress: {
    fontSize: 13,
    color: Apple.Colors.secondaryLabel,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Apple.Colors.systemBlue,
  },
  primaryBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'white',
  },
  deleteAction: {
    backgroundColor: Apple.Colors.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Apple.Colors.tertiaryLabel,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: Apple.Colors.secondarySystemGroupedBackground,
    borderRadius: 10,
  },
  addAccountButtonText: {
    fontSize: 17,
    color: Apple.Colors.systemBlue,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: Apple.Colors.secondarySystemGroupedBackground,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    color: Apple.Colors.systemRed,
  },
  bottomSpacer: {
    height: 50,
  },
});
