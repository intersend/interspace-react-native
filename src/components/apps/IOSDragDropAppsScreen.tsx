import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { DraggableAppIcon } from '@/src/components/apps/DraggableAppIcon';
// Icon components are used within DraggableAppIcon
import { IOSSearchWidget } from '@/src/components/apps/IOSSearchWidget';
import { IOSFolderModal } from '@/src/components/apps/IOSFolderModal';
import { IOSSpotlightModal } from '@/src/components/apps/IOSSpotlightModal';
import { SafariBrowser } from '@/src/components/apps/SafariBrowser';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const ICONS_PER_ROW = 4;
const ROWS_PER_PAGE = 5; // mimic iOS grid height
const ICONS_PER_PAGE = ICONS_PER_ROW * ROWS_PER_PAGE;
const ICON_SIZE = 74;
const HORIZONTAL_PADDING = 20;
const ICON_SPACING = (width - HORIZONTAL_PADDING * 2 - ICON_SIZE * ICONS_PER_ROW) / (ICONS_PER_ROW - 1);
const VERTICAL_SPACING = 30;
const DRAG_SCALE = 1.1;
const DROP_SCALE = 1.2;

interface App {
  id: string;
  name: string;
  url: string;
  iconUrl?: string;
  position: number;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  position: number;
  apps: App[];
  isOpen?: boolean;
}

interface GridPosition {
  page: number;
  row: number;
  col: number;
  x: number;
  y: number;
}

interface DragState {
  item: App | Folder | null;
  originalPosition: number;
  isActive: boolean;
}

