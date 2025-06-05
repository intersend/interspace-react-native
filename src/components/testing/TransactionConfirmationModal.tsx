import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../../../constants/Colors';

interface TransactionDetails {
  to: string;
  value: string;
  gas?: string;
  gasPrice?: string;
  data?: string;
  chainId?: number;
  from?: string;
}

interface TransactionConfirmationModalProps {
  visible: boolean;
  transaction: TransactionDetails | null;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}

export function TransactionConfirmationModal({
  visible,
  transaction,
  onApprove,
  onReject,
  onClose,
}: TransactionConfirmationModalProps) {
  if (!transaction) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatValue = (value: string) => {
    return `${parseFloat(value).toFixed(6)} ETH`;
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚡</Text>
            </View>
            <Text style={styles.title}>Confirm Transaction</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Transaction Details */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transaction Details</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.label}>From:</Text>
                <Text style={styles.value}>
                  {transaction.from ? formatAddress(transaction.from) : 'Your Wallet'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>To:</Text>
                <Text style={styles.value}>{formatAddress(transaction.to)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.label}>Value:</Text>
                <Text style={[styles.value, styles.valueHighlight]}>
                  {formatValue(transaction.value)}
                </Text>
              </View>

              {transaction.gas && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Gas Limit:</Text>
                  <Text style={styles.value}>{transaction.gas}</Text>
                </View>
              )}

              {transaction.gasPrice && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Gas Price:</Text>
                  <Text style={styles.value}>{transaction.gasPrice} gwei</Text>
                </View>
              )}

              {transaction.chainId && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Chain ID:</Text>
                  <Text style={styles.value}>{transaction.chainId}</Text>
                </View>
              )}

              {transaction.data && transaction.data !== '0x' && (
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Data:</Text>
                  <View style={styles.dataContainer}>
                    <Text style={styles.dataText}>
                      {transaction.data.slice(0, 100)}
                      {transaction.data.length > 100 ? '...' : ''}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Warning */}
            <View style={styles.warningSection}>
              <View style={styles.warningHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningTitle}>Development Mode</Text>
              </View>
              <Text style={styles.warningText}>
                This is a test transaction in development mode. No real funds will be transferred.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
            >
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={onApprove}
            >
              <Text style={styles.approveButtonText}>Approve & Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
    width: 80,
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
  valueHighlight: {
    color: '#00FF88',
    fontWeight: '600',
  },
  dataContainer: {
    flex: 1,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    padding: 12,
    marginLeft: 16,
  },
  dataText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  warningSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFC107',
  },
  warningText: {
    fontSize: 12,
    color: '#FFE082',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF4444',
  },
  approveButton: {
    backgroundColor: '#00AA00',
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
