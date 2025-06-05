import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Apple } from '@/constants/AppleDesign';
import { Ionicons } from '@expo/vector-icons';

interface App {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
}

interface IOSFolderIconProps {
  id: string;
  name: string;
  apps: App[];
  color?: string;
  isEditMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// App themes for mini icons
const MINI_APP_THEMES: Record<string, { gradient: string[], icon?: string }> = {
  'Uniswap': { gradient: ['#FF007A', '#D6005F', '#B30050'], icon: 'git-network' },
  'Compound': { gradient: ['#00D395', '#00B37D', '#009365'], icon: 'bar-chart' },
  'Curve': { gradient: ['#0066FF', '#0052CC', '#003D99'], icon: 'analytics' },
  'SushiSwap': { gradient: ['#FA52A0', '#E03B85', '#C72E6C'], icon: 'restaurant' },
  'Balancer': { gradient: ['#1E1E1E', '#141414', '#0A0A0A'], icon: 'scale' },
  '1inch': { gradient: ['#FFD923', '#F5C800', '#E0B700'], icon: 'layers' },
  'Aave': { gradient: ['#B6509E', '#8B3A7A', '#6B2A5A'], icon: 'flash' },
  'Default': { gradient: ['#007AFF', '#0051D5', '#003DAB'], icon: 'apps' },
};

export function IOSFolderIcon({
  id,
  name,
  apps,
  isEditMode,
  onPress,
  onLongPress,
  onDelete,
}: IOSFolderIconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const deleteScale = useSharedValue(0);

  // Reduced jiggle animation for authentic iOS feel
  useEffect(() => {
    if (isEditMode) {
      const delay = Math.random() * 200;
      
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

  // Render mini app icons in 3x3 grid (iOS style)
  const renderMiniApps = () => {
    const displayApps = apps.slice(0, 9); // Show first 9 apps
    const rows = [];
    
    for (let i = 0; i < 3; i++) {
      const rowApps = displayApps.slice(i * 3, (i + 1) * 3);
      if (rowApps.length === 0) break;
      
      rows.push(
        <View key={i} style={styles.miniRow}>
          {rowApps.map((app) => {
            const theme = MINI_APP_THEMES[app.name] || MINI_APP_THEMES.Default;
            return (
              <View key={app.id} style={styles.miniAppContainer}>
                <LinearGradient
                  colors={theme.gradient as any}
                  style={styles.miniApp}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  {/* Mini glass shine */}
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)']}
                    style={styles.miniGlassShine}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                  />
                  
                  <Ionicons
                    name={theme.icon as any}
                    size={7}
                    color="white"
                  />
                </LinearGradient>
              </View>
            );
          })}
          {/* Fill empty slots in row */}
          {Array.from({ length: 3 - rowApps.length }).map((_, index) => (
            <View key={`empty-${i}-${index}`} style={styles.miniAppContainer}>
              <View style={styles.miniAppEmpty} />
            </View>
          ))}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[styles.touchTarget, animatedStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={400}
      >
        {/* Folder Container */}
        <View style={styles.folderOuterShadow}>
          <View style={styles.folderInnerShadow}>
            <BlurView
              intensity={25}
              tint="dark"
              style={styles.folderContainer}
            >
              <View style={styles.folderBackground}>
                {/* Glass effect overlay */}
                <LinearGradient
                  colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)']}
                  style={styles.glassOverlay}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                
                {/* Mini apps grid */}
                <View style={styles.miniAppsGrid}>
                  {renderMiniApps()}
                </View>
                
                {/* Inner border for depth */}
                <View style={styles.innerBorder} />
              </View>
            </BlurView>
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
      </AnimatedPressable>

      {/* Folder Name */}
      <Text style={styles.folderName} numberOfLines={1}>
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
  folderOuterShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  folderInnerShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  folderContainer: {
    width: 60,
    height: 60,
    borderRadius: 13.4, // iOS superellipse
    overflow: 'hidden',
  },
  folderBackground: {
    flex: 1,
    backgroundColor: 'rgba(55, 55, 60, 0.65)',
    padding: 6,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  miniAppsGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  miniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniAppContainer: {
    width: 15,
    height: 15,
  },
  miniApp: {
    width: 15,
    height: 15,
    borderRadius: 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniAppEmpty: {
    width: 15,
    height: 15,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  miniGlassShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 13.4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  folderName: {
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
