/**
 * Enhanced Memories Screen for Memoria.ai
 * Complete memory management interface with all accessibility features
 * Optimized for elderly users with comprehensive functionality
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MemoriesScreenProps, Memory } from '../../types';
import { useMemoryStore, useSettingsStore } from '../../stores';
import MemoryList from '../../components/memory/MemoryList';
import ShareMemoryModal from '../../components/memory/ShareMemoryModal';
import AccessibleButton from '../../components/accessibility/AccessibleButton';

const MemoriesScreen: React.FC<MemoriesScreenProps> = ({ navigation, route }) => {
  const { filter = 'all' } = route.params || {};
  const {
    memories,
    filteredMemories,
    setFilters,
    clearFilters,
    loadingState,
    stats,
    calculateStats
  } = useMemoryStore();

  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const [selectedMemoryForShare, setSelectedMemoryForShare] = useState<Memory | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  // Apply initial filter based on route params
  useEffect(() => {
    const initialFilter = {
      ...(filter === 'favorites' && { isFavorite: true }),
      ...(filter === 'recent' && {
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      }),
      ...(filter === 'archived' && { isArchived: true }),
    };

    if (Object.keys(initialFilter).length > 0) {
      setFilters(initialFilter);
    } else {
      clearFilters();
    }
  }, [filter, setFilters, clearFilters]);

  // Calculate stats when screen is focused
  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [calculateStats])
  );

  // Handle hardware back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription?.remove();
    }, [navigation])
  );

  const handleMemoryPress = useCallback((memory: Memory) => {
    // Navigate to memory details or handle custom action
    if (navigation.getState().routes.find(route => route.name === 'MemoryDetails')) {
      navigation.navigate('MemoryDetails', { memoryId: memory.id });
    }
  }, [navigation]);

  const handleShareMemory = useCallback((memory: Memory) => {
    setSelectedMemoryForShare(memory);
    setShowShareModal(true);
  }, []);

  const handleCloseShare = useCallback(() => {
    setShowShareModal(false);
    setSelectedMemoryForShare(null);
  }, []);

  const getEmptyMessage = () => {
    switch (filter) {
      case 'favorites':
        return language === 'zh'
          ? '您还没有收藏的记忆。\n点击星星图标来收藏重要的记忆！'
          : 'You have no favorite memories yet.\nTap the star icon to favorite important memories!';
      case 'recent':
        return language === 'zh'
          ? '最近7天没有记忆。\n开始录制来记录最近的想法！'
          : 'No memories from the last 7 days.\nStart recording to capture recent thoughts!';
      case 'archived':
        return language === 'zh'
          ? '没有已归档的记忆。'
          : 'No archived memories.';
      default:
        return language === 'zh'
          ? '还没有记忆。\n开始录制来创建您的第一个记忆！'
          : 'No memories yet.\nStart recording to create your first memory!';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    header: {
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#444444' : '#e5e7eb',
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    title: {
      fontSize: fontSize + 6,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    subtitle: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '500',
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    content: {
      flex: 1,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    errorText: {
      fontSize: fontSize + 2,
      color: '#dc2626',
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 24,
    },
    retryButton: {
      paddingHorizontal: 32,
    },
  });

  // Handle critical errors
  if (loadingState.error && memories.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {language === 'zh'
              ? '加载记忆时出错\n请检查您的连接并重试'
              : 'Error loading memories\nPlease check your connection and try again'}
          </Text>
          <AccessibleButton
            title={language === 'zh' ? '重试' : 'Retry'}
            onPress={() => {
              // Trigger reload
              calculateStats();
            }}
            variant="primary"
            style={styles.retryButton}
            accessibilityLabel={language === 'zh' ? '重新加载记忆' : 'Reload memories'}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getFilterTitle = () => {
    switch (filter) {
      case 'favorites':
        return language === 'zh' ? '收藏的记忆' : 'Favorite Memories';
      case 'recent':
        return language === 'zh' ? '最近的记忆' : 'Recent Memories';
      case 'archived':
        return language === 'zh' ? '已归档记忆' : 'Archived Memories';
      default:
        return language === 'zh' ? '我的记忆' : 'My Memories';
    }
  };

  const getFilterSubtitle = () => {
    if (stats) {
      switch (filter) {
        case 'favorites':
          return `${stats.favoriteCount} ${language === 'zh' ? '个收藏' : 'favorites'}`;
        case 'recent':
          const recentCount = filteredMemories.length;
          return `${recentCount} ${language === 'zh' ? '个最近记忆' : 'recent memories'}`;
        default:
          return `${stats.totalCount} ${language === 'zh' ? '个记忆' : 'memories'}`;
      }
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>{getFilterTitle()}</Text>
            {getFilterSubtitle() && (
              <Text style={styles.subtitle}>{getFilterSubtitle()}</Text>
            )}
          </View>

          {/* Quick action button */}
          <AccessibleButton
            title={language === 'zh' ? '录制' : 'Record'}
            onPress={() => navigation.navigate('Recording')}
            variant="primary"
            style={styles.actionButton}
            accessibilityLabel={language === 'zh' ? '开始录制新记忆' : 'Start recording new memory'}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <MemoryList
          initialFilter={filter === 'all' ? {} :
            filter === 'favorites' ? { isFavorite: true } :
            filter === 'recent' ? { dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() } } :
            filter === 'archived' ? { isArchived: true } : {}
          }
          emptyMessage={getEmptyMessage()}
          onMemoryPress={handleMemoryPress}
          showSearch={true}
          showFilters={true}
        />
      </View>

      {/* Share Modal */}
      {selectedMemoryForShare && (
        <ShareMemoryModal
          visible={showShareModal}
          memory={selectedMemoryForShare}
          onClose={handleCloseShare}
        />
      )}
    </SafeAreaView>
  );
};

export default MemoriesScreen;