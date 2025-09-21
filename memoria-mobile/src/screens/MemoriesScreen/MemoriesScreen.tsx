/**
 * Memories Screen for Memoria.ai
 * List view of all memories with filtering and search
 * Optimized for elderly users with large touch targets and clear typography
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MemoriesScreenProps, Memory } from '../../types';
import { useMemoryStore, useSettingsStore } from '../../stores';

const MemoriesScreen: React.FC<MemoriesScreenProps> = ({ navigation, route }) => {
  const { filter = 'all' } = route.params || {};
  const { memories, filteredMemories, searchMemories, setFilters } = useMemoryStore();
  const { getCurrentFontSize, getCurrentTouchTargetSize, shouldUseHighContrast } = useSettingsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  useEffect(() => {
    // Apply initial filter based on route params
    if (filter === 'favorites') {
      setFilters({ isFavorite: true });
    } else if (filter === 'recent') {
      setFilters({ dateRange: { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() } });
    }
  }, [filter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchMemories(query);
  };

  const handleMemoryPress = (memoryId: string) => {
    navigation.navigate('MemoryDetails', { memoryId });
  };

  const renderMemoryItem = ({ item }: { item: Memory }) => (
    <TouchableOpacity
      style={styles.memoryCard}
      onPress={() => handleMemoryPress(item.id)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${item.title}, recorded on ${item.createdAt.toLocaleDateString()}`}
    >
      <View style={styles.memoryHeader}>
        <Text style={styles.memoryTitle} numberOfLines={2}>
          {item.isFavorite ? '⭐ ' : ''}{item.title}
        </Text>
        <Text style={styles.memoryDate}>
          {item.createdAt.toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.memoryDescription} numberOfLines={3}>
        {item.transcription || item.description || 'No transcription available'}
      </Text>
      <View style={styles.memoryMeta}>
        <Text style={styles.metaText}>
          Duration: {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
        </Text>
        <Text style={styles.metaText}>
          Language: {item.language.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    searchContainer: {
      padding: 16,
      backgroundColor: highContrast ? '#333333' : '#ffffff',
    },
    searchInput: {
      height: touchTargetSize,
      borderWidth: 1,
      borderColor: highContrast ? '#666666' : '#d1d5db',
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#1f2937',
      backgroundColor: highContrast ? '#666666' : '#ffffff',
    },
    memoryCard: {
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderRadius: 12,
      minHeight: touchTargetSize,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    memoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    memoryTitle: {
      flex: 1,
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginRight: 8,
    },
    memoryDate: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
    },
    memoryDescription: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#374151',
      lineHeight: fontSize * 1.4,
      marginBottom: 12,
    },
    memoryMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    metaText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: fontSize + 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      lineHeight: (fontSize + 2) * 1.5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search memories..."
          placeholderTextColor={highContrast ? '#999999' : '#9ca3af'}
          value={searchQuery}
          onChangeText={handleSearch}
          accessible={true}
          accessibilityLabel="Search memories"
          accessibilityHint="Type to search through your memories"
        />
      </View>

      <FlatList
        data={filteredMemories.length > 0 ? filteredMemories : memories}
        renderItem={renderMemoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No memories found matching your search.' : 'No memories yet.\nStart recording to create your first memory!'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default MemoriesScreen;