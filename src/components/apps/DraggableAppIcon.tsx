import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { IOSAppIcon } from './IOSAppIcon';
import { IOSFolderIcon } from './IOSFolderIcon';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

interface DraggableAppIconProps {
  item: any; // App or Folder
  isFolder: boolean;
  isEditMode: boolean;
  position: { x: number; y: number };
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  onDragStart: (item: any, index: number) => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  isOpening?: boolean;
}

export function DraggableAppIcon({
  item,
  isFolder,
  isEditMode,
  position,
  index,
  onPress,
  onLongPress,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
  isDropTarget,
  isOpening,
}: DraggableAppIconProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const rotation = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const shadowRadius = useSharedValue(0);

  // Apple-style jiggle animation in edit mode
  useEffect(() => {
    let timeoutId: any;
    let intervalId: any;
    
    if (isEditMode && !isDragging) {
      // Random delay for authentic feel (0-300ms)
      const delay = Math.random() * 300;
      
      timeoutId = setTimeout(() => {
        // Apple's exact jiggle pattern: -1.5° to +1.5° rotation
        rotation.value = withSequence(
          withTiming(-1.5, { duration: 100 }),
          withTiming(1.5, { duration: 200 }),
          withTiming(-1.5, { duration: 200 }),
          withTiming(1.5, { duration: 200 }),
          withTiming(0, { duration: 100 })
        );
        
        // Repeat the jiggle
        const jiggleLoop = () => {
          if (isEditMode) { // Double-check edit mode is still active
            rotation.value = withSequence(
              withDelay(500 + Math.random() * 1000, withTiming(-1.5, { duration: 100 })),
              withTiming(1.5, { duration: 200 }),
              withTiming(-1.5, { duration: 200 }),
              withTiming(1.5, { duration: 200 }),
              withTiming(0, { duration: 100 })
            );
          }
        };
        
        // Set up continuous jiggling
        intervalId = setInterval(jiggleLoop, 2000 + Math.random() * 1000);
      }, delay);
    } else {
      rotation.value = withTiming(0, { duration: 150 });
    }
    
    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      rotation.value = withTiming(0, { duration: 150 });
    };
  }, [isEditMode, isDragging]);

  // Enhanced drop target animation with Apple's exact feel
  useEffect(() => {
    if (isDropTarget && !isDragging) {
      // Apple's drop target feedback: subtle scale with spring
      scale.value = withSequence(
        withSpring(1.08, { 
          damping: 12, 
          stiffness: 400,
          mass: 0.8 
        }),
        withSpring(1, { 
          damping: 15, 
          stiffness: 350,
          mass: 0.8 
        })
      );
      
      // Subtle haptic feedback
      runOnJS(hapticTrigger)('impactLight');
    }
  }, [isDropTarget, isDragging]);

  // App opening animation with perfect iOS timing
  useEffect(() => {
    if (isOpening) {
      // Apple's app launch: scale up while fading out
      scale.value = withTiming(1.3, { duration: 250 });
      opacity.value = withTiming(0, { duration: 200 });
    } else {
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [isOpening]);

  // Enhanced pan gesture with Apple's exact physics
  const panGesture = Gesture.Pan()
    .enabled(isEditMode)
    .minDistance(8) // Apple's drag threshold
    .onBegin(() => {
      'worklet';
      // Stop jiggling when dragging starts
      rotation.value = withTiming(0, { duration: 100 });
      
      // Apple's drag start: scale up with shadow
      scale.value = withSpring(1.15, { 
        damping: 12, 
        stiffness: 400,
        mass: 0.7
      });
      
      // Elevated shadow for depth
      shadowOpacity.value = withTiming(0.25, { duration: 150 });
      shadowRadius.value = withTiming(12, { duration: 150 });
      
      zIndex.value = 1000;
      opacity.value = withTiming(0.9, { duration: 100 });
      
      runOnJS(onDragStart)(item, index);
      runOnJS(hapticTrigger)('impactMedium');
    })
    .onUpdate((event) => {
      'worklet';
      // Smooth translation with slight resistance at edges
      const resistance = 0.98;
      translateX.value = event.translationX * resistance;
      translateY.value = event.translationY * resistance;
      
      runOnJS(onDragMove)(
        position.x + event.translationX,
        position.y + event.translationY
      );
    })
    .onEnd((event) => {
      'worklet';
      const finalX = position.x + event.translationX;
      const finalY = position.y + event.translationY;
      
      runOnJS(onDragEnd)(finalX, finalY);

      // Apple's drop animation: smooth spring back
      translateX.value = withSpring(0, { 
        damping: 20, 
        stiffness: 400,
        mass: 0.8
      });
      translateY.value = withSpring(0, { 
        damping: 20, 
        stiffness: 400,
        mass: 0.8
      });
      
      // Scale back to normal
      scale.value = withSpring(1, { 
        damping: 15, 
        stiffness: 350,
        mass: 0.8
      });
      
      // Remove shadow
      shadowOpacity.value = withTiming(0, { duration: 200 });
      shadowRadius.value = withTiming(0, { duration: 200 });
      
      opacity.value = withTiming(1, { duration: 150 });
      zIndex.value = 0;
      
      runOnJS(hapticTrigger)('impactLight');
    });

  // Enhanced long press with Apple's exact timing
  const longPressGesture = Gesture.LongPress()
    .minDuration(400) // Apple's exact long press duration
    .onStart(() => {
      'worklet';
      if (!isEditMode) {
        // Subtle scale feedback before entering edit mode
        scale.value = withSequence(
          withTiming(0.95, { duration: 100 }),
          withTiming(1, { duration: 100 })
        );
        runOnJS(onLongPress)();
        runOnJS(hapticTrigger)('impactMedium');
      }
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, longPressGesture);

  const animatedStyle = useAnimatedStyle(() => {
    // Enhanced shadow calculation for depth
    const shadowOffset = interpolate(
      shadowRadius.value,
      [0, 12],
      [2, 8],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: shadowOffset },
      shadowOpacity: shadowOpacity.value,
      shadowRadius: shadowRadius.value,
      elevation: shadowRadius.value, // Android shadow
    };
  });

  return (
    <GestureDetector gesture={combinedGesture}>
      <Pressable onPress={onPress} disabled={isEditMode}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {isDragging ? (
            <View style={styles.placeholder} />
          ) : (
            <>
              {isFolder ? (
                <IOSFolderIcon
                  id={item.id}
                  name={item.name}
                  apps={item.apps}
                  color={item.color}
                  isEditMode={isEditMode}
                  onPress={() => {}}
                  onLongPress={() => {}}
                  onDelete={onDelete}
                />
              ) : (
                <IOSAppIcon
                  id={item.id}
                  name={item.name}
                  url={item.url}
                  iconUrl={item.iconUrl}
                  isEditMode={isEditMode}
                  onPress={() => {}}
                  onLongPress={() => {}}
                  onDelete={onDelete}
                />
              )}
            </>
          )}
        </Animated.View>
      </Pressable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 148, // Support both regular apps (74) and folders (148)
    height: 148,
  },
  placeholder: {
    width: 60,
    height: 60,
    marginLeft: 7,
    marginTop: 7,
    borderRadius: 13.4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
});
