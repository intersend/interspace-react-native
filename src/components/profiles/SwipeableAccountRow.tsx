import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useWalletImage, useWalletInfo } from 'thirdweb/react';
import { Apple } from '../../../constants/AppleDesign';
import { LinkedAccount } from '../../types';

interface SwipeableAccountRowProps {
  account: LinkedAccount | any;
  isLinkedAccount: boolean;
  onDelete: () => Promise<void>;
  isEditMode?: boolean;
}

export const SwipeableAccountRow: React.FC<SwipeableAccountRowProps> = ({
  account,
  isLinkedAccount,
  onDelete,
  isEditMode = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteButtonWidth = 80;
  
  const { data: walletImage } = useWalletImage(account.walletType || 'unknown');
  const { data: walletInfo } = useWalletInfo(account.walletType || 'unknown');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isEditMode,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 && !isEditMode;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          // Swiping left
          translateX.setValue(Math.max(gestureState.dx, -deleteButtonWidth));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          // Snap to show delete button
          Animated.spring(translateX, {
            toValue: -deleteButtonWidth,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        } else {
          // Snap back to closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAccountIcon = () => {
    if (isLinkedAccount) {
      return walletImage || '👛';
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
      return account.customName || walletInfo?.name || account.walletType || 'Wallet';
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

  const handleDelete = () => {
    const accountName = getAccountName();
    
    Alert.alert(
      'Remove Account',
      `Are you sure you want to remove "${accountName}" from this profile?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Animate back to closed position
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
              // Animate out
              Animated.timing(translateX, {
                toValue: -300,
                duration: 300,
                useNativeDriver: true,
              }).start();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove account');
              // Reset position on error
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Delete button (underneath) */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Main row content (swipeable) */}
      <Animated.View
        style={[
          styles.rowContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Edit mode delete button */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.editModeDelete}
            onPress={handleDelete}
          >
            <View style={styles.deleteIcon}>
              <Text style={styles.deleteIconText}>−</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Account icon */}
        <View style={styles.accountIcon}>
          {typeof getAccountIcon() === 'string' ? (
            <Text style={styles.accountIconText}>{getAccountIcon()}</Text>
          ) : (
            <Image source={{ uri: getAccountIcon() as string }} style={styles.accountIconImage} />
          )}
        </View>

        {/* Account info */}
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>
            {getAccountName()}
          </Text>
          {getAccountAddress() && (
            <Text style={styles.accountAddress}>
              {getAccountAddress()}
            </Text>
          )}
        </View>

        {/* Primary badge */}
        {account.isPrimary && (
          <View style={styles.primaryBadge}>
            <Text style={styles.primaryText}>Primary</Text>
          </View>
        )}

        {/* Drag handle for edit mode */}
        {isEditMode && (
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleIcon}>≡</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 6,
    borderRadius: Apple.Radius.tight,
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Apple.Colors.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Apple.Colors.secondarySystemBackground,
    borderRadius: Apple.Radius.tight,
  },
  editModeDelete: {
    marginRight: 12,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Apple.Colors.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '300',
    marginTop: -2,
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Apple.Colors.tertiarySystemBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '600',
    color: Apple.Colors.label,
    marginBottom: 2,
  },
  accountAddress: {
    fontSize: 13,
    color: Apple.Colors.secondaryLabel,
    fontFamily: 'monospace',
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Apple.Radius.tight,
    backgroundColor: Apple.Colors.systemBlue,
    marginLeft: 8,
  },
  primaryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  dragHandle: {
    marginLeft: 12,
    opacity: 0.4,
  },
  dragHandleIcon: {
    fontSize: 20,
    color: Apple.Colors.tertiaryLabel,
  },
});
