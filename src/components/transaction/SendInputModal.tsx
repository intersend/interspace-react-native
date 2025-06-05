import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { UnifiedToken } from '../../types/orby';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface SendInputModalProps {
  visible: boolean;
  selectedToken?: UnifiedToken;
  onClose: () => void;
  onContinue: (recipient: string, amount: string) => void;
}

export default function SendInputModal({
  visible,
  selectedToken,
  onClose,
  onContinue,
}: SendInputModalProps) {
  const colorScheme = useColorScheme();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isValidAddress, setIsValidAddress] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const amountScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        damping: 25,
        stiffness: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const validateAddress = (address: string) => {
    // Basic validation - check if it's ENS or valid address format
    const isENS = address.endsWith('.eth');
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    setIsValidAddress(isENS || isAddress);
  };

  useEffect(() => {
    validateAddress(recipient);
  }, [recipient]);

  const handleNumberPress = (num: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the amount display
    Animated.sequence([
      Animated.timing(amountScaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.spring(amountScaleAnim, {
        toValue: 1,
        damping: 15,
        stiffness: 400,
        useNativeDriver: true,
      }),
    ]).start();

    if (num === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + num);
      }
    } else if (num === '⌫') {
      setAmount(amount.slice(0, -1));
    } else {
      // Limit decimal places based on token
      if (amount.includes('.')) {
        const [whole, decimal] = amount.split('.');
        const maxDecimals = selectedToken?.symbol === 'USDC' ? 2 : 4;
        if (decimal.length < maxDecimals) {
          setAmount(amount + num);
        }
      } else {
        setAmount(amount + num);
      }
    }
  };

  const formatDisplayAmount = () => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    // Format with appropriate decimal places
    if (selectedToken?.symbol === 'USDC' || selectedToken?.symbol === 'USDT') {
      return num.toFixed(2);
    }
    return amount;
  };

  const formatUsdValue = () => {
    if (!amount || !selectedToken) return '$0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0.00';
    
    const usdPerToken = parseFloat(selectedToken.totalUsdValue) / (parseFloat(selectedToken.totalAmount) / Math.pow(10, selectedToken.decimals));
    const usdValue = num * usdPerToken;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  };

  const canContinue = isValidAddress && parseFloat(amount) > 0;

  const NumberPad = () => (
    <View style={styles.numberPad}>
      {[
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['.', '0', '⌫'],
      ].map((row, rowIndex) => (
        <View key={rowIndex} style={styles.numberRow}>
          {row.map((num) => (
            <TouchableOpacity
              key={num}
              style={styles.numberButton}
              onPress={() => handleNumberPress(num)}
              activeOpacity={0.7}
            >
              <Text style={[styles.numberText, { color: Colors[colorScheme ?? 'dark'].text }]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: slideAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [600, 0],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView intensity={100} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.blurView}>
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.content}
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                  <Text style={[styles.cancelText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'dark'].text }]}>
                  Send {selectedToken?.symbol || 'Tokens'}
                </Text>
                <View style={styles.cancelButton} />
              </View>

              {/* Recipient Input */}
              <View style={styles.recipientSection}>
                <Text style={[styles.label, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                  To:
                </Text>
                <TextInput
                  style={[
                    styles.recipientInput,
                    {
                      backgroundColor: Colors[colorScheme ?? 'dark'].surface,
                      color: Colors[colorScheme ?? 'dark'].text,
                    },
                  ]}
                  placeholder="Address or ENS name"
                  placeholderTextColor={Colors[colorScheme ?? 'dark'].tabIconDefault}
                  value={recipient}
                  onChangeText={setRecipient}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isValidAddress && (
                  <Text style={styles.validIndicator}>✓</Text>
                )}
              </View>

              {/* Amount Display */}
              <View style={styles.amountSection}>
                <Animated.View
                  style={{
                    transform: [{ scale: amountScaleAnim }],
                  }}
                >
                  <Text style={[styles.amountDisplay, { color: Colors[colorScheme ?? 'dark'].text }]}>
                    {formatDisplayAmount()}
                  </Text>
                  <Text style={[styles.tokenLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    {selectedToken?.symbol || 'Token'} • {formatUsdValue()}
                  </Text>
                </Animated.View>
              </View>

              {/* Number Pad */}
              <NumberPad />

              {/* Continue Button */}
              <TouchableOpacity
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: canContinue
                      ? Colors[colorScheme ?? 'dark'].tint
                      : Colors[colorScheme ?? 'dark'].surface,
                  },
                ]}
                onPress={() => canContinue && onContinue(recipient, amount)}
                disabled={!canContinue}
              >
                <Text
                  style={[
                    styles.continueText,
                    {
                      color: canContinue ? 'white' : Colors[colorScheme ?? 'dark'].tabIconDefault,
                    },
                  ]}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blurView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
  recipientSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recipientInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  validIndicator: {
    position: 'absolute',
    right: 16,
    top: 38,
    fontSize: 18,
    color: '#00d4aa',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  amountDisplay: {
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -2,
  },
  tokenLabel: {
    fontSize: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  numberPad: {
    marginBottom: 30,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  numberButton: {
    width: '30%',
    aspectRatio: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(120, 120, 128, 0.1)',
  },
  numberText: {
    fontSize: 28,
    fontWeight: '400',
  },
  continueButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  continueText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
