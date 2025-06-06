import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';


const { height } = Dimensions.get('window');
const TRAY_HEIGHT = height * 0.5;
const SWIPE_THRESHOLD = 100;

interface AppleBottomTrayProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function AppleBottomTray({ visible, onClose, children }: AppleBottomTrayProps) {
  const translateY = useRef(new Animated.Value(TRAY_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > SWIPE_THRESHOLD) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 25, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: TRAY_HEIGHT, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: TRAY_HEIGHT, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View style={[styles.container, { transform: [{ translateY }] }]} {...panResponder.panHandlers}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Apple.Colors.systemBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: TRAY_HEIGHT,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Apple.Colors.systemGray4,
    alignSelf: 'center',
    marginVertical: 8,
  },
});
