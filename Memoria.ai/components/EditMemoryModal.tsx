import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { MemoryItem } from '@/types/memory';

interface EditMemoryModalProps {
  visible: boolean;
  memory: MemoryItem | null;
  onSave: (updates: Partial<MemoryItem>) => Promise<void>;
  onClose: () => void;
}

export function EditMemoryModal({ visible, memory, onSave, onClose }: EditMemoryModalProps) {
  const colorScheme = useColorScheme();

  const [title, setTitle] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  // Initialize form when memory changes
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setTranscription(memory.transcription || memory.description || '');
      setHasChanges(false);
    }
  }, [memory]);

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!visible) {
      stopPlayback();
    }
  }, [visible]);

  // Track changes
  useEffect(() => {
    if (!memory) return;

    const changed =
      title !== memory.title ||
      transcription !== (memory.transcription || memory.description || '');

    setHasChanges(changed);
  }, [title, transcription, memory]);

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
      Alert.alert('Title Required', 'Please enter a title for your memory.');
      return;
    }

    try {
      setIsSaving(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updates: Partial<MemoryItem> = {
        title: title.trim(),
        transcription: transcription.trim() || undefined,
        updatedAt: new Date(),
      };

      await onSave(updates);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Failed to save memory:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
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
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: borderColor }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close edit screen"
              accessibilityRole="button"
            >
              <IconSymbol name="xmark" size={24} color={textColor} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: textColor }]}>
              Edit Memory
            </Text>

            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: hasChanges && !isSaving ? tintColor : borderColor + '50',
                },
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
              accessibilityLabel="Save changes"
              accessibilityRole="button"
              accessibilityHint="Saves your edits to this memory"
            >
              {isSaving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <IconSymbol name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Audio Playback Section */}
            {memory.audioPath && (
              <View style={[styles.section, styles.audioSection]}>
                {/* Progress and Time */}
                <View style={styles.progressSection}>
                  <Text style={[styles.timeText, { color: textColor }]}>
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

                {/* Playback Controls */}
                <View style={styles.audioControls}>
                  <TouchableOpacity
                    style={[styles.audioControlButton, { backgroundColor: tintColor + '20' }]}
                    onPress={skipBackward}
                    accessibilityLabel="Rewind 15 seconds"
                  >
                    <IconSymbol name="gobackward.15" size={28} color={tintColor} />
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
                    accessibilityLabel="Forward 15 seconds"
                  >
                    <IconSymbol name="goforward.15" size={28} color={tintColor} />
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
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Memory transcription"
                accessibilityHint="Edit or add transcription for this memory"
              />
              <Text style={[styles.charCount, { color: borderColor }]}>
                {transcription.length}/500
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
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
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
    minHeight: 120,
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
});
