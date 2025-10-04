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
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRecording } from '@/contexts/RecordingContext';
import { SimpleWaveform } from './SimpleWaveform';
import { RecordingTimer } from './RecordingTimer';
import { RecordingsList } from './RecordingsList';

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
  const { addMemory } = useRecording();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentRecordingUri, setCurrentRecordingUri] = useState<string | null>(null);

  // UI state
  const [showRecordingsList, setShowRecordingsList] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  // Timer ref
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Colors
  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    if (!visible) {
      // Clean up when modal closes
      stopTimer();
      if (recording) {
        stopRecording();
      }
      setRecordingState('idle');
      setDuration(0);
      setWaveformData([]);
      setCurrentRecordingUri(null);
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
      const permission = await Audio.requestPermissionsAsync();
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

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
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
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await recording.pauseAsync();
      setRecordingState('paused');
      stopTimer();
    } catch (error) {
      console.error('Failed to pause recording:', error);
    }
  };

  const resumeRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await recording.startAsync();
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error('Failed to resume recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await recording.stopAndUnloadAsync();

      const uri = recording.getURI();
      setCurrentRecordingUri(uri);
      setRecordingState('stopped');
      stopTimer();

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const saveRecording = async () => {
    if (!currentRecordingUri || !recording) return;

    try {
      const title = selectedTheme?.title || `Recording ${new Date().toLocaleDateString()}`;

      // Save to context
      await addMemory({
        title,
        description: selectedTheme ? `Recording about: ${selectedTheme.title}` : undefined,
        date: new Date(),
        duration,
        audioPath: currentRecordingUri,
        tags: selectedTheme ? [selectedTheme.id] : [],
        isShared: false,
        familyMembers: [],
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Recording Saved!',
        'Your memory has been saved successfully.',
        [{ text: 'Great!', onPress: onClose }]
      );

    } catch (error) {
      console.error('Failed to save recording:', error);
      Alert.alert('Error', 'Failed to save recording. Please try again.');
    }
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
            setRecording(null);
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