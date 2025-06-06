import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import AppleButton from '../ui/AppleButton';
import AppleTextInput from '../ui/AppleTextInput';
import FloatingTestWallet from '../testing/FloatingTestWallet';
import SIWEWalletSelector from './SIWEWalletSelector';
import { useAuth } from '../../hooks/useAuth';
import { useTestWallet } from '../../hooks/useTestWallet';
import { WalletConnectConfig } from '../../types';
import * as Haptics from 'expo-haptics';
import { createWallet } from 'thirdweb/wallets';

interface AppleAuthScreenProps {
  initialPath?: 'guest' | 'wallet' | 'sign-in' | 'choice';
  onAuthSuccess?: () => void;
}

type AuthStep = 'choice' | 'email' | 'social' | 'wallet' | 'verification';

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  strategy:
    | 'google'
    | 'apple'
    | 'facebook'
    | 'x'
    | 'discord'
    | 'telegram'
    | 'twitch'
    | 'farcaster'
    | 'github'
    | 'line'
    | 'coinbase'
    | 'steam'
    | 'backend';
  primary?: boolean;
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'apple',
    name: 'Continue with Apple',
    icon: '🍎',
    strategy: 'apple',
    primary: true,
  },
  {
    id: 'google',
    name: 'Continue with Google',
    icon: '🔍',
    strategy: 'google',
  },
  {
    id: 'facebook',
    name: 'Continue with Facebook',
    icon: '📘',
    strategy: 'facebook',
  },
  {
    id: 'x',
    name: 'Continue with X',
    icon: '𝕏',
    strategy: 'x',
  },
  {
    id: 'discord',
    name: 'Continue with Discord',
    icon: '🎮',
    strategy: 'discord',
  },
  {
    id: 'telegram',
    name: 'Continue with Telegram',
    icon: '✈️',
    strategy: 'telegram',
  },
  {
    id: 'twitch',
    name: 'Continue with Twitch',
    icon: '📺',
    strategy: 'twitch',
  },
  {
    id: 'farcaster',
    name: 'Continue with Farcaster',
    icon: '📡',
    strategy: 'farcaster',
  },
  {
    id: 'github',
    name: 'Continue with GitHub',
    icon: '🐱',
    strategy: 'github',
  },
  {
    id: 'line',
    name: 'Continue with Line',
    icon: '💚',
    strategy: 'line',
  },
  {
    id: 'coinbase',
    name: 'Continue with Coinbase',
    icon: '💙',
    strategy: 'coinbase',
  },
  {
    id: 'steam',
    name: 'Continue with Steam',
    icon: '🎮',
    strategy: 'steam',
  },
  {
    id: 'backend',
    name: 'Continue with Backend',
    icon: '🔑',
    strategy: 'backend',
  },
];

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  walletId: string;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: '🦊',
    description: 'Connect using MetaMask',
    walletId: 'io.metamask',
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    icon: '💙',
    description: 'Connect using Coinbase Wallet',
    walletId: 'com.coinbase.wallet',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    icon: '🔗',
    description: 'Scan QR code with any wallet',
    walletId: 'walletConnect',
  },
];

