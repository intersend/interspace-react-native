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
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import { useAuth } from '../../hooks/useAuth';
import { useTestWallet } from '../../hooks/useTestWallet';
import { WalletConnectConfig } from '../../types';
import * as Haptics from 'expo-haptics';
import { hasStoredPasskey } from 'thirdweb/wallets/in-app';
import { client } from '../../../constants/thirdweb';
import AppleWalletSelector from './AppleWalletSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppleNativeAuthScreenProps {
  onAuthSuccess?: () => void;
}

export default function AppleNativeAuthScreen({ onAuthSuccess }: AppleNativeAuthScreenProps) {
  const [hasPasskey, setHasPasskey] = useState(false);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonOpacityAnim = useRef(new Animated.Value(0)).current;
  
  const { login } = useAuth();
  const testWallet = useTestWallet();

  useEffect(() => {
    // Check for stored passkey
    checkPasskey();
    
    // Entrance animation
    Animated.sequence([
      Animated.timing(iconScaleAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.medium,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: Apple.Animations.duration.short,
          useNativeDriver: true,
        }),
        Animated.timing(buttonOpacityAnim, {
          toValue: 1,
          duration: Apple.Animations.duration.short,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const checkPasskey = async () => {
    try {
      const stored = await hasStoredPasskey(client);
      setHasPasskey(stored);
    } catch (error) {
      console.error('Failed to check passkey:', error);
    }
  };

  const handleSignInWithApple = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    try {
      const config: WalletConnectConfig = {
        strategy: 'apple',
        socialProvider: 'apple',
      };
      
      await login(config);
      onAuthSuccess?.();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Unable to sign in with Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    
    try {
      const config: WalletConnectConfig = {
        strategy: 'passkey',
        // TODO: Add passkey configuration when supported
      };
      
      await login(config);
      onAuthSuccess?.();
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Unable to authenticate with passkey');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowWalletSelector(true);
  };

  const handleMoreOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMoreOptions(true);
  };

  const renderMainScreen = () => (
    <View style={styles.mainContainer}>
      {/* App Icon */}
      <Animated.View 
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: iconScaleAnim }],
          }
        ]}
      >
        <Image 
          source={require('../../../assets/images/icon.png')}
          style={styles.appIcon}
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.title}>Sign in to Interspace</Text>
      </Animated.View>

      {/* Primary Actions */}
      <Animated.View 
        style={[
          styles.buttonsContainer,
          { opacity: buttonOpacityAnim }
        ]}
      >
        {/* Connect Wallet - Primary Option */}
        <AppleAuthButton
          onPress={handleConnectWallet}
          variant="apple"
          loading={isLoading}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.walletIcon}>👛</Text>
            <Text style={styles.appleButtonText}>Connect Wallet</Text>
          </View>
        </AppleAuthButton>

        {/* Continue with Passkey */}
        {hasPasskey && (
          <AppleAuthButton
            onPress={handlePasskeyAuth}
            variant="secondary"
            loading={isLoading}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.passkeyIcon}>🔐</Text>
              <Text style={styles.secondaryButtonText}>Continue with Passkey</Text>
            </View>
          </AppleAuthButton>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign in with Apple - Secondary Option */}
        <AppleAuthButton
          onPress={handleSignInWithApple}
          variant="tertiary"
        >
          <View style={styles.buttonContent}>
            <Image 
              source={require('../../../assets/images/apple.png')}
              style={[styles.appleIcon, { tintColor: Apple.Colors.systemBlue }]}
            />
            <Text style={styles.tertiaryButtonText}>Sign in with Apple</Text>
          </View>
        </AppleAuthButton>

        {/* More Options */}
        <TouchableOpacity 
          style={styles.moreOptionsButton}
          onPress={handleMoreOptions}
        >
          <Text style={styles.moreOptionsText}>More Options</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Legal Text */}
      <View style={styles.footer}>
        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text>
          {' '}and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );

  const renderMoreOptions = () => (
    <Modal
      visible={showMoreOptions}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMoreOptions(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMoreOptions(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign In Options</Text>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView style={styles.modalScroll}>
            {/* Social Options */}
            <View style={styles.optionGroup}>
              <Text style={styles.optionGroupTitle}>Social</Text>
              
              <OptionButton
                icon="🔍"
                title="Continue with Google"
                onPress={() => handleSocialAuth('google')}
              />
              
              <OptionButton
                icon="📘"
                title="Continue with Facebook"
                onPress={() => handleSocialAuth('facebook')}
              />
              
              <OptionButton
                icon="🎮"
                title="Continue with Discord"
                onPress={() => handleSocialAuth('discord')}
              />
            </View>

            {/* Other Options */}
            <View style={styles.optionGroup}>
              <Text style={styles.optionGroupTitle}>Other</Text>
              
              <OptionButton
                icon="📧"
                title="Continue with Email"
                onPress={() => handleEmailAuth()}
              />
              
              <OptionButton
                icon="👤"
                title="Continue as Guest"
                onPress={() => handleGuestAuth()}
              />
              
              {!hasPasskey && (
                <OptionButton
                  icon="🔐"
                  title="Set up Passkey"
                  onPress={handlePasskeyAuth}
                />
              )}
            </View>

            {/* Development Options */}
            {testWallet.isDevelopment && (
              <View style={styles.optionGroup}>
                <Text style={[styles.optionGroupTitle, { color: Apple.Colors.systemOrange }]}>
                  Development
                </Text>
                
                <OptionButton
                  icon="🧪"
                  title="Test Wallet"
                  onPress={() => handleTestWallet()}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const handleSocialAuth = async (provider: string) => {
    setShowMoreOptions(false);
    setIsLoading(true);
    
    try {
      const config: WalletConnectConfig = {
        strategy: provider as any,
        socialProvider: provider as any,
      };
      
      await login(config);
      onAuthSuccess?.();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || `Unable to sign in with ${provider}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    // Navigate to email auth screen
    setShowMoreOptions(false);
    Alert.alert('Coming Soon', 'Email authentication will be available soon');
  };

  const handleGuestAuth = async () => {
    setShowMoreOptions(false);
    setIsLoading(true);
    
    try {
      await login({ strategy: 'guest' });
      onAuthSuccess?.();
    } catch (error: any) {
      Alert.alert('Failed', error.message || 'Unable to continue as guest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestWallet = async () => {
    setShowMoreOptions(false);
    // Implementation for test wallet
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={Apple.Colors.systemBackground} />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderMainScreen()}
        </ScrollView>
      </SafeAreaView>

      {/* Wallet Selector Modal */}
      <AppleWalletSelector
        visible={showWalletSelector}
        onClose={() => setShowWalletSelector(false)}
        onSuccess={onAuthSuccess}
      />

      {/* More Options Modal */}
      {renderMoreOptions()}
    </>
  );
}

// Apple-style button component
interface AppleAuthButtonProps {
  onPress: () => void;
  variant: 'apple' | 'secondary' | 'tertiary';
  loading?: boolean;
  children: React.ReactNode;
}

function AppleAuthButton({ onPress, variant, loading, children }: AppleAuthButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          variant === 'apple' && styles.appleButton,
          variant === 'secondary' && styles.secondaryButton,
          variant === 'tertiary' && styles.tertiaryButton,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        activeOpacity={1}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Option button for more options modal
interface OptionButtonProps {
  icon: string;
  title: string;
  onPress: () => void;
}

function OptionButton({ icon, title, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity style={styles.optionButton} onPress={onPress}>
      <Text style={styles.optionIcon}>{icon}</Text>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: Apple.Spacing.xlarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: Apple.Spacing.xlarge,
    ...Apple.Shadows.level3,
  },
  appIcon: {
    width: 120,
    height: 120,
    borderRadius: 27,
  },
  title: {
    fontSize: Apple.Typography.largeTitle.fontSize,
    fontWeight: Apple.Typography.largeTitle.fontWeight as any,
    color: Apple.Colors.label,
    textAlign: 'center',
    marginBottom: Apple.Spacing.xxxlarge,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 360,
  },
  button: {
    height: 50,
    borderRadius: Apple.Radius.standard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Apple.Spacing.medium,
  },
  appleButton: {
    backgroundColor: Apple.Colors.label,
  },
  secondaryButton: {
    backgroundColor: Apple.Colors.systemBackground,
    borderWidth: 0.5,
    borderColor: Apple.Colors.separator,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appleIcon: {
    width: 16,
    height: 16,
    marginRight: Apple.Spacing.small,
    tintColor: Apple.Colors.systemBackground,
  },
  walletIcon: {
    fontSize: 16,
    marginRight: Apple.Spacing.small,
    color: Apple.Colors.systemBackground,
  },
  passkeyIcon: {
    fontSize: 16,
    marginRight: Apple.Spacing.small,
  },
  appleButtonText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '600',
    color: Apple.Colors.systemBackground,
  },
  secondaryButtonText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '600',
    color: Apple.Colors.label,
  },
  tertiaryButtonText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '400',
    color: Apple.Colors.systemBlue,
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
  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Apple.Spacing.small,
  },
  moreOptionsText: {
    fontSize: Apple.Typography.subheadline.fontSize,
    color: Apple.Colors.systemBlue,
  },
  chevron: {
    fontSize: 20,
    color: Apple.Colors.systemBlue,
    marginLeft: 4,
    fontWeight: '300',
  },
  footer: {
    position: 'absolute',
    bottom: Apple.Spacing.xxxlarge,
    width: '100%',
    paddingHorizontal: Apple.Spacing.xlarge,
  },
  legalText: {
    fontSize: Apple.Typography.caption2.fontSize,
    color: Apple.Colors.tertiaryLabel,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLink: {
    color: Apple.Colors.systemBlue,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Apple.Colors.systemBackground,
    borderTopLeftRadius: Apple.Radius.standard,
    borderTopRightRadius: Apple.Radius.standard,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: Apple.Colors.tertiaryLabel,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: Apple.Spacing.small,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Apple.Spacing.medium,
    paddingVertical: Apple.Spacing.medium,
    borderBottomWidth: 0.5,
    borderBottomColor: Apple.Colors.separator,
  },
  modalCloseButton: {
    width: 60,
  },
  modalCloseText: {
    fontSize: Apple.Typography.body.fontSize,
    color: Apple.Colors.systemBlue,
  },
  modalTitle: {
    fontSize: Apple.Typography.headline.fontSize,
    fontWeight: Apple.Typography.headline.fontWeight as any,
    color: Apple.Colors.label,
  },
  modalScroll: {
    padding: Apple.Spacing.medium,
  },
  optionGroup: {
    marginBottom: Apple.Spacing.large,
  },
  optionGroupTitle: {
    fontSize: Apple.Typography.footnote.fontSize,
    fontWeight: '600',
    color: Apple.Colors.secondaryLabel,
    marginBottom: Apple.Spacing.small,
    paddingHorizontal: Apple.Spacing.medium,
    textTransform: 'uppercase',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Apple.Colors.secondarySystemBackground,
    borderRadius: Apple.Radius.standard,
    padding: Apple.Spacing.medium,
    marginBottom: Apple.Spacing.small,
  },
  optionIcon: {
    fontSize: 24,
    marginRight: Apple.Spacing.medium,
  },
  optionTitle: {
    flex: 1,
    fontSize: Apple.Typography.body.fontSize,
    color: Apple.Colors.label,
  },
  optionChevron: {
    fontSize: 20,
    color: Apple.Colors.tertiaryLabel,
    fontWeight: '300',
  },
});
