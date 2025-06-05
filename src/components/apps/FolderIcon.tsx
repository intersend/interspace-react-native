import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';

interface App {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
}

interface FolderIconProps {
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

export function FolderIcon({
  id,
  name,
  apps,
  color = Apple.Colors.systemGray4,
  isEditMode,
  onPress,
  onLongPress,
  onDelete,
}: FolderIconProps) {
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

  const getAppColor = (appName: string) => {
    const colors = [
      '#FF453A', '#FF9F0A', '#FFD60A', '#30D158',
      '#40C8E0', '#007AFF', '#5856D6', '#AF52DE',
      '#FF2D92',
    ];
    const index = appName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Render mini app icons in 3x3 grid
  const renderMiniApps = () => {
    const displayApps = apps.slice(0, 9); // Show max 9 apps
    const emptySlots = 9 - displayApps.length;
    
    return (
      <View style={styles.miniAppsGrid}>
        {displayApps.map((app, index) => (
          <View key={app.id} style={styles.miniAppIcon}>
            <View style={[styles.miniAppInner, { backgroundColor: getAppColor(app.name) }]}>
              <Text style={styles.miniAppInitial}>
                {app.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
        ))}
        {/* Fill empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <View key={`empty-${index}`} style={styles.miniAppIcon} />
        ))}
      </View>
    );
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
        {/* Folder Background */}
        <View style={[styles.folderContainer, { backgroundColor: color }]}>
          {renderMiniApps()}
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
    height: 90,
    alignItems: 'center',
  },
  iconWrapper: {
    position: 'relative',
  },
  folderContainer: {
    width: 60,
    height: 60,
    borderRadius: Apple.Radius.medium,
    padding: 8,
    overflow: 'hidden',
  },
  miniAppsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
  },
  miniAppIcon: {
    width: '30%',
    height: '30%',
    padding: 1,
  },
  miniAppInner: {
    width: '100%',
    height: '100%',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniAppInitial: {
    fontSize: 6,
    fontWeight: '600',
    color: 'white',
  },
  folderName: {
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
