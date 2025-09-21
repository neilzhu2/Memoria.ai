/**
 * MemoryCard Component for Memoria.ai
 * Large, accessible card displaying memory information with playback controls
 * Optimized for elderly users with clear visual hierarchy and large touch targets
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Memory } from '../../types';
import { useSettingsStore, useMemoryStore } from '../../stores';
import AccessibleButton from '../accessibility/AccessibleButton';
import PlaybackControls from './PlaybackControls';

interface MemoryCardProps {
  memory: Memory;
  onPress?: (memory: Memory) => void;
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void;
  onShare?: (memory: Memory) => void;
  showActions?: boolean;
  showPlayback?: boolean;
  style?: ViewStyle;
}

const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  onPress,
  onEdit,
  onDelete,
  onShare,
  showActions = true,
  showPlayback = true,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled
  } = useSettingsStore();

  const { toggleFavoriteMemory } = useMemoryStore();

  const [isExpanded, setIsExpanded] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const handleCardPress = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (onPress) {
      onPress(memory);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleFavoritePress = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavoriteMemory(memory.id);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const getLanguageDisplay = (lang: string): string => {
    switch (lang) {
      case 'en': return 'English';
      case 'zh': return 'Chinese';
      case 'auto': return 'Auto-detect';
      default: return lang.toUpperCase();
    }
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: highContrast ? 0.3 : 0.1,
      shadowRadius: 6,
      elevation: 5,
      borderWidth: highContrast ? 2 : 0,
      borderColor: highContrast ? '#666666' : 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    titleContainer: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
      lineHeight: (fontSize + 4) * 1.3,
      marginBottom: 4,
    },
    favoriteButton: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: touchTargetSize / 2,
      backgroundColor: memory.isFavorite
        ? '#fbbf24'
        : (highContrast ? '#555555' : '#f3f4f6'),
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    metadata: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    metaText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '500',
    },
    dateText: {
      fontSize: fontSize - 1,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '500',
    },
    transcriptionPreview: {
      fontSize: fontSize,
      color: highContrast ? '#e5e5e5' : '#374151',
      lineHeight: fontSize * 1.5,
      marginBottom: 16,
    },
    showMoreButton: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    showMoreText: {
      fontSize: fontSize - 1,
      color: '#2563eb',
      fontWeight: '600',
    },
    description: {
      fontSize: fontSize,
      color: highContrast ? '#e5e5e5' : '#374151',
      lineHeight: fontSize * 1.5,
      marginBottom: 16,
      fontStyle: 'italic',
    },
    playbackSection: {
      marginBottom: 16,
    },
    actionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      gap: 12,
      marginTop: 8,
    },
    actionButton: {
      flex: 1,
      minHeight: touchTargetSize - 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    editButton: {
      backgroundColor: highContrast ? '#555555' : '#e5e7eb',
    },
    shareButton: {
      backgroundColor: '#2563eb',
    },
    deleteButton: {
      backgroundColor: '#dc2626',
    },
    actionText: {
      fontSize: fontSize - 1,
      fontWeight: '600',
    },
    editText: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    shareText: {
      color: '#ffffff',
    },
    deleteText: {
      color: '#ffffff',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    tag: {
      backgroundColor: highContrast ? '#555555' : '#e5e7eb',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tagText: {
      fontSize: fontSize - 3,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
    },
  });

  const truncatedTranscription = memory.transcription.length > 120
    ? `${memory.transcription.substring(0, 120)}...`
    : memory.transcription;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={handleCardPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Memory: ${memory.title}. Recorded on ${formatDate(memory.createdAt)}. Duration: ${formatDuration(memory.duration)}. ${memory.isFavorite ? 'Favorited.' : ''}`}
      accessibilityHint="Tap to expand and view details"
      activeOpacity={0.7}
    >
      {/* Header with title and favorite button */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={isExpanded ? undefined : 2}>
            {memory.title}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={memory.isFavorite ? "Remove from favorites" : "Add to favorites"}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={memory.isFavorite ? "star" : "star-outline"}
            size={fontSize + 6}
            color={memory.isFavorite ? "#ffffff" : (highContrast ? "#cccccc" : "#6b7280")}
          />
        </TouchableOpacity>
      </View>

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.dateText}>
          {formatDate(memory.createdAt)}
        </Text>
        <Text style={styles.metaText}>
          {formatDuration(memory.duration)} • {getLanguageDisplay(memory.language)}
        </Text>
      </View>

      {/* Description if available */}
      {memory.description && (
        <Text style={styles.description} numberOfLines={isExpanded ? undefined : 2}>
          {memory.description}
        </Text>
      )}

      {/* Transcription preview */}
      {memory.transcription && (
        <>
          <Text style={styles.transcriptionPreview} numberOfLines={isExpanded ? undefined : 3}>
            {isExpanded ? memory.transcription : truncatedTranscription}
          </Text>

          {memory.transcription.length > 120 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setIsExpanded(!isExpanded)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? "Show less" : "Show more"}
            >
              <Text style={styles.showMoreText}>
                {isExpanded ? "Show less" : "Show more"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {memory.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Playback controls when expanded */}
      {isExpanded && showPlayback && (
        <View style={styles.playbackSection}>
          <PlaybackControls
            memory={memory}
            showTitle={false}
            compact={false}
          />
        </View>
      )}

      {/* Action buttons when expanded */}
      {isExpanded && showActions && (
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(memory)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Edit memory"
            >
              <Ionicons name="pencil" size={fontSize} color={styles.editText.color} />
              <Text style={[styles.actionText, styles.editText]}>Edit</Text>
            </TouchableOpacity>
          )}

          {onShare && (
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={() => onShare(memory)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Share memory"
            >
              <Ionicons name="share" size={fontSize} color="#ffffff" />
              <Text style={[styles.actionText, styles.shareText]}>Share</Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => onDelete(memory)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Delete memory"
            >
              <Ionicons name="trash" size={fontSize} color="#ffffff" />
              <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MemoryCard;