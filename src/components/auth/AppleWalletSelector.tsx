import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  TextInput,
  Alert,
  SafeAreaView,
  Platform,
  SectionList,
  StatusBar,
  ScrollView,
  Linking,
} from 'react-native';
import AppleBottomTray from '../ui/AppleBottomTray';
import { Apple } from '../../../constants/AppleDesign';
import { useAuth } from '../../hooks/useAuth';
import { WalletConnectConfig } from '../../types';
import * as Haptics from 'expo-haptics';
import { createWallet } from 'thirdweb/wallets';
import { DEFAULT_TESTNET_CHAIN } from '../../../constants/thirdweb';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Debug flag
const DEBUG = true;

// Wallet app store links
const WALLET_APP_STORE_LINKS: Record<string, { ios: string, android: string }> = {
  'io.metamask': {
    ios: 'https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202',
    android: 'https://play.google.com/store/apps/details?id=io.metamask'
  },
  'com.coinbase.wallet': {
    ios: 'https://apps.apple.com/us/app/coinbase-wallet-nfts-crypto/id1278383455',
    android: 'https://play.google.com/store/apps/details?id=org.toshi'
  },
  'me.rainbow': {
    ios: 'https://apps.apple.com/us/app/rainbow-ethereum-wallet/id1457119021',
    android: 'https://play.google.com/store/apps/details?id=me.rainbow'
  },
  'com.trustwallet.app': {
    ios: 'https://apps.apple.com/us/app/trust-crypto-bitcoin-wallet/id1288339409',
    android: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp'
  },
  'xyz.argent': {
    ios: 'https://apps.apple.com/us/app/argent-defi-in-a-tap/id1358741926',
    android: 'https://play.google.com/store/apps/details?id=im.argent.contractwalletclient'
  },
  'global.safe': {
    ios: 'https://apps.apple.com/us/app/safe-smart-crypto-wallet/id1515759131',
    android: 'https://play.google.com/store/apps/details?id=io.gnosis.safe'
  },
  'com.ledger': {
    ios: 'https://apps.apple.com/us/app/ledger-live-crypto-wallet/id1361671700',
    android: 'https://play.google.com/store/apps/details?id=com.ledger.live'
  },
  'io.zerion.wallet': {
    ios: 'https://apps.apple.com/us/app/zerion-web3-wallet/id1456732565',
    android: 'https://play.google.com/store/apps/details?id=io.zerion.android'
  },
};

// Wallet URL schemes for checking if installed
const WALLET_URL_SCHEMES: Record<string, string> = {
  'io.metamask': 'metamask://',
  'com.coinbase.wallet': 'cbwallet://',
  'me.rainbow': 'rainbow://',
  'com.trustwallet.app': 'trust://',
  'xyz.argent': 'argent://',
  'global.safe': 'safe://',
  'io.zerion.wallet': 'zerion://',
  'walletconnect': 'wc://',
};

// Top wallets to show in the initial view
const TOP_WALLETS = [
  { id: 'io.metamask', name: 'MetaMask', color: '#F6851B', icon: 'M' },
  { id: 'com.coinbase.wallet', name: 'Coinbase Wallet', color: '#0052FF', icon: 'C' },
  { id: 'me.rainbow', name: 'Rainbow', color: '#7657EB', icon: 'R' },
  { id: 'com.trustwallet.app', name: 'Trust Wallet', color: '#3375BB', icon: 'T' },
  { id: 'walletconnect', name: 'WalletConnect', color: '#3B99FC', icon: 'W' },
  { id: 'xyz.argent', name: 'Argent', color: '#FF875B', icon: 'A' },
  { id: 'global.safe', name: 'Safe', color: '#12FF80', icon: 'S' },
  { id: 'com.ledger', name: 'Ledger Live', color: '#000000', icon: 'L' },
];

