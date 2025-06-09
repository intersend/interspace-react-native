import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useTestWallet, TestTransaction, PendingRequest } from '../../hooks/useTestWallet';
import { TestWallet } from '../../types';
import ApplePayTray from '../transaction/ApplePayTray';
import { getRandomTransactionScenario } from '../../utils/mockOrbyData';

// This modal is only presented from development-only components such as
// `FloatingTestWallet`. Production builds never import it because `__DEV__`
// disables the entire test wallet system.

interface TestWalletModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TestWalletModal({ visible, onClose }: TestWalletModalProps) {
  const {
    testWallets,
    activeWallet,
    transactions,
    pendingRequests,
    createTestWallet,
    setActiveTestWallet,
    deleteTestWallet,
    clearTransactions,
    approveRequest,
    rejectRequest,
  } = useTestWallet();

  const [activeTab, setActiveTab] = useState<'wallets' | 'transactions' | 'pending'>('wallets');
  const [isCreating, setIsCreating] = useState(false);
  
  // Apple Pay Tray test state
  const [showApplePayTest, setShowApplePayTest] = useState(false);
  const [testScenario, setTestScenario] = useState<ReturnType<typeof getRandomTransactionScenario> | null>(null);

  const handleCreateWallet = async () => {
    try {
      setIsCreating(true);
      const newWallet = await createTestWallet();
      await setActiveTestWallet(newWallet);
    } catch (error) {
      Alert.alert('Error', 'Failed to create test wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const handleWalletPress = async (wallet: TestWallet) => {
    await setActiveTestWallet(wallet);
  };

  const handleDeleteWallet = (address: string) => {
    Alert.alert(
      'Delete Test Wallet',
      'Are you sure you want to delete this test wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTestWallet(address)
        },
      ]
    );
  };

  const copyToClipboard = (text: string, type: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', `${type} copied to clipboard`);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleTestApplePay = () => {
    const scenario = getRandomTransactionScenario();
    setTestScenario(scenario);
    setShowApplePayTest(true);
  };

