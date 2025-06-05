import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { UnifiedToken } from '../../types/orby';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { orbyService } from '../../services/orby';

interface SwapInputModalProps {
  visible: boolean;
  tokens: UnifiedToken[];
  onClose: () => void;
  onPreview: (fromToken: UnifiedToken, toToken: UnifiedToken, fromAmount: string) => void;
}

export default function SwapInputModal({
  visible,
  tokens,
  onClose,
  onPreview,
}: SwapInputModalProps) {
  const colorScheme = useColorScheme();
  const [fromToken, setFromToken] = useState<UnifiedToken | undefined>(undefined);
  const [toToken, setToToken] = useState<UnifiedToken | undefined>(undefined);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false);
  const [showToTokenSelector, setShowToTokenSelector] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const swapRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Set default tokens
      if (tokens.length >= 2 && !fromToken && !toToken) {
        setFromToken(tokens[0]);
        setToToken(tokens[1]);
      }
      
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
      }).start(() => {
        // Reset state when closed
        setFromAmount('');
        setToAmount('');
      });
    }
  }, [visible, tokens]);

  // Calculate exchange rate (mock for now)
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      setIsCalculating(true);
      
      // Mock exchange rate calculation
      setTimeout(() => {
        const fromUsdValue = parseFloat(fromToken.totalUsdValue) / (parseFloat(fromToken.totalAmount) / Math.pow(10, fromToken.decimals));
        const toUsdValue = parseFloat(toToken.totalUsdValue) / (parseFloat(toToken.totalAmount) / Math.pow(10, toToken.decimals));
        const rate = fromUsdValue / toUsdValue;
        const calculatedToAmount = parseFloat(fromAmount) * rate;
        
        setToAmount(calculatedToAmount.toFixed(toToken.decimals === 18 ? 4 : 2));
        setIsCalculating(false);
      }, 500);
    }
  }, [fromAmount, fromToken, toToken]);

  const handleSwapTokens = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate the swap icon
    Animated.spring(swapRotateAnim, {
      toValue: 1,
      damping: 10,
      stiffness: 200,
      useNativeDriver: true,
    }).start(() => {
      swapRotateAnim.setValue(0);
    });
    
    // Swap the tokens
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    
    // Swap amounts
    const tempAmount = fromAmount;
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const formatUsdValue = (token?: UnifiedToken, amount?: string) => {
    if (!token || !amount || parseFloat(amount) === 0) return '$0.00';
    
    const num = parseFloat(amount);
    const usdPerToken = parseFloat(token.totalUsdValue) / (parseFloat(token.totalAmount) / Math.pow(10, token.decimals));
    const usdValue = num * usdPerToken;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(usdValue);
  };

  const getExchangeRate = () => {
    if (!fromToken || !toToken) return '';
    
    const fromUsdValue = parseFloat(fromToken.totalUsdValue) / (parseFloat(fromToken.totalAmount) / Math.pow(10, fromToken.decimals));
    const toUsdValue = parseFloat(toToken.totalUsdValue) / (parseFloat(toToken.totalAmount) / Math.pow(10, toToken.decimals));
    const rate = fromUsdValue / toUsdValue;
    
    return `1 ${fromToken.symbol} = ${rate.toFixed(4)} ${toToken.symbol}`;
  };

  const canPreview = fromToken && toToken && parseFloat(fromAmount) > 0;

  const TokenSelector = ({ 
    token, 
    amount, 
    onAmountChange, 
    onTokenPress, 
    label,
    readOnly = false 
  }: {
    token?: UnifiedToken;
    amount: string;
    onAmountChange?: (value: string) => void;
    onTokenPress: () => void;
    label: string;
    readOnly?: boolean;
  }) => (
    <View style={styles.tokenSelector}>
      <Text style={[styles.selectorLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
        {label}
      </Text>
      <View style={[styles.selectorContainer, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}>
        <TextInput
          style={[styles.amountInput, { color: Colors[colorScheme ?? 'dark'].text }]}
          value={amount}
          onChangeText={onAmountChange}
          placeholder="0.00"
          placeholderTextColor={Colors[colorScheme ?? 'dark'].tabIconDefault}
          keyboardType="decimal-pad"
          editable={!readOnly}
        />
        <TouchableOpacity style={styles.tokenButton} onPress={onTokenPress}>
          <Text style={[styles.tokenSymbol, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {token?.symbol || 'Select'}
          </Text>
          <Text style={[styles.dropdownArrow, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            ▼
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.usdValue, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
        {formatUsdValue(token, amount)}
      </Text>
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
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                  <Text style={[styles.cancelText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'dark'].text }]}>
                  Swap
                </Text>
                <View style={styles.cancelButton} />
              </View>

              {/* From Token */}
              <TokenSelector
                token={fromToken}
                amount={fromAmount}
                onAmountChange={setFromAmount}
                onTokenPress={() => setShowFromTokenSelector(true)}
                label="From"
              />

              {/* Swap Button */}
              <TouchableOpacity style={styles.swapButton} onPress={handleSwapTokens}>
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: swapRotateAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '180deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <Text style={styles.swapIcon}>↓</Text>
                </Animated.View>
              </TouchableOpacity>

              {/* To Token */}
              <TokenSelector
                token={toToken}
                amount={toAmount}
                onAmountChange={setToAmount}
                onTokenPress={() => setShowToTokenSelector(true)}
                label="To"
                readOnly={isCalculating}
              />

              {isCalculating && (
                <View style={styles.calculatingContainer}>
                  <ActivityIndicator size="small" color={Colors[colorScheme ?? 'dark'].tint} />
                  <Text style={[styles.calculatingText, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    Calculating best rate...
                  </Text>
                </View>
              )}

              {/* Exchange Rate */}
              {fromToken && toToken && !isCalculating && (
                <View style={styles.rateContainer}>
                  <Text style={[styles.rateLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    Rate:
                  </Text>
                  <Text style={[styles.rateValue, { color: Colors[colorScheme ?? 'dark'].text }]}>
                    {getExchangeRate()}
                  </Text>
                  <Text style={[styles.routeInfo, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                    Best price found via Orby
                  </Text>
                </View>
              )}

              {/* Preview Button */}
              <TouchableOpacity
                style={[
                  styles.previewButton,
                  {
                    backgroundColor: canPreview
                      ? Colors[colorScheme ?? 'dark'].tint
                      : Colors[colorScheme ?? 'dark'].surface,
                  },
                ]}
                onPress={() => canPreview && fromToken && toToken && onPreview(fromToken, toToken, fromAmount)}
                disabled={!canPreview}
              >
                <Text
                  style={[
                    styles.previewText,
                    {
                      color: canPreview ? 'white' : Colors[colorScheme ?? 'dark'].tabIconDefault,
                    },
                  ]}
                >
                  Preview Swap
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </BlurView>
      </Animated.View>

      {/* Token Selector Modals */}
      <TokenListModal
        visible={showFromTokenSelector}
        tokens={tokens.filter(t => t.symbol !== toToken?.symbol)}
        selectedToken={fromToken}
        onSelect={(token) => {
          setFromToken(token);
          setShowFromTokenSelector(false);
        }}
        onClose={() => setShowFromTokenSelector(false)}
      />
      
      <TokenListModal
        visible={showToTokenSelector}
        tokens={tokens.filter(t => t.symbol !== fromToken?.symbol)}
        selectedToken={toToken}
        onSelect={(token) => {
          setToToken(token);
          setShowToTokenSelector(false);
        }}
        onClose={() => setShowToTokenSelector(false)}
      />
    </Modal>
  );
}

// Token List Modal Component
const TokenListModal = ({
  visible,
  tokens,
  selectedToken,
  onSelect,
  onClose,
}: {
  visible: boolean;
  tokens: UnifiedToken[];
  selectedToken?: UnifiedToken;
  onSelect: (token: UnifiedToken) => void;
  onClose: () => void;
}) => {
  const colorScheme = useColorScheme();
  
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.tokenListModal}>
        <View style={[styles.tokenListContent, { backgroundColor: Colors[colorScheme ?? 'dark'].background }]}>
          <View style={styles.tokenListHeader}>
            <Text style={[styles.tokenListTitle, { color: Colors[colorScheme ?? 'dark'].text }]}>
              Select Token
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.doneButton, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          
          {tokens.map((token) => (
            <TouchableOpacity
              key={`${token.symbol}-${token.name}`}
              style={[
                styles.tokenListItem,
                selectedToken?.symbol === token.symbol && { backgroundColor: Colors[colorScheme ?? 'dark'].surface },
              ]}
              onPress={() => onSelect(token)}
            >
              <View style={styles.tokenInfo}>
                <Text style={[styles.tokenName, { color: Colors[colorScheme ?? 'dark'].text }]}>
                  {token.symbol}
                </Text>
                <Text style={[styles.tokenBalance, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                  {(parseFloat(token.totalAmount) / Math.pow(10, token.decimals)).toFixed(4)}
                </Text>
              </View>
              <Text style={[styles.tokenChains, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                {token.balancesPerChain.map(b => b.chainName).join(' • ')}
              </Text>
              {selectedToken?.symbol === token.symbol && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

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
  tokenSelector: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
  },
  tokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  tokenSymbol: {
    fontSize: 17,
    fontWeight: '600',
    marginRight: 4,
  },
  dropdownArrow: {
    fontSize: 12,
  },
  usdValue: {
    fontSize: 14,
    marginTop: 6,
    marginLeft: 16,
  },
  swapButton: {
    alignSelf: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(120, 120, 128, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  swapIcon: {
    fontSize: 24,
    color: '#007AFF',
  },
  calculatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  calculatingText: {
    fontSize: 14,
    marginLeft: 8,
  },
  rateContainer: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  rateLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rateValue: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 4,
  },
  routeInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  previewButton: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 30,
  },
  previewText: {
    fontSize: 17,
    fontWeight: '600',
  },
  tokenListModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tokenListContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  tokenListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(120, 120, 128, 0.2)',
  },
  tokenListTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '400',
  },
  tokenListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 17,
    fontWeight: '600',
  },
  tokenBalance: {
    fontSize: 14,
    marginTop: 2,
  },
  tokenChains: {
    fontSize: 12,
    marginRight: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
  },
});
