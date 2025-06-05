import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Apple } from '../../../constants/AppleDesign';
import AppleButton from '../ui/AppleButton';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  features?: string[];
  action?: {
    primary: string;
    secondary?: string;
  };
}

const APPLE_ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to\nInterspace',
    subtitle: 'Your Web3 Universe',
    description: 'Experience the future of crypto with intelligent session wallets that make Web3 as simple as your iPhone.',
    icon: '🌌',
    features: [
      'Session wallets handle transactions seamlessly',
      'Connect all your existing wallets',
      'iPhone-style app organization'
    ],
    action: {
      primary: 'Continue',
    }
  },
  {
    id: 'profiles',
    title: 'Smart Profiles',
    subtitle: 'Organize Your Crypto Life',
    description: 'Create profiles for different activities—Trading, Gaming, DeFi. Each gets its own secure session wallet.',
    icon: '👤',
    features: [
      'Automatic session wallet creation',
      'Context-based organization',
      'Seamless account switching'
    ],
    action: {
      primary: 'Continue',
    }
  },
  {
    id: 'apps',
    title: 'iPhone-Style Apps',
    subtitle: 'Web3 Made Familiar',
    description: 'Organize Web3 apps just like your iPhone. Create folders, rearrange, and launch with one tap.',
    icon: '📱',
    features: [
      'Drag and drop organization',
      'Folder creation and management',
      'One-tap app launching'
    ],
    action: {
      primary: 'Continue',
    }
  },
  {
    id: 'ready',
    title: 'Ready to Explore?',
    subtitle: 'Choose Your Journey',
    description: 'Start exploring immediately or connect your wallet for the full Interspace experience.',
    icon: '✨',
    action: {
      primary: 'Start Exploring',
      secondary: 'Connect Wallet',
    }
  },
];

interface AppleOnboardingProps {
  onComplete: (path: 'guest' | 'wallet' | 'sign-in') => void;
}