// All supported wallets
const ALL_WALLETS = [
  // Popular wallets
  { id: 'io.metamask', name: 'MetaMask', category: 'Popular' },
  { id: 'com.coinbase.wallet', name: 'Coinbase Wallet', category: 'Popular' },
  { id: 'me.rainbow', name: 'Rainbow', category: 'Popular' },
  { id: 'com.trustwallet.app', name: 'Trust Wallet', category: 'Popular' },
  { id: 'xyz.argent', name: 'Argent', category: 'Popular' },
  { id: 'global.safe', name: 'Safe', category: 'Popular' },
  { id: 'com.ledger', name: 'Ledger Live', category: 'Popular' },
  { id: 'io.zerion.wallet', name: 'Zerion', category: 'Popular' },
  
  // Exchanges
  { id: 'com.binance.wallet', name: 'Binance Wallet', category: 'Exchanges' },
  { id: 'com.okex.wallet', name: 'OKX Wallet', category: 'Exchanges' },
  { id: 'com.bybit', name: 'Bybit', category: 'Exchanges' },
  { id: 'com.kraken', name: 'Kraken', category: 'Exchanges' },
  { id: 'com.crypto.wallet', name: 'Crypto.com DeFi', category: 'Exchanges' },
  { id: 'com.kucoin', name: 'KuCoin', category: 'Exchanges' },
  
  // DeFi
  { id: 'org.uniswap', name: 'Uniswap Wallet', category: 'DeFi' },
  { id: 'io.1inch.wallet', name: '1inch Wallet', category: 'DeFi' },
  { id: 'xyz.sequence', name: 'Sequence', category: 'DeFi' },
  { id: 'io.loopring.wallet', name: 'Loopring', category: 'DeFi' },
  { id: 'com.shapeshift', name: 'ShapeShift', category: 'DeFi' },
  
  // Mobile
  { id: 'com.exodus', name: 'Exodus', category: 'Mobile' },
  { id: 'pro.tokenpocket', name: 'TokenPocket', category: 'Mobile' },
  { id: 'org.mathwallet', name: 'Math Wallet', category: 'Mobile' },
  { id: 'com.bitget.web3', name: 'Bitget Wallet', category: 'Mobile' },
  { id: 'com.safepal', name: 'SafePal', category: 'Mobile' },
  
  // Gaming & NFT
  { id: 'app.backpack', name: 'Backpack', category: 'Gaming & NFT' },
  { id: 'io.magiceden.wallet', name: 'Magic Eden', category: 'Gaming & NFT' },
  { id: 'com.roninchain.wallet', name: 'Ronin Wallet', category: 'Gaming & NFT' },
  { id: 'io.enjin', name: 'Enjin Wallet', category: 'Gaming & NFT' },
  
  // Hardware
  { id: 'com.tangem', name: 'Tangem', category: 'Hardware' },
  { id: 'com.coolbitx.cwsapp', name: 'CoolWallet', category: 'Hardware' },
  { id: 'com.dcentwallet', name: "D'CENT Wallet", category: 'Hardware' },
  { id: 'com.ellipal', name: 'ELLIPAL', category: 'Hardware' },
  
  // Other
  { id: 'walletconnect', name: 'WalletConnect', category: 'Other' },
  { id: 'com.zengo', name: 'ZenGo', category: 'Other' },
  { id: 'io.blocto', name: 'Blocto', category: 'Other' },
  { id: 'app.keplr', name: 'Keplr', category: 'Other' },
];

// Snap points for the sheet
const SNAP_POINTS = {
  CLOSED: SCREEN_HEIGHT,
  HALF: SCREEN_HEIGHT * 0.5,
  FULL: SCREEN_HEIGHT * 0.1, // 10% from top
};

