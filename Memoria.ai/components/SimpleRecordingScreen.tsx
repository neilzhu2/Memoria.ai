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

  // UI state
  const [showRecordingsList, setShowRecordingsList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savedMemory, setSavedMemory] = useState<MemoryItem | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Timer ref
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Track if recording has been stopped/unloaded
  const hasStoppedRecording = useRef(false);

  // Colors
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    if (!visible) {
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
  }, [visible]);

  // Request permissions
  useEffect(() => {
    if (visible) {
      requestPermissions();
    }
  }, [visible]);

  const requestPermissions = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'We need microphone permission to record your memories.',
          [{ text: 'OK' }]
        );
        onClose();
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
      if (uri) {
        await saveRecording();
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const saveRecording = async () => {
    console.log('saveRecording called', { currentRecordingUri, isRecording: audioRecorder.isRecording, recordingState });

    if (!currentRecordingUri) {
      console.error('No recording URI available');
      toastService.recordingFailed();
      return;
    }

    try {
      const title = selectedTheme?.title || `Recording ${new Date().toLocaleDateString()}`;

      console.log('Saving memory with:', { title, audioPath: currentRecordingUri, duration });

      // Save to context and get the memory object
      // NOTE: Using recording URI directly - file copy not needed for Expo Go
      // For production, we'll implement proper file management in Dev Build
      const newMemory = await addMemory({
        title,
        description: selectedTheme ? `Recording about: ${selectedTheme.title}` : undefined,
        date: new Date(),
        duration,
        audioPath: currentRecordingUri, // Use the recording URI directly
        tags: selectedTheme ? [selectedTheme.id] : [],
        isShared: false,
        familyMembers: [],
      });

      console.log('Memory saved successfully:', newMemory);
      console.log('Total memories after save:', memories.length + 1);

      // Show success toast
      toastService.memorySaved();

      // Start transcription in the background
      transcribeRecording(newMemory);

      // Show edit modal to review/edit the memory
      setSavedMemory(newMemory);
      setShowEditModal(true);

      console.log('EditMemoryModal should now be visible');

    } catch (error) {
      console.error('Failed to save recording:', error);
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
          style={[styles.recordButton, styles.recordButtonIdle]}
          onPress={startRecording}
          accessibilityLabel="Start recording"
        >
          <View style={styles.recordButtonInner} />
        </TouchableOpacity>
      );
    }

    // Single pause/resume button when recording or paused
    return (
      <TouchableOpacity
        style={[styles.recordButton, isPaused ? styles.recordButtonIdle : styles.pauseButton]}
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close recording"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: textColor }]}>
            {recordingState === 'stopped' ? 'Saving...' : 'New Recording'}
          </Text>

          {/* Done button - visible when recording or paused */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <TouchableOpacity
              style={styles.doneHeaderButton}
              onPress={stopRecording}
              accessibilityLabel="Stop and save recording"
            >
              <Text style={[styles.doneHeaderText, { color: tintColor }]}>Done</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  listButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  doneHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
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
    borderColor: '#e0e0e0',
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
    backgroundColor: '#e74c3c',
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#c0392b',
  },
  // Simplified button layout - single pause/record toggle
  pauseButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f39c12',
    shadowColor: '#f39c12',
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
    borderColor: '#e74c3c',
    backgroundColor: 'transparent',
  },
  saveButton: {
    borderColor: '#27ae60',
    backgroundColor: 'transparent',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});