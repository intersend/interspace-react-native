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
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import AppleButton from '../ui/AppleButton';
import AppleTextInput from '../ui/AppleTextInput';
import { useAuth } from '../../hooks/useAuth';
import { WalletConnectConfig } from '../../types';
import * as Haptics from 'expo-haptics';

interface CleanAuthScreenProps {
  onAuthSuccess?: () => void;
}

type AuthStep = 'choice' | 'email' | 'verification';

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  strategy:
    | 'google'
    | 'apple'
    | 'passkey';
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
    id: 'passkey',
    name: 'Continue with Passkey',
    icon: '🔐',
    strategy: 'passkey',
  },
];


export default function CleanAuthScreen({ onAuthSuccess }: CleanAuthScreenProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('choice');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const {
    login,
    isLoading: authLoading,
    sendVerificationCode,
  } = useAuth();

  useEffect(() => {
    // Initial animation ONLY - no auto-login
    console.log('🎨 CleanAuthScreen mounted - showing choice screen only');
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

  const handleGuestLogin = async () => {
    try {
      console.log('👤 User clicked guest login');
      setIsLoading(true);
      setError(null);
      await login({ strategy: 'guest' }, onAuthSuccess);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start as guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      console.log('🌐 User clicked social login:', provider.name);
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


  const handleEmailSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      console.log('📧 Sending email verification');
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
      console.log('✅ Verifying email code');
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

  const navigateToStep = (step: AuthStep) => {
    console.log('🧭 Navigating to step:', step);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPath(step);
    setError(null);
    animateStepTransition(() => setCurrentStep(step));
  };

  const handleBack = () => {
    console.log('⬅️ Going back');
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
        <Text style={styles.title}>Welcome to Interspace</Text>
        <Text style={styles.subtitle}>
          Choose how you'd like to get started
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* Primary Options */}
        <AppleButton
          title="🚀 Start Exploring"
          variant="primary"
          size="large"
          fullWidth
          onPress={handleGuestLogin}
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
          onPress={() => navigateToStep('email')}
          style={styles.secondaryOption}
        />
        
        <AppleButton
          title="🔍 Continue with Google"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => handleSocialLogin(SOCIAL_PROVIDERS[1])}
          style={styles.secondaryOption}
        />

        <AppleButton
          title="🔐 Continue with Passkey"
          variant="tertiary"
          size="medium"
          fullWidth
          onPress={() => handleSocialLogin(SOCIAL_PROVIDERS[2])}
          style={styles.secondaryOption}
        />
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


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'choice':
        return renderChoice();
      case 'email':
        return renderEmail();
      case 'verification':
        return renderVerification();
      default:
        return renderChoice();
    }
  };

  // Show error if any
  useEffect(() => {
    if (error) {
      console.error('❌ Auth error:', error);
    }
  }, [error]);

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
        {/* Removed dev wallet features */}
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
  resendButton: {
    marginTop: Apple.Spacing.medium,
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
