import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { Ionicons } from '@expo/vector-icons';

interface IOSSearchWidgetProps {
  onPress: () => void;
  recentApps?: Array<{
    name: string;
    gradient: string[];
    icon: string;
  }>;
}

const { width } = Dimensions.get('window');
const WIDGET_WIDTH = width - 24; // 12px padding on each side

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Default recent apps
const DEFAULT_RECENT_APPS = [
  { name: 'Aave', gradient: ['#B6509E', '#8B3A7A', '#6B2A5A'], icon: 'flash' },
  { name: 'Uniswap', gradient: ['#FF007A', '#D6005F', '#B30050'], icon: 'git-network' },
  { name: 'Jumper', gradient: ['#7B3FF2', '#5E2FBF', '#4A238C'], icon: 'swap-horizontal' },
  { name: 'Hyperliquid', gradient: ['#1a1a1a', '#000000', '#0a0a0a'], icon: 'trending-up' },
];

export function IOSSearchWidget({ onPress, recentApps = DEFAULT_RECENT_APPS }: IOSSearchWidgetProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const blur = useSharedValue(60);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, {
      damping: 20,
      stiffness: 400,
    });
    opacity.value = withTiming(0.9, { duration: 100 });
    blur.value = withTiming(80, { duration: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 350,
    });
    opacity.value = withTiming(1, { duration: 100 });
    blur.value = withTiming(60, { duration: 200 });
  };

  return (
    <AnimatedTouchableOpacity 
      style={[styles.container, animatedStyle]} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      {/* Multiple shadow layers for depth */}
      <View style={styles.shadowLayer1}>
        <View style={styles.shadowLayer2}>
          {/* Glass morphism background */}
          <BlurView intensity={blur.value} tint="dark" style={styles.blurContainer}>
            {/* Gradient overlay for glass effect */}
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
              style={styles.gradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            
            <View style={styles.content}>
              {/* Search Bar Section */}
              <View style={styles.searchSection}>
                <View style={styles.searchBarWrapper}>
                  <LinearGradient
                    colors={['rgba(50,50,52,0.95)', 'rgba(44,44,46,0.95)']}
                    style={styles.searchBar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  >
                    <View style={styles.searchContent}>
                      <Ionicons 
                        name="search" 
                        size={14} 
                        color={Apple.Colors.secondaryLabel} 
                        style={styles.searchIcon}
                      />
                      <Text style={styles.placeholder}>Search or enter website</Text>
                    </View>
                  </LinearGradient>
                  
                  {/* Inner shadow for depth */}
                  <View style={styles.searchBarInnerShadow} />
                </View>
                
                <Text style={styles.sectionLabel}>Recently Used</Text>
              </View>
              
              {/* Recently Used Apps */}
              <View style={styles.recentAppsRow}>
                {recentApps.map((app, index) => (
                  <Pressable
                    key={index}
                    style={({ pressed }) => [
                      styles.recentApp,
                      pressed && styles.recentAppPressed,
                    ]}
                  >
                    <View style={styles.recentAppIconShadow}>
                      <LinearGradient
                        colors={app.gradient as any}
                        style={styles.recentAppIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                      >
                        {/* Glass shine */}
                        <LinearGradient
                          colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                          style={styles.miniGlassShine}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 0.5 }}
                        />
                        
                        <Ionicons
                          name={app.icon as any}
                          size={20}
                          color="white"
                          style={styles.recentAppIconSymbol}
                        />
                        
                        {/* Inner border */}
                        <View style={styles.miniInnerBorder} />
                      </LinearGradient>
                    </View>
                    <Text style={styles.recentAppText}>{app.name}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </BlurView>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDGET_WIDTH,
    marginHorizontal: 12,
    marginBottom: 16,
  },
  shadowLayer1: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  shadowLayer2: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 30, 0.7)',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
  },
  searchSection: {
    marginBottom: 14,
  },
  searchBarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  searchBar: {
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchBarInnerShadow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholder: {
    color: Apple.Colors.placeholderText,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  sectionLabel: {
    color: Apple.Colors.secondaryLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.05,
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  recentAppsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentApp: {
    alignItems: 'center',
    flex: 1,
  },
  recentAppPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  recentAppIconShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  recentAppIcon: {
    width: 38,
    height: 38,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  miniGlassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 18,
  },
  recentAppIconSymbol: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.15,
    shadowRadius: 0.5,
  },
  miniInnerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 9,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  recentAppText: {
    color: Apple.Colors.secondaryLabel,
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.05,
  },
});
