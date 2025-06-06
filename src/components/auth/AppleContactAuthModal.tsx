import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AppleButton from '../ui/AppleButton';
import AppleTextInput from '../ui/AppleTextInput';
import { Apple } from '../../../constants/AppleDesign';
import { useAuth } from '../../hooks/useAuth';
import { WalletConnectConfig } from '../../types';

interface AppleContactAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AppleContactAuthModal({
  visible,
  onClose,
  onSuccess,
}: AppleContactAuthModalProps) {
  const { sendVerificationCode, login } = useAuth();
  const [step, setStep] = useState<'contact' | 'verify'>('contact');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('contact');
    setValue('');
    setCode('');
  };

  const handleSend = async () => {
    if (!value) {
      Alert.alert('Missing', 'Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await sendVerificationCode('email', value);
      setStep('verify');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Missing Code', 'Enter the verification code');
      return;
    }

    try {
      setLoading(true);
      const config: WalletConnectConfig = {
        strategy: 'email',
        email: value,
        verificationCode: code,
      } as any;
      await login(config, onSuccess);
      reset();
      onClose();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const renderContactStep = () => (
    <View style={styles.formContent}>
      <Text style={styles.title}>Sign in with Email</Text>
      <AppleTextInput
        placeholder="Email Address"
        keyboardType="email-address"
        value={value}
        onChangeText={setValue}
        autoFocus
      />
      <AppleButton
        title="Send Code"
        fullWidth
        onPress={handleSend}
        loading={loading}
      />
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.formContent}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <AppleTextInput
        placeholder="000000"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        autoFocus
      />
      <AppleButton
        title="Verify & Continue"
        fullWidth
        onPress={handleVerify}
        loading={loading}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Email Sign In</Text>
          <View style={styles.closeButton} />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          {step === 'contact' ? renderContactStep() : renderVerifyStep()}
        </ScrollView>
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
    paddingHorizontal: Apple.Spacing.medium,
    paddingVertical: Apple.Spacing.medium,
    paddingTop: 60,
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
    flexGrow: 1,
  },
  formContent: {
    gap: Apple.Spacing.large,
  },
  title: {
    fontSize: Apple.Typography.title3.fontSize,
    fontWeight: Apple.Typography.title3.fontWeight as any,
    color: Apple.Colors.label,
    textAlign: 'center',
  },
});
