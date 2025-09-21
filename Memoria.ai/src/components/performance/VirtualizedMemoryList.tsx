/**
 * Virtualized Memory List Component for Memoria.ai
 * Optimized list rendering for elderly users on older devices with large memory collections
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ListRenderItem,
  ViewabilityConfig,
  ViewToken,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { deviceCapabilityService } from '../../services/DeviceCapabilityService';
import { performanceMonitor } from '../../services/PerformanceMonitor';
import { memoryManager } from '../../services/MemoryManager';

export interface MemoryItem {
  id: string;
  title: string;
  date: Date;
  duration: number;
  transcription?: string;
  audioUri?: string;
  isElderlyOptimized: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface VirtualizedMemoryListProps {
  memories: MemoryItem[];
  onMemoryPress: (memory: MemoryItem) => void;
  onMemoryLongPress?: (memory: MemoryItem) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
  elderlyMode?: boolean;
  accessibilityLabel?: string;
}

interface PerformanceConfig {
  windowSize: number;
  maxToRenderPerBatch: number;
  updateCellsBatchingPeriod: number;
  initialNumToRender: number;
  getItemLayout?: (index: number) => { length: number; offset: number; index: number };
  removeClippedSubviews: boolean;
  elderlyOptimizations: boolean;
}

interface ElderlyUIConfig {
  itemHeight: number;
  fontSize: number;
  spacing: number;
  touchTargetSize: number;
  contrastRatio: number;
  animationDuration: number;
}

const VirtualizedMemoryList: React.FC<VirtualizedMemoryListProps> = ({
  memories,
  onMemoryPress,
  onMemoryLongPress,
  onRefresh,
  isLoading = false,
  elderlyMode = true,
  accessibilityLabel = 'Memory list',
}) => {
  const flatListRef = useRef<FlatList<MemoryItem>>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [performanceConfig, setPerformanceConfig] = useState<PerformanceConfig | null>(null);
  const [elderlyConfig, setElderlyConfig] = useState<ElderlyUIConfig | null>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  // Performance tracking
  const renderStartTime = useRef<number>(0);
  const lastScrollTime = useRef<number>(0);
  const frameDropCount = useRef<number>(0);

  /**
   * Initialize performance configuration based on device capabilities
   */
  useEffect(() => {
    const initializeConfig = async () => {
      await deviceCapabilityService.initialize();
      const capabilities = deviceCapabilityService.getCapabilities();

      if (capabilities) {
        const config = generatePerformanceConfig(capabilities);
        const elderlyUIConfig = generateElderlyUIConfig(capabilities, elderlyMode);

        setPerformanceConfig(config);
        setElderlyConfig(elderlyUIConfig);

        console.log('VirtualizedMemoryList configured for elderly users on older devices');
      }
    };

    initializeConfig();
  }, [elderlyMode]);

  /**
   * Generate performance configuration based on device capabilities
   */
  const generatePerformanceConfig = useCallback((capabilities: any): PerformanceConfig => {
    const isLowEnd = capabilities.isLowEndDevice;
    const memoryTier = capabilities.memoryTier;

    // Conservative settings for elderly users on older devices
    const baseConfig: PerformanceConfig = {
      windowSize: isLowEnd ? 5 : 10,           // Smaller window for low-end devices
      maxToRenderPerBatch: isLowEnd ? 3 : 5,   // Fewer items per batch
      updateCellsBatchingPeriod: isLowEnd ? 100 : 50, // Slower updates for stability
      initialNumToRender: isLowEnd ? 5 : 8,    // Fewer initial items
      removeClippedSubviews: isLowEnd,         // Enable for low-end devices
      elderlyOptimizations: elderlyMode,
    };

    // Adjust based on memory tier
    if (memoryTier === 'low') {
      baseConfig.windowSize = 3;
      baseConfig.maxToRenderPerBatch = 2;
      baseConfig.updateCellsBatchingPeriod = 150;
      baseConfig.initialNumToRender = 3;
    } else if (memoryTier === 'high' && !isLowEnd) {
      baseConfig.windowSize = 15;
      baseConfig.maxToRenderPerBatch = 8;
      baseConfig.updateCellsBatchingPeriod = 30;
      baseConfig.initialNumToRender = 12;
    }

    return baseConfig;
  }, [elderlyMode]);

  /**
   * Generate elderly-specific UI configuration
   */
  const generateElderlyUIConfig = useCallback((capabilities: any, elderlyMode: boolean): ElderlyUIConfig => {
    const isTablet = capabilities.screenSize === 'tablet';
    const isLowEnd = capabilities.isLowEndDevice;

    const baseConfig: ElderlyUIConfig = {
      itemHeight: elderlyMode ? (isTablet ? 100 : 80) : (isTablet ? 80 : 64),
      fontSize: capabilities.recommendedFontSize || (elderlyMode ? 18 : 16),
      spacing: elderlyMode ? 16 : 12,
      touchTargetSize: capabilities.recommendedTouchTargetSize || (elderlyMode ? 48 : 44),
      contrastRatio: elderlyMode ? 4.5 : 3.0, // WCAG AA compliance
      animationDuration: isLowEnd ? 150 : (elderlyMode ? 200 : 150),
    };

    // Adjust for device capabilities
    if (isLowEnd) {
      baseConfig.animationDuration = 100; // Faster animations for performance
    }

    return baseConfig;
  }, []);

  /**
   * Optimized item layout calculation
   */
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemHeight = elderlyConfig?.itemHeight || 80;
    const spacing = elderlyConfig?.spacing || 12;
    const totalItemHeight = itemHeight + spacing;

    return {
      length: totalItemHeight,
      offset: totalItemHeight * index,
      index,
    };
  }, [elderlyConfig]);

  /**
   * Viewability configuration optimized for elderly users
   */
  const viewabilityConfig: ViewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: elderlyMode ? 75 : 50, // Higher threshold for elderly users
    minimumViewTime: elderlyMode ? 500 : 250, // Longer view time for elderly users
    waitForInteraction: false,
  }), [elderlyMode]);

  /**
   * Handle viewable items changed
   */
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    // Track visible range for performance optimization
    if (viewableItems.length > 0) {
      const start = viewableItems[0].index || 0;
      const end = viewableItems[viewableItems.length - 1].index || 0;
      setVisibleRange({ start, end });

      // Preload audio for visible items if elderly mode is enabled
      if (elderlyMode) {
        preloadVisibleAudioFiles(viewableItems);
      }
    }
  }, [elderlyMode]);

  /**
   * Preload audio files for visible items (elderly optimization)
   */
  const preloadVisibleAudioFiles = useCallback(async (viewableItems: ViewToken[]) => {
    try {
      for (const item of viewableItems) {
        const memory = item.item as MemoryItem;
        if (memory.audioUri && memory.isElderlyOptimized) {
          // Allocate memory for audio preloading
          await memoryManager.allocateMemory(
            `preload_${memory.id}`,
            1024 * 1024, // 1MB estimation
            'audio',
            'low',
            true // elderly optimized
          );
        }
      }
    } catch (error) {
      console.warn('Audio preloading failed:', error);
    }
  }, []);

  /**
   * Optimized render item function
   */
  const renderItem: ListRenderItem<MemoryItem> = useCallback(({ item, index }) => {
    // Track render performance
    const renderStart = Date.now();

    const component = (
      <MemoryListItem
        memory={item}
        index={index}
        onPress={onMemoryPress}
        onLongPress={onMemoryLongPress}
        elderlyConfig={elderlyConfig}
        elderlyMode={elderlyMode}
        isVisible={index >= visibleRange.start && index <= visibleRange.end}
      />
    );

    // Record render time for performance monitoring
    const renderTime = Date.now() - renderStart;
    if (renderTime > 50) { // More than 50ms is concerning for elderly users
      frameDropCount.current++;
      performanceMonitor.recordInteractionTime(renderTime);
    }

    return component;
  }, [onMemoryPress, onMemoryLongPress, elderlyConfig, elderlyMode, visibleRange]);

  /**
   * Key extractor optimized for performance
   */
  const keyExtractor = useCallback((item: MemoryItem) => item.id, []);

  /**
   * Handle refresh for elderly users
   */
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);

    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  /**
   * Handle scroll performance monitoring
   */
  const handleScrollBeginDrag = useCallback(() => {
    lastScrollTime.current = Date.now();
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    const scrollDuration = Date.now() - lastScrollTime.current;
    if (scrollDuration > 500 && elderlyMode) {
      // Long scroll detected, may indicate difficulty for elderly users
      performanceMonitor.recordAccessibilityViolation();
    }
  }, [elderlyMode]);

  /**
   * Render empty state optimized for elderly users
   */
  const renderEmptyComponent = useCallback(() => (
    <View style={[styles.emptyContainer, elderlyMode && styles.elderlyEmptyContainer]}>
      <Text style={[
        styles.emptyText,
        elderlyMode && styles.elderlyEmptyText,
        { fontSize: elderlyConfig?.fontSize || 16 }
      ]}>
        No memories yet. Tap the record button to create your first memory.
      </Text>
    </View>
  ), [elderlyMode, elderlyConfig]);

  /**
   * Render loading indicator
   */
  const renderLoadingFooter = useCallback(() => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size={elderlyMode ? 'large' : 'small'}
          color={elderlyMode ? '#2563eb' : '#6b7280'}
        />
        <Text style={[
          styles.loadingText,
          elderlyMode && styles.elderlyLoadingText,
          { fontSize: (elderlyConfig?.fontSize || 16) - 2 }
        ]}>
          Loading memories...
        </Text>
      </View>
    );
  }, [isLoading, elderlyMode, elderlyConfig]);

  // Show loading state if configuration is not ready
  if (!performanceConfig || !elderlyConfig) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Optimizing for your device...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={memories}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}

        // Performance optimizations
        windowSize={performanceConfig.windowSize}
        maxToRenderPerBatch={performanceConfig.maxToRenderPerBatch}
        updateCellsBatchingPeriod={performanceConfig.updateCellsBatchingPeriod}
        initialNumToRender={performanceConfig.initialNumToRender}
        removeClippedSubviews={performanceConfig.removeClippedSubviews}

        // Viewability configuration
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}

        // Refresh control
        refreshControl={onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={elderlyMode ? '#2563eb' : '#6b7280'}
            titleColor={elderlyMode ? '#1f2937' : '#6b7280'}
            title={elderlyMode ? 'Updating memories...' : 'Refreshing...'}
          />
        ) : undefined}

        // Scroll handling
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}

        // Empty state
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderLoadingFooter}

        // Accessibility
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="list"

        // Styling
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          elderlyMode && styles.elderlyListContent,
          { paddingHorizontal: elderlyConfig.spacing }
        ]}

        // Elderly-specific optimizations
        scrollEventThrottle={elderlyMode ? 32 : 16} // Slower scroll events for elderly users
        decelerationRate={elderlyMode ? 'normal' : 'fast'} // Gentler deceleration
        showsVerticalScrollIndicator={elderlyMode} // Always show for elderly users
        indicatorStyle={elderlyMode ? 'black' : 'default'}
      />
    </View>
  );
};

