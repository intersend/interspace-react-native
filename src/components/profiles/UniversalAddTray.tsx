import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import AppleBottomTray from '../ui/AppleBottomTray';

const { height: screenHeight } = Dimensions.get('window');

interface AddOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

interface AddOptionGroup {
  title: string;
  options: AddOption[];
}

interface UniversalAddTrayProps {
  visible: boolean;
  onClose: () => void;
  onConnectWallet: () => void;
  onLinkSocial: () => void;
  onAddEmail: () => void;
  onBookmarkApp: () => void;
  onAddContact: () => void;
  onCreateProfile: () => void;
  onProfileSettings: () => void;
}

export const UniversalAddTray: React.FC<UniversalAddTrayProps> = ({
  visible,
  onClose,
  onConnectWallet,
  onLinkSocial,
  onAddEmail,
  onBookmarkApp,
  onAddContact,
  onCreateProfile,
  onProfileSettings,
}) => {
  const colorScheme = useColorScheme();

  const addGroups: AddOptionGroup[] = [
    {
      title: 'WALLET',
      options: [
        {
          id: 'connect-wallet',
          title: 'Link External Wallet',
          subtitle: 'MetaMask, Coinbase, WalletConnect',
          icon: '👛',
          onPress: onConnectWallet,
        },
      ],
    },
    {
      title: 'APPS & CONTENT',
      options: [
        {
          id: 'bookmark-app',
          title: 'Bookmark App',
          subtitle: 'Add any Web3 app by URL',
          icon: '📱',
          onPress: onBookmarkApp,
        },
        {
          id: 'add-contact',
          title: 'Add Contact',
          subtitle: 'Save wallet addresses',
          icon: '👤',
          onPress: onAddContact,
        },
      ],
    },
    {
      title: 'PROFILE MANAGEMENT',
      options: [
        {
          id: 'create-profile',
          title: 'Create New Profile',
          subtitle: 'Trading, Gaming, DeFi contexts',
          icon: '✨',
          onPress: onCreateProfile,
        },
        {
          id: 'profile-settings',
          title: 'Profile Settings',
          subtitle: 'Manage current profile',
          icon: '⚙️',
          onPress: onProfileSettings,
        },
      ],
    },
  ];

  const handleOptionPress = (option: AddOption) => {
    console.log('🎯 Tray option pressed:', option.title);
    // Don't close immediately - let the handler decide
    option.onPress();
  };

  // Debug log when tray renders
  React.useEffect(() => {
    if (visible) {
      console.log('📋 UniversalAddTray is now visible');
      console.log('📋 Number of groups:', addGroups.length);
      console.log('📋 Total options:', addGroups.reduce((total, group) => total + group.options.length, 0));
    }
  }, [visible, addGroups]);

  return (
    <AppleBottomTray visible={visible} onClose={onClose}>
      <View
        style={[
          styles.trayContainer,
          { backgroundColor: Colors[colorScheme ?? 'dark'].surface }
        ]}
      >

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'dark'].text }]}>
              Add to Interspace
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: Colors[colorScheme ?? 'dark'].tint }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {addGroups.map((group, groupIndex) => (
              <View key={group.title} style={styles.optionGroup}>
                {/* Group Header */}
                <Text style={[
                  styles.groupTitle,
                  { color: Colors[colorScheme ?? 'dark'].tabIconDefault }
                ]}>
                  {group.title}
                </Text>

                {/* Group Options */}
                <View style={[
                  styles.groupContainer,
                  { backgroundColor: Colors[colorScheme ?? 'dark'].surface }
                ]}>
                  {group.options.map((option, optionIndex) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionButton,
                        optionIndex < group.options.length - 1 && styles.optionButtonWithBorder,
                        { borderBottomColor: Colors[colorScheme ?? 'dark'].border }
                      ]}
                      onPress={() => handleOptionPress(option)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionIcon}>
                        <Text style={styles.optionIconText}>{option.icon}</Text>
                      </View>
                      
                      <View style={styles.optionContent}>
                        <Text style={[
                          styles.optionTitle,
                          { color: Colors[colorScheme ?? 'dark'].text }
                        ]}>
                          {option.title}
                        </Text>
                        <Text style={[
                          styles.optionSubtitle,
                          { color: Colors[colorScheme ?? 'dark'].tabIconDefault }
                        ]}>
                          {option.subtitle}
                        </Text>
                      </View>

                      <View style={styles.optionChevron}>
                        <Text style={[
                          styles.chevronText,
                          { color: Colors[colorScheme ?? 'dark'].tabIconDefault }
                        ]}>
                          ›
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            {/* Bottom Spacing for Safe Area */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </AppleBottomTray>
  );
};

const styles = StyleSheet.create({
  trayContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: screenHeight * 0.6, // Ensure minimum height
    maxHeight: screenHeight * 0.85,
    // iOS-style shadows
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionGroup: {
    marginBottom: 32,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  groupContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    // Subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 68,
  },
  optionButtonWithBorder: {
    borderBottomWidth: 1,
  },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 18,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  optionChevron: {
    marginLeft: 12,
  },
  chevronText: {
    fontSize: 20,
    fontWeight: '400',
    opacity: 0.6,
  },
});

export default UniversalAddTray;
