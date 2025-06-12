import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors } from '../../../constants/Colors';

export interface AuthMethodButtonProps {
  title: string;
  icon: string;
  description: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dev';
  disabled?: boolean; // Added disabled prop
}

export default function AuthMethodButton({ 
  title, 
  icon, 
  description, 
  onPress, 
  variant = 'primary',
  disabled = false, // Default to false
}: AuthMethodButtonProps) {
  return (
    <View 
      style={[
        styles.methodButton, 
        variant === 'secondary' && styles.methodButtonSecondary,
        variant === 'dev' && styles.methodButtonDev,
        disabled && styles.methodButtonDisabled, // Apply disabled style
      ]}
      onTouchEnd={disabled ? undefined : onPress} // Disable touch if disabled
    >
      <View style={styles.methodButtonContent}>
        <Text style={styles.methodIcon}>{icon}</Text>
        <View style={styles.methodTextContainer}>
          <Text style={[
            styles.methodTitle,
            variant === 'secondary' && styles.methodTitleSecondary,
            variant === 'dev' && styles.methodTitleDev,
            disabled && styles.methodTitleDisabled, // Apply disabled style
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.methodDescription,
            variant === 'secondary' && styles.methodDescriptionSecondary,
            variant === 'dev' && styles.methodDescriptionDev,
            disabled && styles.methodDescriptionDisabled, // Apply disabled style
          ]}>
            {description}
          </Text>
        </View>
      </View>
      {disabled && (
        <View style={styles.disabledOverlay}>
          <ActivityIndicator size="small" color={Colors.dark.tint} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  methodButton: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'relative', // Needed for overlay
  },
  methodButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  methodButtonDev: {
    backgroundColor: '#FF6B35',
    borderColor: '#FFD700',
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.9,
  },
  methodButtonDisabled: {
    opacity: 0.6, // Reduce opacity when disabled
  },
  methodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  methodTitleSecondary: {
    color: Colors.dark.subtext,
  },
  methodTitleDev: {
    color: '#FFFFFF',
  },
  methodTitleDisabled: {
    color: Colors.dark.subtext, // Dim text when disabled
  },
  methodDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
    lineHeight: 18,
  },
  methodDescriptionSecondary: {
    color: Colors.dark.subtext,
  },
  methodDescriptionDev: {
    color: '#FFE4B5',
  },
  methodDescriptionDisabled: {
    color: Colors.dark.subtext, // Dim text when disabled
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});