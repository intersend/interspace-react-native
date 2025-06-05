import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProfileAvatar } from './ProfileAvatar';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import { SmartProfile, LinkedAccount } from '@/src/types';

// iOS Dark mode colors
const Colors = {
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  tertiaryLabel: 'rgba(235, 235, 245, 0.3)',
  separator: 'rgba(84, 84, 88, 0.6)',
  opaqueSeparator: '#38383A',
  systemBlue: '#0A84FF',
  systemRed: '#FF453A',
  systemGreen: '#30D158',
  systemGray: '#8E8E93',
};

interface ProfileMainViewProps {
  profile: SmartProfile;
  linkedAccounts: LinkedAccount[];
  onSwitchProfile: () => void;
  onEditProfile: (name: string) => void;
  onDeleteProfile: () => void;
  onAddAccount: () => void;
  onSelectAccount: (account: LinkedAccount) => void;
  onDeleteAccount: (account: LinkedAccount) => void;
}

export const ProfileMainView: React.FC<ProfileMainViewProps> = ({
  profile,
  linkedAccounts,
  onSwitchProfile,
  onEditProfile,
  onDeleteProfile,
  onAddAccount,
  onSelectAccount,
  onDeleteAccount,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [refreshing, setRefreshing] = useState(false);

  const handleEditName = () => {
    hapticTrigger('impactLight');
    setIsEditingName(true);
    setEditedName(profile.name);
  };

  const handleSaveName = () => {
    if (editedName.trim().length === 0) {
      Alert.alert('Error', 'Profile name cannot be empty');
      return;
    }
    if (editedName.trim().length > 30) {
      Alert.alert('Error', 'Profile name is too long');
      return;
    }
    
    hapticTrigger('notificationSuccess');
    onEditProfile(editedName.trim());
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setEditedName(profile.name);
    setIsEditingName(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getWalletIcon = (walletType?: string) => {
    switch (walletType) {
      case 'metamask':
        return '🦊';
      case 'coinbase':
        return '🪙';
      case 'walletconnect':
        return '🔗';
      default:
        return '💳';
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <Text style={styles.navTitle}>Profiles</Text>
          <TouchableOpacity
            style={styles.switchButton}
            onPress={onSwitchProfile}
          >
            <Text style={styles.switchButtonText}>Switch Profile</Text>
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
              tintColor={Colors.systemBlue}
            />
          }
        >
          {/* Profile Header - Centered like Apple Account */}
          <View style={styles.profileHeader}>
            <ProfileAvatar 
              address={profile.sessionWalletAddress} 
              size={120} 
            />
            
            <View style={styles.nameContainer}>
              {isEditingName ? (
                <View style={styles.editNameContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={editedName}
                    onChangeText={setEditedName}
                    autoFocus
                    selectTextOnFocus
                    maxLength={30}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={handleCancelEdit}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveName}>
                      <Text style={styles.saveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={handleEditName}
                  >
                    <Ionicons name="pencil" size={18} color={Colors.systemBlue} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <Text style={styles.sessionAddress} numberOfLines={1} adjustsFontSizeToFit>
              {profile.sessionWalletAddress}
            </Text>
          </View>

          {/* Linked Accounts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Linked Accounts</Text>
            <View style={styles.listContainer}>
              {linkedAccounts.map((account, index) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.listItem,
                    index < linkedAccounts.length - 1 && styles.listItemBorder,
                  ]}
                  onPress={() => onSelectAccount(account)}
                >
                  <View style={styles.listItemContent}>
                    <Text style={styles.listItemIcon}>
                      {getWalletIcon(account.walletType)}
                    </Text>
                    <View style={styles.listItemText}>
                      <Text style={styles.listItemTitle}>
                        {account.customName || account.walletType || 'Wallet'}
                      </Text>
                      <Text style={styles.listItemSubtitle} numberOfLines={1}>
                        {account.address}
                      </Text>
                    </View>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={Colors.tertiaryLabel} 
                  />
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.listItem, styles.addAccountItem]}
                onPress={onAddAccount}
              >
                <View style={styles.listItemContent}>
                  <View style={styles.addIconContainer}>
                    <Ionicons name="add" size={20} color={Colors.systemBlue} />
                  </View>
                  <Text style={styles.addAccountText}>Account</Text>
                </View>
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={Colors.tertiaryLabel} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete Profile */}
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDeleteProfile}
            >
              <Text style={styles.deleteText}>Delete Profile</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  navTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.label,
    letterSpacing: 0.37,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  switchButtonText: {
    fontSize: 17,
    color: Colors.systemBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 40,
  },
  nameContainer: {
    marginTop: 20,
    minHeight: 34,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.label,
    letterSpacing: 0.36,
  },
  editButton: {
    marginLeft: 10,
    padding: 4,
  },
  editNameContainer: {
    alignItems: 'center',
  },
  nameInput: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.label,
    borderBottomWidth: 2,
    borderBottomColor: Colors.systemBlue,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 200,
    textAlign: 'center',
  },
  editActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 20,
  },
  cancelText: {
    fontSize: 17,
    color: Colors.systemGray,
  },
  saveText: {
    fontSize: 17,
    color: Colors.systemBlue,
    fontWeight: '600',
  },
  sessionAddress: {
    fontSize: 13,
    fontFamily: 'Courier',
    color: Colors.secondaryLabel,
    marginTop: 8,
    letterSpacing: -0.5,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.secondaryLabel,
    letterSpacing: -0.08,
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  listContainer: {
    backgroundColor: Colors.secondaryBackground,
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  listItemBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 17,
    color: Colors.label,
    letterSpacing: -0.43,
  },
  listItemSubtitle: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: Colors.secondaryLabel,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  addAccountItem: {
    // No bottom border
  },
  addIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.tertiaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addAccountText: {
    fontSize: 17,
    color: Colors.systemBlue,
    letterSpacing: -0.43,
  },
  deleteSection: {
    marginHorizontal: 20,
    marginTop: 40,
  },
  deleteButton: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 17,
    color: Colors.systemRed,
    letterSpacing: -0.43,
  },
});

export default ProfileMainView;
