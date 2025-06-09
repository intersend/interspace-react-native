import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Apple } from '@/constants/AppleDesign';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';
import { useProfiles } from '../../hooks/useProfiles';

interface IOSSearchScreenProps {
  visible: boolean;
  onClose: () => void;
  onAppSelect: (app: any) => void;
  onSearch: (query: string) => void;
}

const { width, height } = Dimensions.get('window');

// Siri suggestions and settings

// Mock settings
const SETTINGS_ITEMS = [
  { 
    id: '1', 
    title: 'Pro mode', 
    icon: 'bluetooth',
    hasToggle: true,
    isEnabled: true,
  },
  { 
    id: '2', 
    title: 'Custom Email Domain',
    subtitle: 'Apple Account → iCloud → Custom Email Domain',
    icon: 'mail',
    hasToggle: false,
  },
];

export function IOSSearchScreen({
  visible,
  onClose,
  onAppSelect,
  onSearch,
}: IOSSearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<{ id: string; query: string }[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const { activeProfile } = useProfiles();
  
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load suggestions and recent searches
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('recent_searches');
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {}

      if (activeProfile?.id) {
        try {
          const apps = await apiService.getApps(activeProfile.id);
          setSuggestions(
            apps.slice(0, 4).map(a => ({ id: a.id, name: a.name, icon: 'apps', color: 'rgba(120,120,128,0.3)' }))
          );
        } catch (err) {
          console.error('Failed to load suggestions:', err);
        }
      }
    };

    load();
  }, [activeProfile?.id]);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 350,
        mass: 0.8,
      });
      opacity.value = withTiming(1, { duration: 200 });
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      translateY.value = withSpring(height, {
        damping: 25,
        stiffness: 350,
        mass: 0.8,
      });
      opacity.value = withTiming(0, { duration: 200 });
      setSearchQuery('');
      Keyboard.dismiss();
    }
  }, [visible]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [
          { id: Date.now().toString(), query: searchQuery.trim() },
          ...prev.filter(s => s.query !== searchQuery.trim()).slice(0, 4),
        ];
        AsyncStorage.setItem('recent_searches', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleSwipeDown = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      onClose();
    }, 100);
  };

  const handleClearRecent = () => {
    hapticTrigger('impactLight');
    setRecentSearches([]);
    AsyncStorage.removeItem('recent_searches');
  };

  const handleToggle = (itemId: string) => {
    hapticTrigger('impactLight');
    // Handle toggle action
  };

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Background blur */}
      <Animated.View style={[StyleSheet.absoluteFillObject, backgroundStyle]}>
        <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      <Animated.View style={[styles.container, containerStyle]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Swipe down area */}
          <TouchableOpacity 
            style={styles.swipeDownArea} 
            onPress={handleSwipeDown}
            activeOpacity={1}
          >
            <View style={styles.handleBar} />
          </TouchableOpacity>

          <KeyboardAvoidingView 
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 100 : 100 }
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={true}
              onScrollBeginDrag={Keyboard.dismiss}
            >
              {/* Siri Suggestions */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Suggestions</Text>
                  <TouchableOpacity>
                    <Text style={styles.showMoreText}>Show More</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.suggestionsContainer}>
                  <View style={styles.suggestionsRow}>
                    {suggestions.map((app) => (
                      <TouchableOpacity
                        key={app.id}
                        style={styles.suggestionItem}
                        onPress={() => onAppSelect(app)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.suggestionIcon, { backgroundColor: app.color }]}>
                          <Ionicons name={app.icon as any} size={32} color="white" />
                        </View>
                        <Text style={styles.suggestionName}>{app.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Camera Quick Action */}
              <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
                <View style={styles.quickActionLeft}>
                  <Ionicons name="camera" size={24} color="white" style={styles.quickActionIcon} />
                  <Text style={styles.quickActionText}>Camera</Text>
                </View>
                <Ionicons name="camera" size={24} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Searches</Text>
                    <TouchableOpacity onPress={handleClearRecent}>
                      <Text style={styles.clearText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {recentSearches.map((search) => (
                    <TouchableOpacity
                      key={search.id}
                      style={styles.recentItem}
                      onPress={() => {
                        setSearchQuery(search.query);
                        handleSearch();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.recentText}>{search.query}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Settings Items */}
              <View style={styles.settingsSection}>
                {SETTINGS_ITEMS.map((item, index) => (
                  <View key={item.id}>
                    <TouchableOpacity
                      style={styles.settingItem}
                      onPress={() => !item.hasToggle && hapticTrigger('impactLight')}
                      activeOpacity={item.hasToggle ? 1 : 0.7}
                    >
                      <View style={styles.settingLeft}>
                        <View style={styles.settingIconContainer}>
                          <Ionicons name={item.icon as any} size={20} color="white" />
                        </View>
                        <View style={styles.settingTextContainer}>
                          <Text style={styles.settingTitle}>{item.title}</Text>
                          {item.subtitle && (
                            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                          )}
                        </View>
                      </View>
                      
                      {item.hasToggle && (
                        <Switch
                          value={item.isEnabled}
                          onValueChange={() => handleToggle(item.id)}
                          trackColor={{ false: 'rgba(120,120,128,0.32)', true: '#34C759' }}
                          thumbColor="white"
                          ios_backgroundColor="rgba(120,120,128,0.32)"
                        />
                      )}
                    </TouchableOpacity>
                    
                    {index < SETTINGS_ITEMS.length - 1 && <View style={styles.separator} />}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Search Bar */}
            <View style={[
              styles.searchBarContainer,
              { bottom: keyboardHeight > 0 ? keyboardHeight : 20 }
            ]}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28,28,30,0.95)',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  swipeDownArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.4,
  },
  showMoreText: {
    fontSize: 15,
    color: Apple.Colors.systemBlue,
    fontWeight: '400',
  },
  clearText: {
    fontSize: 15,
    color: Apple.Colors.systemBlue,
    fontWeight: '400',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(72,72,74,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  suggestionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  suggestionItem: {
    alignItems: 'center',
    flex: 1,
  },
  suggestionIcon: {
    width: 60,
    height: 60,
    borderRadius: 13.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 12,
    color: 'white',
    fontWeight: '400',
    letterSpacing: -0.08,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(72,72,74,0.3)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    marginRight: 12,
  },
  quickActionText: {
    fontSize: 17,
    color: 'white',
    fontWeight: '400',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  recentText: {
    fontSize: 17,
    color: 'white',
    fontWeight: '400',
  },
  settingsSection: {
    marginTop: 30,
    marginHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(120,120,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    color: 'white',
    fontWeight: '400',
  },
  settingSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  separator: {
    height: 0.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 40,
  },
  searchBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: 'rgba(28,28,30,0.95)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118,118,128,0.24)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: 'white',
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
});
