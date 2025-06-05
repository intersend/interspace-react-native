import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';

interface AppIconProps {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  isEditMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AppIcon({
  id,
  name,
  url,
  iconUrl,
  isEditMode,
  onPress,
  onLongPress,
  onDelete,
}: AppIconProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  // Jiggly animation for edit mode
  useEffect(() => {
    if (isEditMode) {
      rotation.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 }),
          withTiming(-2, { duration: 100 }),
          withTiming(2, { duration: 100 })
        ),
        -1,
        true
      );
    } else {
      rotation.value = withTiming(0, { duration: 100 });
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

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const getAppInitial = () => {
    return name.charAt(0).toUpperCase();
  };

  const getAppColor = () => {
    // Generate consistent color from app name
    const colors = [
      '#FF453A', '#FF9F0A', '#FFD60A', '#30D158',
      '#40C8E0', '#007AFF', '#5856D6', '#AF52DE',
      '#FF2D92',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View style={styles.container}>
      <AnimatedPressable
        style={[styles.iconWrapper, animatedStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
      >
        {/* App Icon */}
        <View style={styles.iconContainer}>
          {iconUrl ? (
            <Image source={{ uri: iconUrl }} style={styles.iconImage} />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: getAppColor() }]}>
              <Text style={styles.iconInitial}>{getAppInitial()}</Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        {isEditMode && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.deleteButtonInner}>
              <Text style={styles.deleteButtonText}>×</Text>
            </View>
          </TouchableOpacity>
        )}
      </AnimatedPressable>

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
    height: 90,
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: Apple.Radius.medium,
    overflow: 'hidden',
    backgroundColor: Apple.Colors.tertiarySystemBackground,
  },
  iconImage: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInitial: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  appName: {
    marginTop: 6,
    fontSize: Apple.Typography.caption1.fontSize,
    fontWeight: Apple.Typography.caption1.fontWeight,
    lineHeight: Apple.Typography.caption1.lineHeight,
    color: Apple.Colors.label,
    textAlign: 'center',
    width: '100%',
    paddingHorizontal: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Apple.Colors.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
    ...Apple.Shadows.level2,
  },
  deleteButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Apple.Colors.systemRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 18,
    marginTop: -2,
  },
});
