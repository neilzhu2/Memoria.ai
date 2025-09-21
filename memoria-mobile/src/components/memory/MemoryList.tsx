/**
 * MemoryList Component for Memoria.ai
 * Comprehensive list component with search, filtering, and memory management
 * Optimized for elderly users with accessibility features and performance
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Memory, MemoryFilters as MemoryFiltersType, MemorySort } from '../../types';
import { useMemoryStore, useSettingsStore } from '../../stores';
import MemoryCard from './MemoryCard';
import MemorySearch from './MemorySearch';
import MemoryFilters from './MemoryFilters';
import EditMemoryModal from './EditMemoryModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AccessibleButton from '../accessibility/AccessibleButton';

interface MemoryListProps {
  initialFilter?: MemoryFiltersType;
  initialSort?: MemorySort;
  showSearch?: boolean;
  showFilters?: boolean;
  emptyMessage?: string;
  onMemoryPress?: (memory: Memory) => void;
  style?: ViewStyle;
}

const MemoryList: React.FC<MemoryListProps> = ({
  initialFilter = {},
  initialSort = { field: 'createdAt', direction: 'desc' },
  showSearch = true,
  showFilters = true,
  emptyMessage,
  onMemoryPress,
  style,
}) => {
  const {
    memories,
    filteredMemories,
    loadingState,
    setFilters,
    setSort,
    clearFilters,
    deleteMemory,
    updateMemory,
    getFavoriteMemories,
    getRecentMemories,
  } = useMemoryStore();

  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  // Apply initial filters on mount
  useEffect(() => {
    setFilters(initialFilter);
    setSort(initialSort);
  }, []);

  const displayedMemories = useMemo(() => {
    return filteredMemories.length > 0 ? filteredMemories : memories.filter(m => !m.isArchived);
  }, [filteredMemories, memories]);

  const handleRefresh = useCallback(async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRefreshing(true);
    // In a real app, this would reload data from storage/server
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [hapticFeedbackEnabled]);

  const handleMemoryPress = useCallback((memory: Memory) => {
    if (onMemoryPress) {
      onMemoryPress(memory);
    }
    // Default behavior is handled by MemoryCard expansion
  }, [onMemoryPress]);

  const handleEdit = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setShowDeleteModal(true);
  }, []);

  const handleShare = useCallback(async (memory: Memory) => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Note: In a real implementation, this would integrate with native sharing
    Alert.alert(
      'Share Memory',
      `Share "${memory.title}" with others?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Audio',
          onPress: () => {
            // Share audio file
            console.log('Sharing audio:', memory.audioFilePath);
          }
        },
        {
          text: 'Share Text',
          onPress: () => {
            // Share transcription
            console.log('Sharing text:', memory.transcription);
          }
        },
      ]
    );
  }, [hapticFeedbackEnabled]);

  const confirmDelete = useCallback(async () => {
    if (!selectedMemory) return;

    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setIsPerformingAction(true);

    try {
      deleteMemory(selectedMemory.id);

      // Show success feedback
      const successMessage = language === 'zh'
        ? '记忆已删除'
        : 'Memory deleted successfully';

      Alert.alert('Success', successMessage);
    } catch (error) {
      const errorMessage = language === 'zh'
        ? '删除失败，请重试'
        : 'Failed to delete memory. Please try again.';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsPerformingAction(false);
      setShowDeleteModal(false);
      setSelectedMemory(null);
    }
  }, [selectedMemory, deleteMemory, hapticFeedbackEnabled, language]);

  const handleSaveEdit = useCallback(async (updates: Partial<Memory>) => {
    if (!selectedMemory) return;

    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsPerformingAction(true);

    try {
      updateMemory(selectedMemory.id, updates);

      const successMessage = language === 'zh'
        ? '记忆已更新'
        : 'Memory updated successfully';

      Alert.alert('Success', successMessage);
    } catch (error) {
      const errorMessage = language === 'zh'
        ? '更新失败，请重试'
        : 'Failed to update memory. Please try again.';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsPerformingAction(false);
      setShowEditModal(false);
      setSelectedMemory(null);
    }
  }, [selectedMemory, updateMemory, hapticFeedbackEnabled, language]);

  const renderMemoryItem = useCallback(({ item, index }: { item: Memory; index: number }) => (
    <MemoryCard
      memory={item}
      onPress={handleMemoryPress}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onShare={handleShare}
      showActions={true}
      showPlayback={true}
      style={{
        marginHorizontal: 16,
        marginVertical: 8,
        marginTop: index === 0 ? 16 : 8,
      }}
    />
  ), [handleMemoryPress, handleEdit, handleDelete, handleShare]);

  const renderEmptyState = useCallback(() => {
    const defaultEmptyMessage = language === 'zh'
      ? '还没有记忆。\n开始录制来创建您的第一个记忆！'
      : 'No memories yet.\nStart recording to create your first memory!';

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>🎙️</Text>
        </View>
        <Text style={styles.emptyMessage}>
          {emptyMessage || defaultEmptyMessage}
        </Text>
        <AccessibleButton
          title={language === 'zh' ? '开始录制' : 'Start Recording'}
          onPress={() => {
            // Navigate to recording screen
            console.log('Navigate to recording');
          }}
          variant="primary"
          style={styles.emptyAction}
          accessibilityLabel={language === 'zh' ? '跳转到录制页面' : 'Go to recording screen'}
        />
      </View>
    );
  }, [emptyMessage, language]);

  const renderLoadingState = useCallback(() => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        size="large"
        color="#2563eb"
        accessibilityLabel={language === 'zh' ? '正在加载记忆' : 'Loading memories'}
      />
      <Text style={styles.loadingText}>
        {language === 'zh' ? '正在加载您的记忆...' : 'Loading your memories...'}
      </Text>
    </View>
  ), [language]);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 200, // Estimated item height
    offset: 200 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: Memory) => item.id, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyIcon: {
      width: touchTargetSize + 20,
      height: touchTargetSize + 20,
      borderRadius: (touchTargetSize + 20) / 2,
      backgroundColor: highContrast ? '#333333' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    emptyIconText: {
      fontSize: fontSize + 12,
    },
    emptyMessage: {
      fontSize: fontSize + 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      lineHeight: (fontSize + 2) * 1.5,
      marginBottom: 32,
      fontWeight: '500',
    },
    emptyAction: {
      paddingHorizontal: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 16,
      fontWeight: '500',
    },
    quickStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#444444' : '#e5e7eb',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      color: '#2563eb',
    },
    statLabel: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 4,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    errorText: {
      fontSize: fontSize,
      color: '#dc2626',
      textAlign: 'center',
      marginBottom: 20,
      fontWeight: '500',
    },
    retryButton: {
      marginTop: 16,
    },
  });

  // Show loading state
  if (loadingState.isLoading && displayedMemories.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {showSearch && <MemorySearch showFilters={showFilters} />}
        {renderLoadingState()}
      </View>
    );
  }

  // Show error state
  if (loadingState.error) {
    return (
      <View style={[styles.container, style]}>
        {showSearch && <MemorySearch showFilters={showFilters} />}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {language === 'zh'
              ? '加载记忆时出错。请重试。'
              : 'Error loading memories. Please try again.'}
          </Text>
          <AccessibleButton
            title={language === 'zh' ? '重试' : 'Retry'}
            onPress={handleRefresh}
            variant="secondary"
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showSearch && (
        <MemorySearch
          showFilters={showFilters}
          onSearch={() => {}} // Handled by the search component itself
        />
      )}

      {/* Quick Stats */}
      {displayedMemories.length > 0 && (
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{displayedMemories.length}</Text>
            <Text style={styles.statLabel}>
              {language === 'zh' ? '记忆' : 'Memories'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getFavoriteMemories().length}</Text>
            <Text style={styles.statLabel}>
              {language === 'zh' ? '收藏' : 'Favorites'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getRecentMemories(7).length}</Text>
            <Text style={styles.statLabel}>
              {language === 'zh' ? '最近7天' : 'Recent'}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          displayedMemories.length === 0 && { flex: 1 }
        ]}
        data={displayedMemories}
        renderItem={renderMemoryItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
            progressBackgroundColor={highContrast ? '#333333' : '#ffffff'}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        accessible={true}
        accessibilityLabel={`Memory list with ${displayedMemories.length} memories`}
      />

      {/* Modals */}
      <MemoryFilters
        visible={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
      />

      {selectedMemory && (
        <>
          <EditMemoryModal
            visible={showEditModal}
            memory={selectedMemory}
            onSave={handleSaveEdit}
            onClose={() => {
              setShowEditModal(false);
              setSelectedMemory(null);
            }}
            loading={isPerformingAction}
          />

          <DeleteConfirmationModal
            visible={showDeleteModal}
            memory={selectedMemory}
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteModal(false);
              setSelectedMemory(null);
            }}
            loading={isPerformingAction}
          />
        </>
      )}
    </View>
  );
};

export default MemoryList;