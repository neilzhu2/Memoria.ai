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
  requestRecordingPermissionsAsync
} from 'expo-audio';
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
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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
    if (!audioRecorder.isRecording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await audioRecorder.pause();
      setRecordingState('paused');
      stopTimer();
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    if (audioRecorder.isRecording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await audioRecorder.record();
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async () => {
    if (hasStoppedRecording.current) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const uri = await audioRecorder.stop();
      hasStoppedRecording.current = true; // Mark as stopped

      setCurrentRecordingUri(uri);
      setRecordingState('stopped');
      stopTimer();

      // Reset audio mode
      await AudioModule.setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

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
      const newMemory = await addMemory({
        title,
        description: selectedTheme ? `Recording about: ${selectedTheme.title}` : undefined,
        date: new Date(),
        duration,
        audioPath: currentRecordingUri,
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

  const discardRecording = () => {
    Alert.alert(
      'Discard Recording?',
      'Are you sure you want to discard this recording?',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setRecordingState('idle');
            setDuration(0);
            setCurrentRecordingUri(null);
            setWaveformData([]);
          }
        }
      ]
    );
  };

  const renderRecordingButton = () => {
    const isRecording = recordingState === 'recording';
    const isPaused = recordingState === 'paused';
    const isIdle = recordingState === 'idle';

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

    return (
      <View style={styles.recordingControls}>
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={isPaused ? resumeRecording : pauseRecording}
          accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
        >
          <IconSymbol
            name={isPaused ? "play.fill" : "pause.fill"}
            size={28}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.stopButton]}
          onPress={stopRecording}
          accessibilityLabel="Stop recording"
        >
          <IconSymbol name="stop.fill" size={28} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderDoneSection = () => {
    if (recordingState !== 'stopped') return null;

    return (
      <View style={styles.doneSection}>
        <Text style={[styles.doneTitle, { color: textColor }]}>
          Recording Complete
        </Text>

        <View style={styles.doneButtons}>
          <TouchableOpacity
            style={[styles.doneButton, styles.discardButton]}
            onPress={discardRecording}
          >
            <IconSymbol name="trash" size={20} color="#e74c3c" />
            <Text style={[styles.doneButtonText, { color: '#e74c3c' }]}>
              Discard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.doneButton, styles.saveButton]}
            onPress={saveRecording}
          >
            <IconSymbol name="checkmark" size={20} color="#27ae60" />
            <Text style={[styles.doneButtonText, { color: '#27ae60' }]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
            Voice Memo
          </Text>

          <TouchableOpacity
            style={styles.listButton}
            onPress={() => setShowRecordingsList(true)}
            accessibilityLabel="View recordings"
          >
            <IconSymbol name="list.bullet" size={24} color={tintColor} />
          </TouchableOpacity>
        </View>

        {/* Theme indicator */}
        {selectedTheme && (
          <View style={[styles.themeIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <Text style={[styles.themeText, { color: textColor }]}>
              {selectedTheme.title}
            </Text>
          </View>
        )}

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

          {/* Done Section */}
          {renderDoneSection()}
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
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pauseButton: {
    backgroundColor: '#f39c12',
  },
  stopButton: {
    backgroundColor: '#7f8c8d',
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