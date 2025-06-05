import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
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
  systemBlue: '#0A84FF',
  systemGray: '#8E8E93',
  systemGreen: '#30D158',
};

interface ProfileSelectorProps {
  visible: boolean;
  profiles: SmartProfile[];
  activeProfileId: string;
  profileAccountsMap: Map<string, LinkedAccount[]>;
  onSelectProfile: (profile: SmartProfile) => void;
  onCreateProfile: () => void;
  onClose: () => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  visible,
  profiles,
  activeProfileId,
  profileAccountsMap,
  onSelectProfile,
  onCreateProfile,
  onClose,
}) => {
  const handleSelectProfile = (profile: SmartProfile) => {
    if (profile.id !== activeProfileId) {
      hapticTrigger('impactLight');
      onSelectProfile(profile);
    }
  };

  const handleCreateProfile = () => {
    hapticTrigger('impactLight');
    onCreateProfile();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Navigation Bar */}
          <View style={styles.navigationBar}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.navTitle}>Select SmartProfile</Text>
            
            <TouchableOpacity 
              style={styles.navButton}
              onPress={onClose}
            >
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {profiles.map((profile, index) => {
              const linkedAccounts = profileAccountsMap.get(profile.id) || [];
              const isActive = profile.id === activeProfileId;
              
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={styles.profileCard}
                  onPress={() => handleSelectProfile(profile)}
                  activeOpacity={0.7}
                >
                  <View style={styles.profileContent}>
                    <ProfileAvatar 
                      address={profile.sessionWalletAddress}
                      size={48}
                    />
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{profile.name}</Text>
                      <Text style={styles.accountCount}>
                        {linkedAccounts.length} linked account{linkedAccounts.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    
                    {isActive && (
                      <View style={styles.checkmark}>
                        <Ionicons 
                          name="checkmark-circle-outline" 
                          size={24} 
                          color={Colors.systemGreen} 
                        />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Create New Profile */}
            <TouchableOpacity
              style={[styles.profileCard, styles.createCard]}
              onPress={handleCreateProfile}
            >
              <View style={styles.createContent}>
                <View style={styles.createIcon}>
                  <Ionicons name="add" size={24} color={Colors.systemBlue} />
                </View>
                <Text style={styles.createText}>Create SmartProfile</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.separator,
  },
  navButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  cancelText: {
    fontSize: 17,
    color: Colors.systemGray,
  },
  doneText: {
    fontSize: 17,
    color: Colors.systemBlue,
    fontWeight: '600',
    textAlign: 'right',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.label,
    letterSpacing: -0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: Colors.secondaryBackground,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.label,
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  accountCount: {
    fontSize: 14,
    color: Colors.secondaryLabel,
    letterSpacing: -0.2,
  },
  checkmark: {
    marginLeft: 12,
  },
  createCard: {
    marginTop: 24,
  },
  createContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  createIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.tertiaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createText: {
    fontSize: 17,
    color: Colors.systemBlue,
    letterSpacing: -0.4,
    marginLeft: 12,
  },
});

export default ProfileSelector;
