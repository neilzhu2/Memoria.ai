import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { MemoryItem } from '@/types/memory';
import { toastService } from '@/services/toastService';

interface EditMemoryModalProps {
  visible: boolean;
  memory: MemoryItem | null;
  onSave: (updates: Partial<MemoryItem>) => Promise<void>;
  onDelete?: () => Promise<void>; // Optional delete handler
  onClose: () => void;
  isFirstTimeSave?: boolean; // If true, enable save button immediately
}

export function EditMemoryModal({ visible, memory, onSave, onDelete, onClose, isFirstTimeSave = false }: EditMemoryModalProps) {
  const colorScheme = useColorScheme();

  const [title, setTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isHeroCollapsed, setIsHeroCollapsed] = useState(false);

  // Animated value for hero section height
  const heroHeight = useRef(new Animated.Value(1)).current; // 1 = full, 0 = collapsed

  // Audio playback
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
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const errorColor = Colors[colorScheme ?? 'light'].elderlyError;

  // Initialize form when memory changes
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setTranscription(memory.transcription || memory.description || '');
      // If first-time save, enable save button immediately
      setHasChanges(isFirstTimeSave);
    }
  }, [memory, isFirstTimeSave]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!visible) {
      stopPlayback();
      // Reset hero to expanded state when modal closes
      setIsHeroCollapsed(false);
      heroHeight.setValue(1);
    }
  }, [visible]);

  // Keyboard listeners for hero collapse/expand
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setIsHeroCollapsed(true);
        Animated.timing(heroHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setIsHeroCollapsed(false);
        Animated.timing(heroHeight, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [heroHeight]);

  // Track changes
  useEffect(() => {
    if (!memory) return;

    const changed =
      title !== memory.title ||
      transcription !== (memory.transcription || memory.description || '');

    // For first-time saves, always keep hasChanges true
    // For editing existing memories, track actual changes
    setHasChanges(isFirstTimeSave || changed);
  }, [title, transcription, memory, isFirstTimeSave]);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!memory) return;

    // Validation
    if (title.trim().length === 0) {
      toastService.warning('Title Required', 'Please enter a title for your memory.');
      return;
    }

    try {
      setIsSaving(true);

      const updates: Partial<MemoryItem> = {
        title: title.trim(),
        transcription: transcription.trim() || undefined,
        updatedAt: new Date(),
      };

      await onSave(updates);

      // Show success toast based on whether it's first save or edit
      if (isFirstTimeSave) {
        toastService.memorySaved();
      } else {
        toastService.memoryUpdated();
      }

      onClose();
    } catch (error) {
      console.error('Failed to save memory:', error);
      if (isFirstTimeSave) {
        toastService.memorySaveFailed(error instanceof Error ? error.message : undefined);
      } else {
        toastService.memoryUpdateFailed();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setHasChanges(false);
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!memory || !onDelete) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Memory?',
      `Are you sure you want to delete "${memory.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              await onDelete();
              onClose();
            } catch (error) {
              console.error('Failed to delete memory:', error);
              toastService.memoryDeleteFailed();
            }
          },
        },
      ]
    );
  };

  if (!memory) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header - Clean with just close and save buttons */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close edit screen"
              accessibilityRole="button"
            >
              <IconSymbol name="xmark" size={24} color={textColor} />
            </TouchableOpacity>

            {/* Compact title - shown when hero is collapsed */}
            {isHeroCollapsed && (
              <View style={styles.compactTitleContainer}>
                <Text
                  style={[styles.compactTitle, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {memory.title || 'Untitled Memory'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              accessibilityHint="Saves your edits to this memory"
            >
              {isSaving ? (
                <ActivityIndicator color={tintColor} size="small" />
              ) : (
                <Text
                  style={[
                    styles.saveButtonText,
                    {
                      color: hasChanges ? tintColor : borderColor,
                      opacity: hasChanges ? 1 : 0.5,
                    },
                  ]}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Hero Memory Section - Animated collapsible */}
          <Animated.View
            style={[
              styles.memoryHeroSection,
              {
                borderBottomColor: borderColor + '20',
                maxHeight: heroHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200], // 0px when collapsed, 200px when full
                }),
                opacity: heroHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.5, 1], // Fade out as it collapses
                }),
                overflow: 'hidden',
              },
            ]}
          >
            {/* Category Badge - Small and subtle */}
            {memory.category && (
              <View style={[styles.categoryBadgeHero, {
                backgroundColor: tintColor + '12',
                borderColor: tintColor + '25'
              }]}>
                {memory.category.icon && (
                  <Text style={styles.categoryIconHero}>
                    {memory.category.icon}
                  </Text>
                )}
                <Text style={[styles.categoryNameHero, { color: tintColor }]}>
                  {memory.category.display_name}
                </Text>
              </View>
            )}

            {/* Memory Title - Hero size */}
            <Text
              style={[styles.memoryTitleHero, { color: textColor }]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {memory.title || 'Untitled Memory'}
            </Text>

            {/* Recording date indicator */}
            <Text style={[styles.recordingDateBadge, { color: borderColor }]}>
              Recorded {memory.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </Text>
          </Animated.View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.contentContainer,
              {
                paddingTop: isHeroCollapsed ? 0 : 20,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Audio Playback Section */}
            {memory.audioPath && (
              <View style={[styles.section, styles.audioSection]}>
                {/* Progress and Time */}
                <View style={styles.progressSection}>
                  <Text style={[styles.timeText, { color: textColor }]}>
                    {formatTime(playbackPosition)} / {formatTime(playbackDuration || memory.duration * 1000)}
                  </Text>
                  <View style={[styles.progressBar, { backgroundColor: borderColor + '30' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: tintColor,
                          width: `${(playbackPosition / ((playbackDuration || memory.duration * 1000) || 1)) * 100}%`,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Playback Controls */}
                <View style={styles.audioControls}>
                  <TouchableOpacity
                    style={[styles.audioControlButton, { backgroundColor: tintColor + '20' }]}
                    onPress={skipBackward}
                    accessibilityLabel="Rewind 10 seconds"
                  >
                    <IconSymbol name="gobackward.10" size={28} color={tintColor} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.audioControlButton, styles.playPauseButton, { backgroundColor: tintColor }]}
                    onPress={() => memory.audioPath && togglePlayPause(memory.id, memory.audioPath)}
                    accessibilityLabel={isPlaying ? "Pause" : "Play"}
                  >
                    <IconSymbol
                      name={isPlaying ? "pause.fill" : "play.fill"}
                      size={32}
                      color="white"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.audioControlButton, { backgroundColor: tintColor + '20' }]}
                    onPress={skipForward}
                    accessibilityLabel="Forward 10 seconds"
                  >
                    <IconSymbol name="goforward.10" size={28} color={tintColor} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Title Field */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>
                Title <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: borderColor + '20', color: textColor }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter memory title"
                placeholderTextColor={borderColor}
                maxLength={100}
                accessibilityLabel="Memory title"
                accessibilityHint="Enter a title for this memory"
                returnKeyType="next"
              />
              <Text style={[styles.charCount, { color: borderColor }]}>
                {title.length}/100
              </Text>
            </View>

            {/* Transcription Field */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: textColor }]}>
                Transcription
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: borderColor + '20', color: textColor },
                ]}
                value={transcription}
                onChangeText={setTranscription}
                placeholder="Transcription will appear here automatically..."
                placeholderTextColor={borderColor}
                maxLength={5000}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Memory transcription"
                accessibilityHint="Edit or add transcription for this memory"
              />
              <Text style={[styles.charCount, { color: borderColor }]}>
                {transcription.length}/5000
              </Text>
            </View>

            {/* Metadata Display */}
            <View style={[styles.metadata, { borderTopColor: borderColor }]}>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: borderColor }]}>
                  Recorded:
                </Text>
                <Text style={[styles.metadataValue, { color: textColor }]}>
                  {memory.date.toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={[styles.metadataLabel, { color: borderColor }]}>
                  Duration:
                </Text>
                <Text style={[styles.metadataValue, { color: textColor }]}>
                  {Math.floor(memory.duration / 60)}:{(memory.duration % 60)
                    .toString()
                    .padStart(2, '0')}
                </Text>
              </View>
            </View>

            {/* Delete Button */}
            {onDelete && !isFirstTimeSave && (
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: errorColor + '20', borderColor: errorColor }]}
                onPress={handleDelete}
                accessibilityLabel="Delete memory"
                accessibilityRole="button"
                accessibilityHint="Permanently delete this memory"
              >
                <IconSymbol name="trash" size={24} color={errorColor} />
                <Text style={[styles.deleteButtonText, { color: errorColor }]}>Delete Memory</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitleContainer: {
    position: 'absolute',
    left: 72,
    right: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  memoryHeroSection: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  categoryIconHero: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryNameHero: {
    fontSize: 14,
    fontWeight: '600',
  },
  memoryTitleHero: {
    fontSize: 24,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '90%',
  },
  recordingDateBadge: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 12,
  },
  saveButton: {
    minWidth: 56,
    height: 56,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20, // Dynamic in component based on hero state
  },
  section: {
    marginBottom: 28,
  },
  transcriptionSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  required: {
    color: '#e74c3c',
  },
  transcriptionBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  input: {
    fontSize: 18,
    padding: 16,
    borderRadius: 12,
    minHeight: 60,
  },
  textArea: {
    minHeight: 400,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 8,
  },
  metadata: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 16,
  },
  metadataValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Audio playback styles
  audioSection: {
    marginBottom: 32,
  },
  progressSection: {
    marginBottom: 20,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  audioControlButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    marginTop: 24,
    borderRadius: 12,
    borderWidth: 2,
    gap: 12,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
