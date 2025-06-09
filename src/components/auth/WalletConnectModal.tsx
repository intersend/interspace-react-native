import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import * as Clipboard from 'expo-clipboard';
import AppleButton from '../ui/AppleButton';
import AppleTextInput from '../ui/AppleTextInput';
import { Apple } from '../../../constants/AppleDesign';
import { useAuth } from '../../hooks/useAuth';

interface WalletConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function WalletConnectModal({ visible, onClose, onSuccess }: WalletConnectModalProps) {
  const { loginWithWalletConnect } = useAuth();
  const [uri, setUri] = useState('');
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = BarCodeScanner.usePermissions();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setUri('');
      setScanning(false);
    }
  }, [visible]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    setUri(text);
  };

  const handleConnect = async () => {
    if (!uri) {
      Alert.alert('Missing URI', 'Please enter or scan a WalletConnect URI');
      return;
    }
    try {
      setLoading(true);
      await loginWithWalletConnect(uri, onSuccess);
      onClose();
    } catch (err: any) {
      Alert.alert('Connection Failed', err.message || 'Unable to connect');
    } finally {
      setLoading(false);
    }
  };

  const onBarCodeScanned = (result: BarCodeScannerResult) => {
    setScanning(false);
    setUri(result.data);
  };

  const requestScan = async () => {
    if (!permission?.granted) {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes');
        return;
      }
    }
    setScanning(true);
  };

  const renderScanner = () => (
    <View style={styles.scannerContainer}>
      <BarCodeScanner onBarCodeScanned={onBarCodeScanned} style={StyleSheet.absoluteFillObject} />
      <TouchableOpacity style={styles.cancelScan} onPress={() => setScanning(false)}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderForm = () => (
    <View style={styles.content}>
      <Text style={styles.title}>WalletConnect</Text>
      <AppleTextInput
        placeholder="wc:..."
        value={uri}
        onChangeText={setUri}
        autoFocus
      />
      <AppleButton title="Paste from Clipboard" onPress={handlePaste} fullWidth variant="secondary" />
      <AppleButton title="Scan QR Code" onPress={requestScan} fullWidth variant="secondary" />
      <AppleButton title="Connect" onPress={handleConnect} fullWidth loading={loading} />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      {scanning ? renderScanner() : (
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>WalletConnect</Text>
            <View style={styles.closeButton} />
          </View>
          {renderForm()}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Apple.Spacing.medium,
    paddingBottom: Apple.Spacing.medium,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Apple.Colors.separator,
  },
  closeButton: {
    width: 60,
  },
  closeText: {
    fontSize: Apple.Typography.body.fontSize,
    color: Apple.Colors.systemBlue,
  },
  headerTitle: {
    fontSize: Apple.Typography.headline.fontSize,
    fontWeight: Apple.Typography.headline.fontWeight as any,
    color: Apple.Colors.label,
  },
  content: {
    padding: Apple.Spacing.large,
    gap: Apple.Spacing.large,
  },
  title: {
    fontSize: Apple.Typography.title3.fontSize,
    fontWeight: Apple.Typography.title3.fontWeight as any,
    color: Apple.Colors.label,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  cancelScan: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: Apple.Colors.systemBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontSize: Apple.Typography.body.fontSize,
  },
});
