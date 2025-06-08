import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableWithoutFeedback,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

interface IOSSpotlightModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (query: string) => void;
}

const { width, height } = Dimensions.get('window');

export function IOSSpotlightModal({ visible, onClose, onSubmit }: IOSSpotlightModalProps) {
  const opacity = useSharedValue(0);
  const blurIntensity = useSharedValue(0);
  const searchBarOpacity = useSharedValue(0);
  const searchBarScale = useSharedValue(0.9);
  const searchBarTranslateY = useSharedValue(20);
  
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      // Apple's Spotlight animation sequence with enhanced timing
      hapticTrigger('impactLight');
      
      // Stage 1: More subtle blur appears with depth
      opacity.value = withTiming(1, { duration: 250 });
      blurIntensity.value = withTiming(75, { duration: 350 }); // Reduced for more subtle effect
      
      // Stage 2: Search bar slides up with Apple's exact spring physics
      searchBarOpacity.value = withSequence(
        withTiming(0, { duration: 120 }),
        withTiming(1, { duration: 280 })
      );
      searchBarScale.value = withSpring(1, {
        damping: 22, // Apple's exact damping
        stiffness: 380,
        mass: 0.85,
        overshootClamping: false,
      });
      searchBarTranslateY.value = withSpring(0, {
        damping: 20,
        stiffness: 360,
        mass: 0.9,
        overshootClamping: false,
      });
      
      // Auto-focus with Apple's timing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 180);
    } else {
      // Apple's Spotlight close animation with proper easing
      searchBarOpacity.value = withTiming(0, { duration: 180 });
      searchBarScale.value = withTiming(0.88, { duration: 180 });
      searchBarTranslateY.value = withTiming(25, { duration: 180 });
      
      blurIntensity.value = withTiming(0, { duration: 220 });
      opacity.value = withTiming(0, { duration: 220 });
      
      // Clear query when closing
      setQuery('');
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      blurIntensity.value,
      [0, 80],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  const searchBarStyle = useAnimatedStyle(() => ({
    opacity: searchBarOpacity.value,
    transform: [
      { scale: searchBarScale.value },
      { translateY: searchBarTranslateY.value },
    ],
  }));

  const handleSubmit = () => {
    if (query.trim()) {
      hapticTrigger('impactLight');
      onSubmit(query.trim());
    }
  };

  const handleClose = () => {
    hapticTrigger('impactLight');
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <Animated.View style={[styles.overlay, backgroundStyle]}>
          {/* Subtle Gaussian blur with Apple's frosted-glass effect */}
          <Animated.View style={[StyleSheet.absoluteFillObject, blurStyle]}>
            <BlurView intensity={75} tint="dark" style={StyleSheet.absoluteFillObject}>
              {/* More subtle gradient for depth perception */}
              <LinearGradient
                colors={[
                  'rgba(0,0,0,0.15)', 
                  'rgba(0,0,0,0.25)', 
                  'rgba(0,0,0,0.35)'
                ]}
                style={StyleSheet.absoluteFillObject}
                locations={[0, 0.5, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </BlurView>
          </Animated.View>
          
          {/* Search bar with Apple's exact styling */}
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.searchContainer, searchBarStyle]}>
              <LinearGradient
                colors={[
                  'rgba(72,72,74,0.98)', // Brighter, more translucent
                  'rgba(58,58,60,0.95)',
                  'rgba(44,44,46,0.92)',
                ]}
                style={styles.searchBackground}
                locations={[0, 0.5, 1]}
              >
                {/* Enhanced glass overlay for authentic iOS feel */}
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0.15)', 
                    'rgba(255,255,255,0.08)', 
                    'rgba(255,255,255,0.02)'
                  ]}
                  style={styles.glassOverlay}
                  locations={[0, 0.6, 1]}
                />
                
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search or enter website"
                  placeholderTextColor="rgba(174,174,178,0.8)" // Brighter, neutral gray
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  onSubmitEditing={handleSubmit}
                  selectionColor="#007AFF" // iOS's exact vibrant blue
                />
                
                {/* Enhanced inner border */}
                <View style={styles.innerBorder} />
              </LinearGradient>
            </Animated.View>
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
    width: width * 0.88,
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  searchBackground: {
    borderRadius: 18, // Apple's exact corner radius
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 18, // Precise vertical centering
    position: 'relative',
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  input: {
    fontSize: 17, // Apple's exact font size
    fontWeight: '400',
    color: '#FFFFFF', // Pure white for better contrast
    letterSpacing: -0.24, // Apple's letter spacing
    lineHeight: 22,
    textAlign: 'left',
    paddingVertical: 0, // Remove default padding for precise centering
    zIndex: 1,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 18,
    borderWidth: 0.33, // Apple's exact border width
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
