import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

interface IOSSearchWidgetProps {
  onPress: () => void;
}

const { width } = Dimensions.get('window');

export function IOSSearchWidget({ onPress }: IOSSearchWidgetProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.15);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 20,
      stiffness: 400,
    });
    shadowOpacity.value = withTiming(0.08, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 350,
    });
    shadowOpacity.value = withTiming(0.15, { duration: 100 });
  };

  const handlePress = () => {
    hapticTrigger('impactLight');
    onPress();
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.shadowContainer, shadowStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.searchBar, animatedStyle]}>
            <Ionicons 
              name="search" 
              size={16} 
              color="rgba(60, 60, 67, 0.6)" 
              style={styles.searchIcon}
            />
            <Text style={styles.placeholder}>Search</Text>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchBar: {
    height: 36,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  placeholder: {
    fontSize: 17,
    color: 'rgba(60, 60, 67, 0.3)',
    fontWeight: '400',
    letterSpacing: -0.4,
  },
});
