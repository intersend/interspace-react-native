import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  withSequence,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  State,
} from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

const { width, height } = Dimensions.get('window');
const SWIPE_THRESHOLD = height * 0.2;

interface SafariBrowserProps {
  visible: boolean;
  initialUrl?: string;
  onClose: () => void;
}

export function SafariBrowser({ visible, initialUrl, onClose }: SafariBrowserProps) {
  const [url, setUrl] = useState(initialUrl || '');
  const [inputUrl, setInputUrl] = useState(initialUrl || '');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlBar, setShowUrlBar] = useState(true);
  const webViewRef = useRef<WebView>(null);
  
  const translateY = useSharedValue(height);
  const gestureTranslateY = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const borderRadius = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      hapticTrigger('impactLight');
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 400,
        mass: 0.8,
      });
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 350,
      });
      opacity.value = withTiming(1, { duration: 250 });
      borderRadius.value = withTiming(0, { duration: 300 });
    } else {
      translateY.value = withSpring(height, {
        damping: 25,
        stiffness: 400,
      });
      scale.value = withTiming(0.9, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      borderRadius.value = withTiming(40, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const totalTranslateY = translateY.value + gestureTranslateY.value;
    return {
      transform: [
        { translateY: totalTranslateY },
        { scale: scale.value },
      ],
      opacity: opacity.value,
      borderTopLeftRadius: borderRadius.value,
      borderTopRightRadius: borderRadius.value,
    };
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      gestureTranslateY.value,
      [0, SWIPE_THRESHOLD],
      [1, 0]
    );
    return {
      opacity: progress * opacity.value,
    };
  });

  const gestureHandler = useAnimatedGestureHandler({
    onStart: () => {
      'worklet';
    },
    onActive: (event) => {
      'worklet';
      if (event.translationY > 0) {
        gestureTranslateY.value = event.translationY;
        scale.value = interpolate(
          event.translationY,
          [0, SWIPE_THRESHOLD],
          [1, 0.95]
        );
        borderRadius.value = interpolate(
          event.translationY,
          [0, SWIPE_THRESHOLD],
          [0, 20]
        );
      }
    },
    onEnd: (event) => {
      'worklet';
      if (event.translationY > SWIPE_THRESHOLD) {
        translateY.value = withTiming(height, { duration: 300 });
        runOnJS(onClose)();
        runOnJS(hapticTrigger)('impactLight');
      } else {
        gestureTranslateY.value = withSpring(0, {
          damping: 20,
          stiffness: 400,
        });
        scale.value = withSpring(1, {
          damping: 20,
          stiffness: 400,
        });
        borderRadius.value = withSpring(0, {
          damping: 20,
          stiffness: 400,
        });
      }
    },
  });

  const handleNavigate = () => {
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    setUrl(finalUrl);
  };

  const handleGoBack = () => {
    webViewRef.current?.goBack();
  };

  const handleGoForward = () => {
    webViewRef.current?.goForward();
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  const handleShare = () => {
    // Implement share functionality
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Background blur */}
        <Animated.View style={[styles.backgroundBlur, backgroundStyle]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
        
        <PanGestureHandler onGestureEvent={gestureHandler}>
          <Animated.View style={[styles.browserContainer, animatedStyle]}>
            <SafeAreaView style={styles.safeArea}>
              {/* Drag indicator */}
              <View style={styles.dragIndicatorContainer}>
                <View style={styles.dragIndicator} />
              </View>
              
              {/* Top Bar */}
              <BlurView intensity={80} tint="dark" style={styles.topBarBlur}>
                <View style={styles.topBar}>
                  <TouchableOpacity onPress={onClose} style={styles.doneButton}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {isLoading ? 'Loading...' : url}
                </Text>
              </View>
                  <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                    <Ionicons name="share-outline" size={22} color={Apple.Colors.systemBlue} />
                  </TouchableOpacity>
                </View>
              </BlurView>

            {/* WebView */}
            <View style={styles.webViewContainer}>
              {url ? (
                <WebView
                  ref={webViewRef}
                  source={{ uri: url }}
                  style={styles.webView}
                  onNavigationStateChange={(navState: any) => {
                    setCanGoBack(navState.canGoBack);
                    setCanGoForward(navState.canGoForward);
                    setIsLoading(navState.loading);
                    setUrl(navState.url);
                    setInputUrl(navState.url);
                  }}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadEnd={() => setIsLoading(false)}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Enter a URL to get started</Text>
                </View>
              )}
            </View>

            {/* Bottom Navigation Bar */}
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.bottomBarContainer}
            >
              <View style={styles.bottomBar}>
                {/* Navigation Controls */}
                <View style={styles.navControls}>
                  <TouchableOpacity
                    onPress={handleGoBack}
                    disabled={!canGoBack}
                    style={styles.navButton}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={28}
                      color={canGoBack ? Apple.Colors.systemBlue : Apple.Colors.quaternaryLabel}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleGoForward}
                    disabled={!canGoForward}
                    style={styles.navButton}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={28}
                      color={canGoForward ? Apple.Colors.systemBlue : Apple.Colors.quaternaryLabel}
                    />
                  </TouchableOpacity>
                </View>

                {/* URL Bar */}
                <View style={styles.urlBarContainer}>
                  <View style={styles.urlBar}>
                    <Ionicons
                      name="lock-closed"
                      size={12}
                      color={Apple.Colors.secondaryLabel}
                      style={styles.lockIcon}
                    />
                    <TextInput
                      style={styles.urlInput}
                      value={inputUrl}
                      onChangeText={setInputUrl}
                      onSubmitEditing={handleNavigate}
                      placeholder="Search or enter website"
                      placeholderTextColor={Apple.Colors.placeholderText}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      selectTextOnFocus
                    />
                    <TouchableOpacity onPress={handleReload} style={styles.reloadButton}>
                      <Ionicons
                        name="reload"
                        size={16}
                        color={Apple.Colors.secondaryLabel}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="book-outline" size={22} color={Apple.Colors.systemBlue} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="apps" size={22} color={Apple.Colors.systemBlue} />
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>
          </Animated.View>
        </PanGestureHandler>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  browserContainer: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  topBarBlur: {
    borderBottomWidth: 0.5,
    borderBottomColor: Apple.Colors.separator,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Apple.Spacing.medium,
    paddingVertical: Apple.Spacing.small,
    borderBottomWidth: 0.5,
    borderBottomColor: Apple.Colors.separator,
  },
  doneButton: {
    paddingVertical: Apple.Spacing.small,
    paddingRight: Apple.Spacing.medium,
  },
  doneText: {
    fontSize: Apple.Typography.headline.fontSize,
    fontWeight: Apple.Typography.headline.fontWeight,
    color: Apple.Colors.systemBlue,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: Apple.Typography.footnote.fontSize,
    fontWeight: Apple.Typography.footnote.fontWeight,
    color: Apple.Colors.secondaryLabel,
  },
  shareButton: {
    paddingVertical: Apple.Spacing.small,
    paddingLeft: Apple.Spacing.medium,
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: Apple.Typography.headline.fontSize,
    color: Apple.Colors.secondaryLabel,
  },
  bottomBarContainer: {
    borderTopWidth: 0.5,
    borderTopColor: Apple.Colors.separator,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Apple.Spacing.small,
    paddingVertical: Apple.Spacing.small,
    backgroundColor: Apple.Colors.secondarySystemBackground,
  },
  navControls: {
    flexDirection: 'row',
  },
  navButton: {
    paddingHorizontal: Apple.Spacing.small,
  },
  urlBarContainer: {
    flex: 1,
    paddingHorizontal: Apple.Spacing.small,
  },
  urlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Apple.Colors.tertiarySystemBackground,
    borderRadius: Apple.Radius.standard,
    paddingHorizontal: Apple.Spacing.small,
    height: 32,
  },
  lockIcon: {
    marginRight: Apple.Spacing.micro,
  },
  urlInput: {
    flex: 1,
    fontSize: Apple.Typography.footnote.fontSize,
    color: Apple.Colors.label,
    paddingVertical: 0,
  },
  reloadButton: {
    padding: Apple.Spacing.micro,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingHorizontal: Apple.Spacing.small,
  },
});
