import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Apple } from '@/constants/AppleDesign';
import { Ionicons } from '@expo/vector-icons';

interface SearchWidgetProps {
  onPress: () => void;
}

const { width } = Dimensions.get('window');
const WIDGET_WIDTH = width - 32; // 16px padding on each side

export function SearchWidget({ onPress }: SearchWidgetProps) {
  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <View style={styles.content}>
          <View style={styles.searchBar}>
            <Ionicons 
              name="search" 
              size={16} 
              color={Apple.Colors.secondaryLabel} 
              style={styles.searchIcon}
            />
            <Text style={styles.placeholder}>Search or enter website</Text>
          </View>
          <View style={styles.suggestionRow}>
            <View style={styles.suggestion}>
              <View style={[styles.suggestionIcon, { backgroundColor: '#FF453A' }]}>
                <Text style={styles.suggestionInitial}>A</Text>
              </View>
              <Text style={styles.suggestionText}>Aave</Text>
            </View>
            <View style={styles.suggestion}>
              <View style={[styles.suggestionIcon, { backgroundColor: '#007AFF' }]}>
                <Text style={styles.suggestionInitial}>U</Text>
              </View>
              <Text style={styles.suggestionText}>Uniswap</Text>
            </View>
            <View style={styles.suggestion}>
              <View style={[styles.suggestionIcon, { backgroundColor: '#30D158' }]}>
                <Text style={styles.suggestionInitial}>J</Text>
              </View>
              <Text style={styles.suggestionText}>Jumper</Text>
            </View>
            <View style={styles.suggestion}>
              <View style={[styles.suggestionIcon, { backgroundColor: '#AF52DE' }]}>
                <Text style={styles.suggestionInitial}>H</Text>
              </View>
              <Text style={styles.suggestionText}>Hyperliquid</Text>
            </View>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDGET_WIDTH,
    height: 110,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: Apple.Radius.xlarge,
    overflow: 'hidden',
    ...Apple.Shadows.level3,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(28, 28, 30, 0.8)', // Fallback for blur
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchBar: {
    height: 36,
    backgroundColor: Apple.Colors.tertiarySystemBackground,
    borderRadius: Apple.Radius.standard,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  placeholder: {
    color: Apple.Colors.placeholderText,
    fontSize: Apple.Typography.subheadline.fontSize,
    fontWeight: Apple.Typography.subheadline.fontWeight,
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestion: {
    alignItems: 'center',
    flex: 1,
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  suggestionInitial: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  suggestionText: {
    color: Apple.Colors.secondaryLabel,
    fontSize: 10,
    fontWeight: Apple.Typography.caption2.fontWeight,
  },
});
