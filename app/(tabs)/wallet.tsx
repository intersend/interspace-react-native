import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import ApplePayTray from '@/src/components/transaction/ApplePayTray';
import SendInputModal from '@/src/components/transaction/SendInputModal';
import SwapInputModal from '@/src/components/transaction/SwapInputModal';
import { IOSAssetIcon } from '@/src/components/wallet/IOSAssetIcon';

// Hooks and Types
import { useOrbyBalance } from '@/src/hooks/useOrbyBalance';
import { useTransactionIntent } from '@/src/hooks/useTransactionIntent';
import { useLinkedAccounts } from '@/src/hooks/useLinkedAccounts';
import { useProfiles } from '@/src/hooks/useProfiles';
import { UnifiedToken } from '@/src/types/orby';
import { LinkedAccount } from '@/src/types';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

// Constants
import { IOSColors, IOSTypography, IOSLayout } from '@/src/constants/IOSColors';

const { width: screenWidth } = Dimensions.get('window');

export default function WalletScreen() {
  // State
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'activity'>('tokens');
  const [refreshing, setRefreshing] = useState(false);
  const [showTransactionTray, setShowTransactionTray] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<UnifiedToken | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<LinkedAccount | undefined>(undefined);
  const [transactionType, setTransactionType] = useState<'send' | 'swap'>('send');

  // Hooks
  const { balance, isLoading, error, refresh } = useOrbyBalance();
  const { activeProfile } = useProfiles();
  const { 
    createIntent, 
    signAndSubmit, 
    trackOperation, 
    currentIntent, 
    error: txError, 
    reset: resetIntent 
  } = useTransactionIntent();
  const linkedAccountsHook = useLinkedAccounts(activeProfile?.id);

  // Get linked accounts and primary account
  const linkedAccounts = linkedAccountsHook.accounts || [];
  const primaryAccount = linkedAccounts.find(acc => acc.isPrimary) || linkedAccounts[0];

  // Initialize selected account
  useEffect(() => {
    if (primaryAccount && !selectedAccount) {
      setSelectedAccount(primaryAccount);
    }
  }, [primaryAccount, selectedAccount]);

  // Handlers
  const onRefresh = () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleSend = () => {
    if (balance?.tokens && balance.tokens.length > 0) {
      setSelectedToken(balance.tokens[0]);
      setTransactionType('send');
      setShowSendModal(true);
      hapticTrigger('impactLight');
    }
  };

  const handleReceive = () => {
    // TODO: Implement receive functionality
    hapticTrigger('impactLight');
  };

  const handleSwap = () => {
    if (balance?.tokens && balance.tokens.length > 0) {
      setTransactionType('swap');
      setShowSwapModal(true);
      hapticTrigger('impactLight');
    }
  };

  const handleBuy = () => {
    // TODO: Implement buy functionality
    hapticTrigger('impactLight');
  };

  const handleSendContinue = async (recipientAddress: string, sendAmount: string) => {
    setShowSendModal(false);
    
    if (selectedToken) {
      try {
        const intent = await createIntent({
          type: 'transfer',
          amount: sendAmount,
          token: selectedToken,
          recipient: recipientAddress,
        });
        setShowTransactionTray(true);
      } catch (error) {
        console.error('Failed to create intent:', error);
      }
    }
  };

  const handleSwapPreview = async (fromToken: UnifiedToken, toToken: UnifiedToken, fromAmount: string) => {
    setSelectedToken(fromToken);
    setShowSwapModal(false);
    
    try {
      const intent = await createIntent({
        type: 'swap',
        amount: fromAmount,
        token: fromToken,
        toToken: toToken,
      });
      setShowTransactionTray(true);
    } catch (error) {
      console.error('Failed to create swap intent:', error);
    }
  };

  const handleTransactionConfirm = async () => {
    if (!selectedToken || !currentIntent) return;

    try {
      const operationSetId = await signAndSubmit(currentIntent);
      setShowTransactionTray(false);
      
      const finalStatus = await trackOperation(operationSetId);
      
      if (finalStatus.status === 'successful') {
        refresh();
        hapticTrigger('notificationSuccess');
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      hapticTrigger('notificationError');
    }
  };

  const formatUsdValue = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatTokenBalance = (amount: string, decimals: number) => {
    const value = parseFloat(amount) / Math.pow(10, decimals);
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    return value.toFixed(4);
  };

  // Components
  const BalanceDisplay = () => {
    const totalUsd = balance ? formatUsdValue(balance.totalUsdValue) : '$0.00';

    return (
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>{totalUsd}</Text>
      </View>
    );
  };

  const ActionButton = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionCardPressed
      ]} 
      onPress={onPress}
    >
      <View style={styles.actionContent}>
        <Ionicons name={icon as any} size={28} color={IOSColors.systemBlue} />
        <Text style={styles.actionLabel}>{label}</Text>
      </View>
    </Pressable>
  );

  const SegmentedControl = () => (
    <View style={styles.segmentedControl}>
      {(['tokens', 'nfts', 'activity'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.segmentTab,
            activeTab === tab && styles.segmentTabActive
          ]}
          onPress={() => {
            setActiveTab(tab);
            hapticTrigger('selection');
          }}
        >
          <Text style={[
            styles.segmentTabText,
            activeTab === tab && styles.segmentTabTextActive
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const TokenItem = ({ token }: { token: UnifiedToken }) => {
    const formattedBalance = formatTokenBalance(token.totalAmount, token.decimals);
    const chainName = token.balancesPerChain?.[0]?.chainName || 'ethereum';
    
    return (
      <Pressable 
        style={({ pressed }) => [
          styles.assetItem,
          pressed && styles.assetItemPressed
        ]}
        onPress={() => {
          setSelectedToken(token);
          setTransactionType('send');
          setShowSendModal(true);
          hapticTrigger('impactLight');
        }}
      >
        <View style={styles.assetLeft}>
          <IOSAssetIcon 
            symbol={token.symbol} 
            chainName={chainName}
            size={44}
          />
          <View style={styles.assetInfo}>
            <Text style={styles.assetName}>{token.name}</Text>
            <Text style={styles.assetDetails}>
              {token.symbol} • {formatUsdValue(token.totalUsdValue)}
            </Text>
          </View>
        </View>
        
        <View style={styles.assetRight}>
          <Text style={styles.assetBalance}>{formattedBalance}</Text>
          <Text style={styles.assetUsdValue}>{formatUsdValue(token.totalUsdValue)}</Text>
        </View>
      </Pressable>
    );
  };

  const ActivityItem = ({ type, description, amount, time, app }: any) => (
    <Pressable 
      style={({ pressed }) => [
        styles.activityItem,
        pressed && styles.activityItemPressed
      ]}
    >
      <View style={styles.activityLeft}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(type) }]}>
          <Ionicons 
            name={getActivityIcon(type) as any} 
            size={20} 
            color="#FFFFFF" 
          />
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityDescription}>{description}</Text>
          <Text style={styles.activityTime}>{time} • {app}</Text>
        </View>
      </View>
      
      <View style={styles.activityRight}>
        <Text style={[
          styles.activityAmount,
          { color: type === 'receive' ? IOSColors.systemGreen : IOSColors.label }
        ]}>
          {type === 'receive' ? '+' : '-'}{amount}
        </Text>
      </View>
    </Pressable>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'send': return 'arrow-up-outline';
      case 'receive': return 'arrow-down-outline';
      case 'swap': return 'swap-horizontal-outline';
      case 'app': return 'apps-outline';
      default: return 'ellipse-outline';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'send': return IOSColors.systemBlue;
      case 'receive': return IOSColors.systemGreen;
      case 'swap': return IOSColors.systemPurple;
      case 'app': return IOSColors.systemIndigo;
      default: return IOSColors.systemGray;
    }
  };

  // Mock activity data
  const mockActivity = [
    { type: 'app', description: 'Uniswap Transaction', amount: '0.1 ETH', time: '2h ago', app: 'Uniswap' },
    { type: 'receive', description: 'Received USDC', amount: '500 USDC', time: '5h ago', app: 'Transfer' },
    { type: 'send', description: 'Sent ETH', amount: '0.05 ETH', time: '1d ago', app: 'Transfer' },
    { type: 'swap', description: 'Swapped ETH for USDC', amount: '0.2 ETH', time: '2d ago', app: 'Uniswap' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <Text style={styles.navTitle}>Wallet</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => hapticTrigger('impactLight')}
          >
            <Ionicons name="settings-outline" size={22} color={IOSColors.systemGray2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={IOSColors.systemBlue}
            />
          }
        >
          {/* Hero Balance */}
          <BalanceDisplay />

          {/* Action Cards */}
          <View style={styles.actionsContainer}>
            <ActionButton icon="arrow-up" label="Send" onPress={handleSend} />
            <ActionButton icon="arrow-down" label="Receive" onPress={handleReceive} />
            <ActionButton icon="swap-horizontal" label="Swap" onPress={handleSwap} />
            <ActionButton icon="card" label="Buy" onPress={handleBuy} />
          </View>

          {/* Segmented Control */}
          <SegmentedControl />

          {/* Content based on active tab */}
          {activeTab === 'tokens' && (
            <View style={styles.contentSection}>
              {balance?.tokens?.map((token, index) => (
                <TokenItem key={`${token.symbol}-${index}`} token={token} />
              ))}
              
              {!balance?.tokens?.length && !isLoading && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💰</Text>
                  <Text style={styles.emptyText}>No tokens yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add accounts to see your tokens
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'nfts' && (
            <View style={styles.contentSection}>
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🖼</Text>
                <Text style={styles.emptyText}>No NFTs yet</Text>
                <Text style={styles.emptySubtext}>
                  Your collectibles will appear here
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'activity' && (
            <View style={styles.contentSection}>
              {mockActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))}
              
              {mockActivity.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>⏱</Text>
                  <Text style={styles.emptyText}>No activity yet</Text>
                  <Text style={styles.emptySubtext}>
                    Your transactions will appear here
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <SendInputModal
        visible={showSendModal}
        selectedToken={selectedToken}
        onClose={() => setShowSendModal(false)}
        onContinue={handleSendContinue}
      />

      <SwapInputModal
        visible={showSwapModal}
        tokens={balance?.tokens || []}
        onClose={() => setShowSwapModal(false)}
        onPreview={handleSwapPreview}
      />

      <ApplePayTray
        visible={showTransactionTray}
        intent={currentIntent || undefined}
        selectedAccount={selectedAccount}
        onClose={() => {
          setShowTransactionTray(false);
          resetIntent();
        }}
        onConfirm={handleTransactionConfirm}
        onAccountSelect={() => {
          console.log('Select account');
        }}
        isProcessing={false}
        error={txError || undefined}
        transactionType={transactionType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: IOSColors.systemBackground,
  },
  safeArea: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: IOSLayout.screenPadding,
    paddingVertical: 12,
  },
  navTitle: {
    ...IOSTypography.largeTitle,
    color: IOSColors.label,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Hero Balance
  balanceContainer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  balanceAmount: {
    fontSize: 72,
    fontWeight: '700',
    color: IOSColors.label,
    letterSpacing: -3,
  },
  
  // Action Cards
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: IOSLayout.screenPadding,
    marginBottom: 24,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: IOSColors.tertiarySystemFill,
    borderRadius: 13,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  actionCardPressed: {
    backgroundColor: IOSColors.quaternarySystemFill,
    transform: [{ scale: 0.98 }],
  },
  actionContent: {
    alignItems: 'center',
  },
  actionLabel: {
    ...IOSTypography.subheadline,
    fontWeight: '500',
    color: IOSColors.label,
    marginTop: 6,
  },
  
  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: IOSColors.tertiarySystemFill,
    borderRadius: 9,
    padding: 2,
    marginHorizontal: IOSLayout.screenPadding,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 7,
  },
  segmentTabActive: {
    backgroundColor: IOSColors.tertiarySystemBackground,
  },
  segmentTabText: {
    ...IOSTypography.footnote,
    fontWeight: '600',
    color: IOSColors.secondaryLabel,
  },
  segmentTabTextActive: {
    color: IOSColors.label,
  },
  
  // Content Section
  contentSection: {
    paddingTop: 4,
  },
  
  // Asset List
  assetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: IOSLayout.screenPadding,
    minHeight: 60,
  },
  assetItemPressed: {
    backgroundColor: IOSColors.quaternarySystemFill,
  },
  assetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assetInfo: {
    marginLeft: 12,
    flex: 1,
  },
  assetName: {
    ...IOSTypography.body,
    fontWeight: '600',
    color: IOSColors.label,
    marginBottom: 2,
  },
  assetDetails: {
    ...IOSTypography.footnote,
    color: IOSColors.secondaryLabel,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetBalance: {
    ...IOSTypography.body,
    fontWeight: '500',
    color: IOSColors.label,
    marginBottom: 2,
  },
  assetUsdValue: {
    ...IOSTypography.footnote,
    color: IOSColors.secondaryLabel,
  },
  
  // Activity List
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: IOSLayout.screenPadding,
    minHeight: 60,
  },
  activityItemPressed: {
    backgroundColor: IOSColors.quaternarySystemFill,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    ...IOSTypography.body,
    color: IOSColors.label,
    marginBottom: 2,
  },
  activityTime: {
    ...IOSTypography.caption1,
    color: IOSColors.secondaryLabel,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    ...IOSTypography.body,
    fontWeight: '500',
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyText: {
    ...IOSTypography.body,
    fontWeight: '600',
    color: IOSColors.secondaryLabel,
    marginBottom: 4,
  },
  emptySubtext: {
    ...IOSTypography.footnote,
    color: IOSColors.tertiaryLabel,
    textAlign: 'center',
  },
});
