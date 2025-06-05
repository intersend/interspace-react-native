import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { Colors, SpaceTokens } from '../../../constants/Colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  gradient: string[];
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to\nInterspace',
    subtitle: 'Your Web3 Wallet Wrapper',
    description: 'Bring your existing wallets and accounts into one seamless experience for using Web3 apps.',
    icon: '🚀',
    gradient: ['#000000', '#0F0F23', '#1A1A3A'],
  },
  {
    id: '2',
    title: 'Smart Profiles',
    subtitle: 'Organize Your Crypto Identity',
    description: 'Group your wallets into contexts like Trading, Gaming, or Payments. Each profile gets its own session wallet.',
    icon: '👤',
    gradient: ['#0F0F23', '#1A1A3A', '#2D2D5A'],
  },
  {
    id: '3',
    title: 'Seamless Apps',
    subtitle: 'iPhone-Style Web3 Experience',
    description: 'Browse and organize Web3 apps like your iPhone home screen. Create folders, rearrange, and launch with one tap.',
    icon: '📱',
    gradient: ['#1A1A3A', '#2D2D5A', '#4A4AFF'],
  },
  {
    id: '4',
    title: 'Ready to Start?',
    subtitle: 'Connect Your First Wallet',
    description: 'Connect your existing wallet or create a new account to begin your Web3 journey with Interspace.',
    icon: '✨',
    gradient: ['#2D2D5A', '#4A4AFF', '#007AFF'],
  },
];

interface OnboardingSliderProps {
  onComplete: () => void;
}

export default function OnboardingSlider({ onComplete }: OnboardingSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      // Animate out and complete
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({
        x: prevIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(prevIndex);
    }
  };

  const renderSlide = (slide: OnboardingSlide, index: number) => (
    <View key={slide.id} style={styles.slide}>
      <View style={styles.slideContent}>
        {/* Icon with cosmic glow */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconGlow, { backgroundColor: Colors.dark.cosmicGlow }]} />
          <Text style={styles.slideIcon}>{slide.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {ONBOARDING_SLIDES.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            {
              backgroundColor: index === currentIndex 
                ? Colors.dark.tint 
                : Colors.dark.textTertiary,
              width: index === currentIndex ? 24 : 8,
            }
          ]}
        />
      ))}
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header with skip button */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          {currentIndex < ONBOARDING_SLIDES.length - 1 && (
            <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {ONBOARDING_SLIDES.map(renderSlide)}
        </ScrollView>

        {/* Pagination */}
        {renderPagination()}

        {/* Navigation buttons */}
        <View style={styles.navigation}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={goToPrevious} style={styles.navButton}>
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.navSpacer} />
          
          <TouchableOpacity onPress={goToNext} style={[styles.navButton, styles.nextButton]}>
            <Text style={[styles.navButtonText, styles.nextButtonText]}>
              {currentIndex === ONBOARDING_SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingVertical: SpaceTokens.spacing.md,
    height: 60,
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    paddingHorizontal: SpaceTokens.spacing.md,
    paddingVertical: SpaceTokens.spacing.sm,
  },
  skipText: {
    color: Colors.dark.textSecondary,
    fontSize: SpaceTokens.fontSize.md,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SpaceTokens.spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SpaceTokens.spacing.xxl,
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  slideIcon: {
    fontSize: 80,
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  slideTitle: {
    fontSize: SpaceTokens.fontSize.largeTitle,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: SpaceTokens.spacing.sm,
    lineHeight: 40,
  },
  slideSubtitle: {
    fontSize: SpaceTokens.fontSize.title3,
    fontWeight: '600',
    color: Colors.dark.tint,
    textAlign: 'center',
    marginBottom: SpaceTokens.spacing.lg,
  },
  slideDescription: {
    fontSize: SpaceTokens.fontSize.lg,
    fontWeight: '400',
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SpaceTokens.spacing.xl,
    gap: SpaceTokens.spacing.sm,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingBottom: SpaceTokens.spacing.xl,
  },
  navSpacer: {
    flex: 1,
  },
  navButton: {
    paddingHorizontal: SpaceTokens.spacing.lg,
    paddingVertical: SpaceTokens.spacing.md,
    borderRadius: SpaceTokens.borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: Colors.dark.tint,
  },
  navButtonText: {
    fontSize: SpaceTokens.fontSize.md,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  nextButtonText: {
    color: Colors.dark.textInverted,
  },
});
