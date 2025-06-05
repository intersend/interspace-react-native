import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// iOS Dark mode colors
const Colors = {
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  separator: 'rgba(84, 84, 88, 0.6)',
  systemBlue: '#0A84FF',
};

interface WalletOption {
  id: string;
  label: string;
  icon: string;
}

interface AddAccountSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (walletType: string) => void;
}

const walletOptions: WalletOption[] = [
  { id: 'metamask', label: 'MetaMask', icon: '🦊' },
  { id: 'coinbase', label: 'Coinbase Wallet', icon: '🪙' },
  { id: 'walletconnect', label: 'WalletConnect', icon: '🔗' },
  { id: 'test', label: 'Test Wallet', icon: '🧪' },
];

export const AddAccountSheet: React.FC<AddAccountSheetProps> = ({
  visible,
  onClose,
  onSelect,
}) => {
  const handleSelect = (walletType: string) => {
    onSelect(walletType);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.handle} />
          
          <Text style={styles.title}>Add Account</Text>
          
          <View style={styles.options}>
            {walletOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  index < walletOptions.length - 1 && styles.optionBorder,
                ]}
                onPress={() => handleSelect(option.id)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  sheet: {
    backgroundColor: Colors.secondaryBackground,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingTop: 6,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: Colors.separator,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.08,
  },
  options: {
    backgroundColor: Colors.tertiaryBackground,
    marginHorizontal: 8,
    borderRadius: 13,
    overflow: 'hidden',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  optionIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  optionLabel: {
    fontSize: 20,
    color: Colors.systemBlue,
    letterSpacing: -0.45,
  },
  cancelButton: {
    backgroundColor: Colors.tertiaryBackground,
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 13,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.systemBlue,
    letterSpacing: -0.45,
  },
});

export default AddAccountSheet;
