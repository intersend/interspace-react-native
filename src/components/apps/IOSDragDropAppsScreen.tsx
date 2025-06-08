import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  TouchableOpacity,
  Text,
  TouchableWithoutFeedback,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Apple } from '@/constants/AppleDesign';
import { IOSAppIcon } from '@/src/components/apps/IOSAppIcon';
import { IOSFolderIcon } from '@/src/components/apps/IOSFolderIcon';
import { IOSSearchWidget } from '@/src/components/apps/IOSSearchWidget';
import { IOSFolderModal } from '@/src/components/apps/IOSFolderModal';
import { IOSSearchScreen } from '@/src/components/apps/IOSSearchScreen';
import { SafariBrowser } from '@/src/components/apps/SafariBrowser';
import { IOSDeleteConfirmation } from '@/src/components/apps/IOSDeleteConfirmation';
import { IOSGridLayoutManager, GRID_CONFIG } from '@/src/components/apps/IOSGridLayoutManager';
import { hapticTrigger } from '@/src/utils/hapticFeedback';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedRef,
  scrollTo,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

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
}

export default function IOSDragDropAppsScreen() {
  const [apps, setApps] = useState<App[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [browserVisible, setBrowserVisible] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [openFolder, setOpenFolder] = useState<Folder | null>(null);
  const [folderPosition, setFolderPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    itemId: string;
    itemName: string;
    isFolder: boolean;
  }>({
    visible: false,
    itemId: '',
    itemName: '',
    isFolder: false,
  });

  // Grid layout manager
  const gridManager = useMemo(() => new IOSGridLayoutManager(), []);
  const [gridPositions, setGridPositions] = useState<Map<string, any>>(new Map());
  const [totalPages, setTotalPages] = useState(1);
  
  // Drag state
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'app' | 'folder' } | null>(null);
  const dragPosition = useSharedValue({ x: 0, y: 0 });
  const dragScale = useSharedValue(1);
  const dragOpacity = useSharedValue(1);
  
  // Animation values
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const pageIndicatorOpacity = useSharedValue(0.6);
  const widgetOpacity = useSharedValue(1);

  // Initialize with mock data
  useEffect(() => {
    const mockApps: App[] = [
      { id: 'app-1', name: 'Aave', url: 'https://app.aave.com', position: 0 },
      { id: 'app-2', name: 'Hyperliquid', url: 'https://app.hyperliquid.xyz', position: 1 },
      { id: 'app-3', name: 'Jumper', url: 'https://jumper.exchange', position: 2 },
      { id: 'app-4', name: 'Uniswap', url: 'https://app.uniswap.org', position: 0, folderId: 'folder-defi' },
      { id: 'app-5', name: 'Compound', url: 'https://app.compound.finance', position: 1, folderId: 'folder-defi' },
      { id: 'app-6', name: 'Curve', url: 'https://curve.fi', position: 2, folderId: 'folder-defi' },
      { id: 'app-7', name: 'SushiSwap', url: 'https://app.sushi.com', position: 3, folderId: 'folder-defi' },
      { id: 'app-8', name: 'Balancer', url: 'https://app.balancer.fi', position: 4, folderId: 'folder-defi' },
      { id: 'app-9', name: '1inch', url: 'https://app.1inch.io', position: 5, folderId: 'folder-defi' },
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

  // Update grid positions when apps/folders change
  useEffect(() => {
    const standaloneApps = apps.filter(app => !app.folderId);
    const allItems = [...standaloneApps, ...folders].sort((a, b) => a.position - b.position);
    
    const items = allItems.map(item => ({
      id: item.id,
      type: 'apps' in item ? 'folder' : 'app',
    }));
    
    const positions = gridManager.reorganizeItems(items as any);
    setGridPositions(positions);
    setTotalPages(gridManager.getPageCount());
  }, [apps, folders, gridManager]);

  // Animate widget opacity in edit mode
  useEffect(() => {
    widgetOpacity.value = withTiming(isEditMode ? 0.3 : 1, { duration: 200 });
  }, [isEditMode]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      pageIndicatorOpacity.value = withTiming(1, { duration: 150 });
    },
    onEndDrag: () => {
      pageIndicatorOpacity.value = withTiming(0.6, { duration: 300 });
    },
  });

  const handleLongPress = useCallback((itemId: string) => {
    if (!isEditMode) {
      hapticTrigger('impactMedium');
      setIsEditMode(true);
    }
  }, [isEditMode]);

  const handleDonePress = useCallback(() => {
    hapticTrigger('impactLight');
    setIsEditMode(false);
  }, []);

  const handleAppPress = useCallback((app: App) => {
    if (isEditMode || draggedItem) return;
    
    hapticTrigger('impactLight');
    setBrowserUrl(app.url);
    setBrowserVisible(true);
  }, [isEditMode, draggedItem]);

  const handleFolderPress = useCallback((folder: Folder, position: { x: number; y: number }) => {
    if (isEditMode || draggedItem) return;
    
    hapticTrigger('impactLight');
    setFolderPosition(position);
    setOpenFolder(folder);
  }, [isEditMode, draggedItem]);

  const handleDeleteApp = useCallback((appId: string) => {
    const app = apps.find(a => a.id === appId);
    if (app) {
      setDeleteConfirmation({
        visible: true,
        itemId: appId,
        itemName: app.name,
        isFolder: false,
      });
    }
  }, [apps]);

  const handleDeleteFolder = useCallback((folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setDeleteConfirmation({
        visible: true,
        itemId: folderId,
        itemName: folder.name,
        isFolder: true,
      });
    }
  }, [folders]);

  const handleSearchPress = useCallback(() => {
    hapticTrigger('impactLight');
    setSearchVisible(true);
  }, []);

  const handleSearchSubmit = useCallback((text: string) => {
    setSearchVisible(false);
    if (!text) return;
    
    let finalUrl = text;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    
    setBrowserUrl(finalUrl);
    setBrowserVisible(true);
  }, []);

  const handleDragStart = useCallback((itemId: string, type: 'app' | 'folder') => {
    setDraggedItem({ id: itemId, type });
    dragScale.value = withSpring(1.1, { damping: 15, stiffness: 350 });
    dragOpacity.value = withTiming(0.9, { duration: 100 });
    hapticTrigger('impactMedium');
  }, []);

  const handleDragMove = useCallback((x: number, y: number) => {
    dragPosition.value = { x, y };
  }, []);

  const handleDragEnd = useCallback(() => {
    if (!draggedItem) return;
    
    const dropTarget = gridManager.findDropTarget(
      dragPosition.value.x,
      dragPosition.value.y
    );
    
    if (dropTarget) {
      // Handle drop logic
      hapticTrigger('impactLight');
    }
    
    dragScale.value = withSpring(1, { damping: 15, stiffness: 350 });
    dragOpacity.value = withTiming(1, { duration: 100 });
    setDraggedItem(null);
  }, [draggedItem, gridManager]);

  const pageIndicatorStyle = useAnimatedStyle(() => ({
    opacity: pageIndicatorOpacity.value,
  }));

  const widgetAnimatedStyle = useAnimatedStyle(() => ({
    opacity: widgetOpacity.value,
  }));

  const renderItem = (itemId: string, position: any) => {
    const app = apps.find(a => a.id === itemId);
    const folder = folders.find(f => f.id === itemId);
    
    if (!app && !folder) return null;
    
    const isFolder = !!folder;
    const item = folder || app!;
    
    return (
      <View
        key={itemId}
        style={[
          styles.itemContainer,
          {
            position: 'absolute',
            left: position.x,
            top: position.y,
            width: isFolder ? GRID_CONFIG.FOLDER_SIZE : GRID_CONFIG.ICON_SIZE,
            height: isFolder ? GRID_CONFIG.FOLDER_SIZE : GRID_CONFIG.ICON_SIZE,
          },
        ]}
      >
        {isFolder ? (
          <IOSFolderIcon
            id={folder.id}
            name={folder.name}
            apps={folder.apps}
            isEditMode={isEditMode}
            onPress={() => handleFolderPress(folder, position)}
            onLongPress={() => handleLongPress(folder.id)}
            onDelete={() => handleDeleteFolder(folder.id)}
          />
        ) : (
          <IOSAppIcon
            id={app!.id}
            name={app!.name}
            url={app!.url}
            iconUrl={app!.iconUrl}
            isEditMode={isEditMode}
            onPress={() => handleAppPress(app!)}
            onLongPress={() => handleLongPress(app!.id)}
            onDelete={() => handleDeleteApp(app!.id)}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background */}
      <LinearGradient
        colors={['#1c1c1e', '#000000', '#000000']}
        style={styles.backgroundGradient}
        locations={[0, 0.4, 1]}
      />
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Edit Mode Header */}
        {isEditMode && (
          <View style={styles.editModeHeader}>
            <TouchableOpacity onPress={handleDonePress} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Search Widget */}
        <Animated.View style={widgetAnimatedStyle}>
          <IOSSearchWidget onPress={handleSearchPress} />
        </Animated.View>
        
        {/* Apps Grid */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ width: width * totalPages }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <View key={pageIndex} style={{ width, height }}>
              {Array.from(gridPositions.entries()).map(([itemId, position]) => {
                if (position.page === pageIndex) {
                  return renderItem(itemId, position);
                }
                return null;
              })}
            </View>
          ))}
        </Animated.ScrollView>
        
        {/* Page Indicators */}
        {totalPages > 1 && (
          <Animated.View style={[styles.pageIndicator, pageIndicatorStyle]}>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.pageDot,
                  currentPage === idx && styles.activePageDot,
                ]}
              />
            ))}
          </Animated.View>
        )}
      </SafeAreaView>
      
      {/* Modals */}
      <SafariBrowser
        visible={browserVisible}
        initialUrl={browserUrl}
        onClose={() => setBrowserVisible(false)}
      />
      
      <IOSSearchScreen
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        onSearch={handleSearchSubmit}
        onAppSelect={() => {}}
      />
      
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
      
      <IOSDeleteConfirmation
        visible={deleteConfirmation.visible}
        appName={deleteConfirmation.itemName}
        isFolder={deleteConfirmation.isFolder}
        onCancel={() => setDeleteConfirmation(prev => ({ ...prev, visible: false }))}
        onDelete={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          
          if (deleteConfirmation.isFolder) {
            setApps(prev => 
              prev.map(app => 
                app.folderId === deleteConfirmation.itemId 
                  ? { ...app, folderId: undefined } 
                  : app
              )
            );
            setFolders(prev => prev.filter(folder => folder.id !== deleteConfirmation.itemId));
          } else {
            setApps(prev => prev.filter(app => app.id !== deleteConfirmation.itemId));
          }
          
          setDeleteConfirmation(prev => ({ ...prev, visible: false }));
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  editModeHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  itemContainer: {
    position: 'absolute',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
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
});
