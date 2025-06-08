import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

interface IOSDeleteConfirmationProps {
  visible: boolean;
  appName: string;
  isFolder?: boolean;
  onCancel: () => void;
  onDelete: () => void;
}

const { width } = Dimensions.get('window');

export function IOSDeleteConfirmation({
  visible,
  appName,
  isFolder = false,
  onCancel,
  onDelete,
}: IOSDeleteConfirmationProps) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 400,
        mass: 0.8,
      });
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withTiming(0.9, { duration: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handleDelete = () => {
    hapticTrigger('notificationWarning');
    onDelete();
  };

  const handleCancel = () => {
    hapticTrigger('impactLight');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />
        
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>
              Remove "{appName}"?
            </Text>
            
            {/* Message */}
            <Text style={styles.message}>
              {isFolder
                ? 'This will remove the folder and keep all apps on the Home Screen.'
                : 'Removing from Home Screen will keep the app in your App Library.'}
            </Text>
          </View>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </TouchableOpacity>
            
            {/* Divider */}
            <View style={styles.divider} />
            
            {/* Delete Button */}
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.deleteText]}>
                {isFolder ? 'Remove Folder' : 'Remove from Home Screen'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    width: width * 0.72,
    maxWidth: 270,
    backgroundColor: 'rgba(44,44,46,0.95)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  message: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: -0.08,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  button: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Cancel button styles
  },
  deleteButton: {
    // Delete button styles
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.4,
  },
  cancelText: {
    color: Apple.Colors.systemBlue,
  },
  deleteText: {
    color: '#FF453A',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
