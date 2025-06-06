import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { IntentResponse } from '../../types/orby';
import { LinkedAccount } from '../../types';
import { orbyService } from '../../services/orby';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AppleBottomTray from '../ui/AppleBottomTray';



interface ApplePayTrayProps {
  visible: boolean;
  intent?: IntentResponse;
  selectedAccount?: LinkedAccount;
  onClose: () => void;
  onConfirm: () => void;
  onAccountSelect: () => void;
  isProcessing?: boolean;
  error?: string;
  transactionType?: 'send' | 'swap';
}

export default function ApplePayTray({
  visible,
  intent,
  selectedAccount,
  onClose,
  onConfirm,
  onAccountSelect,
  isProcessing = false,
  error,
  transactionType = 'send',
}: ApplePayTrayProps) {
  const colorScheme = useColorScheme();
  const [isFullyHidden, setIsFullyHidden] = React.useState(true);
  const [showRouting, setShowRouting] = React.useState(false);
  const routingHeightAnim = useRef(new Animated.Value(0)).current;
  const routingRotateAnim = useRef(new Animated.Value(0)).current;

  // Parse transaction summary
  const txSummary = intent ? orbyService.formatTransactionSummary(intent) : null;

  // Toggle routing display
  const toggleRouting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = showRouting ? 0 : 1;
    
    Animated.parallel([
      Animated.spring(routingHeightAnim, {
        toValue,
        damping: 20,
        stiffness: 300,
        useNativeDriver: false,
      }),
      Animated.timing(routingRotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    setShowRouting(!showRouting);
  };

  // No-op effect: bottom tray handles animations

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleConfirm = async () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Authenticate with biometrics
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Transaction',
        fallbackLabel: 'Use Passcode',
      });

      if (success) {
        onConfirm();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <AppleBottomTray visible={visible} onClose={handleClose}>
      <BlurView
        intensity={100}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'dark'].text }]}>
              Interspace
            </Text>
            <View style={styles.cancelButton} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* App/Recipient Info */}
            {txSummary && (
              <View style={styles.recipientSection}>
                <View style={styles.recipientIcon}>
                  <Text style={styles.recipientIconText}>
                    {txSummary.recipient ? '👤' : '🔄'}
                  </Text>
                </View>
                <Text style={[styles.recipientName, { color: Colors[colorScheme ?? 'dark'].text }]}>
                  {txSummary.subtitle}
                </Text>
              </View>
            )}

            {/* Amount */}
            {txSummary && (
              <View style={styles.amountSection}>
                <Text style={[styles.amount, { color: Colors[colorScheme ?? 'dark'].text }]}>
                  {txSummary.amount} {txSummary.token}
                </Text>
              </View>
            )}

            {/* Account Selector */}
            <TouchableOpacity
              style={[styles.accountSelector, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}
              onPress={onAccountSelect}
            >
              <View style={styles.accountInfo}>
                <Text style={[styles.accountLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                  From:
                </Text>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: Colors[colorScheme ?? 'dark'].text }]}>
                    {selectedAccount?.customName || selectedAccount?.walletType || 'Select Account'}
                  </Text>
                  {selectedAccount && (
                    <Text style={[styles.accountAddress, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      {`${selectedAccount.address.slice(0, 6)}...${selectedAccount.address.slice(-4)}`}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[styles.chevron, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                ›
              </Text>
            </TouchableOpacity>

            {/* Gas Info */}
            {txSummary && (
              <View style={[styles.gasSection, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}>
                <View style={styles.gasRow}>
                  <Text style={[styles.gasLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    Gas Fee:
                  </Text>
                  <Text style={[styles.gasValue, { color: Colors[colorScheme ?? 'dark'].text }]}>
                    {txSummary.gasInfo}
                  </Text>
                </View>
                <View style={styles.gasHighlight}>
                  <Text style={styles.gasHighlightText}>✨ No ETH needed!</Text>
                </View>
              </View>
            )}

            {/* Routing Section */}
            <TouchableOpacity
              style={[styles.routingSection, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}
              onPress={toggleRouting}
              activeOpacity={0.7}
            >
              <View style={styles.routingHeader}>
                <Text style={[styles.routingLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                  Route: Optimized
                </Text>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: routingRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '90deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={[styles.routingChevron, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    ›
                  </Text>
                </Animated.View>
              </View>
              
              <Animated.View
                style={[
                  styles.routingDetails,
                  {
                    maxHeight: routingHeightAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 200],
                    }),
                    opacity: routingHeightAnim,
                  },
                ]}
              >
                <View style={styles.routingPath}>
                  {/* Source Wallet */}
                  <View style={styles.routingStep}>
                    <View style={[styles.routingNode, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
                      <Text style={styles.routingNodeIcon}>👛</Text>
                    </View>
                    <Text style={[styles.routingStepText, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {selectedAccount?.customName || 'Your Wallet'}
                    </Text>
                    <Text style={[styles.routingStepSubtext, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      {selectedAccount?.walletType || 'External Account'}
                    </Text>
                  </View>
                  
                  <View style={[styles.routingLine, { backgroundColor: Colors[colorScheme ?? 'dark'].tabIconDefault }]} />
                  
                  {/* Session Wallet */}
                  <View style={styles.routingStep}>
                    <View style={[styles.routingNode, { backgroundColor: 'rgba(120, 120, 128, 0.2)' }]}>
                      <Text style={styles.routingNodeIcon}>🔐</Text>
                    </View>
                    <Text style={[styles.routingStepText, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      Session Wallet
                    </Text>
                    <Text style={[styles.routingStepSubtext, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      Smart Profile Proxy
                    </Text>
                  </View>
                  
                  <View style={[styles.routingLine, { backgroundColor: Colors[colorScheme ?? 'dark'].tabIconDefault }]} />
                  
                  {/* Network */}
                  <View style={styles.routingStep}>
                    <View style={[styles.routingNode, { backgroundColor: 'rgba(120, 120, 128, 0.2)' }]}>
                      <Text style={styles.routingNodeIcon}>🌐</Text>
                    </View>
                    <Text style={[styles.routingStepText, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {intent?.summary.from.chainName || 'Network'}
                    </Text>
                    <Text style={[styles.routingStepSubtext, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      Fastest Route
                    </Text>
                  </View>
                  
                  <View style={[styles.routingLine, { backgroundColor: Colors[colorScheme ?? 'dark'].tabIconDefault }]} />
                  
                  {/* Destination */}
                  <View style={styles.routingStep}>
                    <View style={[styles.routingNode, { backgroundColor: '#00d4aa' }]}>
                      <Text style={styles.routingNodeIcon}>{transactionType === 'swap' ? '🔄' : '📍'}</Text>
                    </View>
                    <Text style={[styles.routingStepText, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {transactionType === 'swap' ? 'Swap Complete' : txSummary?.recipient || 'Recipient'}
                    </Text>
                    <Text style={[styles.routingStepSubtext, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      {transactionType === 'swap' ? `${intent?.summary.to.token || 'Token'} received` : 'Destination'}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>

            {/* Estimated Time */}
            {txSummary && (
              <Text style={[styles.estimatedTime, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                Estimated time: {txSummary.estimatedTime}
              </Text>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          {/* Confirm Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={isProcessing || !selectedAccount || !intent}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#000000', '#1a1a1a']}
                style={styles.confirmButtonGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.confirmButtonText}>Double Click to Confirm</Text>
                    <Text style={styles.confirmButtonSubtext}>with Face ID</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
      </BlurView>
    </AppleBottomTray>
  );
}

const styles = StyleSheet.create({
  tray: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(120, 120, 128, 0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120, 120, 128, 0.2)',
  },
  cancelButton: {
    width: 60,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  recipientSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recipientIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(120, 120, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recipientIconText: {
    fontSize: 28,
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '500',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  accountDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '500',
  },
  accountAddress: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 24,
  },
  gasSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  gasRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gasLabel: {
    fontSize: 15,
  },
  gasValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  gasHighlight: {
    backgroundColor: 'rgba(0, 212, 170, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  gasHighlightText: {
    color: '#00d4aa',
    fontSize: 13,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  confirmButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  confirmButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  routingSection: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  routingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  routingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  routingChevron: {
    fontSize: 20,
    fontWeight: '600',
  },
  routingDetails: {
    overflow: 'hidden',
  },
  routingPath: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  routingStep: {
    alignItems: 'center',
  },
  routingNode: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  routingNodeIcon: {
    fontSize: 20,
  },
  routingStepText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  routingStepSubtext: {
    fontSize: 12,
    marginBottom: 12,
  },
  routingLine: {
    width: 2,
    height: 20,
    alignSelf: 'center',
    marginBottom: 12,
    opacity: 0.3,
  },
});
