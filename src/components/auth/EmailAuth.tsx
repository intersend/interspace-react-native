import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, SpaceTokens } from '../../../constants/Colors';
import { WalletConnectConfig } from '../../types';

interface EmailAuthProps {
  onLogin: (config: WalletConnectConfig) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  onSendVerificationCode: (strategy: 'email', contact: string) => Promise<void>;
}

export default function EmailAuth({ 
  onLogin, 
  onBack, 
  isLoading, 
  onSendVerificationCode 
}: EmailAuthProps) {
  const [step, setStep] = useState<'email' | 'verification'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sending, setSending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setSending(true);
      await onSendVerificationCode('email', email);
      setStep('verification');
      startResendTimer();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    try {
      const config: WalletConnectConfig = {
        strategy: 'email',
        email,
        verificationCode,
      };

      await onLogin(config);
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid verification code');
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    await handleSendCode();
  };

  const renderEmailStep = () => (
    <>
      <Text style={styles.title}>Sign in with Email</Text>
      <Text style={styles.subtitle}>
        Enter your email address to receive a verification code
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.emailInput}
          placeholder="Enter your email"
          placeholderTextColor={Colors.dark.textTertiary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={true}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (!isValidEmail(email) || sending) && styles.primaryButtonDisabled
        ]}
        onPress={handleSendCode}
        disabled={!isValidEmail(email) || sending}
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.dark.textInverted} />
        ) : (
          <Text style={styles.primaryButtonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderVerificationStep = () => (
    <>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {email}
      </Text>

      <View style={styles.codeInputContainer}>
        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor={Colors.dark.textTertiary}
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus={true}
          textAlign="center"
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          verificationCode.length !== 6 && styles.primaryButtonDisabled
        ]}
        onPress={handleVerifyCode}
        disabled={verificationCode.length !== 6}
      >
        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the code? </Text>
        <TouchableOpacity
          onPress={handleResendCode}
          disabled={resendTimer > 0}
        >
          <Text style={[
            styles.resendLink,
            resendTimer > 0 && styles.resendLinkDisabled
          ]}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setStep('email')}
        style={styles.changeEmailButton}
      >
        <Text style={styles.changeEmailText}>Change email address</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {step === 'email' ? renderEmailStep() : renderVerificationStep()}
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>Signing in...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.authBackground,
  },
  header: {
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingTop: SpaceTokens.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: SpaceTokens.spacing.sm,
    paddingHorizontal: SpaceTokens.spacing.xs,
  },
  backButtonText: {
    color: Colors.dark.tint,
    fontSize: SpaceTokens.fontSize.md,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: SpaceTokens.spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: SpaceTokens.fontSize.title1,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: SpaceTokens.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SpaceTokens.fontSize.md,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: SpaceTokens.spacing.xl,
  },
  inputContainer: {
    marginBottom: SpaceTokens.spacing.lg,
  },
  emailInput: {
    backgroundColor: Colors.dark.authSurface,
    borderRadius: SpaceTokens.borderRadius.md,
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingVertical: SpaceTokens.spacing.lg,
    fontSize: SpaceTokens.fontSize.lg,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.authBorder,
  },
  codeInputContainer: {
    marginBottom: SpaceTokens.spacing.lg,
  },
  codeInput: {
    backgroundColor: Colors.dark.authSurface,
    borderRadius: SpaceTokens.borderRadius.md,
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingVertical: SpaceTokens.spacing.xl,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: Colors.dark.authBorder,
    letterSpacing: 8,
  },
  primaryButton: {
    backgroundColor: Colors.dark.tint,
    borderRadius: SpaceTokens.borderRadius.md,
    paddingVertical: SpaceTokens.spacing.lg,
    alignItems: 'center',
    marginBottom: SpaceTokens.spacing.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: SpaceTokens.fontSize.lg,
    fontWeight: '600',
    color: Colors.dark.textInverted,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SpaceTokens.spacing.md,
  },
  resendText: {
    fontSize: SpaceTokens.fontSize.sm,
    color: Colors.dark.textSecondary,
  },
  resendLink: {
    fontSize: SpaceTokens.fontSize.sm,
    color: Colors.dark.tint,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: Colors.dark.textTertiary,
  },
  changeEmailButton: {
    alignItems: 'center',
    paddingVertical: SpaceTokens.spacing.md,
  },
  changeEmailText: {
    fontSize: SpaceTokens.fontSize.sm,
    color: Colors.dark.textSecondary,
    textDecorationLine: 'underline',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: SpaceTokens.fontSize.md,
    marginTop: SpaceTokens.spacing.md,
  },
});
