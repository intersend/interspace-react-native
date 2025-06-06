import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TextInput, TouchableWithoutFeedback } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';

interface IOSSpotlightModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
}

export function IOSSpotlightModal({ visible, onClose, onSubmit }: IOSSpotlightModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 250 });
      scale.value = withTiming(1, { duration: 250 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.95, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, containerStyle]}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject} />
          <TouchableWithoutFeedback>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="Search or enter website"
                placeholderTextColor={Apple.Colors.placeholderText}
                autoFocus
                autoCorrect={false}
                autoCapitalize="none"
                onSubmitEditing={() => onSubmit(query)}
              />
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    width: '90%',
    backgroundColor: Apple.Colors.secondarySystemBackground,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 17,
    color: Apple.Colors.label,
  },
});
