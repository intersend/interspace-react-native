import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, SpaceTokens } from '../../../constants/Colors';
import { WalletConnectConfig } from '../../types';

interface SocialAuthProps {
  onLogin: (config: WalletConnectConfig) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

interface SocialProvider {
  id: string;
  name: string;
  icon: string;
  backgroundColor: string;
  textColor: string;
  strategy: 'google' | 'apple' | 'facebook' | 'discord';
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  {
    id: 'apple',
    name: 'Continue with Apple',
    icon: '🍎',
    backgroundColor: Colors.dark.socialApple,
    textColor: Colors.dark.textInverted,
    strategy: 'apple',
  },
  {
    id: 'google',
    name: 'Continue with Google',
    icon: '🔍',
    backgroundColor: Colors.dark.socialGoogle,
    textColor: Colors.dark.textInverted,
    strategy: 'google',
  },
  {
    id: 'facebook',
    name: 'Continue with Facebook',
    icon: '📘',
    backgroundColor: Colors.dark.socialFacebook,
    textColor: Colors.dark.textInverted,
    strategy: 'facebook',
  },
  {
    id: 'discord',
    name: 'Continue with Discord',
    icon: '🎮',
    backgroundColor: Colors.dark.socialDiscord,
    textColor: Colors.dark.textInverted,
    strategy: 'discord',
  },
];

export default function SocialAuth({ onLogin, onBack, isLoading }: SocialAuthProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const handleSocialLogin = async (provider: SocialProvider) => {
    try {
      setSelectedProvider(provider.id);
      setConnecting(true);

      console.log('🔗 Connecting with:', provider.name);

      // Prepare the social authentication configuration with enhanced options
      const config: WalletConnectConfig = {
        strategy: provider.strategy,
        socialProvider: provider.strategy,
        // Social profile will be populated by AuthContext after successful authentication
        socialProfile: undefined,
      };

      // Attempt to connect with improved error handling
      await onLogin(config);

      console.log('✅ Social authentication successful:', provider.name);
    } catch (error: any) {
      console.error('❌ Social authentication failed:', error);
      
      // Show user-friendly error message with enhanced handling
      let errorMessage = `Failed to connect with ${provider.name}`;
      let errorTitle = 'Authentication Failed';
      
      if (error.message?.includes('User rejected') || error.message?.includes('cancelled')) {
        errorMessage = 'Authentication was cancelled';
        errorTitle = 'Authentication Cancelled';
      } else if (error.message?.includes('Network error') || error.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        errorTitle = 'Connection Error';
      } else if (error.message?.includes('Permission denied')) {
        errorMessage = 'Permission denied. Please allow access and try again.';
        errorTitle = 'Permission Required';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Authentication request timed out. Please try again.';
        errorTitle = 'Request Timeout';
      } else if (error.message?.includes('not installed') || error.message?.includes('No app')) {
        errorMessage = `${provider.name} app is not installed or configured properly.`;
        errorTitle = 'App Not Found';
      }
      
      // Provide more helpful guidance
      errorMessage += '\n\nPlease try again or choose another sign-in method.';
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setConnecting(false);
      setSelectedProvider(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Social Sign In</Text>
        <Text style={styles.subtitle}>
          Choose your preferred social account to sign in
        </Text>
      </View>

      {/* Social Providers */}
      <View style={styles.providersContainer}>
        {SOCIAL_PROVIDERS.map((provider) => (
          <SocialProviderButton
            key={provider.id}
            provider={provider}
            onPress={() => handleSocialLogin(provider)}
            isConnecting={connecting && selectedProvider === provider.id}
            disabled={connecting}
          />
        ))}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>🔒 Privacy & Security</Text>
        <Text style={styles.infoText}>
          We only access basic profile information. Your social account credentials are never stored on our servers.
        </Text>
      </View>

      {/* Global loading overlay */}
      {(isLoading || connecting) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.tint} />
          <Text style={styles.loadingText}>
            {connecting ? 'Connecting...' : 'Signing in...'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface SocialProviderButtonProps {
  provider: SocialProvider;
  onPress: () => void;
  isConnecting: boolean;
  disabled: boolean;
}

function SocialProviderButton({ 
  provider, 
  onPress, 
  isConnecting, 
  disabled 
}: SocialProviderButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.providerButton,
        { backgroundColor: provider.backgroundColor },
        disabled && styles.providerButtonDisabled,
      ]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={0.8}
    >
      <View style={styles.providerButtonContent}>
        <Text style={styles.providerIcon}>{provider.icon}</Text>
        <Text style={[
          styles.providerText,
          { color: provider.textColor },
          disabled && styles.providerTextDisabled
        ]}>
          {provider.name}
        </Text>
        {isConnecting && (
          <ActivityIndicator 
            size="small" 
            color={provider.textColor}
            style={styles.providerLoader}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SpaceTokens.spacing.lg,
    backgroundColor: Colors.dark.authBackground,
  },
  header: {
    marginBottom: SpaceTokens.spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SpaceTokens.spacing.md,
    paddingVertical: SpaceTokens.spacing.sm,
    paddingHorizontal: SpaceTokens.spacing.xs,
  },
  backButtonText: {
    color: Colors.dark.tint,
    fontSize: SpaceTokens.fontSize.md,
    fontWeight: '500',
  },
  title: {
    fontSize: SpaceTokens.fontSize.title1,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: SpaceTokens.spacing.sm,
  },
  subtitle: {
    fontSize: SpaceTokens.fontSize.md,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  providersContainer: {
    flex: 1,
    gap: SpaceTokens.spacing.md,
  },
  providerButton: {
    borderRadius: SpaceTokens.borderRadius.lg,
    paddingVertical: SpaceTokens.spacing.lg,
    paddingHorizontal: SpaceTokens.spacing.lg,
    ...SpaceTokens.shadow.sm,
  },
  providerButtonDisabled: {
    opacity: 0.6,
  },
  providerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerIcon: {
    fontSize: 20,
    marginRight: SpaceTokens.spacing.md,
  },
  providerText: {
    fontSize: SpaceTokens.fontSize.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  providerTextDisabled: {
    opacity: 0.7,
  },
  providerLoader: {
    marginLeft: SpaceTokens.spacing.md,
  },
  infoSection: {
    marginTop: SpaceTokens.spacing.lg,
    padding: SpaceTokens.spacing.md,
    backgroundColor: Colors.dark.authSurface,
    borderRadius: SpaceTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.authBorder,
  },
  infoTitle: {
    fontSize: SpaceTokens.fontSize.md,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: SpaceTokens.spacing.sm,
  },
  infoText: {
    fontSize: SpaceTokens.fontSize.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
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
    textAlign: 'center',
  },
});