interface AppleWalletSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AppleWalletSelector({ visible, onClose, onSuccess }: AppleWalletSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [filteredWallets, setFilteredWallets] = useState<any[]>([]);
  
  // Animation values
  const translateY = useRef(new Animated.Value(SNAP_POINTS.CLOSED)).current;
  
  const { login } = useAuth();

  // Debug logging
  useEffect(() => {
    if (DEBUG) {
      console.log('[WalletSelector] Mounted, visible:', visible);
      console.log('[WalletSelector] TOP_WALLETS count:', TOP_WALLETS.length);
    }
  }, []);

  // Pan responder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to vertical gestures
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 3);
      },
      onPanResponderGrant: () => {
        // When the gesture starts, stop any running animations
        translateY.stopAnimation();
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        // Move the sheet based on the gesture
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        // When the gesture ends, snap to the nearest point
        translateY.flattenOffset();
        
        // Determine which snap point to go to based on velocity
        let targetPosition;
        
        if (gestureState.vy > 0.5) {
          // Fast downward swipe - close
          targetPosition = SNAP_POINTS.CLOSED;
        } else if (gestureState.vy < -0.5) {
          // Fast upward swipe - open fully
          targetPosition = SNAP_POINTS.FULL;
        } else if (gestureState.dy > 100) {
          // Dragged down significantly
          targetPosition = SNAP_POINTS.CLOSED;
        } else if (gestureState.dy < -100) {
          // Dragged up significantly
          targetPosition = SNAP_POINTS.FULL;
        } else {
          // Default to half-open position
          targetPosition = SNAP_POINTS.HALF;
        }
        
        // Animate to the target position
        if (targetPosition === SNAP_POINTS.CLOSED) {
          // Close the sheet
          animateOut(() => {
            onClose();
          });
        } else {
          // Snap to a position
          Animated.spring(translateY, {
            toValue: targetPosition,
            tension: 50,
            friction: 12,
            useNativeDriver: true,
          }).start();
          
        }
      },
    })
  ).current;

  // Filter wallets based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredWallets([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = ALL_WALLETS.filter(wallet => 
      wallet.name.toLowerCase().includes(query)
    );
    
    // Group by category
    const categories = [...new Set(filtered.map(w => w.category))];
    const grouped = categories.map(category => ({
      title: category,
      data: filtered.filter(w => w.category === category),
    }));
    
    setFilteredWallets(grouped);
    
    if (DEBUG) {
      console.log('[WalletSelector] Filtered wallets:', filtered.length);
    }
  }, [searchQuery]);

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      if (DEBUG) console.log('[WalletSelector] Opening sheet');
      
      // Reset state
      setSearchQuery('');
      setSelectedWallet(null);
      setIsConnecting(false);
      setFilteredWallets([]);
      
      // Animate in
      StatusBar.setBarStyle('light-content');
      animateIn();
    }
  }, [visible]);

  const animateIn = () => {
    // Reset position
    translateY.setValue(SNAP_POINTS.CLOSED);
    
    // Animate to half-screen position
    Animated.spring(translateY, {
      toValue: SNAP_POINTS.HALF,
      tension: 50,
      friction: 12,
      useNativeDriver: true,
    }).start();
    
  };

  const animateOut = (callback?: () => void) => {
    // Animate to closed position
    Animated.timing(translateY, {
      toValue: SNAP_POINTS.CLOSED,
      duration: 250,
      useNativeDriver: true,
    }).start(callback);
    
    // Reset status bar
    StatusBar.setBarStyle('default');
  };

  // Check if wallet app is installed
  const isWalletInstalled = async (walletId: string): Promise<boolean> => {
    try {
      // For WalletConnect, always return true as it can work via QR code
      if (walletId === 'walletconnect') {
        return true;
      }
      
      // Get URL scheme for the wallet
      const scheme = WALLET_URL_SCHEMES[walletId];
      if (!scheme) return false;
      
      // Check if URL scheme can be opened
      const canOpen = await Linking.canOpenURL(scheme);
      if (DEBUG) console.log(`[WalletSelector] Wallet ${walletId} installed: ${canOpen}`);
      return canOpen;
    } catch (error) {
      console.error('[WalletSelector] Error checking wallet installation:', error);
      return false;
    }
  };

  // Get app store link based on platform
  const getWalletAppStoreLink = (walletId: string): string => {
    const links = WALLET_APP_STORE_LINKS[walletId];
    if (!links) return '';
    
    return Platform.OS === 'ios' ? links.ios : links.android;
  };

  const handleWalletSelect = async (walletId: string) => {
    if (DEBUG) console.log('[WalletSelector] Selected wallet:', walletId);
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedWallet(walletId);
    setIsConnecting(true);
    
    try {
      // Check if wallet is installed
      const installed = await isWalletInstalled(walletId);
      
      if (!installed) {
        // Wallet not installed - prompt to install
        const walletName = ALL_WALLETS.find(w => w.id === walletId)?.name || 'Wallet';
        const appStoreLink = getWalletAppStoreLink(walletId);
        
        if (appStoreLink) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          
          Alert.alert(
            'Wallet Not Installed',
            `${walletName} is not installed on your device. Would you like to install it now?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Install', 
                onPress: () => Linking.openURL(appStoreLink)
              }
            ]
          );
        } else {
          Alert.alert(
            'Wallet Not Found',
            `${walletName} is not installed on your device.`
          );
        }
        
        setIsConnecting(false);
        setSelectedWallet(null);
        return;
      }
      
      // Create wallet instance with mobile configuration
      const wallet = createWallet(walletId as any, {
        mobileConfig: {
          // Your app's URL scheme for deep linking back
          callbackURL: "interspace://"
        },
        // Customize metadata shown in wallet app
        appMetadata: {
          name: "Interspace Wallet",
          description: "Connect your wallet to Interspace",
          url: "https://interspace.app"
        }
      });
      
      // Configure wallet connection
      const config: WalletConnectConfig = {
        strategy: 'wallet',
        wallet: wallet,
        chain: DEFAULT_TESTNET_CHAIN, // Use appropriate chain for SIWE
      };
      
      // Attempt login with enhanced error handling
      await login(config);
      
      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Unable to connect to wallet.';
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'You cancelled the connection request.';
      } else if (error.message?.includes('No wallet found') || error.message?.includes('not installed')) {
        const walletName = ALL_WALLETS.find(w => w.id === walletId)?.name || 'Wallet';
        errorMessage = `${walletName} is not installed or not properly configured.`;
      } else if (error.message?.includes('timeout') || error.message?.includes('Timed out')) {
        errorMessage = 'Connection request timed out. Please try again.';
      } else if (error.message?.includes('network') || error.message?.includes('Network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Failed to connect to wallet.';
      }
      
      Alert.alert('Connection Failed', errorMessage);
    } finally {
      setIsConnecting(false);
      setSelectedWallet(null);
    }
  };

  const handleClose = () => {
    if (DEBUG) console.log('[WalletSelector] Closing sheet');
    
    // Animate out
    animateOut(() => {
      onClose();
    });
  };

  // Render a wallet icon in the grid
  const renderWalletIcon = ({ item }: { item: typeof TOP_WALLETS[0] }) => {
    const isSelected = selectedWallet === item.id;
    
    return (
      <TouchableOpacity
        style={styles.walletIconButton}
        onPress={() => handleWalletSelect(item.id)}
        disabled={isConnecting}
        activeOpacity={0.7}
      >
        <View style={[styles.walletIconContainer, { backgroundColor: item.color }]}>
          <Text style={styles.walletIconText}>{item.icon}</Text>
          {isSelected && isConnecting && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="white" size="small" />
            </View>
          )}
        </View>
        <Text style={styles.walletName}>{item.name}</Text>
      </TouchableOpacity>
    );
  };
  
  // Render a wallet item in the search results list
  const renderWalletItem = ({ item }: { item: typeof ALL_WALLETS[0] }) => {
    const isSelected = selectedWallet === item.id;
    const walletColor = TOP_WALLETS.find(w => w.id === item.id)?.color || '#8E8E93';
    
    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          isSelected && styles.listItemSelected,
        ]}
        onPress={() => handleWalletSelect(item.id)}
        disabled={isConnecting}
        activeOpacity={0.6}
      >
        <View style={[styles.listItemIcon, { backgroundColor: walletColor }]}>
          <Text style={styles.listItemIconText}>{item.name.charAt(0)}</Text>
        </View>
        <Text style={styles.listItemText}>{item.name}</Text>
        {isSelected && isConnecting ? (
          <ActivityIndicator size="small" color={Apple.Colors.systemBlue} />
        ) : (
          <Text style={styles.chevron}>›</Text>
        )}
      </TouchableOpacity>
    );
  };
  
  // Render section header in search results
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  if (!visible) return null;

  return (
    <AppleBottomTray visible={visible} onClose={handleClose}>
      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY }]
          }
        ]}
        {...panResponder.panHandlers}
      >
          {/* Drag indicator */}
          <View style={styles.dragIndicator} />
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              activeOpacity={0.6}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Connect Wallet</Text>
            <View style={styles.headerRight} />
          </View>
          
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search wallets"
                placeholderTextColor={Apple.Colors.placeholderText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          </View>
          
          {/* Content */}
          <View style={styles.contentContainer}>
            {searchQuery.length === 0 ? (
              // Popular wallets grid
              <ScrollView style={styles.scrollView}>
                <Text style={styles.sectionTitle}>Popular Wallets</Text>
                <View style={styles.gridContainer}>
                  {TOP_WALLETS.map((wallet) => (
                    <View key={wallet.id} style={styles.walletIconButton}>
                      <TouchableOpacity
                        style={[styles.walletIconContainer, { backgroundColor: wallet.color }]}
                        onPress={() => handleWalletSelect(wallet.id)}
                        disabled={isConnecting}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.walletIconText}>{wallet.icon}</Text>
                        {selectedWallet === wallet.id && isConnecting && (
                          <View style={styles.loadingOverlay}>
                            <ActivityIndicator color="white" size="small" />
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={styles.walletName}>{wallet.name}</Text>
                    </View>
                  ))}
                </View>
                
                {/* Debug info */}
                {DEBUG && (
                  <View style={styles.debugContainer}>
                    <Text style={styles.debugText}>
                      Wallets: {TOP_WALLETS.length}
                    </Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              // Search results
              <SectionList
                sections={filteredWallets}
                keyExtractor={(item) => item.id}
                renderItem={renderWalletItem}
                renderSectionHeader={renderSectionHeader}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={true}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No wallets found</Text>
                  </View>
                }
              />
            )}
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.helpLink}>
              <Text style={styles.helpLinkText}>What is a wallet?</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </AppleBottomTray>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: Apple.Colors.systemBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: SCREEN_HEIGHT * 0.9, // 90% of screen height
    width: '100%',
    position: 'absolute',
    bottom: -SCREEN_HEIGHT * 0.1, // Offset to account for the 90% height
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  dragIndicator: {
    width: 36,
    height: 5,
    backgroundColor: Apple.Colors.tertiaryLabel,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Apple.Colors.separator,
  },
  cancelButton: {
    minWidth: 60,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 17,
    color: Apple.Colors.systemBlue,
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Apple.Colors.label,
  },
  headerRight: {
    minWidth: 60,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Apple.Colors.separator,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Apple.Colors.tertiarySystemBackground,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 6,
    color: Apple.Colors.tertiaryLabel,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: Apple.Colors.label,
    height: 36,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Apple.Colors.label,
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  walletIconButton: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Apple.Shadows.level1,
  },
  walletIconText: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  walletName: {
    fontSize: 12,
    color: Apple.Colors.label,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: Apple.Colors.systemGroupedBackground,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Apple.Colors.secondaryLabel,
    textTransform: 'uppercase',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Apple.Colors.systemBackground,
  },
  listItemSelected: {
    backgroundColor: Apple.Colors.tertiarySystemBackground,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemIconText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  listItemText: {
    flex: 1,
    fontSize: 17,
    color: Apple.Colors.label,
  },
  chevron: {
    fontSize: 20,
    color: Apple.Colors.tertiaryLabel,
    fontWeight: '300',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Apple.Colors.separator,
    marginLeft: 68,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 17,
    color: Apple.Colors.secondaryLabel,
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Apple.Colors.separator,
    paddingVertical: 16,
  },
  helpLink: {
    alignItems: 'center',
  },
  helpLinkText: {
    fontSize: 15,
    color: Apple.Colors.systemBlue,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: '#FFFF0033',
    marginTop: 20,
  },
  debugText: {
    fontSize: 14,
    color: '#000',
  },
});
