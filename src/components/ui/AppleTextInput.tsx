import React, { useState, useRef } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  TextInputProps,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import * as Haptics from 'expo-haptics';

interface AppleTextInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  success?: boolean;
  variant?: 'standard' | 'search' | 'secure';
  icon?: string;
  iconPosition?: 'left' | 'right';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export default function AppleTextInput({
  label,
  error,
  success = false,
  variant = 'standard',
  icon,
  iconPosition = 'left',
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  containerStyle,
  inputStyle,
  labelStyle,
  hapticFeedback = true,
  ...props
}: AppleTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e: any) => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setIsFocused(true);
    
    // Animate focus state
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
    ]).start();
    
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    
    // Animate blur state
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: 0,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
      Animated.timing(labelAnim, {
        toValue: hasValue ? 1 : 0,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnim, {
        toValue: 0,
        duration: Apple.Animations.duration.short,
        useNativeDriver: false,
      }),
    ]).start();
    
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    const newHasValue = !!text;
    if (newHasValue !== hasValue) {
      setHasValue(newHasValue);
      
      if (!isFocused) {
        Animated.timing(labelAnim, {
          toValue: newHasValue ? 1 : 0,
          duration: Apple.Animations.duration.short,
          useNativeDriver: false,
        }).start();
      }
    }
    
    onChangeText?.(text);
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: Apple.Spacing.medium,
    };

    return {
      ...baseStyle,
      ...containerStyle,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    let backgroundColor = Apple.Colors.tertiarySystemBackground;
    let borderColor = 'transparent';
    let borderWidth = 1;

    if (error) {
      backgroundColor = Apple.Colors.tertiarySystemBackground;
      borderColor = Apple.Colors.systemRed;
    } else if (success) {
      backgroundColor = Apple.Colors.tertiarySystemBackground;
      borderColor = Apple.Colors.systemGreen;
    } else if (isFocused) {
      backgroundColor = Apple.Colors.secondarySystemBackground;
      borderColor = Apple.Colors.systemBlue;
    }

    return {
      height: Apple.TouchTargets.minimum,
      backgroundColor,
      borderRadius: Apple.Radius.standard,
      borderWidth,
      borderColor,
      paddingHorizontal: Apple.Spacing.medium,
      flexDirection: 'row',
      alignItems: 'center',
    };
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      fontSize: Apple.Typography.body.fontSize,
      lineHeight: Apple.Typography.body.lineHeight,
      color: Apple.Colors.label,
      paddingVertical: Apple.Spacing.small,
    };

    if (variant === 'search') {
      baseStyle.textAlign = 'left';
    }

    return {
      ...baseStyle,
      ...inputStyle,
    };
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      position: 'absolute',
      left: Apple.Spacing.medium,
      fontSize: Apple.Typography.body.fontSize,
      color: Apple.Colors.secondaryLabel,
      backgroundColor: 'transparent',
    };

    return {
      ...baseStyle,
      ...labelStyle,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      fontSize: Apple.Typography.caption1.fontSize,
      lineHeight: Apple.Typography.caption1.lineHeight,
      color: Apple.Colors.systemRed,
      marginTop: Apple.Spacing.micro,
      marginLeft: Apple.Spacing.medium,
    };
  };

  const renderFloatingLabel = () => {
    if (!label) return null;

    const animatedStyle = {
      transform: [
        {
          translateY: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -32],
          }),
        },
        {
          scale: labelAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.85],
          }),
        },
      ],
      color: labelAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [Apple.Colors.placeholderText, isFocused ? Apple.Colors.systemBlue : Apple.Colors.secondaryLabel],
      }),
    };

    return (
      <Animated.Text style={[getLabelStyle(), animatedStyle]}>
        {label}
      </Animated.Text>
    );
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconStyle = {
      fontSize: 16,
      color: isFocused ? Apple.Colors.systemBlue : Apple.Colors.secondaryLabel,
      marginRight: iconPosition === 'left' ? Apple.Spacing.small : 0,
      marginLeft: iconPosition === 'right' ? Apple.Spacing.small : 0,
    };

    return <Text style={iconStyle}>{icon}</Text>;
  };

  return (
    <View style={getContainerStyle()}>
      <View style={{ position: 'relative' }}>
        {renderFloatingLabel()}
        <View style={getInputContainerStyle()}>
          {iconPosition === 'left' && renderIcon()}
          <TextInput
            style={getInputStyle()}
            placeholder={!label || (label && (isFocused || hasValue)) ? placeholder : undefined}
            placeholderTextColor={Apple.Colors.placeholderText}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            selectionColor={Apple.Colors.systemBlue}
            {...props}
          />
          {iconPosition === 'right' && renderIcon()}
        </View>
      </View>
      
      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles are handled dynamically for better customization
});
