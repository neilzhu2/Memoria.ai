/**
 * Recording Screen for Memoria.ai
 * Audio recording interface optimized for elderly users
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  AccessibilityInfo,
  Vibration,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { RecordingScreenProps } from '../../types';
import { useAudioStore, useMemoryStore, useUserStore, useSettingsStore } from '../../stores';
import {
  AudioLevelIndicator,
  VoiceRecordingButton,
  RecordingControls,
  VoiceGuidance,
  VoiceGuidanceService,
} from '../../components';
import RealtimeTranscriptionView from '../../components/audio/RealtimeTranscriptionView';
import TranscriptionControls from '../../components/audio/TranscriptionControls';

const RecordingScreen: React.FC<RecordingScreenProps> = ({ navigation, route }) => {
  const { editMemoryId } = route.params || {};

  const {
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
    settings: audioSettings,
    realtimeTranscription,
    startRealtimeTranscription,
    stopRealtimeTranscription,
    updateRealtimeConfig,
    updateElderlyTranscriptionSettings,
    updateChineseSupport,
    updateLanguageDetection,
    clearRealtimeTranscriptionError
  } = useAudioStore();

  const { addMemory, updateMemory, getMemory } = useMemoryStore();
  const { user } = useUserStore();
  const { getCurrentFontSize, getCurrentTouchTargetSize, shouldUseHighContrast, hapticFeedbackEnabled } = useSettingsStore();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [showTranscription, setShowTranscription] = useState(true);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const audioLevelInterval = useRef<NodeJS.Timeout | null>(null);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();
  const maxDuration = audioSettings.maxRecordingDuration;

  // Welcome message for elderly users when screen is focused
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (!isRecording) {
          VoiceGuidanceService.speak(
            'Welcome to memory recording. This is where you can share your stories and preserve your memories. Tap the blue recording button when you\'re ready to begin.',
            { rate: 0.7 } // Slower for elderly users
          );
        }
      }, 1000); // Small delay to let screen transition complete

      return () => clearTimeout(timer);
    }, [isRecording])
  );

  // Animation for recording indicator
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, isPaused]);

  // Progress animation
  useEffect(() => {
    if (isRecording) {
      const progress = Math.min(recordingDuration / maxDuration, 1);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [recordingDuration, maxDuration, isRecording]);

  // Audio level monitoring for elderly users
  useEffect(() => {
    if (isRecording && !isPaused) {
      audioLevelInterval.current = setInterval(() => {
        // Simulate audio level - in real implementation this would come from the audio service
        // The audio service would need to expose real-time audio level monitoring
        const simulatedLevel = Math.random() * 0.6 + 0.2; // Simulate 0.2-0.8 range
        setAudioLevel(simulatedLevel);
      }, 100);
    } else {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
        audioLevelInterval.current = null;
      }
      setAudioLevel(0);
    }

    return () => {
      if (audioLevelInterval.current) {
        clearInterval(audioLevelInterval.current);
      }
    };
  }, [isRecording, isPaused]);

  // Accessibility announcements
  useEffect(() => {
    if (isRecording && !isPaused) {
      AccessibilityInfo.announceForAccessibility('Recording started');
    } else if (isPaused) {
      AccessibilityInfo.announceForAccessibility('Recording paused');
    } else if (!isRecording && recordingDuration > 0) {
      AccessibilityInfo.announceForAccessibility('Recording stopped');
    }
  }, [isRecording, isPaused]);

  // Vibration for time warnings (elderly users may not hear audio cues)
  useEffect(() => {
    if (isRecording) {
      const timeLeft = maxDuration - recordingDuration;

      // Vibrate at 1 minute, 30 seconds, and 10 seconds remaining
      if (timeLeft === 60 || timeLeft === 30 || timeLeft === 10) {
        if (hapticFeedbackEnabled) {
          Vibration.vibrate([0, 200, 100, 200]);
        }

        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : `${seconds} seconds`;

        AccessibilityInfo.announceForAccessibility(`${timeString} remaining`);
      }
    }
  }, [recordingDuration, maxDuration, isRecording, hapticFeedbackEnabled]);

  // Handle transcription errors
  useEffect(() => {
    if (realtimeTranscription.lastError) {
      setTranscriptionError(realtimeTranscription.lastError.message);

      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearRealtimeTranscriptionError();
        setTranscriptionError(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [realtimeTranscription.lastError, clearRealtimeTranscriptionError]);

  // Clear transcription error when user starts new action
  useEffect(() => {
    if (transcriptionError && isRecording) {
      setTranscriptionError(null);
    }
  }, [isRecording, transcriptionError]);

  // Real-time transcription handlers
  const handleToggleTranscription = useCallback(async () => {
    try {
      if (realtimeTranscription.isActive) {
        await stopRealtimeTranscription();
      } else {
        // Only start transcription if recording is active
        if (isRecording) {
          await startRealtimeTranscription();
        }
      }
    } catch (error) {
      console.error('Transcription toggle error:', error);
      setTranscriptionError(error instanceof Error ? error.message : 'Transcription error');
    }
  }, [realtimeTranscription.isActive, isRecording, startRealtimeTranscription, stopRealtimeTranscription]);

  const handleLanguageChange = useCallback((language: 'en' | 'zh' | 'auto') => {
    updateRealtimeConfig({ language });
  }, [updateRealtimeConfig]);

  const handleTranscriptionTextPress = useCallback((text: string) => {
    // For future implementation: open text editor
    console.log('Transcription text pressed:', text);
  }, []);

  const handleLanguageDetected = useCallback((language: 'en' | 'zh') => {
    // Update user preferences if needed
    if (user?.preferredLanguage !== language) {
      console.log('Language detected:', language);
    }
  }, [user]);

  const handleConfidenceWarning = useCallback((confidence: number) => {
    if (confidence < 0.5) {
      if (hapticFeedbackEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      console.warn('Low transcription confidence:', confidence);
    }
  }, [hapticFeedbackEnabled]);

  const handleStartRecording = async () => {
    try {
      if (hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      await startRecording({
        quality: audioSettings.defaultQuality,
        maxDuration: audioSettings.maxRecordingDuration,
        autoStop: audioSettings.autoStopEnabled,
        enableNoiseCancellation: audioSettings.noiseCancellationEnabled,
        enableAmplification: audioSettings.amplificationEnabled,
      });

      setIsPaused(false);
      setShowPermissionHelp(false);

      // Auto-start transcription if enabled
      if (showTranscription) {
        try {
          await startRealtimeTranscription();
        } catch (transcriptionError) {
          console.warn('Could not start transcription:', transcriptionError);
          setTranscriptionError('Transcription unavailable - recording continues');
        }
      }
    } catch (error) {
      console.error('Recording start error:', error);

      // Voice guidance for error
      VoiceGuidanceService.announceError(
        error instanceof Error ? error.message : 'Unable to start recording'
      );

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isPermissionError = errorMessage.toLowerCase().includes('permission');

      if (isPermissionError) {
        setShowPermissionHelp(true);
        Alert.alert(
          'Microphone Permission Required',
          'Memoria needs access to your microphone to record your memories. Please enable microphone permissions in your device settings.',
          [
            { text: 'Settings', onPress: () => {/* Open settings if available */} },
            { text: 'OK', style: 'default' }
          ]
        );
      } else {
        Alert.alert(
          'Recording Error',
          'Unable to start recording. Please try again in a moment.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    }
  };

  const handleStopRecording = async () => {
    try {
      if (hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setIsProcessing(true);

      // Stop transcription first to get final result
      let transcriptionResult = null;
      if (realtimeTranscription.isActive) {
        try {
          transcriptionResult = await stopRealtimeTranscription();
        } catch (error) {
          console.warn('Failed to stop transcription:', error);
        }
      }

      const audioRecording = await stopRecording();

      if (audioRecording && recordingDuration >= 1) {
        // Auto-generate title with timestamp for elderly users
        const title = recordingTitle || `Memory ${new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })}`;

        const newMemory = {
          title,
          audioFilePath: audioRecording.filePath,
          duration: audioRecording.duration,
          fileSize: audioRecording.fileSize,
          language: user?.preferredLanguage || 'en',
          tags: [],
          createdAt: new Date(),
          // Include transcription if available
          transcription: transcriptionResult ? {
            text: transcriptionResult.text,
            confidence: transcriptionResult.confidence,
            language: transcriptionResult.language,
            segments: transcriptionResult.segments,
            isRealtime: transcriptionResult.isRealtime || false,
          } : undefined,
        };

        if (editMemoryId) {
          // Update existing memory
          await updateMemory(editMemoryId, {
            title,
            audioFilePath: audioRecording.filePath,
            duration: audioRecording.duration,
            updatedAt: new Date()
          });
          VoiceGuidanceService.announceSuccess('Your memory has been updated successfully.');
        } else {
          // Create new memory
          await addMemory(newMemory as any);
          VoiceGuidanceService.announceSuccess('Your memory has been saved successfully.');
        }

        // Small delay to let voice guidance finish
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        VoiceGuidanceService.announceError('Recording too short. Please record for at least 1 second.');
        Alert.alert(
          'Recording Too Short',
          'Please record for at least 1 second to save your memory.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('Recording save error:', error);
      VoiceGuidanceService.announceError('Unable to save recording');
      Alert.alert(
        'Save Error',
        'Unable to save your recording. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      if (isPaused) {
        await resumeRecording();
        setIsPaused(false);
      } else {
        await pauseRecording();
        setIsPaused(true);
      }
    } catch (error) {
      console.error('Pause/Resume error:', error);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Recording',
      'Are you sure you want to cancel? Your recording will be lost.',
      [
        { text: 'Keep Recording', style: 'cancel' },
        {
          text: 'Cancel Recording',
          style: 'destructive',
          onPress: () => {
            if (isRecording) {
              stopRecording();
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRecordingStatusText = () => {
    if (isProcessing) return 'Saving recording...';
    if (!isRecording) return 'Ready to record';
    if (isPaused) return 'Recording paused';
    return 'Recording in progress';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      padding: 20,
      alignItems: 'center',
    },
    headerContainer: {
      alignItems: 'center',
      marginBottom: 30,
      paddingTop: 10,
    },
    headerTitle: {
      fontSize: fontSize + 6,
      fontWeight: '700',
      color: highContrast ? '#ffffff' : '#1f2937',
      textAlign: 'center',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginBottom: 20,
    },
    timeDisplay: {
      fontSize: fontSize + 18,
      fontWeight: '700',
      color: isRecording ? '#dc2626' : (highContrast ? '#ffffff' : '#374151'),
      fontFamily: 'monospace',
    },
    maxTimeDisplay: {
      fontSize: fontSize + 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontFamily: 'monospace',
      marginLeft: 8,
    },
    progressContainer: {
      width: '100%',
      alignItems: 'center',
      marginBottom: 30,
    },
    progressBarContainer: {
      width: '90%',
      height: 12,
      backgroundColor: highContrast ? '#333333' : '#e5e7eb',
      borderRadius: 6,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: isRecording ? '#dc2626' : '#2563eb',
      borderRadius: 6,
    },
    audioLevelContainer: {
      marginBottom: 40,
      alignItems: 'center',
    },
    recordingButtonContainer: {
      marginBottom: 40,
      alignItems: 'center',
    },
    controlsContainer: {
      width: '100%',
      marginBottom: 30,
    },
    statusContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    statusText: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: isRecording
        ? (isPaused ? '#f59e0b' : '#dc2626')
        : (highContrast ? '#ffffff' : '#374151'),
      textAlign: 'center',
    },
    permissionHelpContainer: {
      backgroundColor: highContrast ? '#333333' : '#fef3c7',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      width: '100%',
    },
    permissionHelpText: {
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#92400e',
      textAlign: 'center',
      lineHeight: fontSize * 1.5,
    },
    transcriptionContainer: {
      width: '100%',
      marginBottom: 20,
      minHeight: 120,
    },
    transcriptionControlsContainer: {
      width: '100%',
      marginBottom: 20,
    },
    transcriptionErrorContainer: {
      backgroundColor: highContrast ? '#4b0000' : '#fef2f2',
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
    },
    transcriptionErrorText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#ffffff' : '#991b1b',
      fontWeight: '500',
      textAlign: 'center',
    },
    transcriptionToggle: {
      backgroundColor: highContrast ? '#333333' : '#f3f4f6',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginTop: 12,
      alignSelf: 'center',
      minHeight: 44, // Large touch target
    },
    transcriptionToggleText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
      textAlign: 'center',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Voice Guidance Component */}
      <VoiceGuidance
        isRecording={isRecording}
        isPaused={isPaused}
        recordingDuration={recordingDuration}
        maxDuration={maxDuration}
        announceOnChange={true}
        announceTimeWarnings={true}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Status */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>
            {editMemoryId ? 'Update Memory' : 'Record Memory'}
          </Text>
          <Text style={styles.headerSubtitle}>
            Share your story, preserve your legacy
          </Text>

          {/* Transcription Toggle for Elderly Users */}
          <Pressable
            style={styles.transcriptionToggle}
            onPress={() => {
              setShowTranscription(!showTranscription);
              if (hapticFeedbackEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            accessibilityLabel={showTranscription ? 'Hide transcription' : 'Show transcription'}
            accessibilityRole="button"
          >
            <Text style={styles.transcriptionToggleText}>
              {showTranscription ? '📝 Hide Text' : '📝 Show Text'}
            </Text>
          </Pressable>
        </View>

        {/* Time Display */}
        <View style={styles.timeContainer}>
          <Text
            style={styles.timeDisplay}
            accessible={true}
            accessibilityLabel={`Recording time: ${formatTime(recordingDuration)}`}
          >
            {formatTime(recordingDuration)}
          </Text>
          <Text style={styles.maxTimeDisplay}>
            / {formatTime(maxDuration)}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
          </View>
        </View>

        {/* Audio Level Indicator */}
        <View style={styles.audioLevelContainer}>
          <AudioLevelIndicator
            audioLevel={audioLevel}
            isRecording={isRecording && !isPaused}
            showLabel={true}
            size="large"
          />
        </View>

        {/* Real-time Transcription Display */}
        {showTranscription && (
          <View style={styles.transcriptionContainer}>
            <RealtimeTranscriptionView
              transcriptionState={realtimeTranscription.state}
              displayOptions={realtimeTranscription.displayOptions}
              elderlySettings={realtimeTranscription.elderlySettings}
              chineseSupport={realtimeTranscription.chineseSupport}
              onTextPress={handleTranscriptionTextPress}
              onLanguageDetected={handleLanguageDetected}
              onConfidenceWarning={handleConfidenceWarning}
              isRecording={isRecording}
              showControls={true}
            />

            {/* Transcription Error Display */}
            {transcriptionError && (
              <View style={styles.transcriptionErrorContainer}>
                <Text style={styles.transcriptionErrorText}>
                  {transcriptionError}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Transcription Controls */}
        {showTranscription && (
          <View style={styles.transcriptionControlsContainer}>
            <TranscriptionControls
              isActive={realtimeTranscription.isActive}
              config={realtimeTranscription.config}
              elderlySettings={realtimeTranscription.elderlySettings}
              chineseSupport={realtimeTranscription.chineseSupport}
              languageDetection={realtimeTranscription.languageDetection}
              onToggleTranscription={handleToggleTranscription}
              onLanguageChange={handleLanguageChange}
              onConfigChange={updateRealtimeConfig}
              onElderlySettingsChange={updateElderlyTranscriptionSettings}
              onChineseSupportChange={updateChineseSupport}
              fontSize={fontSize}
              highContrast={highContrast}
              hapticEnabled={hapticFeedbackEnabled}
              disabled={!isRecording}
            />
          </View>
        )}

        {/* Main Recording Button */}
        <View style={styles.recordingButtonContainer}>
          <VoiceRecordingButton
            isRecording={isRecording}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing || showPermissionHelp}
            size="large"
          />
        </View>

        {/* Recording Controls */}
        <View style={styles.controlsContainer}>
          <RecordingControls
            isRecording={isRecording}
            isPaused={isPaused}
            isProcessing={isProcessing}
            onStartStop={isRecording ? handleStopRecording : handleStartRecording}
            onPauseResume={handlePauseResume}
            onCancel={handleCancel}
            showCancel={true}
            showPauseResume={true}
          />
        </View>

        {/* Permission Help */}
        {showPermissionHelp && (
          <View style={styles.permissionHelpContainer}>
            <Text style={styles.permissionHelpText}>
              Microphone access is required to record your memories. Please check your device settings and allow microphone permissions for Memoria.
            </Text>
          </View>
        )}

        {/* Status Text */}
        <View style={styles.statusContainer}>
          <Text
            style={styles.statusText}
            accessible={true}
            accessibilityLabel={getRecordingStatusText()}
          >
            {getRecordingStatusText()}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecordingScreen;