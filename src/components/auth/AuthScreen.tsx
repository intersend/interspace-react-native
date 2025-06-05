import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors, SpaceTokens } from '../../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { WalletConnectConfig } from '../../types';

// Import auth components
import EmailAuth from './EmailAuth';
import SocialAuth from './SocialAuth';
import ExternalWalletAuth from './ExternalWalletAuth';
import { useTestWallet } from '../../hooks/useTestWallet';
import { testWalletDemo } from '../testing/TestWalletSystem';
import FloatingTestWallet from '../testing/FloatingTestWallet';

export type AuthMethod = 'select' | 'email' | 'phone' | 'social' | 'wallet' | 'guest';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
  allowGuest?: boolean;
}

export default function AuthScreen({ onAuthSuccess, allowGuest = true }: AuthScreenProps) {
  const [currentMethod, setCurrentMethod] = useState<AuthMethod>('select');
  const { login, isLoading, error, sendVerificationCode } = useAuth();
  const testWallet = useTestWallet();

  const handleAuthSuccess = () => {
    console.log('🎉 Authentication successful!');
    onAuthSuccess?.();
  };

  const handleAuthError = (error: string) => {
    Alert.alert('Authentication Failed', error);
  };

  const handleLogin = async (config: WalletConnectConfig) => {
    try {
      await login(config);
      handleAuthSuccess();
    } catch (err: any) {
      handleAuthError(err.message || 'Authentication failed');
    }
  };

  const handleGuestLogin = async () => {
    try {
      await login({ strategy: 'guest' });
      handleAuthSuccess();
    } catch (err: any) {
      handleAuthError(err.message || 'Guest login failed');
    }
  };

  const handleTestWalletLogin = async () => {
    try {
      // Debug: Check current wallet state
      console.log('🔍 AuthScreen Debug:');
      console.log('  - testWallets.length:', testWallet.testWallets.length);
      console.log('  - activeWallet:', testWallet.activeWallet?.address);
      console.log('  - isDevelopment:', testWallet.isDevelopment);
      
      // Force reload from storage before checking
      console.log('🔄 Force reloading wallets from storage...');
      await testWallet.loadTestWallets();
      
      console.log('🔍 After reload:');
      console.log('  - testWallets.length:', testWallet.testWallets.length);
      console.log('  - activeWallet:', testWallet.activeWallet?.address);
      
      // Check if we have any wallets in the dev tool
      if (testWallet.testWallets.length === 0) {
        Alert.alert(
          'No Dev Wallets Available',
          'Please create a test wallet using the floating dev tool (🧪 button) before attempting to login.',
          [{ text: 'OK' }]
        );
        return;
      }

      let walletToUse = testWallet.activeWallet;
      
      // If no active wallet, use the first existing wallet from dev tool
      if (!walletToUse) {
        walletToUse = testWallet.testWallets[0];
        await testWallet.setActiveTestWallet(walletToUse);
        console.log('🔄 Using existing test wallet from dev tool:', walletToUse.address);
      } else {
        console.log('✅ Using active test wallet from dev tool:', walletToUse.address);
      }
      
      // Use test wallet for external wallet authentication with SIWE
      const config: WalletConnectConfig = {
        strategy: 'wallet', // Use wallet strategy for SIWE authentication
        testWallet: walletToUse,
      };
      
      await login(config);
      handleAuthSuccess();
    } catch (err: any) {
      handleAuthError(err.message || 'Test wallet login failed');
    }
  };

  const renderMethodSelection = () => (
    <View style={styles.methodContainer}>
      <Text style={styles.title}>Welcome to Interspace</Text>
      <Text style={styles.subtitle}>
        Connect your wallet or sign in to get started
      </Text>

      <View style={styles.methodsGrid}>
        <AuthMethodButton
          title="Email"
          icon="📧"
          description="Sign in with email verification"
          onPress={() => setCurrentMethod('email')}
        />
        
        <AuthMethodButton
          title="Phone"
          icon="📱"
          description="Sign in with SMS verification"
          onPress={() => setCurrentMethod('phone')}
        />
        
        <AuthMethodButton
          title="Social"
          icon="🌐"
          description="Google, Apple, Facebook & more"
          onPress={() => setCurrentMethod('social')}
        />
        
        <AuthMethodButton
          title="Wallet"
          icon="👛"
          description="MetaMask, Coinbase & more"
          onPress={() => setCurrentMethod('wallet')}
        />
      </View>

      {allowGuest && (
        <View style={styles.guestSection}>
          <Text style={styles.orText}>or</Text>
          <AuthMethodButton
            title="Continue as Guest"
            icon="👤"
            description="Explore without signing in"
            onPress={handleGuestLogin}
            variant="secondary"
          />
          
          {/* Development Test Wallet - Only visible in development */}
          {testWallet.isDevelopment && (
            <View style={styles.devSection}>
              <Text style={styles.devLabel}>— DEVELOPMENT ONLY —</Text>
              <AuthMethodButton
                title={testWallet.hasActiveWallet ? "🧪 Use Test Wallet" : "🧪 Dev Test Wallet"}
                icon="⚡"
                description={testWallet.hasActiveWallet 
                  ? `Login with ${testWallet.activeWallet?.address.slice(0, 8)}...` 
                  : "Login with managed test wallet"
                }
                onPress={handleTestWalletLogin}
                variant="dev"
              />
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderCurrentMethod = () => {
    switch (currentMethod) {
      case 'wallet':
        return (
          <ExternalWalletAuth
            onLogin={handleLogin}
            onBack={() => setCurrentMethod('select')}
            isLoading={isLoading}
          />
        );
      
      case 'email':
        return (
          <EmailAuth
            onLogin={handleLogin}
            onBack={() => setCurrentMethod('select')}
            isLoading={isLoading}
            onSendVerificationCode={sendVerificationCode}
          />
        );
      
      case 'social':
        return (
          <SocialAuth
            onLogin={handleLogin}
            onBack={() => setCurrentMethod('select')}
            isLoading={isLoading}
          />
        );
      
      case 'phone':
        return (
          <View style={styles.comingSoonContainer}>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              Phone authentication will be available soon.
            </Text>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentMethod('select')}
            >
              <Text style={styles.backButtonText}>← Back to Options</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return renderMethodSelection();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentMethod()}
        
        {/* Global loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.dark.tint} />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Floating Test Wallet - Auth Screen Position */}
      <FloatingTestWallet 
        position="auth-screen"
        showTransactionConfirmation={true}
      />
    </SafeAreaView>
  );
}

interface AuthMethodButtonProps {
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dev';
}

function AuthMethodButton({ 
  title, 
  icon, 
  description, 
  onPress, 
  variant = 'primary' 
}: AuthMethodButtonProps) {
  return (
    <View 
      style={[
        styles.methodButton, 
        variant === 'secondary' && styles.methodButtonSecondary,
        variant === 'dev' && styles.methodButtonDev
      ]}
      onTouchEnd={onPress}
    >
      <View style={styles.methodButtonContent}>
        <Text style={styles.methodIcon}>{icon}</Text>
        <View style={styles.methodTextContainer}>
          <Text style={[
            styles.methodTitle,
            variant === 'secondary' && styles.methodTitleSecondary,
            variant === 'dev' && styles.methodTitleDev
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.methodDescription,
            variant === 'secondary' && styles.methodDescriptionSecondary,
            variant === 'dev' && styles.methodDescriptionDev
          ]}>
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  methodContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 22,
  },
  methodsGrid: {
    width: '100%',
    gap: 16,
  },
  methodButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  methodButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  methodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  methodTitleSecondary: {
    color: Colors.dark.subtext,
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 18,
  },
  methodDescriptionSecondary: {
    color: Colors.dark.subtext,
  },
  guestSection: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
  orText: {
    fontSize: 14,
    color: Colors.dark.subtext,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 12,
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    color: Colors.dark.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  backButtonText: {
    color: Colors.dark.tint,
    fontSize: 16,
    fontWeight: '500',
  },
  // Development styles
  devSection: {
    marginTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  devLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 1,
  },
  methodButtonDev: {
    backgroundColor: '#FF6B35',
    borderColor: '#FFD700',
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  methodTitleDev: {
    color: '#FFFFFF',
  },
  methodDescriptionDev: {
    color: '#FFE4B5',
  },
});