  const renderWalletsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Test Apple Pay Button */}
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: '#007AFF' }]}
        onPress={handleTestApplePay}
      >
        <View style={styles.createButtonContent}>
          <Text style={styles.createButtonIcon}>🍎</Text>
          <Text style={styles.createButtonText}>Test Apple Pay Tray</Text>
        </View>
      </TouchableOpacity>

      {/* Create Wallet Button */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateWallet}
        disabled={isCreating}
      >
        <View style={styles.createButtonContent}>
          {isCreating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.createButtonIcon}>+</Text>
          )}
          <Text style={styles.createButtonText}>
            {isCreating ? 'Creating...' : 'Create Test Wallet'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Wallets List */}
      {testWallets.map((wallet) => (
        <View key={wallet.address} style={styles.walletCard}>
          <TouchableOpacity
            style={[
              styles.walletCardContent,
              activeWallet?.address === wallet.address && styles.activeWalletCard
            ]}
            onPress={() => handleWalletPress(wallet)}
          >
            <View style={styles.walletHeader}>
              <View style={styles.walletInfo}>
                <Text style={styles.walletName}>
                  {(wallet as any).name || 'Test Wallet'}
                </Text>
                {activeWallet?.address === wallet.address && (
                  <View style={styles.activeLabel}>
                    <Text style={styles.activeLabelText}>ACTIVE</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteWallet(wallet.address)}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.walletDetails}>
              <TouchableOpacity
                style={styles.addressRow}
                onPress={() => copyToClipboard(wallet.address, 'Address')}
              >
                <Text style={styles.addressLabel}>Address:</Text>
                <Text style={styles.addressText}>{formatAddress(wallet.address)}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addressRow}
                onPress={() => copyToClipboard(wallet.privateKey, 'Private Key')}
              >
                <Text style={styles.addressLabel}>Private Key:</Text>
                <Text style={styles.addressText}>{formatAddress(wallet.privateKey)}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      ))}

      {testWallets.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No test wallets yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first test wallet to get started</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTransactionsTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Clear Transactions Button */}
      {transactions.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearTransactions}
        >
          <Text style={styles.clearButtonText}>Clear All Transactions</Text>
        </TouchableOpacity>
      )}

      {/* Transactions List */}
      {transactions.map((tx) => (
        <View key={tx.id} style={styles.transactionCard}>
          <View style={styles.transactionHeader}>
            <Text style={styles.transactionStatus}>
              {tx.status === 'confirmed' ? '✅' : tx.status === 'failed' ? '❌' : '⏳'}
            </Text>
            <Text style={styles.transactionTime}>{formatTime(tx.timestamp)}</Text>
          </View>

          <View style={styles.transactionDetails}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>To:</Text>
              <Text style={styles.transactionValue}>{formatAddress(tx.to)}</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Value:</Text>
              <Text style={styles.transactionValue}>{tx.value} ETH</Text>
            </View>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionLabel}>Network:</Text>
              <Text style={styles.transactionValue}>{tx.network}</Text>
            </View>
            {tx.hash && (
              <TouchableOpacity
                style={styles.transactionRow}
                onPress={() => copyToClipboard(tx.hash!, 'Transaction Hash')}
              >
                <Text style={styles.transactionLabel}>Hash:</Text>
                <Text style={styles.transactionValue}>{formatAddress(tx.hash)}</Text>
                <Text style={styles.copyIcon}>📋</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {transactions.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
          <Text style={styles.emptyStateSubtext}>Transactions will appear here when you use the test wallet</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderPendingTab = () => (
    <ScrollView style={styles.tabContent}>
      {pendingRequests.map((request) => (
        <View key={request.id} style={styles.pendingCard}>
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingType}>
              {request.type === 'transaction' ? '💸 Transaction' : '📝 Sign Message'}
            </Text>
            <Text style={styles.pendingTime}>
              {formatTime((request.data as any).timestamp)}
            </Text>
          </View>

          <View style={styles.pendingDetails}>
            {request.type === 'transaction' ? (
              <TransactionRequestDetails transaction={request.data as TestTransaction} />
            ) : (
              <SIWERequestDetails siweRequest={request.data as any} />
            )}
          </View>

          <View style={styles.pendingActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => rejectRequest(request.id)}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => approveRequest(request.id)}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {pendingRequests.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No pending requests</Text>
          <Text style={styles.emptyStateSubtext}>Transaction and signing requests will appear here</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
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
            <Text style={styles.title}>🧪 Test Wallet</Text>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV ONLY</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'wallets' && styles.activeTab]}
              onPress={() => setActiveTab('wallets')}
            >
              <Text style={[styles.tabText, activeTab === 'wallets' && styles.activeTabText]}>
                Wallets ({testWallets.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
                History ({transactions.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
              onPress={() => setActiveTab('pending')}
            >
              <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                Pending ({pendingRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'wallets' && renderWalletsTab()}
          {activeTab === 'transactions' && renderTransactionsTab()}
          {activeTab === 'pending' && renderPendingTab()}
        </View>
      </Modal>

      {/* Apple Pay Test Tray */}
      {testScenario && (
        <ApplePayTray
          visible={showApplePayTest}
          intent={testScenario.intent}
          selectedAccount={testScenario.account}
          onClose={() => {
            setShowApplePayTest(false);
            setTestScenario(null);
          }}
          onConfirm={() => {
            Alert.alert('Test Success', 'Apple Pay tray test completed!');
            setShowApplePayTest(false);
            setTestScenario(null);
          }}
          onAccountSelect={() => {
            Alert.alert('Account Selection', 'Account selector would open here');
          }}
          transactionType={testScenario.type}
        />
      )}
    </>
  );
}

// Helper components for request details
function TransactionRequestDetails({ transaction }: { transaction: TestTransaction }) {
  return (
    <>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>To:</Text>
        <Text style={styles.detailValue}>{transaction.to.slice(0, 10)}...</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Value:</Text>
        <Text style={styles.detailValue}>{transaction.value} ETH</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Gas:</Text>
        <Text style={styles.detailValue}>{transaction.gasLimit}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Network:</Text>
        <Text style={styles.detailValue}>{transaction.network}</Text>
      </View>
    </>
  );
}

function SIWERequestDetails({ siweRequest }: { siweRequest: any }) {
  return (
    <>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Domain:</Text>
        <Text style={styles.detailValue}>{siweRequest.domain}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Address:</Text>
        <Text style={styles.detailValue}>{siweRequest.address.slice(0, 10)}...</Text>
      </View>
      {siweRequest.statement && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Message:</Text>
          <Text style={styles.detailValue}>{siweRequest.statement.slice(0, 50)}...</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000014',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#FF6B35',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 16,
  },
  closeButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  devBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  devBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    marginBottom: 20,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  createButtonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walletCard: {
    marginBottom: 16,
  },
  walletCardContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeWalletCard: {
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 12,
  },
  activeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#00FF00',
    borderRadius: 8,
  },
  activeLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  walletDetails: {
    gap: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 12,
    color: '#888',
    width: 80,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    flex: 1,
  },
  copyIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  transactionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionStatus: {
    fontSize: 16,
  },
  transactionTime: {
    fontSize: 12,
    color: '#888',
  },
  transactionDetails: {
    gap: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLabel: {
    fontSize: 12,
    color: '#888',
    width: 60,
  },
  transactionValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#FFFFFF',
    flex: 1,
  },
  pendingCard: {
    backgroundColor: '#2a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  pendingTime: {
    fontSize: 12,
    color: '#888',
  },
  pendingDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#00AA00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
