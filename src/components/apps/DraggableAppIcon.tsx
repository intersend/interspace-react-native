import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
  useAnimatedGestureHandler,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler';
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
}: DraggableAppIconProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const longPressRef = useRef<LongPressGestureHandler>(null);
  const panRef = useRef<PanGestureHandler>(null);

  // Handle drop target animation
  React.useEffect(() => {
    if (isDropTarget && !isDragging) {
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
    }
  }, [isDropTarget]);

  const handleLongPress = () => {
    if (!isEditMode) {
      onLongPress();
    }
  };

  const panHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
      if (isEditMode) {
        scale.value = withSpring(1.1, {
          damping: 15,
          stiffness: 400,
        });
        zIndex.value = 1000;
        opacity.value = withTiming(0.8, { duration: 150 });
        runOnJS(onDragStart)(item, index);
        runOnJS(hapticTrigger)('impactMedium');
      }
    },
    onActive: (event) => {
      'worklet';
      if (isEditMode) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        runOnJS(onDragMove)(
          position.x + event.translationX,
          position.y + event.translationY
        );
      }
    },
    onEnd: (event) => {
      'worklet';
      if (isEditMode) {
        const finalX = position.x + event.translationX;
        const finalY = position.y + event.translationY;
        
        runOnJS(onDragEnd)(finalX, finalY);
        
        // Animate back to original position
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 400,
        });
        translateY.value = withSpring(0, {
          damping: 20,
          stiffness: 400,
        });
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 400,
        });
        opacity.value = withTiming(1, { duration: 150 });
        zIndex.value = 0;
        
        runOnJS(hapticTrigger)('impactLight');
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      zIndex: zIndex.value,
    };
  });

  return (
    <LongPressGestureHandler
      ref={longPressRef}
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
          handleLongPress();
        }
      }}
      minDurationMs={400}
      simultaneousHandlers={panRef}
    >
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={panHandler}
        simultaneousHandlers={longPressRef}
        waitFor={longPressRef}
        enabled={isEditMode}
      >
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
      </PanGestureHandler>
    </LongPressGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 74,
    height: 74,
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
