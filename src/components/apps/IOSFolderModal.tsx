import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableWithoutFeedback,
  Dimensions,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
  useAnimatedScrollHandler,
  Extrapolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { IOSAppIcon } from './IOSAppIcon';
import { hapticTrigger } from '@/src/utils/hapticFeedback';

const { width, height } = Dimensions.get('window');
// Folder size tuned to better match iOS folder popover
const FOLDER_WIDTH = width - 60;
const FOLDER_HEIGHT = Math.min(360, height * 0.65);
const ICONS_PER_ROW = 3;
const ROWS_PER_PAGE = 3;
const ICONS_PER_PAGE = ICONS_PER_ROW * ROWS_PER_PAGE;
const ICON_SIZE = 74;
const ICON_SPACING = 25;

interface App {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  position: number;
  folderId?: string;
}

interface IOSFolderModalProps {
  visible: boolean;
  folderName: string;
  apps: App[];
  onClose: () => void;
  onAppPress: (app: App) => void;
  onRename?: (newName: string) => void;
  sourcePosition?: { x: number; y: number };
}

export function IOSFolderModal({
  visible,
  folderName,
  apps,
  onClose,
  onAppPress,
  onRename,
  sourcePosition = { x: width / 2, y: height / 2 },
}: IOSFolderModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(folderName);
  const [currentPage, setCurrentPage] = React.useState(0);
  const totalPages = Math.max(1, Math.ceil(apps.length / ICONS_PER_PAGE));

  useEffect(() => {
    if (visible) {
      // Calculate initial position based on source
      const centerX = width / 2;
      const centerY = height / 2;
      translateX.value = sourcePosition.x - centerX;
      translateY.value = sourcePosition.y - centerY;

      // Animate in
      hapticTrigger('impactLight');
      scale.value = withSpring(1, {
        damping: 20,
        stiffness: 350,
        overshootClamping: false,
      });
      opacity.value = withTiming(1, { duration: 200 });
      backgroundOpacity.value = withTiming(1, { duration: 250 });
      translateX.value = withSpring(0, {
        damping: 20,
        stiffness: 350,
      });
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 350,
      });
    } else {
      // Animate out
      scale.value = withTiming(0.1, { duration: 200 });
      opacity.value = withTiming(0, { duration: 150 });
      backgroundOpacity.value = withTiming(0, { duration: 200 });
      translateX.value = withTiming(sourcePosition.x - width / 2, { duration: 200 });
      translateY.value = withTiming(sourcePosition.y - height / 2, { duration: 200 });
    }
  }, [visible]);

  const folderAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
      opacity: opacity.value,
    };
  });

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: backgroundOpacity.value,
    };
  });

  const handleBackgroundPress = () => {
    hapticTrigger('impactLight');
    onClose();
  };

  const handleNameSubmit = () => {
    if (onRename && editedName !== folderName) {
      onRename(editedName);
    }
    setIsEditing(false);
  };

  const renderApps = (page: number) => {
    const startIndex = page * ICONS_PER_PAGE;
    const pageApps = apps.slice(startIndex, startIndex + ICONS_PER_PAGE);
    const rows = [];
    for (let i = 0; i < ROWS_PER_PAGE; i++) {
      const rowApps = pageApps.slice(i * ICONS_PER_ROW, (i + 1) * ICONS_PER_ROW);
      rows.push(
        <View key={`row-${i}`} style={styles.appRow}>
          {rowApps.map((app) => (
            <IOSAppIcon
              key={app.id}
              id={app.id}
              name={app.name}
              url={app.url}
              iconUrl={app.iconUrl}
              isEditMode={false}
              onPress={() => onAppPress(app)}
              onLongPress={() => {}}
              onDelete={() => {}}
            />
          ))}
          {/* Fill empty slots */}
          {Array.from({ length: ICONS_PER_ROW - rowApps.length }).map((_, index) => (
            <View key={`empty-${i}-${index}`} style={styles.emptySlot} />
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.container}>
          {/* Background blur */}
          <Animated.View style={[styles.backgroundBlur, backgroundAnimatedStyle]}>
            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFillObject}>
              <View style={styles.backgroundOverlay} />
            </BlurView>
          </Animated.View>

          {/* Folder content */}
          <Animated.View style={[styles.folderContainer, folderAnimatedStyle]}>
            <TouchableWithoutFeedback>
              <View>
                <BlurView intensity={70} tint="dark" style={styles.folderBlur}>
                  <LinearGradient
                    colors={['rgba(55,55,60,0.95)', 'rgba(55,55,60,0.9)']}
                    style={styles.folderGradient}
                  >
                    {/* Folder header */}
                    <View style={styles.header}>
                      {isEditing ? (
                        <TextInput
                          style={styles.folderNameInput}
                          value={editedName}
                          onChangeText={setEditedName}
                          onSubmitEditing={handleNameSubmit}
                          onBlur={handleNameSubmit}
                          autoFocus
                          selectTextOnFocus
                          returnKeyType="done"
                        />
                      ) : (
                        <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
                          <Text style={styles.folderName}>{folderName}</Text>
                        </TouchableWithoutFeedback>
                      )}
                    </View>

                    {/* Apps grid */}
                    <ScrollView
                      style={styles.appsContainer}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={(e) =>
                        setCurrentPage(
                          Math.round(e.nativeEvent.contentOffset.x / FOLDER_WIDTH),
                        )
                      }
                    >
                      {Array.from({ length: totalPages }).map((_, pageIndex) => (
                        <View key={`page-${pageIndex}`} style={{ width: FOLDER_WIDTH }}>
                          {renderApps(pageIndex)}
                        </View>
                      ))}
                    </ScrollView>

                    {/* Page dots */}
                    {totalPages > 1 && (
                      <View style={styles.pageDots}>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                          <View
                            key={`dot-${idx}`}
                            style={[
                              styles.dot,
                              idx === currentPage && styles.activeDot,
                            ]}
                          />
                        ))}
                      </View>
                    )}
                  </LinearGradient>
                </BlurView>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  folderContainer: {
    width: FOLDER_WIDTH,
    height: FOLDER_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  folderBlur: {
    flex: 1,
  },
  folderGradient: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  folderName: {
    fontSize: 20,
    fontWeight: '600',
    color: Apple.Colors.label,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  folderNameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: Apple.Colors.label,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    minWidth: 150,
    textAlign: 'center',
  },
  appsContainer: {
    flexGrow: 0,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: ICON_SPACING,
    paddingHorizontal: 20,
  },
  emptySlot: {
    width: ICON_SIZE,
    marginHorizontal: 12,
  },
  pageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