/**
 * Individual memory list item component with optimizations
 */
interface MemoryListItemProps {
  memory: MemoryItem;
  index: number;
  onPress: (memory: MemoryItem) => void;
  onLongPress?: (memory: MemoryItem) => void;
  elderlyConfig: ElderlyUIConfig | null;
  elderlyMode: boolean;
  isVisible: boolean;
}

const MemoryListItem: React.FC<MemoryListItemProps> = React.memo(({
  memory,
  index,
  onPress,
  onLongPress,
  elderlyConfig,
  elderlyMode,
  isVisible,
}) => {
  const handlePress = useCallback(() => {
    onPress(memory);
  }, [memory, onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(memory);
    }
  }, [memory, onLongPress]);

  // Format date for elderly users
  const formattedDate = useMemo(() => {
    const date = memory.date;
    if (elderlyMode) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return date.toLocaleDateString();
  }, [memory.date, elderlyMode]);

  // Format duration
  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(memory.duration / 60);
    const seconds = memory.duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [memory.duration]);

  if (!elderlyConfig) return null;

  return (
    <View
      style={[
        styles.memoryItem,
        elderlyMode && styles.elderlyMemoryItem,
        {
          height: elderlyConfig.itemHeight,
          marginBottom: elderlyConfig.spacing,
          minHeight: elderlyConfig.touchTargetSize,
        },
        !isVisible && styles.hiddenItem, // Optimize non-visible items
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${memory.title}, recorded on ${formattedDate}, duration ${formattedDuration}`}
      accessibilityHint={elderlyMode ? "Double tap to play this memory" : "Tap to play"}
    >
      <View style={styles.memoryContent}>
        <Text
          style={[
            styles.memoryTitle,
            elderlyMode && styles.elderlyMemoryTitle,
            { fontSize: elderlyConfig.fontSize },
          ]}
          numberOfLines={elderlyMode ? 2 : 1}
          ellipsizeMode="tail"
        >
          {memory.title}
        </Text>

        <Text
          style={[
            styles.memoryDate,
            elderlyMode && styles.elderlyMemoryDate,
            { fontSize: elderlyConfig.fontSize - 2 },
          ]}
        >
          {formattedDate}
        </Text>

        <View style={styles.memoryMeta}>
          <Text
            style={[
              styles.memoryDuration,
              elderlyMode && styles.elderlyMemoryDuration,
              { fontSize: elderlyConfig.fontSize - 2 },
            ]}
          >
            {formattedDuration}
          </Text>

          {memory.isElderlyOptimized && elderlyMode && (
            <View style={styles.optimizedBadge}>
              <Text style={styles.optimizedText}>✓</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  elderlyListContent: {
    paddingVertical: 16,
  },
  memoryItem: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  elderlyMemoryItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  hiddenItem: {
    opacity: 0.7, // Reduce opacity for non-visible items to save rendering
  },
  memoryContent: {
    flex: 1,
  },
  memoryTitle: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  elderlyMemoryTitle: {
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  memoryDate: {
    color: '#6b7280',
    marginBottom: 8,
  },
  elderlyMemoryDate: {
    color: '#374151',
    marginBottom: 12,
    fontWeight: '500',
  },
  memoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryDuration: {
    color: '#9ca3af',
    fontWeight: '500',
  },
  elderlyMemoryDuration: {
    color: '#6b7280',
    fontWeight: '600',
  },
  optimizedBadge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optimizedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  elderlyEmptyContainer: {
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 24,
  },
  elderlyEmptyText: {
    textAlign: 'center',
    color: '#374151',
    lineHeight: 28,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
  elderlyLoadingText: {
    marginTop: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default VirtualizedMemoryList;