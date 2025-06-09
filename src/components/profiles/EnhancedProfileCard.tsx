import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { SmartProfile, LinkedAccount } from '../../types';

const WALLET_ICONS: Record<string, { icon: string; name: string }> = {
  metamask: { icon: '🦊', name: 'MetaMask' },
  coinbase: { icon: '🪙', name: 'Coinbase' },
  walletconnect: { icon: '🔗', name: 'WalletConnect' },
};

interface EnhancedProfileCardProps {
  profile: SmartProfile;
  linkedAccounts: LinkedAccount[];
  thirdwebProfiles: any[];
  onProfilePress: (profile: SmartProfile) => void;
  onActivateProfile: (profileId: string) => void;
}

interface AccountRowProps {
  account: any;
  isLinkedAccount?: boolean;
}

const AccountRow: React.FC<AccountRowProps> = ({ account, isLinkedAccount = true }) => {
  const colorScheme = useColorScheme();
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  
  const getAccountIcon = () => {
    if (isLinkedAccount) {
      // Backend linked account (wallet)
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
    if (isLinkedAccount) {
      return (
        account.customName ||
        WALLET_ICONS[account.walletType]?.name ||
        account.walletType ||
        'Wallet'
      );
    } else {
      return account.details?.email || account.details?.phone || account.type;
    }
  };
  
  const getAccountAddress = () => {
    if (isLinkedAccount) {
      return formatAddress(account.address);
    } else {
      return account.details?.address ? formatAddress(account.details.address) : '';
    }
  };
  
  return (
    <View style={styles.accountRow}>
      <View style={styles.accountIcon}>
        {typeof getAccountIcon() === 'string' ? (
          <Text style={styles.accountIconText}>{getAccountIcon()}</Text>
        ) : (
          <Image source={{ uri: getAccountIcon() as string }} style={styles.accountIconImage} />
        )}
      </View>
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: Colors[colorScheme ?? 'dark'].text }]}>
          {getAccountName()}
        </Text>
        {getAccountAddress() && (
          <Text style={[styles.accountAddress, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            {getAccountAddress()}
          </Text>
        )}
      </View>
      {account.isPrimary && (
        <View style={[styles.primaryBadge, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
          <Text style={styles.primaryText}>Primary</Text>
        </View>
      )}
    </View>
  );
};

export const EnhancedProfileCard: React.FC<EnhancedProfileCardProps> = ({
  profile,
  linkedAccounts,
  thirdwebProfiles,
  onProfilePress,
  onActivateProfile,
}) => {
  const colorScheme = useColorScheme();
  
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // linkedAccounts are already filtered for this profile by useLinkedAccounts hook
  const profileLinkedAccounts = linkedAccounts;

  return (
    <TouchableOpacity
      style={[
        styles.profileCard,
        {
          backgroundColor: Colors[colorScheme ?? 'dark'].surface,
          borderColor: profile.isActive 
            ? Colors[colorScheme ?? 'dark'].tint 
            : Colors[colorScheme ?? 'dark'].tabIconDefault,
          borderWidth: profile.isActive ? 2 : 1,
        }
      ]}
      onPress={() => onProfilePress(profile)}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {profile.name}
          </Text>
          {profile.isActive && (
            <View style={[styles.activeTag, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
              <Text style={styles.activeText}>Active</Text>
            </View>
          )}
        </View>
        {!profile.isActive && (
          <TouchableOpacity
            style={[styles.activateButton, { borderColor: Colors[colorScheme ?? 'dark'].tint }]}
            onPress={() => onActivateProfile(profile.id)}
          >
            <Text style={[styles.activateText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
              Activate
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Session Wallet */}
      <View style={styles.sessionWallet}>
        <Text style={[styles.sectionLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
          Session Wallet
        </Text>
        <Text style={[styles.addressText, { color: Colors[colorScheme ?? 'dark'].text }]}>
          {formatAddress(profile.sessionWalletAddress)}
        </Text>
      </View>

      {/* Linked Accounts Section */}
      {(profileLinkedAccounts.length > 0 || thirdwebProfiles.length > 0) && (
        <View style={styles.accountsSection}>
          <Text style={[styles.sectionLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            Linked Accounts
          </Text>
          
          {/* Backend Linked Accounts (Wallets) */}
          {profileLinkedAccounts.map((account) => (
            <AccountRow key={account.id} account={account} isLinkedAccount={true} />
          ))}
          
          {/* Thirdweb Social Profiles */}
          {thirdwebProfiles.map((profile, index) => (
            <AccountRow key={`social-${index}`} account={profile} isLinkedAccount={false} />
          ))}
          
          {/* Encourage linking if no accounts */}
          {profileLinkedAccounts.length === 0 && thirdwebProfiles.length === 0 && (
            <TouchableOpacity style={styles.encourageLinkButton}>
              <Text style={[styles.encourageLinkText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                + Link your first account
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
            {profileLinkedAccounts.length + thirdwebProfiles.length}
          </Text>
          <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
            Accounts
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  activeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  activateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  activateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sessionWallet: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  accountsSection: {
    marginBottom: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 6,
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 16,
  },
  accountIconImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
  },
  accountAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  primaryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  encourageLinkButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  encourageLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