export default function IOSDragDropAppsScreen() {
  const [apps, setApps] = useState<App[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [openingAppId, setOpeningAppId] = useState<string | null>(null);
  const [spotlightVisible, setSpotlightVisible] = useState(false);
  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [folderPosition, setFolderPosition] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    item: null,
    originalPosition: 0,
    isActive: false,
  });
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTargetIndex, setDropTargetIndex] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Grid positions for drag & drop
  const gridPositions = useRef<GridPosition[]>([]);
  const gridItems = useRef<(App | Folder)[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const browserScale = useSharedValue(0);
  const browserOpacity = useSharedValue(0);
  const backgroundBlur = useSharedValue(0);
  const widgetOpacity = useSharedValue(1);

  // Initialize with mock data
  useEffect(() => {
    const mockApps: App[] = [
      // Standalone apps
      { id: 'app-1', name: 'Aave', url: 'https://app.aave.com', position: 0 },
      { id: 'app-2', name: 'Hyperliquid', url: 'https://app.hyperliquid.xyz', position: 1 },
      { id: 'app-3', name: 'Jumper', url: 'https://jumper.exchange', position: 2 },
      
      // Apps in DeFi folder
      { id: 'app-4', name: 'Uniswap', url: 'https://app.uniswap.org', position: 0, folderId: 'folder-defi' },
      { id: 'app-5', name: 'Compound', url: 'https://app.compound.finance', position: 1, folderId: 'folder-defi' },
      { id: 'app-6', name: 'Curve', url: 'https://curve.fi', position: 2, folderId: 'folder-defi' },
      { id: 'app-7', name: 'SushiSwap', url: 'https://app.sushi.com', position: 3, folderId: 'folder-defi' },
      { id: 'app-8', name: 'Balancer', url: 'https://app.balancer.fi', position: 4, folderId: 'folder-defi' },
      { id: 'app-9', name: '1inch', url: 'https://app.1inch.io', position: 5, folderId: 'folder-defi' },
      
      // More standalone apps
      { id: 'app-10', name: 'OpenSea', url: 'https://opensea.io', position: 4 },
      { id: 'app-11', name: 'Blur', url: 'https://blur.io', position: 5 },
      { id: 'app-12', name: 'dYdX', url: 'https://dydx.exchange', position: 6 },
      { id: 'app-13', name: 'GMX', url: 'https://app.gmx.io', position: 7 },
      { id: 'app-14', name: 'Hop', url: 'https://app.hop.exchange', position: 8 },
      { id: 'app-15', name: 'Across', url: 'https://app.across.to', position: 9 },
    ];

    const deFiApps = mockApps.filter(app => app.folderId === 'folder-defi');
    
    const mockFolders: Folder[] = [
      {
        id: 'folder-defi',
        name: 'DeFi',
        color: Apple.Colors.systemBlue,
        position: 3,
        apps: deFiApps,
      },
    ];

    setApps(mockApps);
    setFolders(mockFolders);
  }, []);

  const recalcPositions = (
    appsList: App[],
    folderList: Folder[],
  ): { apps: App[]; folders: Folder[] } => {
    let idx = 0;
    const sortedFolders = folderList
      .sort((a, b) => a.position - b.position)
      .map((f) => ({ ...f, position: idx++ }));
    const updatedApps = appsList.map((a) => {
      if (a.folderId) return a;
      const pos = idx++;
      return { ...a, position: pos };
    });
    return { apps: updatedApps, folders: sortedFolders };
  };

  const addAppToFolder = (app: App, folder: Folder) => {
    const updatedFolders = folders.map((f) =>
      f.id === folder.id
        ? { ...f, apps: [...f.apps, { ...app, folderId: folder.id, position: f.apps.length }] }
        : f,
    );
    const updatedApps = apps.map((a) =>
      a.id === app.id ? { ...a, folderId: folder.id } : a,
    );
    const { apps: resApps, folders: resFolders } = recalcPositions(updatedApps, updatedFolders);
    setApps(resApps);
    setFolders(resFolders);
  };

  const createFolderFromApps = (dragApp: App, targetApp: App) => {
    const newFolderId = `folder-${Date.now()}`;
    const newFolder: Folder = {
      id: newFolderId,
      name: 'Folder',
      color: Apple.Colors.systemBlue,
      position: targetApp.position,
      apps: [
        { ...targetApp, folderId: newFolderId, position: 0 },
        { ...dragApp, folderId: newFolderId, position: 1 },
      ],
    };

    const remainingApps = apps.filter((a) => a.id !== targetApp.id && a.id !== dragApp.id);
    const updatedApps = [
      ...remainingApps,
      { ...targetApp, folderId: newFolderId },
      { ...dragApp, folderId: newFolderId },
    ];
    const updatedFolders = [...folders, newFolder];
    const { apps: resApps, folders: resFolders } = recalcPositions(updatedApps, updatedFolders);
    setApps(resApps);
    setFolders(resFolders);
  };

  // Calculate grid positions and pages
  useEffect(() => {
    const standaloneApps = apps.filter(app => !app.folderId);
    const allItems = [...standaloneApps, ...folders].sort((a, b) => a.position - b.position);

    const positions: GridPosition[] = [];

    const pages = Math.max(1, Math.ceil(allItems.length / ICONS_PER_PAGE));
    setTotalPages(pages);

    allItems.forEach((item, index) => {
      const page = Math.floor(index / ICONS_PER_PAGE);
      const indexInPage = index % ICONS_PER_PAGE;
      const row = Math.floor(indexInPage / ICONS_PER_ROW);
      const col = indexInPage % ICONS_PER_ROW;
      positions.push({
        page,
        row,
        col,
        x: page * width + HORIZONTAL_PADDING + col * (ICON_SIZE + ICON_SPACING),
        y: 100 + row * (ICON_SIZE + VERTICAL_SPACING),
      });
    });

    gridPositions.current = positions;
    gridItems.current = allItems;
  }, [apps, folders]);

  // Animate widget opacity in edit mode
  useEffect(() => {
    widgetOpacity.value = withTiming(isEditMode ? 0.3 : 1, { duration: 200 });
  }, [isEditMode]);

  // Configure layout animation for smooth transitions
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [apps, folders]);

  const handleLongPress = useCallback(() => {
    if (!isEditMode) {
      hapticTrigger('impactMedium');
      setIsEditMode(true);
    }
  }, [isEditMode]);

  const handleDonePress = useCallback(() => {
    hapticTrigger('impactLight');
    setIsEditMode(false);
  }, []);

  const handleEmptySpacePress = useCallback(() => {
    if (isEditMode && !dragState.isActive) {
      handleDonePress();
    }
  }, [isEditMode, dragState.isActive, handleDonePress]);

  const handleAppPress = useCallback(
    (app: App, position: { x: number; y: number }) => {
      if (isEditMode || dragState.isActive) return;

      hapticTrigger('impactLight');
      setOpeningAppId(app.id);
      setBrowserUrl(app.url);

      browserScale.value = 0.85;
      browserOpacity.value = 0;

      browserScale.value = withTiming(1, { duration: 250 });
      browserOpacity.value = withTiming(1, { duration: 250 });
      backgroundBlur.value = withTiming(10, { duration: 250 });

      setTimeout(() => {
        setBrowserVisible(true);
        setOpeningAppId(null);
      }, 200);
    },
    [isEditMode, dragState.isActive],
  );

  const handleFolderPress = useCallback((folder: Folder, position: { x: number; y: number }) => {
    if (isEditMode || dragState.isActive) return;
    
    hapticTrigger('impactLight');
    setFolderPosition(position);
    setOpenFolder(folder);
  }, [isEditMode, dragState.isActive]);

  const handleDeleteApp = useCallback((appId: string) => {
    hapticTrigger('notificationWarning');
    Alert.alert(
      'Delete App',
      'Remove from Home Screen?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setApps(prev => prev.filter(app => app.id !== appId));
          },
        },
      ]
    );
  }, []);

  const handleDeleteFolder = useCallback((folderId: string) => {
    hapticTrigger('notificationWarning');
    Alert.alert(
      'Delete Folder',
      'This will remove the folder and move all apps to the home screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            // Move folder apps to main screen
            setApps(prev => 
              prev.map(app => 
                app.folderId === folderId 
                  ? { ...app, folderId: undefined } 
                  : app
              )
            );
            setFolders(prev => prev.filter(folder => folder.id !== folderId));
          },
        },
      ]
    );
  }, []);

  const handleSearchPress = useCallback(() => {
    hapticTrigger('impactLight');
    setSpotlightVisible(true);
  }, []);

  const handleSearchSubmit = useCallback(
    (text: string) => {
      setSpotlightVisible(false);
      if (!text) return;
      let finalUrl = text;
      if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
      }

      browserScale.value = 0.85;
      browserOpacity.value = 0;

      browserScale.value = withTiming(1, { duration: 250 });
      browserOpacity.value = withTiming(1, { duration: 250 });
      backgroundBlur.value = withTiming(10, { duration: 250 });

      setBrowserUrl(finalUrl);
      setBrowserVisible(true);
    },
    [],
  );

  const handleBrowserClose = useCallback(() => {
    // Animate browser closing
    browserScale.value = withTiming(0, { duration: 200 });
    browserOpacity.value = withTiming(0, { duration: 200 });
    backgroundBlur.value = withTiming(0, { duration: 200 });
    
    setTimeout(() => setBrowserVisible(false), 200);
  }, []);

  // Drag & drop handlers
  const handleDragStart = useCallback((item: App | Folder, index: number) => {
    setDragState({
      item,
      originalPosition: index,
      isActive: true,
    });
  }, []);

  const handleDragMove = useCallback((x: number, y: number) => {
    setDragPosition({ x, y });
    
    // Find closest grid position
    let closestIndex = -1;
    let minDistance = Infinity;
    
    gridPositions.current.forEach((pos, index) => {
      const distance = Math.sqrt(
        Math.pow(x - (pos.x + ICON_SIZE / 2), 2) +
        Math.pow(y - (pos.y + ICON_SIZE / 2), 2)
      );
      
      if (distance < minDistance && distance < ICON_SIZE * 0.75) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    setDropTargetIndex(closestIndex);
  }, []);

  const handleDragEnd = useCallback((x: number, y: number) => {
    if (dropTargetIndex >= 0 && dragState.item) {
      const target = gridItems.current[dropTargetIndex];
      if (target && !('apps' in dragState.item)) {
        if (target && 'apps' in target) {
          addAppToFolder(dragState.item as App, target as Folder);
        } else if ((target as App).id !== (dragState.item as App).id) {
          createFolderFromApps(dragState.item as App, target as App);
        } else {
          handleItemDrop(dragState.item, dropTargetIndex);
        }
      } else {
        handleItemDrop(dragState.item, dropTargetIndex);
      }
    }
    
    setDragState({
      item: null,
      originalPosition: 0,
      isActive: false,
    });
    setDropTargetIndex(-1);
  }, [dropTargetIndex, dragState.item]);

  const handleItemDrop = (item: App | Folder, newPosition: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    // Collect visible items sorted by position
    const standaloneApps = apps.filter((a) => !a.folderId);
    const allItems: (App | Folder)[] = [...standaloneApps, ...folders].sort(
      (a, b) => a.position - b.position,
    );

    const currentIndex = allItems.findIndex((i) => i.id === item.id);
    if (currentIndex === -1) return;

    const clampedPosition = Math.max(0, Math.min(newPosition, allItems.length - 1));

    allItems.splice(currentIndex, 1);
    allItems.splice(clampedPosition, 0, item);

    const updatedApps = [...apps];
    const updatedFolders = [...folders];

    allItems.forEach((it, idx) => {
      if ('apps' in it) {
        const fIdx = updatedFolders.findIndex((f) => f.id === it.id);
        if (fIdx >= 0) updatedFolders[fIdx] = { ...updatedFolders[fIdx], position: idx };
      } else {
        const aIdx = updatedApps.findIndex((a) => a.id === it.id);
        if (aIdx >= 0) updatedApps[aIdx] = { ...updatedApps[aIdx], position: idx };
      }
    });

    setApps(updatedApps.sort((a, b) => a.position - b.position));
    setFolders(updatedFolders.sort((a, b) => a.position - b.position));
  };

  const backgroundAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(backgroundBlur.value, [0, 10], [1, 0.3]),
    };
  });

  const widgetAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: widgetOpacity.value,
    };
  });


  const renderGrid = (pageIndex: number) => {
    // Get all items (apps not in folders + folders)
    const standaloneApps = apps.filter(app => !app.folderId);
    const allItems = [...standaloneApps, ...folders].sort((a, b) => a.position - b.position);

    const pageItems = allItems.slice(
      pageIndex * ICONS_PER_PAGE,
      (pageIndex + 1) * ICONS_PER_PAGE,
    );

    const rows = [];
    for (let i = 0; i < ROWS_PER_PAGE; i++) {
      const start = i * ICONS_PER_ROW;
      const rowItems = pageItems.slice(start, start + ICONS_PER_ROW);
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {rowItems.map((item, indexInRow) => {
            const isFolder = 'apps' in item;
            const itemIndex = pageIndex * ICONS_PER_PAGE + i * ICONS_PER_ROW + indexInRow;
            let position = gridPositions.current[itemIndex];
            if (!position) {
              const row = Math.floor((itemIndex % ICONS_PER_PAGE) / ICONS_PER_ROW);
              const col = itemIndex % ICONS_PER_ROW;
              position = {
                page: pageIndex,
                row,
                col,
                x:
                  pageIndex * width +
                  HORIZONTAL_PADDING +
                  col * (ICON_SIZE + ICON_SPACING),
                y: 100 + row * (ICON_SIZE + VERTICAL_SPACING),
              };
            }
            const isDragging = dragState.isActive && dragState.item?.id === item.id;

            return (
              <DraggableAppIcon
                key={item.id}
                item={item}
                isFolder={isFolder}
                isEditMode={isEditMode}
                position={{ x: position.x, y: position.y }}
                index={itemIndex}
                onPress={() =>
                  isFolder
                    ? handleFolderPress(item as Folder, {
                        x: position.x + ICON_SIZE / 2,
                        y: position.y + ICON_SIZE / 2,
                      })
                    : handleAppPress(item as App, {
                        x: position.x + ICON_SIZE / 2,
                        y: position.y + ICON_SIZE / 2,
                      })
                }
                onLongPress={handleLongPress}
                onDelete={() => (isFolder ? handleDeleteFolder(item.id) : handleDeleteApp(item.id))}
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                isDragging={isDragging}
                isDropTarget={dropTargetIndex === itemIndex}
                isOpening={openingAppId === item.id}
              />
            );
          })}
          {/* Fill empty slots in row */}
          {Array.from({ length: ICONS_PER_ROW - rowItems.length }).map((_, index) => (
            <View key={`empty-${i}-${index}`} style={styles.emptySlot} />
          ))}
        </View>
      );
    }
    
    return rows;
  };

  // Get recent apps for the widget
  const recentApps = [
    { name: 'Aave', gradient: ['#B6509E', '#8B3A7A', '#6B2A5A'], icon: 'flash' },
    { name: 'Uniswap', gradient: ['#FF007A', '#D6005F', '#B30050'], icon: 'git-network' },
    { name: 'Jumper', gradient: ['#7B3FF2', '#5E2FBF', '#4A238C'], icon: 'swap-horizontal' },
    { name: 'Hyperliquid', gradient: ['#1a1a1a', '#000000', '#0a0a0a'], icon: 'trending-up' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* iOS 17 style gradient background */}
      <LinearGradient
        colors={['#8e8e93', '#3a3a3c', '#000000']}
        style={styles.backgroundGradient}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
      {/* Subtle mesh gradient overlay */}
      <LinearGradient
        colors={['rgba(88,86,214,0.12)', 'rgba(180,80,158,0.12)', 'transparent']}
        style={styles.meshGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.6 }}
      />
      
      {/* Noise texture overlay for authentic iOS feel */}
      <View style={styles.noiseOverlay} />
      
      <Animated.View style={[styles.contentWrapper, backgroundAnimatedStyle]}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Done button in edit mode */}
          {isEditMode && (
            <View style={styles.editModeHeader}>
              <View style={styles.editModeTitle} />
              <TouchableOpacity onPress={handleDonePress} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableWithoutFeedback onPress={handleEmptySpacePress}>
            <View style={styles.touchableContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const page = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentPage(page);
                }}
                scrollEnabled={!isEditMode || !dragState.isActive}
              >
                {Array.from({ length: totalPages }).map((_, pageIndex) => (
                  <View key={`page-${pageIndex}`} style={{ width }}>
                    <View style={styles.gridContainer}>{renderGrid(pageIndex)}</View>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.pageIndicator}>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <View
                    key={idx}
                    style={[styles.pageDot, idx === currentPage && styles.activePageDot]}
                  />
                ))}
              </View>
              
              {/* Search Widget at bottom */}
              <Animated.View style={[styles.widgetContainer, widgetAnimatedStyle]}>
                <IOSSearchWidget 
                  onPress={handleSearchPress}
                  recentApps={recentApps}
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
      </Animated.View>
      
      {/* Safari Browser Modal */}
      <SafariBrowser
        visible={browserVisible}
        initialUrl={browserUrl}
        onClose={handleBrowserClose}
      />

      {/* Spotlight Search Modal */}
      <IOSSpotlightModal
        visible={spotlightVisible}
        onClose={() => setSpotlightVisible(false)}
        onSubmit={handleSearchSubmit}
      />
      
      {/* Folder Modal */}
      {openFolder && (
        <IOSFolderModal
          visible={!!openFolder}
          folderName={openFolder.name}
          apps={openFolder.apps}
          onClose={() => setOpenFolder(null)}
          onAppPress={(app) => {
            setOpenFolder(null);
            handleAppPress(app);
          }}
          onRename={(newName) => {
            setFolders(prev => 
              prev.map(f => f.id === openFolder.id ? { ...f, name: newName } : f)
            );
          }}
          sourcePosition={folderPosition}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Apple.Colors.systemBackground,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  meshGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    opacity: 0.6,
  },
  noiseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: '#ffffff',
  },
  contentWrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  editModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  editModeTitle: {
    flex: 1,
  },
  doneButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Apple.Colors.systemBlue,
  },
  touchableContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  row: {
    flexDirection: 'row',
    marginBottom: VERTICAL_SPACING,
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  draggingPlaceholder: {
    opacity: 0.3,
  },
  emptySlot: {
    width: ICON_SIZE,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 3,
  },
  activePageDot: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  widgetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 95, // Account for tab bar
  },
  draggingItem: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
});
