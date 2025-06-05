import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import * as Haptics from 'expo-haptics';

interface AppleButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export default function AppleButton({
  title,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  textStyle,
  hapticFeedback = true,
}: AppleButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (hapticFeedback && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: Apple.Animations.duration.micro,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      ...Apple.Animations.spring,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: Apple.Radius.standard,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    };
    
    let combinedStyle: ViewStyle = { ...baseStyle };

    // Apply variant styles
    switch (variant) {
      case 'primary':
        Object.assign(combinedStyle, {
          backgroundColor: Apple.Colors.systemBlue,
          shadowColor: Apple.Shadows.level1.shadowColor,
          shadowOffset: Apple.Shadows.level1.shadowOffset,
          shadowOpacity: Apple.Shadows.level1.shadowOpacity,
          shadowRadius: Apple.Shadows.level1.shadowRadius,
          elevation: Apple.Shadows.level1.elevation,
        });
        break;
      case 'secondary':
        Object.assign(combinedStyle, {
          backgroundColor: Apple.Colors.secondarySystemBackground,
          borderWidth: 0.5,
          borderColor: Apple.Colors.separator,
        });
        break;
      case 'tertiary':
        Object.assign(combinedStyle, {
          backgroundColor: 'transparent',
        });
        break;
      case 'destructive':
        Object.assign(combinedStyle, {
          backgroundColor: Apple.Colors.systemRed,
          shadowColor: Apple.Shadows.level1.shadowColor,
          shadowOffset: Apple.Shadows.level1.shadowOffset,
          shadowOpacity: Apple.Shadows.level1.shadowOpacity,
          shadowRadius: Apple.Shadows.level1.shadowRadius,
          elevation: Apple.Shadows.level1.elevation,
        });
        break;
    }

    // Apply size styles
    switch (size) {
      case 'small':
        Object.assign(combinedStyle, {
          height: 36,
          paddingHorizontal: Apple.Spacing.medium,
        });
        break;
      case 'medium':
        Object.assign(combinedStyle, {
          height: Apple.TouchTargets.comfortable,
          paddingHorizontal: Apple.Spacing.large,
        });
        break;
      case 'large':
        Object.assign(combinedStyle, {
          height: Apple.TouchTargets.large,
          paddingHorizontal: Apple.Spacing.xlarge,
        });
        break;
    }

    // Apply full width
    if (fullWidth) {
      combinedStyle.width = '100%';
    }

    // Apply disabled style
    if (disabled) {
      combinedStyle.opacity = 0.5;
    }

    // Apply custom style
    if (style) {
      Object.assign(combinedStyle, style);
    }

    return combinedStyle;
  };

  const getTextStyle = (): TextStyle => {
    let variantTextStyle: TextStyle = {};
    let sizeTextStyle: TextStyle = {};

    // Variant text styles
    switch (variant) {
      case 'primary':
      case 'destructive':
        variantTextStyle = {
          color: '#FFFFFF',
          fontWeight: '600',
        };
        break;
      case 'secondary':
        variantTextStyle = {
          color: Apple.Colors.label,
          fontWeight: '400',
        };
        break;
      case 'tertiary':
        variantTextStyle = {
          color: Apple.Colors.systemBlue,
          fontWeight: '400',
        };
        break;
    }

    // Size text styles
    switch (size) {
      case 'small':
        sizeTextStyle = {
          fontSize: Apple.Typography.callout.fontSize,
          lineHeight: Apple.Typography.callout.lineHeight,
        };
        break;
      case 'medium':
        sizeTextStyle = {
          fontSize: Apple.Typography.body.fontSize,
          lineHeight: Apple.Typography.body.lineHeight,
        };
        break;
      case 'large':
        sizeTextStyle = {
          fontSize: Apple.Typography.headline.fontSize,
          lineHeight: Apple.Typography.headline.lineHeight,
        };
        break;
    }

    return {
      ...variantTextStyle,
      ...sizeTextStyle,
      ...textStyle,
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'destructive' ? '#FFFFFF' : Apple.Colors.systemBlue}
          />
          <Text style={[getTextStyle(), { marginLeft: Apple.Spacing.small }]}>
            {title}
          </Text>
        </View>
      );
    }

    if (icon) {
      return (
        <View style={styles.contentContainer}>
          {iconPosition === 'left' && (
            <Text style={[styles.icon, { marginRight: Apple.Spacing.small }]}>
              {icon}
            </Text>
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {iconPosition === 'right' && (
            <Text style={[styles.icon, { marginLeft: Apple.Spacing.small }]}>
              {icon}
            </Text>
          )}
        </View>
      );
    }

    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {renderContent()}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Apple.Radius.standard,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 16,
  },
});
