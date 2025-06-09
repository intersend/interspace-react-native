import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { SmartProfile, LinkedAccount } from '../../types';
import { SwipeableAccountRow } from './SwipeableAccountRow';
import { apiService } from '../../services/api';
import { useLinkedAccounts } from '../../hooks/useLinkedAccounts';

const WALLET_ICONS: Record<string, { icon: string; name: string }> = {
  metamask: { icon: '🦊', name: 'MetaMask' },
  coinbase: { icon: '🪙', name: 'Coinbase' },
  walletconnect: { icon: '🔗', name: 'WalletConnect' },
};
interface AppleWalletCardProps {
  profile: SmartProfile;
  linkedAccounts: LinkedAccount[];
  isActive: boolean;
  onPress: (profile: SmartProfile) => void;
  onSwitchToProfile?: (profileId: string) => void;
}

interface AccountRowProps {
  account: any;
  isSessionAccount?: boolean;
  isLinkedAccount?: boolean;
  isPrimary?: boolean;
}

const AccountRow: React.FC<AccountRowProps> = ({ 
  account, 
  isSessionAccount = false, 
  isLinkedAccount = true,
  isPrimary = false 
}) => {
  const colorScheme = useColorScheme();
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const getAccountIcon = () => {
    if (isSessionAccount) {
      return '🔗'; // Session account icon
    }
    
    if (isLinkedAccount) {
      return WALLET_ICONS[account.walletType]?.icon || '👛';
    } else {
      // Thirdweb social profile
      switch (account.type) {
        case 'google': return '🌐';
        case 'discord': return '💬';
        case 'apple': return '🍎';
        case 'facebook': return '📘';
        case 'email': return '📧';
        case 'phone': return '📱';
        default: return '🔗';
      }
    }
  };
  
  const getAccountName = () => {
    if (isSessionAccount) {
      return 'Delegation Wallet';
    }
    
    if (isLinkedAccount) {
      return (
        account.customName ||
        WALLET_ICONS[account.walletType]?.name ||
        account.walletType ||
        'External Wallet'
      );
    } else {
      return account.details?.email || account.details?.phone || account.type;
    }
  };
  
  const getAccountSubtitle = () => {
    if (isSessionAccount) {
      return 'Signs transactions on your behalf';
    }
    
    if (isLinkedAccount) {
      return isPrimary ? 'Primary funding source' : 'Funding source';
    } else {
      return 'Social account';
    }
  };
  
  return (
    <View style={[
      styles.accountRow,
      isSessionAccount && styles.sessionAccountRow,
      { backgroundColor: isSessionAccount ? 'rgba(0, 122, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)' }
    ]}>
      <View style={[
        styles.accountIcon,
        isSessionAccount && styles.sessionAccountIcon,
        { backgroundColor: isSessionAccount ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }
      ]}>
        {typeof getAccountIcon() === 'string' ? (
          <Text style={styles.accountIconText}>{getAccountIcon()}</Text>
        ) : (
          <Image source={{ uri: getAccountIcon() as string }} style={styles.accountIconImage} />
        )}
      </View>
      
      <View style={styles.accountInfo}>
        <View style={styles.accountNameRow}>
          <Text style={[
            styles.accountName, 
            { color: Colors[colorScheme ?? 'dark'].text },
            isSessionAccount && styles.sessionAccountName
          ]}>
            {getAccountName()}
          </Text>
          {isPrimary && (
            <View style={[styles.primaryBadge, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
              <Text style={styles.primaryText}>Primary</Text>
            </View>
          )}
        </View>
        
        <Text style={[
          styles.accountSubtitle, 
          { color: Colors[colorScheme ?? 'dark'].tabIconDefault },
          isSessionAccount && styles.sessionAccountSubtitle
        ]}>
          {getAccountSubtitle()}
        </Text>
        
        {(account.address || isSessionAccount) && (
          <Text style={[
            styles.accountAddress, 
            { color: Colors[colorScheme ?? 'dark'].tabIconDefault }
          ]}>
            {formatAddress(account.address || account.sessionWalletAddress)}
          </Text>
        )}
      </View>
    </View>
  );
};

export const AppleWalletCard: React.FC<AppleWalletCardProps> = ({
  profile,
  linkedAccounts,
  isActive,
  onPress,
  onSwitchToProfile,
}) => {
  const colorScheme = useColorScheme();
  const [isEditMode, setIsEditMode] = useState(false);
  const { unlinkAccount } = useLinkedAccounts(profile.id);
  
  const handlePress = () => {
    if (!isEditMode) {
      onPress(profile);
    }
  };
  
  const handleLongPress = () => {
    setIsEditMode(!isEditMode);
  };
  
  const handleSwitchPress = () => {
    if (onSwitchToProfile && !isActive) {
      onSwitchToProfile(profile.id);
    }
  };

  const handleDeleteLinkedAccount = async (account: LinkedAccount) => {
    try {
      await unlinkAccount(account.id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove wallet');
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: Colors[colorScheme ?? 'dark'].surface,
          borderColor: isActive 
            ? Colors[colorScheme ?? 'dark'].tint 
            : 'rgba(255, 255, 255, 0.1)',
          borderWidth: isActive ? 2 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        isActive && styles.activeCard,
        isEditMode && styles.editModeCard,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {profile.name}
          </Text>
          
          {isActive ? (
            <View style={[styles.currentIndicator, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
              <Text style={styles.currentText}>Current</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.switchButton, { borderColor: Colors[colorScheme ?? 'dark'].tint }]}
              onPress={handleSwitchPress}
            >
              <Text style={[styles.switchText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                Switch
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

      {/* Session Account Section */}
      <View style={styles.accountSection}>
        <Text style={[styles.sectionLabel, { color: Colors[colorScheme ?? 'dark'].tint }]}>
          SESSION ACCOUNT
        </Text>
        <AccountRow 
          account={{ sessionWalletAddress: profile.sessionWalletAddress }}
          isSessionAccount={true}
        />
      </View>

      {/* Funding Accounts Section */}
      {linkedAccounts.length > 0 && (
        <View style={styles.accountSection}>
          <Text style={[styles.sectionLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            YOUR WALLETS
          </Text>
          
          {/* Backend Linked Accounts (EOA Wallets) */}
          {linkedAccounts.map((account) => (
            <SwipeableAccountRow
              key={account.id} 
              account={account} 
              isLinkedAccount={true}
              isEditMode={isEditMode}
              onDelete={() => handleDeleteLinkedAccount(account)}
            />
          ))}
        </View>
      )}

      {/* Empty State for Accounts */}
      {linkedAccounts.length === 0 && (
        <View style={styles.accountSection}>
          <Text style={[styles.sectionLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            YOUR WALLETS
          </Text>
          <TouchableOpacity style={styles.addAccountButton}>
            <Text style={[styles.addAccountText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
              + Add your first wallet
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Footer */}
      <View style={[styles.statsFooter, { borderTopColor: 'rgba(255, 255, 255, 0.1)' }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {linkedAccounts.length}
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            Wallets
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {profile.appsCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            Apps
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {profile.foldersCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            Folders
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    marginBottom: 20,
    padding: 0,
    overflow: 'hidden',
    // Apple Wallet multi-layer shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
    // Apple's card background with subtle gradient
    backgroundColor: '#1C1C1E', // iOS dark card background
  },
  activeCard: {
    // Enhanced shadow for active state
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 20,
    // Active card gets blue tint
    borderWidth: 2,
    borderColor: 'rgba(0, 122, 255, 0.6)',
  },
  editModeCard: {
    // Edit mode visual feedback
    borderColor: 'rgba(255, 59, 48, 0.6)', // Red border for edit mode
    borderWidth: 2,
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700', // SF Pro Bold equivalent
    letterSpacing: -0.6,
    color: '#FFFFFF', // Apple Wallet card title color
  },
  activeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  currentIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 122, 255, 1)',
  },
  currentText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  switchButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  accountSection: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  sessionAccountRow: {
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionAccountIcon: {
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  accountIconText: {
    fontSize: 18,
  },
  accountIconImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sessionAccountName: {
    fontWeight: '700',
  },
  accountSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  sessionAccountSubtitle: {
    fontWeight: '600',
  },
  accountAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
    opacity: 0.8,
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addAccountButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default AppleWalletCard;
