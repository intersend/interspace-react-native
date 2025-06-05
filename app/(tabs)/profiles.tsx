import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';

// Components
import { ProfileMainView } from '@/src/components/profiles/ProfileMainView';
import { ProfileSelector } from '@/src/components/profiles/ProfileSelector';
import { AddAccountSheet } from '@/src/components/profiles/AddAccountSheet';

// Hooks and Services
import { useAuth } from '@/src/hooks/useAuth';
import { useProfiles } from '@/src/hooks/useProfiles';
import { useLinkedAccounts } from '@/src/hooks/useLinkedAccounts';
import { SmartProfile, LinkedAccount } from '@/src/types';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

// iOS Dark mode colors
const Colors = {
  background: '#000000',
  secondaryBackground: '#1C1C1E',
  tertiaryBackground: '#2C2C2E',
  label: '#FFFFFF',
  secondaryLabel: 'rgba(235, 235, 245, 0.6)',
  separator: 'rgba(84, 84, 88, 0.6)',
  systemBlue: '#0A84FF',
  systemRed: '#FF453A',
  systemGray: '#8E8E93',
};

export default function ProfilesScreen() {
  // State
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [allProfileAccounts, setAllProfileAccounts] = useState<Map<string, LinkedAccount[]>>(new Map());
  
  // Hooks
  const { user } = useAuth();
  const {
    profiles,
    activeProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    switchToProfile,
  } = useProfiles();
  
  const {
    accounts: activeAccounts,
    refreshAccounts,
    getCachedAccounts,
    linkAccount,
    unlinkAccount,
  } = useLinkedAccounts(activeProfile?.id);

  // Effects
  useEffect(() => {
    // Fetch accounts for all profiles
    const fetchAllAccounts = async () => {
      const accountsMap = new Map<string, LinkedAccount[]>();
      
      for (const profile of profiles) {
        if (profile.id === activeProfile?.id) {
          accountsMap.set(profile.id, activeAccounts);
        } else {
          const cached = getCachedAccounts(profile.id);
          accountsMap.set(profile.id, cached);
        }
      }
      
      setAllProfileAccounts(accountsMap);
    };
    
    if (profiles.length > 0) {
      fetchAllAccounts();
    }
  }, [profiles, activeAccounts, activeProfile]);

  // Handlers
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert('Error', 'Please enter a profile name.');
      return;
    }

    try {
      await createProfile(newProfileName.trim(), user?.walletAddress);
      setShowCreateProfile(false);
      setNewProfileName('');
      hapticTrigger('notificationSuccess');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create profile.');
    }
  };

  const handleEditProfile = async (newName: string) => {
    if (!activeProfile) return;
    
    try {
      await updateProfile(activeProfile.id, { name: newName });
      hapticTrigger('notificationSuccess');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    }
  };

  const handleDeleteProfile = () => {
    if (!activeProfile) return;
    
    if (profiles.length === 1) {
      Alert.alert('Error', 'Cannot delete the last profile.');
      return;
    }
    
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${activeProfile.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(activeProfile.id);
              hapticTrigger('notificationSuccess');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete profile');
            }
          },
        },
      ]
    );
  };

  const handleSwitchProfile = async (profile: SmartProfile) => {
    if (profile.id !== activeProfile?.id) {
      await switchToProfile(profile.id);
      setShowProfileSelector(false);
      hapticTrigger('notificationSuccess');
    }
  };

  const handleAddAccount = async (walletType: string) => {
    try {
      // Here you would integrate with the actual wallet connection logic
      // For now, we'll show a placeholder
      Alert.alert('Coming Soon', `${walletType} integration will be available soon.`);
      setShowAddAccount(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add account.');
    }
  };

  const handleSelectAccount = (account: LinkedAccount) => {
    // Navigate to account details or perform action
    Alert.alert('Account Details', `${account.customName || account.walletType}\n${account.address}`);
  };

  const handleDeleteAccount = async (account: LinkedAccount) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount(account.id);
              hapticTrigger('notificationSuccess');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove account');
            }
          },
        },
      ]
    );
  };

  if (!activeProfile) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No profiles found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateProfile(true)}
          >
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ProfileMainView
        profile={activeProfile}
        linkedAccounts={activeAccounts}
        onSwitchProfile={() => setShowProfileSelector(true)}
        onEditProfile={handleEditProfile}
        onDeleteProfile={handleDeleteProfile}
        onAddAccount={() => setShowAddAccount(true)}
        onSelectAccount={handleSelectAccount}
        onDeleteAccount={handleDeleteAccount}
      />

      {/* Profile Selector Modal */}
      <ProfileSelector
        visible={showProfileSelector}
        profiles={profiles}
        activeProfileId={activeProfile.id}
        profileAccountsMap={allProfileAccounts}
        onSelectProfile={handleSwitchProfile}
        onCreateProfile={() => {
          setShowProfileSelector(false);
          setShowCreateProfile(true);
        }}
        onClose={() => setShowProfileSelector(false)}
      />

      {/* Create Profile Modal */}
      <Modal
        visible={showCreateProfile}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createProfileModal}>
            <Text style={styles.modalTitle}>New Profile</Text>
            
            <TextInput
              style={styles.profileNameInput}
              placeholder="Profile name"
              placeholderTextColor="#999"
              value={newProfileName}
              onChangeText={setNewProfileName}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={handleCreateProfile}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateProfile(false);
                  setNewProfileName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateProfile}
                disabled={!newProfileName.trim()}
              >
                <Text style={[
                  styles.confirmButtonText,
                  !newProfileName.trim() && styles.disabledButtonText
                ]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Account Sheet */}
      <AddAccountSheet
        visible={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onSelect={handleAddAccount}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    color: Colors.secondaryLabel,
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: Colors.systemBlue,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createProfileModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.label,
    textAlign: 'center',
    marginBottom: 20,
  },
  profileNameInput: {
    backgroundColor: Colors.tertiaryBackground,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 17,
    color: Colors.label,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: Colors.separator,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.tertiaryBackground,
  },
  confirmButton: {
    backgroundColor: Colors.systemBlue,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.label,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});