export default function AppleOnboarding({ onComplete }: AppleOnboardingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Animated values for each slide element
  const iconAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const descriptionAnim = useRef(new Animated.Value(0)).current;
  const featuresAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animation
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: Apple.Animations.duration.long,
        useNativeDriver: true,
      }),
      Animated.stagger(Apple.Animations.duration.micro, [
        Animated.spring(iconAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
        Animated.spring(titleAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
        Animated.spring(subtitleAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
        Animated.spring(descriptionAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
        Animated.spring(featuresAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
        Animated.spring(buttonsAnim, {
          toValue: 1,
          ...Apple.Animations.spring,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [currentIndex]);

  const resetAnimations = () => {
    iconAnim.setValue(0);
    titleAnim.setValue(0);
    subtitleAnim.setValue(0);
    descriptionAnim.setValue(0);
    featuresAnim.setValue(0);
    buttonsAnim.setValue(0);
  };

  const handleNext = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (currentIndex < APPLE_ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      
      // Slide out current content
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: Apple.Animations.duration.medium,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(nextIndex);
        slideAnim.setValue(SCREEN_WIDTH);
        resetAnimations();
        
        // Slide in new content
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: Apple.Animations.duration.medium,
          useNativeDriver: true,
        }).start(() => {
          // Animate in elements
          animateSlideElements();
        });
      });
    }
  };

  const handleBack = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      
      // Slide out current content
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: Apple.Animations.duration.medium,
        useNativeDriver: true,
      }).start(() => {
        setCurrentIndex(prevIndex);
        slideAnim.setValue(-SCREEN_WIDTH);
        resetAnimations();
        
        // Slide in new content
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: Apple.Animations.duration.medium,
          useNativeDriver: true,
        }).start(() => {
          // Animate in elements
          animateSlideElements();
        });
      });
    }
  };

  const animateSlideElements = () => {
    Animated.stagger(Apple.Animations.duration.micro, [
      Animated.spring(iconAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
      Animated.spring(titleAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
      Animated.spring(subtitleAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
      Animated.spring(descriptionAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
      Animated.spring(featuresAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
      Animated.spring(buttonsAnim, {
        toValue: 1,
        ...Apple.Animations.spring,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePrimaryAction = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const currentSlide = APPLE_ONBOARDING_SLIDES[currentIndex];
    
    if (currentSlide.id === 'ready') {
      // Final slide - start exploring as guest
      onComplete('guest');
    } else {
      // Continue to next slide
      handleNext();
    }
  };

  const handleSecondaryAction = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Connect wallet option
    onComplete('wallet');
  };

  const handleSkip = () => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Skip to sign in
    onComplete('sign-in');
  };

  const currentSlide = APPLE_ONBOARDING_SLIDES[currentIndex];
  const isLastSlide = currentIndex === APPLE_ONBOARDING_SLIDES.length - 1;
  const hapticFeedback = true;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={Apple.Colors.systemBackground} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          {currentIndex > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerSpacer} />
          {!isLastSlide && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {APPLE_ONBOARDING_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentIndex 
                    ? Apple.Colors.systemBlue 
                    : Apple.Colors.systemGray5,
                  width: index === currentIndex ? 24 : 8,
                }
              ]}
            />
          ))}
        </View>

        {/* Content */}
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          {/* Icon */}
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                opacity: iconAnim,
                transform: [
                  {
                    scale: iconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              }
            ]}
          >
            <View style={styles.iconGlow} />
            <Text style={styles.icon}>{currentSlide.icon}</Text>
          </Animated.View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Animated.Text 
              style={[
                styles.title,
                {
                  opacity: titleAnim,
                  transform: [
                    {
                      translateY: titleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              {currentSlide.title}
            </Animated.Text>

            <Animated.Text 
              style={[
                styles.subtitle,
                {
                  opacity: subtitleAnim,
                  transform: [
                    {
                      translateY: subtitleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              {currentSlide.subtitle}
            </Animated.Text>

            <Animated.Text 
              style={[
                styles.description,
                {
                  opacity: descriptionAnim,
                  transform: [
                    {
                      translateY: descriptionAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }
              ]}
            >
              {currentSlide.description}
            </Animated.Text>

            {/* Features List */}
            {currentSlide.features && (
              <Animated.View 
                style={[
                  styles.featuresContainer,
                  {
                    opacity: featuresAnim,
                    transform: [
                      {
                        translateY: featuresAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  }
                ]}
              >
                {currentSlide.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Text style={styles.featureCheck}>✓</Text>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View 
          style={[
            styles.actions,
            {
              opacity: buttonsAnim,
              transform: [
                {
                  translateY: buttonsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <AppleButton
            title={currentSlide.action?.primary || 'Continue'}
            variant="primary"
            size="large"
            fullWidth
            onPress={handlePrimaryAction}
            style={styles.primaryButton}
          />
          
          {currentSlide.action?.secondary && (
            <AppleButton
              title={currentSlide.action.secondary}
              variant="secondary"
              size="large"
              fullWidth
              onPress={handleSecondaryAction}
              style={styles.secondaryButton}
            />
          )}
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Apple.Spacing.large,
    paddingVertical: Apple.Spacing.medium,
    height: 60,
  },
  backButton: {
    width: Apple.TouchTargets.minimum,
    height: Apple.TouchTargets.minimum,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: Apple.Colors.systemBlue,
    fontWeight: '300',
  },
  headerSpacer: {
    flex: 1,
  },
  skipButton: {
    paddingHorizontal: Apple.Spacing.medium,
    paddingVertical: Apple.Spacing.small,
  },
  skipText: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: '400',
    color: Apple.Colors.systemBlue,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Apple.Spacing.medium,
    gap: Apple.Spacing.small,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Apple.Colors.systemGray5,
  },
  content: {
    flex: 1,
    paddingHorizontal: Apple.Spacing.xlarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Apple.Spacing.xxxlarge,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Apple.Colors.systemBlue,
    opacity: 0.1,
  },
  icon: {
    fontSize: 90,
    textAlign: 'center',
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 340,
  },
  title: {
    fontSize: Apple.Typography.largeTitle.fontSize,
    fontWeight: Apple.Typography.largeTitle.fontWeight,
    lineHeight: Apple.Typography.largeTitle.lineHeight,
    color: Apple.Colors.label,
    textAlign: 'center',
    marginBottom: Apple.Spacing.small,
  },
  subtitle: {
    fontSize: Apple.Typography.title3.fontSize,
    fontWeight: Apple.Typography.title3.fontWeight,
    lineHeight: Apple.Typography.title3.lineHeight,
    color: Apple.Colors.systemBlue,
    textAlign: 'center',
    marginBottom: Apple.Spacing.large,
  },
  description: {
    fontSize: Apple.Typography.body.fontSize,
    fontWeight: Apple.Typography.body.fontWeight,
    lineHeight: 24,
    color: Apple.Colors.secondaryLabel,
    textAlign: 'center',
    marginBottom: Apple.Spacing.xlarge,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: Apple.Spacing.xlarge,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Apple.Spacing.small,
  },
  featureCheck: {
    fontSize: 16,
    color: Apple.Colors.systemGreen,
    marginRight: Apple.Spacing.medium,
    fontWeight: '600',
  },
  featureText: {
    fontSize: Apple.Typography.callout.fontSize,
    fontWeight: Apple.Typography.callout.fontWeight,
    color: Apple.Colors.label,
    flex: 1,
  },
  actions: {
    paddingHorizontal: Apple.Spacing.xlarge,
    paddingBottom: Apple.Spacing.xlarge,
    gap: Apple.Spacing.medium,
  },
  primaryButton: {
    marginBottom: Apple.Spacing.small,
  },
  secondaryButton: {
    // Additional styling if needed
  },
});