export default function AppleAuthScreen({ 
  initialPath = 'choice',
  onAuthSuccess 
}: AppleAuthScreenProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('choice');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSIWESelector, setShowSIWESelector] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const { login, isLoading: authLoading, sendVerificationCode } = useAuth();
  const testWallet = useTestWallet();

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.medium,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
    ]).start();

    // Set initial path
    if (initialPath !== 'choice') {
      handlePathSelection(initialPath);
    }
  }, []);

  const animateStepTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: Apple.Animations.duration.short,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: Apple.Animations.duration.short,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: Apple.Animations.duration.short,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: Apple.Animations.duration.short,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePathSelection = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPath(path);
    setError(null);
    
    switch (path) {
      case 'guest':
        handleGuestLogin();
        break;
      case 'sign-in':
        animateStepTransition(() => setCurrentStep('email'));
        break;
      case 'wallet':
        animateStepTransition(() => setCurrentStep('wallet'));
        break;
      case 'social':
        animateStepTransition(() => setCurrentStep('social'));
        break;
    }
  };

  const handleGuestLogin = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      await login({ strategy: 'guest' }, onAuthSuccess);
      // Clear error on success
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start as guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setIsLoading(true);
      setError(null);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const config: WalletConnectConfig = {
        strategy: provider.strategy,
        socialProvider: provider.strategy,
      };
      
      await login(config, onAuthSuccess);
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider.name}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletConnect = async (wallet: WalletOption) => {
    try {
      setIsLoading(true);
      setError(null);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const walletInstance = createWallet(wallet.walletId as any);
      
      const config: WalletConnectConfig = {
        strategy: 'wallet',
        wallet: walletInstance,
      };
      
      await login(config, onAuthSuccess);
    } catch (err: any) {
      setError(err.message || `Failed to connect ${wallet.name}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSIWEAuthentication = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowSIWESelector(true);
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await sendVerificationCode('email', email);
      animateStepTransition(() => setCurrentStep('verification'));
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const config: WalletConnectConfig = {
        strategy: 'email',
        email,
        verificationCode,
      };
      
      await login(config, onAuthSuccess);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    
    if (currentStep === 'verification') {
      animateStepTransition(() => setCurrentStep('email'));
    } else {
      animateStepTransition(() => setCurrentStep('choice'));
    }
  };

  const renderChoice = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          How would you like to get started?
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* Primary Options */}
        <AppleButton
          title="🚀 Start Exploring"
          variant="primary"
          size="large"
          fullWidth
          onPress={() => handlePathSelection('guest')}
          style={styles.optionButton}
        />
        
        <AppleButton
          title="🍎 Continue with Apple"
          variant="secondary"
          size="large"
          fullWidth
          onPress={() => handleSocialLogin(SOCIAL_PROVIDERS[0])}
          style={styles.optionButton}
        />

        {/* Secondary Options */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <AppleButton
          title="📧 Continue with Email"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => handlePathSelection('sign-in')}
          style={styles.secondaryOption}
        />
        
        <AppleButton
          title="👛 Connect Wallet"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => handlePathSelection('wallet')}
          style={styles.secondaryOption}
        />
        
        <AppleButton
          title="🌐 More Social Options"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => handlePathSelection('social')}
          style={styles.secondaryOption}
        />

        {/* Dev Mode */}
        {testWallet.isDevelopment && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>— DEVELOPMENT —</Text>
            <AppleButton
              title="🔐 Sign in with SIWE"
              variant="secondary"
              size="small"
              fullWidth
              onPress={handleSIWEAuthentication}
              style={styles.devButton}
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderEmail = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Enter your email address to continue
        </Text>
      </View>

      <View style={styles.formContainer}>
        <AppleTextInput
          label="Email Address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon="📧"
          error={error || undefined}
        />

        <AppleButton
          title="Continue"
          variant="primary"
          size="large"
          fullWidth
          loading={isLoading}
          onPress={handleEmailSubmit}
        />
      </View>
    </View>
  );

  const renderVerification = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          Enter the code sent to {email}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <AppleTextInput
          label="Verification Code"
          placeholder="123456"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
          icon="🔢"
          error={error || undefined}
        />

        <AppleButton
          title="Verify & Sign In"
          variant="primary"
          size="large"
          fullWidth
          loading={isLoading}
          onPress={handleVerificationSubmit}
        />

        <AppleButton
          title="Resend Code"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => sendVerificationCode('email', email)}
          style={styles.resendButton}
        />
      </View>
    </View>
  );

  const renderSocial = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Social Sign In</Text>
        <Text style={styles.subtitle}>
          Choose your preferred social account
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <AppleButton
            key={provider.id}
            title={provider.name}
            variant={provider.primary ? 'primary' : 'secondary'}
            size="large"
            fullWidth
            icon={provider.icon}
            loading={isLoading && selectedPath === provider.id}
            onPress={() => handleSocialLogin(provider)}
            style={styles.socialButton}
          />
        ))}
      </View>
    </View>
  );

  const renderWallet = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Wallet</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to connect
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {WALLET_OPTIONS.map((wallet) => (
          <TouchableOpacity
            key={wallet.id}
            style={styles.walletOption}
            onPress={() => handleWalletConnect(wallet)}
            disabled={isLoading}
          >
            <Text style={styles.walletIcon}>{wallet.icon}</Text>
            <View style={styles.walletInfo}>
              <Text style={styles.walletName}>{wallet.name}</Text>
              <Text style={styles.walletDescription}>{wallet.description}</Text>
            </View>
            <Text style={styles.walletArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'choice':
        return renderChoice();
      case 'email':
        return renderEmail();
      case 'verification':
        return renderVerification();
      case 'social':
        return renderSocial();
      case 'wallet':
        return renderWallet();
      default:
        return renderChoice();
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={Apple.Colors.systemBackground} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header with back button */}
        <View style={styles.navigationHeader}>
          {currentStep !== 'choice' && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              {
                transform: [
                  { translateY: slideAnim },
                  { scale: scaleAnim },
                ],
              }
            ]}
          >
            {renderCurrentStep()}
          </Animated.View>
        </ScrollView>

        {/* Privacy Notice */}
        <View style={styles.footer}>
          <Text style={styles.privacyText}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </View>

        {/* Floating Test Wallet - positioned for auth screen */}
        <FloatingTestWallet 
          position="auth-screen"
        />

        {/* SIWE Wallet Selector Modal */}
        <SIWEWalletSelector
          visible={showSIWESelector}
          onClose={() => setShowSIWESelector(false)}
          onSuccess={onAuthSuccess}
        />
      </SafeAreaView>
    </Animated.View>
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
  navigationHeader: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: Apple.Spacing.large,
  },
  backButton: {
    width: Apple.TouchTargets.minimum,
    height: Apple.TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 32,
    color: Apple.Colors.systemBlue,
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Apple.Spacing.xlarge,
  },
  content: {
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Apple.Spacing.xxxlarge,
  },
  title: {
    fontSize: Apple.Typography.largeTitle.fontSize,
    fontWeight: Apple.Typography.largeTitle.fontWeight,
    color: Apple.Colors.label,
    textAlign: 'center',
    marginBottom: Apple.Spacing.small,
  },
  subtitle: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: Apple.Typography.body.fontWeight,
    color: Apple.Colors.secondaryLabel,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    width: '100%',
    gap: Apple.Spacing.medium,
  },
  optionButton: {
    marginBottom: Apple.Spacing.small,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Apple.Spacing.large,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Apple.Colors.separator,
  },
  dividerText: {
    marginHorizontal: Apple.Spacing.medium,
    fontSize: Apple.Typography.callout.fontSize,
    color: Apple.Colors.secondaryLabel,
  },
  secondaryOption: {
    marginBottom: Apple.Spacing.small,
  },
  formContainer: {
    width: '100%',
    gap: Apple.Spacing.large,
  },
  socialButton: {
    marginBottom: Apple.Spacing.small,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Apple.Spacing.large,
    backgroundColor: Apple.Colors.secondarySystemBackground,
    borderRadius: Apple.Radius.medium,
    marginBottom: Apple.Spacing.small,
  },
  walletIcon: {
    fontSize: 24,
    marginRight: Apple.Spacing.medium,
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
  walletDescription: {
    fontSize: Apple.Typography.callout.fontSize,
    color: Apple.Colors.secondaryLabel,
  },
  walletArrow: {
    fontSize: 20,
    color: Apple.Colors.systemGray,
    fontWeight: '300',
  },
  resendButton: {
    marginTop: Apple.Spacing.medium,
  },
  devSection: {
    marginTop: Apple.Spacing.xlarge,
    alignItems: 'center',
    width: '100%',
  },
  devLabel: {
    fontSize: Apple.Typography.caption1.fontSize,
    color: Apple.Colors.systemOrange,
    fontWeight: '600',
    marginBottom: Apple.Spacing.medium,
    letterSpacing: 1,
  },
  devButton: {
    opacity: 0.8,
  },
  footer: {
    paddingHorizontal: Apple.Spacing.xlarge,
    paddingBottom: Apple.Spacing.large,
    alignItems: 'center',
  },
  privacyText: {
    fontSize: Apple.Typography.caption1.fontSize,
    color: Apple.Colors.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 16,
  },
});
