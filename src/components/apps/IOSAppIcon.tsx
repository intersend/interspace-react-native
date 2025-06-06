import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { Ionicons } from '@expo/vector-icons';

interface IOSAppIconProps {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  gradient?: string[];
  icon?: string;
  isEditMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}


// App-specific gradients and icons with iOS-style colors
const APP_THEMES: Record<string, { gradient: string[], secondaryGradient?: string[], icon?: string, iconColor?: string }> = {
  'Aave': {
    gradient: ['#B6509E', '#8B3A7A', '#6B2A5A'],
    secondaryGradient: ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'],
    icon: 'flash',
    iconColor: '#FFFFFF',
  },
  'Hyperliquid': {
    gradient: ['#1a1a1a', '#000000', '#0a0a0a'],
    secondaryGradient: ['rgba(0,212,255,0.3)', 'rgba(0,212,255,0.05)'],
    icon: 'trending-up',
    iconColor: '#00D4FF',
  },
  'Jumper': {
    gradient: ['#7B3FF2', '#5E2FBF', '#4A238C'],
    secondaryGradient: ['rgba(47,128,237,0.3)', 'rgba(47,128,237,0.1)'],
    icon: 'swap-horizontal',
    iconColor: '#FFFFFF',
  },
  'Uniswap': {
    gradient: ['#FF007A', '#D6005F', '#B30050'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'git-network',
    iconColor: '#FFFFFF',
  },
  'Compound': {
    gradient: ['#00D395', '#00B37D', '#009365'],
    secondaryGradient: ['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)'],
    icon: 'bar-chart',
    iconColor: '#FFFFFF',
  },
  'Curve': {
    gradient: ['#0066FF', '#0052CC', '#003D99'],
    secondaryGradient: ['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.05)'],
    icon: 'analytics',
    iconColor: '#FFD700',
  },
  'SushiSwap': {
    gradient: ['#FA52A0', '#E03B85', '#C72E6C'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'restaurant',
    iconColor: '#FFFFFF',
  },
  'Balancer': {
    gradient: ['#1E1E1E', '#141414', '#0A0A0A'],
    secondaryGradient: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
    icon: 'scale',
    iconColor: '#FFFFFF',
  },
  '1inch': {
    gradient: ['#FFD923', '#F5C800', '#E0B700'],
    secondaryGradient: ['rgba(27,49,79,0.3)', 'rgba(27,49,79,0.1)'],
    icon: 'layers',
    iconColor: '#1B314F',
  },
  'OpenSea': {
    gradient: ['#2081E2', '#1868B7', '#10508C'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'boat',
    iconColor: '#FFFFFF',
  },
  'Blur': {
    gradient: ['#FF6900', '#E55A00', '#CC4D00'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'aperture',
    iconColor: '#FFFFFF',
  },
  'dYdX': {
    gradient: ['#6966FF', '#524CFF', '#3D38E5'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'stats-chart',
    iconColor: '#FFFFFF',
  },
  'GMX': {
    gradient: ['#2E5CE6', '#2449C5', '#1A36A5'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'rocket',
    iconColor: '#FFFFFF',
  },
  'Hop': {
    gradient: ['#C252FC', '#AD3EE5', '#9B2FCD'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'arrow-forward-circle',
    iconColor: '#FFFFFF',
  },
  'Across': {
    gradient: ['#6CF9D8', '#52E5C4', '#3DD1B0'],
    secondaryGradient: ['rgba(45,45,61,0.2)', 'rgba(45,45,61,0.05)'],
    icon: 'git-branch',
    iconColor: '#2D2D3D',
  },
};

export function IOSAppIcon({
  id,
  name,
  url,
  iconUrl,
  isEditMode,
  onPress,
  onLongPress,
  onDelete,
}: IOSAppIconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(0);

  const theme = APP_THEMES[name] || {
    gradient: ['#007AFF', '#0051D5', '#003DAB'],
    secondaryGradient: ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)'],
    icon: 'apps',
    iconColor: '#FFFFFF',
  };

  // Reduced jiggle animation for more authentic iOS feel
  useEffect(() => {
    if (isEditMode) {
      // Stagger the animation start for each icon
      const delay = Math.random() * 150;
      
      setTimeout(() => {
        rotation.value = withRepeat(
          withSequence(
            withTiming(-1, { duration: 100 }),
            withTiming(1, { duration: 100 }),
            withTiming(-1, { duration: 100 }),
            withTiming(1, { duration: 100 }),
          ),
          -1,
          true
        );
      }, delay);
      
      // Animate delete button
      deleteScale.value = withSpring(1, {
        damping: 12,
        stiffness: 300,
        overshootClamping: false,
      });
    } else {
      rotation.value = withTiming(0, { duration: 150 });
      deleteScale.value = withSpring(0, {
        damping: 15,
        stiffness: 400,
      });
    }
  }, [isEditMode]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
    };
  });

  const deleteButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      deleteScale.value,
      [0, 0.5, 1],
      [0, 1.1, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity: deleteScale.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.85, {
      damping: 10,
      stiffness: 300,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 300,
    });
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.touchTarget}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        <Animated.View style={animatedStyle}>
        {/* Icon Container with multiple shadows for depth */}
        <View style={styles.iconOuterShadow}>
          <View style={styles.iconInnerShadow}>
            <LinearGradient
              colors={theme.gradient as any}
              style={styles.iconContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {/* Secondary gradient for depth */}
              {theme.secondaryGradient && (
                <LinearGradient
                  colors={theme.secondaryGradient as any}
                  style={styles.secondaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              
              {/* Glass shine effect */}
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0)'] as any}
                style={styles.glassShine}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.5 }}
              />
              
              {/* App Icon with shadow */}
              <View style={styles.iconWrapper}>
                {iconUrl ? (
                  <Image source={{ uri: iconUrl }} style={styles.iconImage} />
                ) : (
                  <Ionicons
                    name={theme.icon as any}
                    size={30}
                    color={theme.iconColor}
                    style={styles.iconSymbol}
                  />
                )}
              </View>
              
              {/* Inner border for depth */}
              <View style={styles.innerBorder} />
            </LinearGradient>
          </View>
        </View>

        {/* Delete button */}
        {isEditMode && (
          <Animated.View style={[styles.deleteButton, deleteButtonStyle]}>
            <Pressable onPress={onDelete} hitSlop={8}>
              <View style={styles.deleteButtonOuter}>
                <LinearGradient
                  colors={['#FF453A', '#FF3B30']}
                  style={styles.deleteButtonGradient}
                >
                  <Text style={styles.deleteButtonText}>－</Text>
                </LinearGradient>
              </View>
            </Pressable>
          </Animated.View>
        )}
        </Animated.View>
      </Pressable>

      {/* App Name */}
      <Text style={styles.appName} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 74,
    alignItems: 'center',
  },
  touchTarget: {
    width: 74,
    height: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOuterShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconInnerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 13.4, // iOS superellipse
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  secondaryGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  iconWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  iconImage: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
  },
  iconSymbol: {
    // Icon shadow is handled by wrapper
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 13.4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  appName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.07,
    color: Apple.Colors.label,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -2,
    left: -2,
  },
  deleteButtonOuter: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  deleteButtonGradient: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Apple.Colors.systemBackground,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 13,
    marginTop: -1,
  },
});
