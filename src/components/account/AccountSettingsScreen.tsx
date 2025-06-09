import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Image,
  Alert,
  Switch,
  ActionSheetIOS,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { useAuth } from '../../hooks/useAuth';
import { ThemedView } from '../../../components/ThemedView';
import { ThemedText } from '../../../components/ThemedText';
import { apiService } from '../../services/api';
import { User, SocialAccount } from '../../types';
import * as WebBrowser from 'expo-web-browser';
import { useUserSocialAccounts } from '../../hooks/useUserSocialAccounts';

interface AccountSettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const { user: authUser, isAuthenticated, logout } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    socialAccounts,
    isLoading: accountsLoading,
    unlinkAccount,
    refresh,
  } = useUserSocialAccounts();
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Fetch user data with social accounts
  const fetchUserData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      Alert.alert('Error', 'Failed to load account information');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible && isAuthenticated) {
      fetchUserData();
    }
  }, [visible, isAuthenticated]);

  const formatAccountDetails = (account: SocialAccount) => {
    if (account.provider === 'email') {
      return account.username || 'Email';
    } else if (account.provider === 'phone') {
      return account.username || 'Phone';
    } else if (account.provider === 'telegram') {
      return account.username || account.displayName || 'Telegram';
    } else if (account.provider === 'google') {
      return account.username || 'Google';
    } else if (account.provider === 'apple') {
      return account.username || 'Apple ID';
    } else if (account.provider === 'discord') {
      return account.username || 'Discord';
    } else if (account.provider === 'facebook') {
      return account.username || 'Facebook';
    } else if (account.provider === 'farcaster') {
      return account.username || 'Farcaster';
    }
    return account.displayName || account.username || account.provider;
  };

  const getAccountIcon = (provider: string) => {
    switch (provider) {
      case 'google': return '🌐';
      case 'apple': return '🍎';
      case 'facebook': return '📘';
      case 'discord': return '💬';
      case 'email': return '📧';
      case 'phone': return '📱';
      case 'telegram': return '💬';
      case 'farcaster': return '🎭';
      case 'line': return '💚';
      case 'passkey': return '🔐';
      case 'wallet': return '👛';
      case 'guest': return '👤';
      default: return '🔗';
    }
  };

  const handleAddAccount = () => {
    const options = ['Cancel', 'Google', 'Discord', 'Telegram'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) return;
          const provider = options[buttonIndex].toLowerCase();
          try {
            const redirectUri = Linking.createURL('oauth');
            const { authUrl } = await apiService.getLinkAuthUrl(provider, redirectUri);
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            if (result.type === 'success' && result.url) {
              const url = new URL(result.url);
              const code = url.searchParams.get('code');
              if (code) {
                await linkAccount(provider, code, redirectUri);
                Alert.alert('Success', 'Account linked successfully');
                refresh();
              }
            }
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to link account');
          }
        }
      );
    }
  };

  const handleRemoveAccount = (account: SocialAccount) => {
    if (socialAccounts.length === 1) {
      Alert.alert(
        'Cannot Remove',
        'You must have at least one account linked to your profile.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove this ${account.provider} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount(account.id);
              Alert.alert('Success', 'Account removed successfully');
              refresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of all accounts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              onClose();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const userEmail = user?.email || socialAccounts.find(a => a.username?.includes('@'))?.username || '';
  const displayName = userEmail || (user?.isGuest ? 'Guest User' : 'User');

  if (isLoading && !user) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <ThemedView style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'dark'].tint} />
              <ThemedText style={styles.loadingText}>Loading account...</ThemedText>
            </View>
          </SafeAreaView>
        </ThemedView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                Done
              </Text>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.headerTitle}>Account</ThemedText>
            <View style={styles.closeButton} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  fetchUserData(true);
                  refresh();
                }}
                tintColor={Colors[colorScheme ?? 'dark'].tint}
              />
            }
          >
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={[styles.avatar, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
                <Text style={styles.avatarText}>
                  {displayName ? displayName[0].toUpperCase() : '👤'}
                </Text>
              </View>
              <ThemedText type="subtitle" style={styles.userName}>
                {displayName}
              </ThemedText>
              <Text style={[styles.userType, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                Interspace ID
              </Text>
              {user && (
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {user.profilesCount || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      Profiles
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {user.linkedAccountsCount || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      Wallets
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: Colors[colorScheme ?? 'dark'].text }]}>
                      {socialAccounts.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                      Accounts
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Linked Accounts Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                LINKED ACCOUNTS
              </Text>
              
              <View style={[styles.sectionContent, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}>
                {socialAccounts.map((account, index) => (
                  <View
                    key={account.id}
                    style={[
                      styles.accountRow,
                      index < socialAccounts.length - 1 && styles.accountRowBorder,
                      { borderBottomColor: Colors[colorScheme ?? 'dark'].border }
                    ]}
                  >
                    <View style={styles.accountIcon}>
                      <Text style={styles.accountIconText}>{getAccountIcon(account.provider)}</Text>
                    </View>
                    
                    <View style={styles.accountInfo}>
                      <ThemedText style={styles.accountType}>
                        {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}
                      </ThemedText>
                      <Text style={[styles.accountDetails, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                        {formatAccountDetails(account)}
                      </Text>
                    </View>

                    {socialAccounts.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveAccount(account)}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>−</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addAccountButton}
                  onPress={handleAddAccount}
                >
                  <View style={[styles.accountIcon, { backgroundColor: Colors[colorScheme ?? 'dark'].tint }]}>
                    <Text style={[styles.accountIconText, { color: 'white' }]}>+</Text>
                  </View>
                  <ThemedText style={[styles.accountType, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                    Add Account
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Security Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                SECURITY
              </Text>
              
              <View style={[styles.sectionContent, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}>
                <View style={styles.settingRow}>
                  <ThemedText style={styles.settingTitle}>Two-Factor Authentication</ThemedText>
                  <Switch
                    value={twoFactorEnabled}
                    onValueChange={setTwoFactorEnabled}
                    trackColor={{ false: '#767577', true: Colors[colorScheme ?? 'dark'].tint }}
                    thumbColor="#f4f3f4"
                  />
                </View>
                
                <TouchableOpacity 
                  style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: Colors[colorScheme ?? 'dark'].border }]}
                >
                  <ThemedText style={styles.settingTitle}>Privacy Settings</ThemedText>
                  <Text style={[styles.chevron, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* About Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>
                ABOUT
              </Text>
              
              <View style={[styles.sectionContent, { backgroundColor: Colors[colorScheme ?? 'dark'].surface }]}>
                <TouchableOpacity style={styles.settingRow}>
                  <ThemedText style={styles.settingTitle}>Terms of Service</ThemedText>
                  <Text style={[styles.chevron, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>›</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: Colors[colorScheme ?? 'dark'].border }]}
                >
                  <ThemedText style={styles.settingTitle}>Privacy Policy</ThemedText>
                  <Text style={[styles.chevron, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>›</Text>
                </TouchableOpacity>

                <View 
                  style={[styles.settingRow, styles.settingRowBorder, { borderTopColor: Colors[colorScheme ?? 'dark'].border }]}
                >
                  <ThemedText style={styles.settingTitle}>Version</ThemedText>
                  <Text style={[styles.settingValue, { color: Colors[colorScheme ?? 'dark'].tabIconDefault }]}>1.0.0</Text>
                </View>
              </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: '#FF3B30' }]}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  closeButton: {
    width: 50,
  },
  closeText: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    color: 'white',
    fontWeight: '600',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  userType: {
    fontSize: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 35,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 20,
  },
  sectionContent: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  accountRowBorder: {
    borderBottomWidth: 1,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 18,
  },
  accountInfo: {
    flex: 1,
  },
  accountType: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  accountDetails: {
    fontSize: 14,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingRowBorder: {
    borderTopWidth: 1,
  },
  settingTitle: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 20,
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default AccountSettingsScreen;
