import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality,
} from 'expo-audio';
import { File, Paths } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRecording } from '@/contexts/RecordingContext';
import { SimpleWaveform } from './SimpleWaveform';
import { RecordingTimer } from './RecordingTimer';
import { RecordingsList } from './RecordingsList';
import { EditMemoryModal } from './EditMemoryModal';
import { MemoryItem } from '@/types/memory';
import { getTranscriptionService } from '@/services/transcription/TranscriptionService';
import { toastService } from '@/services/toastService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Custom CAF recording preset for better expo-av compatibility
const CAF_RECORDING_PRESET = {
  extension: '.caf',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  ios: {
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

interface MemoryTheme {
  id: string;
  title: string;
  category?: {
    id: string;
    name: string;
    display_name: string;
    icon: string | null;
  };
}

interface SimpleRecordingScreenProps {
  visible: boolean;
  onClose: () => void;
  selectedTheme?: MemoryTheme;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

interface RecordingData {
  id: string;
  title: string;
  duration: number;
  uri: string;
  date: Date;
}

export function SimpleRecordingScreen({ visible, onClose, selectedTheme }: SimpleRecordingScreenProps) {
  const colorScheme = useColorScheme();
  const { addMemory, updateMemory, refreshStats, memories } = useRecording();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  // Use CAF/LINEARPCM format instead of HIGH_QUALITY m4a for expo-av compatibility
  const audioRecorder = useAudioRecorder(CAF_RECORDING_PRESET);
  const [duration, setDuration] = useState(0);
  const [currentRecordingUri, setCurrentRecordingUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Track if save is in progress

  // UI state
  const [showRecordingsList, setShowRecordingsList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savedMemory, setSavedMemory] = useState<MemoryItem | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Animation values for topic prompt
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const promptOpacity = useRef(new Animated.Value(1)).current;

  // Timer ref
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Track if recording has been stopped/unloaded
  const hasStoppedRecording = useRef(false);

  // Colors
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const errorColor = Colors[colorScheme ?? 'light'].elderlyError;
  const warningColor = Colors[colorScheme ?? 'light'].elderlyWarning;
  const successColor = Colors[colorScheme ?? 'light'].elderlySuccess;
  const goldColor = Colors[colorScheme ?? 'light'].highlight; // Honey gold for constructive actions

  useEffect(() => {
    console.log('[SimpleRecordingScreen] useEffect - visible changed:', {
      visible,
      isSaving,
      recordingState,
    });

    if (!visible) {
      // CRITICAL: Don't clean up if save is in progress
      if (isSaving) {
        console.log('[SimpleRecordingScreen] BLOCKED cleanup - save is in progress');
        return;
      }

      console.log('[SimpleRecordingScreen] Cleaning up when modal closes');
      // Clean up when modal closes
      stopTimer();
      if (audioRecorder.isRecording && recordingState !== 'idle' && !hasStoppedRecording.current) {
        stopRecording().catch(err => {
          console.log('Recording cleanup error:', err.message);
        });
      }
      setRecordingState('idle');
      setDuration(0);
      setWaveformData([]);
      setCurrentRecordingUri(null);
      hasStoppedRecording.current = false; // Reset for next recording
    }
  }, [visible, isSaving]);

  // Request permissions and auto-start recording
  useEffect(() => {
    if (visible) {
      requestPermissionsAndStart();
    }
  }, [visible]);

  // Fade-in animation for topic prompt on mount
  useEffect(() => {
    if (visible && selectedTheme?.title) {
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);

      // Start fade-in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, selectedTheme?.title]);

  // Adjust opacity when paused vs recording
  useEffect(() => {
    if (recordingState === 'paused') {
      Animated.timing(promptOpacity, {
        toValue: 0.6,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (recordingState === 'recording') {
      Animated.timing(promptOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [recordingState]);

  const requestPermissionsAndStart = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'We need microphone permission to record your memories.',
          [{ text: 'OK' }]
        );
        onClose();
      } else {
        // Auto-start recording after permission is granted
        console.log('Permission granted, auto-starting recording...');
        // Small delay to ensure UI is ready
        setTimeout(() => {
          startRecording();
        }, 300);
      }
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  const startTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    timerInterval.current = setInterval(() => {
      setDuration(prev => prev + 1);

      // Add random waveform data for visualization
      setWaveformData(prev => {
        const newData = [...prev, Math.random() * 100];
        // Keep only the last 50 data points for performance
        return newData.slice(-50);
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  };

  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reset stopped flag for new recording
      hasStoppedRecording.current = false;

      // Configure audio mode for recording
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Start recording
      await audioRecorder.record();

      setRecordingState('recording');
      setDuration(0);
      setWaveformData([]);
      startTimer();

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const pauseRecording = async () => {
    // Don't check audioRecorder.isRecording - trust our state instead
    if (recordingState !== 'recording') return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      console.log('[Pause] Attempting to pause recording');
      await audioRecorder.pause();
      console.log('[Pause] Successfully paused');
      setRecordingState('paused');
      stopTimer();
    } catch (error) {
      console.error('Failed to pause recording:', error);
      Alert.alert('Error', 'Failed to pause recording. Please try again.');
    }
  };

  const resumeRecording = async () => {
    // Don't check audioRecorder.isRecording - trust our state instead
    if (recordingState !== 'paused') return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log('[Resume] Attempting to resume recording');
      await audioRecorder.record();
      console.log('[Resume] Successfully resumed');
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error('Failed to resume recording:', error);
      Alert.alert('Error', 'Failed to resume recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (hasStoppedRecording.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      await audioRecorder.stop();
      hasStoppedRecording.current = true; // Mark as stopped

      // URI is available on audioRecorder.uri after stopping
      const uri = audioRecorder.uri;
      setCurrentRecordingUri(uri || null);
      setRecordingState('stopped');
      stopTimer();

      // Reset audio mode
      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      // Auto-save the recording immediately (simplified flow per wireframe)
      // Pass URI directly to avoid React state timing issues
      if (uri) {
        await saveRecording(uri);
      } else {
        console.error('No URI available from audioRecorder');
        toastService.recordingFailed();
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const saveRecording = async (recordingUri?: string) => {
    // Use passed URI or fall back to state (for potential future direct calls)
    const uri = recordingUri || currentRecordingUri;

    console.log('[saveRecording] START - Called with:', {
      recordingUri: recordingUri?.substring(0, 50) + '...',
      currentRecordingUri: currentRecordingUri?.substring(0, 50) + '...',
      uri: uri?.substring(0, 50) + '...',
      isRecording: audioRecorder.isRecording,
      recordingState,
      duration,
    });

    if (!uri) {
      console.error('[saveRecording] ERROR: No recording URI available');
      toastService.recordingFailed();
      return;
    }

    // Set saving flag to prevent modal from closing prematurely
    console.log('[saveRecording] Setting isSaving = true');
    setIsSaving(true);

    try {
      const title = selectedTheme?.title || `Recording ${new Date().toLocaleDateString()}`;
      console.log('[saveRecording] Recording title:', title);
      console.log('[saveRecording] Preparing to call addMemory...');

      const memoryData = {
        title,
        description: selectedTheme ? `Recording about: ${selectedTheme.title}` : undefined,
        date: new Date(),
        duration,
        audioPath: uri,  // MemoryItem type uses audioPath
        tags: selectedTheme ? [selectedTheme.id] : [],
        isShared: false,
        familyMembers: [],
        topicId: selectedTheme?.id,  // Save topic ID for auto-dismiss
      };

      console.log('[saveRecording] Memory data prepared:', {
        title: memoryData.title,
        duration: memoryData.duration,
        audioPath: memoryData.audioPath?.substring(0, 50) + '...',
        tagsCount: memoryData.tags.length,
      });

      console.log('[saveRecording] Calling addMemory (await)...');
      const startTime = Date.now();

      // Save to context and get the memory object
      // NOTE: Using recording URI directly - file copy not needed for Expo Go
      // For production, we'll implement proper file management in Dev Build
      const newMemory = await addMemory(memoryData);

      const endTime = Date.now();
      console.log(`[saveRecording] addMemory completed in ${endTime - startTime}ms`);
      console.log('[saveRecording] Memory saved successfully:', {
        id: newMemory.id,
        title: newMemory.title,
        duration: newMemory.duration,
      });
      console.log('[saveRecording] Total memories after save:', memories.length + 1);

      // Clear saving flag
      console.log('[saveRecording] Setting isSaving = false');
      setIsSaving(false);

      // Show success toast
      console.log('[saveRecording] Showing success toast');
      toastService.memorySaved();

      // Start transcription in the background
      console.log('[saveRecording] Starting transcription...');
      transcribeRecording(newMemory);

      // Show edit modal to review/edit the memory
      console.log('[saveRecording] Setting savedMemory and showing edit modal');
      setSavedMemory(newMemory);
      setShowEditModal(true);

      console.log('[saveRecording] SUCCESS - EditMemoryModal should now be visible');

    } catch (error) {
      console.error('[saveRecording] ERROR - Failed to save recording:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Clear saving flag on error
      console.log('[saveRecording] Setting isSaving = false (error path)');
      setIsSaving(false);

      toastService.memorySaveFailed(error instanceof Error ? error.message : undefined);
    }
  };

  const transcribeRecording = async (memory: MemoryItem) => {
    try {
      console.log('Starting mock transcription for memory:', memory.id);

      // Show transcription starting toast
      toastService.transcriptionStarted();

      // Simulate processing delay (2 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock transcription text based on recording title
      const mockTranscript = `This is a mock transcription of your recording about "${memory.title}". In a production environment, this would contain the actual speech-to-text conversion of your audio recording. The transcription feature uses on-device processing to convert your voice into searchable text, making it easy to find and review your memories later.`;

      console.log('Mock transcription generated:', mockTranscript.substring(0, 50) + '...');

      // Update the memory with mock transcription
      await updateMemory(memory.id, {
        transcription: mockTranscript,
      });

      // Update the savedMemory state so the modal shows the transcription
      setSavedMemory(prev => prev ? { ...prev, transcription: mockTranscript } : null);

      console.log('Mock transcription saved successfully');

      // Show completion toast
      toastService.transcriptionComplete();
    } catch (error) {
      console.error('Mock transcription failed:', error);
      toastService.transcriptionFailed();
    }
  };

  const handleSaveMemoryEdits = async (updates: Partial<MemoryItem>) => {
    if (!savedMemory) return;

    console.log('handleSaveMemoryEdits - updating memory:', savedMemory.id);
    console.log('Current memories count before update:', memories.length);

    await updateMemory(savedMemory.id, updates);

    console.log('Memory updated, refreshing stats...');
    refreshStats();

    console.log('Closing modals and recording screen...');
    setShowEditModal(false);
    setSavedMemory(null);
    onClose(); // Close the recording screen after editing

    console.log('handleSaveMemoryEdits complete. Memories count:', memories.length);
  };

  // Removed discardRecording - auto-save flow per wireframe

  const renderRecordingButton = () => {
    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isIdle = recordingState === 'idle';
    const isStopped = recordingState === 'stopped';

    // Hide button when stopped (auto-saving)
    if (isStopped) {
      return null;
    }

    if (isIdle) {
      return (
        <TouchableOpacity
          style={[
            styles.recordButton,
            styles.recordButtonIdle,
            { backgroundColor: errorColor, shadowColor: errorColor }
          ]}
          onPress={startRecording}
          accessibilityLabel="Start recording"
        >
          <View style={[styles.recordButtonInner, { backgroundColor: Colors[colorScheme ?? 'light'].elderlyHighContrast, opacity: 0.1 }]} />
        </TouchableOpacity>
      );
    }

    // Single pause/resume button when recording or paused
    return (
      <TouchableOpacity
        style={[
          styles.recordButton,
          isPaused ? styles.recordButtonIdle : styles.pauseButton,
          isPaused
            ? { backgroundColor: errorColor, shadowColor: errorColor }
            : { backgroundColor: warningColor, shadowColor: warningColor }
        ]}
        onPress={isPaused ? resumeRecording : pauseRecording}
        accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
      >
        <IconSymbol
          name={isPaused ? "play.fill" : "pause.fill"}
          size={40}
          color="white"
        />
      </TouchableOpacity>
    );
  };

  // Removed renderDoneSection - auto-save flow per wireframe

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor + '40' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close recording"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            {/* Category Badge */}
            {selectedTheme?.category && (
              <View style={[styles.categoryBadge, {
                backgroundColor: Colors[colorScheme ?? 'light'].highlight + '20',
                borderColor: Colors[colorScheme ?? 'light'].highlight + '40'
              }]}>
                <Text style={styles.categoryIcon}>{selectedTheme.category.icon}</Text>
                <Text style={[styles.categoryName, { color: Colors[colorScheme ?? 'light'].highlight }]}>
                  {selectedTheme.category.display_name}
                </Text>
              </View>
            )}

            {/* Topic Prompt with animation */}
            {selectedTheme?.title ? (
              <Animated.Text
                style={[
                  styles.topicPrompt,
                  {
                    color: borderColor,
                    opacity: Animated.multiply(fadeAnim, promptOpacity),
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
                numberOfLines={3}
                ellipsizeMode="tail"
                accessibilityLabel={`Recording prompt: ${selectedTheme.title}`}
              >
                {selectedTheme.title}
              </Animated.Text>
            ) : (
              <Text style={[styles.headerTitle, { color: textColor }]}>
                {isSaving || recordingState === 'stopped' ? 'Saving...' : 'New Recording'}
              </Text>
            )}
          </View>

          {/* Done button - visible when recording or paused */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <TouchableOpacity
              style={styles.doneHeaderButton}
              onPress={stopRecording}
              accessibilityLabel="Stop and save recording"
            >
              <Text style={[styles.doneHeaderText, { color: goldColor }]}>Done</Text>
            </TouchableOpacity>
          )}
          {recordingState === 'idle' || recordingState === 'stopped' ? (
            <View style={styles.listButton} />
          ) : null}
        </View>

        {/* Theme indicator removed - simplified design per wireframe */}

        {/* Main recording area */}
        <View style={styles.recordingArea}>
          {/* Timer */}
          <RecordingTimer
            duration={duration}
            isActive={recordingState === 'recording'}
          />

          {/* Waveform */}
          <SimpleWaveform
            data={waveformData}
            isActive={recordingState === 'recording'}
            color={tintColor}
          />

          {/* Recording Button */}
          <View style={styles.buttonContainer}>
            {renderRecordingButton()}
          </View>
        </View>

        {/* Recordings List Modal */}
        <RecordingsList
          visible={showRecordingsList}
          onClose={() => setShowRecordingsList(false)}
        />

        {/* Edit Memory Modal */}
        <EditMemoryModal
          visible={showEditModal}
          memory={savedMemory}
          onSave={handleSaveMemoryEdits}
          onClose={() => setShowEditModal(false)}
          isFirstTimeSave={true}
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
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  headerTitleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  topicPrompt: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 20,
    maxWidth: '85%',
  },
  listButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  doneHeaderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  doneHeaderText: {
    fontSize: 17,
    fontWeight: '600',
  },
  themeIndicator: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  recordingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonIdle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  // Simplified button layout - single pause/record toggle
  pauseButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
  },
  doneButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  discardButton: {
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: 'transparent',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});