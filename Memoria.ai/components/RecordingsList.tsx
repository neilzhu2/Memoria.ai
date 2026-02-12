import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRecording } from '@/contexts/RecordingContext';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { MemoryItem } from '@/types/memory';
import { toastService } from '@/services/toastService';

interface RecordingsListProps {
  visible: boolean;
  onClose: () => void;
}

export function RecordingsList({ visible, onClose }: RecordingsListProps) {
  const colorScheme = useColorScheme();
  const { memories, removeMemory } = useRecording();

  // Use shared audio playback hook
  const {
    playingId,
    playbackPosition,
    playbackDuration,
    isPlaying,
    togglePlayPause,
    stopPlayback,
    skipBackward,
    skipForward,
  } = useAudioPlayback();

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };


  const deleteRecording = (memory: MemoryItem) => {
    Alert.alert(
      'Delete Recording',
      `Are you sure you want to delete "${memory.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Stop playback if this memory is playing
              if (playingId === memory.id) {
                await stopPlayback();
              }
              await removeMemory(memory.id);
              toastService.memoryDeleted();
            } catch (error) {
              console.error('Failed to delete memory:', error);
              toastService.memoryDeleteFailed();
            }
          }
        }
      ]
    );
  };

  const renderMemoryItem = ({ item: memory }: { item: MemoryItem }) => {
    const isCurrentMemory = playingId === memory.id;
    const showPlaybackControls = isCurrentMemory;

    return (
      <View style={[styles.memoryItem, { backgroundColor, borderColor }]}>
        {/* Header with title and delete */}
        <View style={styles.memoryHeader}>
          <Text
            style={[styles.memoryTitle, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {memory.title}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteRecording(memory)}
            accessibilityLabel={`Delete recording: ${memory.title}`}
          >
            <IconSymbol name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>

        {/* Playback Controls */}
        {showPlaybackControls ? (
          <View style={styles.playbackControlsContainer}>
            {/* Time and Progress */}
            <View style={styles.progressSection}>
              <Text style={[styles.timeText, { color: borderColor }]}>
                {formatTime(playbackPosition)} / {formatTime(playbackDuration)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: borderColor + '30' }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: tintColor,
                      width: `${(playbackPosition / (playbackDuration || 1)) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Control Buttons */}
            <View style={styles.controlButtons}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: tintColor + '20' }]}
                onPress={skipBackward}
                accessibilityLabel="Rewind 15 seconds"
              >
                <IconSymbol name="gobackward.15" size={24} color={tintColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.playPauseButton, { backgroundColor: tintColor }]}
                onPress={() => memory.audioPath && togglePlayPause(memory.id, memory.audioPath, memory.localAudioPath)}
                accessibilityLabel={isPlaying ? "Pause" : "Play"}
              >
                <IconSymbol
                  name={isPlaying ? "pause.fill" : "play.fill"}
                  size={28}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: tintColor + '20' }]}
                onPress={skipForward}
                accessibilityLabel="Forward 15 seconds"
              >
                <IconSymbol name="goforward.15" size={24} color={tintColor} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.compactView}>
            <TouchableOpacity
              style={[styles.playButton, { backgroundColor: tintColor }]}
              onPress={() => memory.audioPath && togglePlayPause(memory.id, memory.audioPath)}
              accessibilityLabel={`Play recording: ${memory.title}`}
            >
              <IconSymbol name="play.fill" size={20} color="white" />
            </TouchableOpacity>

            <View style={styles.memoryInfo}>
              <View style={styles.memoryMeta}>
                <Text style={[styles.memoryDuration, { color: borderColor }]}>
                  {formatDuration(memory.duration)}
                </Text>
                <Text style={[styles.memoryDate, { color: borderColor }]}>
                  {formatDate(memory.date)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="mic.slash" size={48} color={borderColor} />
      <Text style={[styles.emptyTitle, { color: textColor }]}>
        No recordings yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: borderColor }]}>
        Your saved voice memos will appear here
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close recordings list"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: textColor }]}>
            Voice Memos
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Recordings list */}
        <FlatList
          data={memories.filter(memory => memory.audioPath)} // Only show memories with audio
          renderItem={renderMemoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  memoryItem: {
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  compactView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryInfo: {
    flex: 1,
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memoryDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  memoryDate: {
    fontSize: 16,
  },
  playbackControlsContainer: {
    gap: 16,
  },
  progressSection: {
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});