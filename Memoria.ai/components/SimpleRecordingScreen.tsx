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
  ActivityIndicator,
} from 'react-native';
import {
  useAudioRecorder,
  AudioModule,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  IOSOutputFormat,
  AudioQuality,
  AndroidOutputFormat,
  AndroidAudioEncoder,
} from 'expo-audio';
// File operations now handled by audioStorageService (uploads to Supabase Storage)
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
import { audioStorageService } from '@/services/audioStorageService';
import { useAuth } from '@/contexts/AuthContext';
// fileSafeService no longer used in save flow — see RECORDING_FEATURE_FINDINGS.md

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
  android: {
    extension: '.amr',
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    outputFormat: 3 as any, // AndroidOutputFormat.AMR_NB
    audioEncoder: 1 as any, // AndroidAudioEncoder.AMR_NB
  },
  web: {} as any,
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
  selectedTheme?: MemoryTheme | null; // null = free-style recording
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
  const { user } = useAuth();

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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
      // 1. Request microphone permission
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'We need microphone permission to record your memories.',
          [{ text: 'OK' }]
        );
        onClose();
        return;
      }

      // 2. Pre-request speech recognition permission (for transcription)
      // This avoids a jarring popup mid-save when transcription starts
      try {
        const transcriptionService = getTranscriptionService();
        const speechAvailable = await transcriptionService.isAvailable();
        if (speechAvailable) {
          const hasPermission = await transcriptionService.requestPermissions();
          if (!hasPermission) {
            // Not blocking — transcription is optional, recording still works
            console.log('[Permissions] Speech recognition denied — transcription will be skipped');
          }
        }
      } catch (err) {
        // Non-fatal — don't prevent recording if speech recognition setup fails
        console.warn('[Permissions] Speech recognition permission check failed:', err);
      }

      // Auto-start recording after permissions are granted
      console.log('Permissions granted, auto-starting recording...');
      // Small delay to ensure UI is ready
      setTimeout(() => {
        startRecording();
      }, 300);
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
    }, 1000) as any;
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

      // Prepare and start recording (both steps required per official docs)
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

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

      if (uri) {
        console.log('[Stop] Recording stopped, cache URI:', uri);

        // Use cache URI directly — no file relocation needed!
        // See RECORDING_FEATURE_FINDINGS.md: Nitro File API cannot read ExpoAudio cache,
        // but fetch() and native modules can. Skip FileSafeService entirely.
        setCurrentRecordingUri(uri);
        setRecordingState('stopped');
        stopTimer();

        // Show saving indicator
        setIsSaving(true);

        // Reset audio mode
        await AudioModule.setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });

        // Brief delay to let iOS fully flush the file to disk
        await new Promise(resolve => setTimeout(resolve, 500));

        // Auto-save the recording immediately (simplified flow per wireframe)
        await saveRecording(uri);
      } else {
        console.error('No URI available from audioRecorder');
        setRecordingState('idle');
        stopTimer();
        toastService.recordingFailed();
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      setRecordingState('idle');
      stopTimer();
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

    if (!user?.id) {
      console.error('[saveRecording] ERROR: No user ID available');
      toastService.memorySaveFailed('Not logged in');
      return;
    }

    // Set saving flag to prevent modal from closing prematurely
    console.log('[saveRecording] Setting isSaving = true');
    setIsSaving(true);

    try {
      // Upload audio to Supabase Storage for permanent, reliable access
      // This bypasses the local file system issues with expo-file-system + expo-audio
      console.log('[saveRecording] Uploading audio to Supabase Storage...');

      // Rapid-fire fix: Use a small safety gap. 
      // FileSafeService already retries for existence, but we add a tiny gap here 
      // to let the OS finalize the file handles before reading for upload.
      await new Promise(resolve => setTimeout(resolve, 200));

      const uploadResult = await audioStorageService.uploadAudio(uri, user.id);

      if (!uploadResult.success || !uploadResult.url) {
        console.error('[saveRecording] Upload failed:', uploadResult.error);
        throw new Error(uploadResult.error || 'Failed to upload audio');
      }

      console.log('[saveRecording] Audio uploaded successfully:', uploadResult.url);

      // Free-style mode: selectedTheme is null
      // Topic mode: selectedTheme has id and title
      const isFreeStyle = selectedTheme === null || selectedTheme === undefined;
      const title = isFreeStyle
        ? `Free Recording - ${new Date().toLocaleDateString()}`
        : selectedTheme.title;
      console.log('[saveRecording] Recording title:', title);
      console.log('[saveRecording] Free-style mode:', isFreeStyle);
      console.log('[saveRecording] Preparing to call addMemory...');

      const memoryData = {
        title,
        description: isFreeStyle ? 'Free recording' : `Recording about: ${selectedTheme!.title}`,
        date: new Date(),
        duration,
        audioPath: uploadResult.url,  // Use Supabase Storage URL for permanent storage
        localAudioPath: uri,           // Store local path for zero-latency playback
        tags: isFreeStyle ? [] : [selectedTheme!.id],
        isShared: false,
        familyMembers: [],
        topicId: isFreeStyle ? undefined : selectedTheme!.id,  // null for free-style
      };

      console.log('[saveRecording] Memory data prepared:', {
        title: memoryData.title,
        duration: memoryData.duration,
        audioPath: memoryData.audioPath?.substring(0, 80) + '...',
        tagsCount: memoryData.tags.length,
      });

      console.log('[saveRecording] Calling addMemory (await)...');
      const startTime = Date.now();

      // Save to context and get the memory object with Supabase Storage URL
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
    if (!memory.audioPath) {
      console.log('[Transcription] No audio path found for memory:', memory.id);
      return;
    }

    try {
      console.log('[Transcription] Starting REAL transcription for memory:', memory.id);

      // Show transcription starting toast
      toastService.transcriptionStarted();

      const transcriptionService = getTranscriptionService();

      // Check availability (Native Dev Build required)
      const available = await transcriptionService.isAvailable();
      console.log('[Transcription] Recognition available:', available);

      if (!available) {
        console.warn('[Transcription] Speech recognition not available on this device, falling back to mock.');
        // Fallback to mock if native module is missing (e.g., if Dev Build setup is incomplete)
        return fallbackToMockTranscription(memory);
      }

      // Using the transcribe() method which sets up the provider and starts recognition
      // Prefer local path for better performance and reliability
      const transcriptionUri = memory.localAudioPath || memory.audioPath;
      const result = await transcriptionService.transcribe(transcriptionUri!, {
        language: 'en-US', // Default to English for now, could be dynamic
      });

      if (result.transcript) {
        console.log('[Transcription] REAL result received:', result.transcript.substring(0, 50) + '...');

        // Update the memory with real transcription
        await updateMemory(memory.id, {
          transcription: result.transcript,
        });

        // Update the savedMemory state so the modal shows the transcription
        setSavedMemory(prev => prev ? { ...prev, transcription: result.transcript } : null);

        toastService.transcriptionComplete();
      } else {
        console.log('[Transcription] No transcript returned from service.');
        toastService.transcriptionFailed();
      }

    } catch (error) {
      console.error('[Transcription] Failed:', error);
      toastService.transcriptionFailed();
      // Try mock as last resort if real fails
      fallbackToMockTranscription(memory);
    }
  };

  const fallbackToMockTranscription = async (memory: MemoryItem) => {
    console.log('[Transcription] Generating mock transcription...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    const mockTranscript = `Recording summary: ${memory.title}. This transcription was generated in fallback mode. In a native build environment, your actual voice recording would be converted to text here.`;

    await updateMemory(memory.id, { transcription: mockTranscript });
    setSavedMemory(prev => prev ? { ...prev, transcription: mockTranscript } : null);
    toastService.transcriptionComplete();
  }

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

    // Show saving indicator when stopped (auto-saving)
    if (isStopped || isSaving) {
      return (
        <View style={styles.savingContainer}>
          <ActivityIndicator size="large" color={goldColor} />
          <Text style={[styles.savingText, { color: textColor }]}>Saving your memory...</Text>
        </View>
      );
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
        {/* Header - Clean with just close and done buttons */}
        <View style={[styles.header, { borderBottomColor: borderColor + '40' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close recording"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

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

        {/* Hero Topic Prompt Section */}
        <View style={styles.topicSection}>
          {selectedTheme ? (
            <>
              {/* Badges Row - Horizontal layout for spatial efficiency */}
              <View style={styles.badgesRow}>
                {/* Category Badge */}
                {selectedTheme.category && (
                  <View style={[styles.categoryBadgeHero, {
                    backgroundColor: goldColor + '20',
                    borderColor: goldColor + '40'
                  }]}>
                    <Text style={styles.categoryIconHero}>{selectedTheme.category.icon}</Text>
                    <Text style={[styles.categoryNameHero, { color: goldColor }]}>
                      {selectedTheme.category.display_name}
                    </Text>
                  </View>
                )}

                {/* Status Badge - Shows when recording is not idle */}
                {recordingState !== 'idle' && (
                  <View style={[styles.statusBadgeHero, {
                    backgroundColor: successColor + '15',
                    borderColor: successColor + '30'
                  }]}>
                    <IconSymbol name="checkmark" size={12} color={successColor} />
                    <Text style={[styles.statusTextHero, { color: successColor }]}>
                      Recorded today
                    </Text>
                  </View>
                )}
              </View>

              {/* Hero Prompt - Large and prominent */}
              <Animated.Text
                style={[
                  styles.topicPromptHero,
                  {
                    color: textColor,
                    opacity: Animated.multiply(fadeAnim, promptOpacity),
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
                numberOfLines={5}
                ellipsizeMode="tail"
                accessibilityLabel={`Recording prompt: ${selectedTheme.title}`}
              >
                {selectedTheme.title}
              </Animated.Text>
            </>
          ) : (
            /* Free-style recording mode */
            <>
              <View style={styles.badgesRow}>
                <View style={[styles.categoryBadgeHero, {
                  backgroundColor: goldColor + '20',
                  borderColor: goldColor + '40'
                }]}>
                  <Text style={styles.categoryIconHero}>✨</Text>
                  <Text style={[styles.categoryNameHero, { color: goldColor }]}>
                    Free Recording
                  </Text>
                </View>
              </View>
              <Animated.Text
                style={[
                  styles.topicPromptHero,
                  {
                    color: textColor,
                    opacity: Animated.multiply(fadeAnim, promptOpacity),
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
                numberOfLines={3}
                accessibilityLabel="Free recording mode"
              >
                Record anything on your mind
              </Animated.Text>
            </>
          )}
        </View>

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
  topicSection: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryIconHero: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryNameHero: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadgeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  statusTextHero: {
    fontSize: 14,
    fontWeight: '600',
  },
  topicPromptHero: {
    fontSize: 28,
    lineHeight: 39,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: '90%',
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
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
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
  savingContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 24,
    gap: 12,
  },
  savingText: {
    fontSize: 16,
    fontWeight: '500' as const,
    opacity: 0.7,
  },
});