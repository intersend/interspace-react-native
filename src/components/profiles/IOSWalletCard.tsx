import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import { SmartProfile, LinkedAccount } from '../../types';
import { Apple } from '@/constants/AppleDesign';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width - 40; // 20px padding on each side
const CARD_HEIGHT = 180; // Much shorter, like Apple's cards
const CARD_BORDER_RADIUS = 16;

interface IOSWalletCardProps {
  profile: SmartProfile;
  linkedAccounts: LinkedAccount[];
  isActive: boolean;
  onPress: () => void;
  index: number;
  totalCards: number;
  isExpanded: boolean;
  selectedIndex: number;
  expandAnimation: Animated.SharedValue<number>;
}

export const IOSWalletCard: React.FC<IOSWalletCardProps> = ({
  profile,
  linkedAccounts,
  isActive,
  onPress,
  index,
  totalCards,
  isExpanded,
  selectedIndex,
  expandAnimation,
}) => {
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(0);
  
  const handlePressIn = () => {
    isPressed.value = withSpring(1, { damping: 15, stiffness: 300 });
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };
  
  const handlePressOut = () => {
    isPressed.value = withSpring(0, { damping: 15, stiffness: 300 });
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };
  
  const handlePress = () => {
    hapticTrigger('impactLight');
    onPress();
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    // Stack positioning
    const CARD_SPACING = isExpanded ? 120 : 50; // Less dramatic spacing
    
    // Calculate Y position
    const baseY = index * CARD_SPACING;
    
    // Selected card moves up slightly
    const selectedOffset = isExpanded && index === selectedIndex ? -20 : 0;
    
    const translateY = interpolate(
      expandAnimation.value,
      [0, 1],
      [index * 50, baseY + selectedOffset],
      Extrapolate.CLAMP
    );
    
    // Scale for depth effect
    const cardScale = interpolate(
      expandAnimation.value,
      [0, 1],
      [1 - (index * 0.02), 1],
      Extrapolate.CLAMP
    );
    
    // Opacity for non-selected cards when expanded
    const opacity = isExpanded && index !== selectedIndex 
      ? withTiming(0.9, { duration: 200 }) 
      : withTiming(1, { duration: 200 });
    
    return {
      transform: [
        { translateY },
        { scale: scale.value * cardScale },
      ],
      zIndex: totalCards - index,
      opacity,
    };
  });
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(
        isPressed.value,
        [0, 1],
        [0.08, 0.12],
        Extrapolate.CLAMP
      ),
    };
  });
  
  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Main content */}
          <View style={styles.cardContent}>
            <View style={styles.mainInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              
              {linkedAccounts.length > 0 && (
                <Text style={styles.accountCount}>
                  {linkedAccounts.length} linked
                </Text>
              )}
            </View>
            
            {/* Active indicator */}
            {isActive && (
              <View style={styles.activeIndicator}>
                <Ionicons 
                  name="checkmark-circle" 
                  size={24} 
                  color={Apple.Colors.systemGreen} 
                />
              </View>
            )}
          </View>
          
          {/* Subtle bottom accent */}
          <View style={styles.bottomAccent} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  pressable: {
    width: '100%',
    height: '100%',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: CARD_BORDER_RADIUS,
    // Apple-style subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '600',
    color: Apple.Colors.label,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  accountCount: {
    fontSize: 16,
    fontWeight: '400',
    color: Apple.Colors.secondaryLabel,
  },
  activeIndicator: {
    marginLeft: 16,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: Apple.Colors.systemBlue,
    opacity: 0.1,
  },
});

export default IOSWalletCard;
