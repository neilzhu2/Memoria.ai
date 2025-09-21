/**
 * Recording Screen for Memoria.ai
 * Audio recording interface optimized for elderly users
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  AccessibilityInfo,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { RecordingScreenProps } from '../../types';
import { useAudioStore, useMemoryStore, useUserStore, useSettingsStore } from '../../stores';

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
    settings: audioSettings
  } = useAudioStore();

  const { addMemory, updateMemory, getMemory } = useMemoryStore();
  const { user } = useUserStore();
  const { getCurrentFontSize, getCurrentTouchTargetSize, shouldUseHighContrast, hapticFeedbackEnabled } = useSettingsStore();

  const [isPaused, setIsPaused] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();
  const maxDuration = audioSettings.maxRecordingDuration;

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
    } catch (error) {
      Alert.alert(
        'Recording Error',
        'Unable to start recording. Please check your microphone permissions and try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleStopRecording = async () => {
    try {
      if (hapticFeedbackEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setIsProcessing(true);
      const audioRecording = await stopRecording();

      if (audioRecording && recordingDuration >= 1) {
        // Navigate to save/title screen or auto-save with timestamp
        const title = recordingTitle || `Memory ${new Date().toLocaleDateString()}`;

        const newMemory = {
          title,
          audioFilePath: audioRecording.filePath,
          language: user?.preferredLanguage || 'en',
          tags: [],
        };

        if (editMemoryId) {
          // Update existing memory
          await updateMemory(editMemoryId, {
            title,
            updatedAt: new Date()
          });
        } else {
          // Create new memory
          await addMemory(newMemory as any);
        }

        navigation.goBack();
      } else {
        Alert.alert(
          'Recording Too Short',
          'Please record for at least 1 second.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
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
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    statusContainer: {
      alignItems: 'center',
      marginBottom: 40,
    },
    statusText: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      textAlign: 'center',
      marginBottom: 8,
    },
    timeDisplay: {
      fontSize: fontSize + 16,
      fontWeight: '700',
      color: isRecording ? '#dc2626' : (highContrast ? '#ffffff' : '#374151'),
      fontFamily: 'monospace',
      marginBottom: 16,
    },
    maxTimeDisplay: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
    },
    recordingIndicatorContainer: {
      alignItems: 'center',
      marginBottom: 50,
    },
    recordingIndicator: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: isRecording ? '#dc2626' : (highContrast ? '#666666' : '#e5e7eb'),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    recordingDot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#ffffff',
    },
    progressBarContainer: {
      width: '80%',
      height: 8,
      backgroundColor: highContrast ? '#333333' : '#e5e7eb',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: '#dc2626',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: 20,
      marginTop: 50,
    },
    controlButton: {
      width: touchTargetSize + 20,
      height: touchTargetSize + 20,
      borderRadius: (touchTargetSize + 20) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    primaryButton: {
      backgroundColor: isRecording ? '#dc2626' : '#2563eb',
    },
    secondaryButton: {
      backgroundColor: highContrast ? '#666666' : '#6b7280',
    },
    disabledButton: {
      backgroundColor: highContrast ? '#333333' : '#d1d5db',
    },
    buttonText: {
      color: '#ffffff',
      fontSize: fontSize - 2,
      fontWeight: '600',
      textAlign: 'center',
    },
    helpText: {
      position: 'absolute',
      bottom: 40,
      left: 20,
      right: 20,
      textAlign: 'center',
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      lineHeight: (fontSize - 2) * 1.5,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Status Display */}
        <View style={styles.statusContainer}>
          <Text
            style={styles.statusText}
            accessible={true}
            accessibilityLabel={getRecordingStatusText()}
          >
            {getRecordingStatusText()}
          </Text>

          <Text
            style={styles.timeDisplay}
            accessible={true}
            accessibilityLabel={`Recording time: ${formatTime(recordingDuration)}`}
          >
            {formatTime(recordingDuration)}
          </Text>

          <Text
            style={styles.maxTimeDisplay}
            accessible={true}
            accessibilityLabel={`Maximum recording time: ${formatTime(maxDuration)}`}
          >
            Max: {formatTime(maxDuration)}
          </Text>
        </View>

        {/* Recording Indicator */}
        <View style={styles.recordingIndicatorContainer}>
          <Animated.View
            style={[
              styles.recordingIndicator,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            {isRecording && <View style={styles.recordingDot} />}
          </Animated.View>

          {/* Progress Bar */}
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

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {/* Cancel Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.secondaryButton]}
            onPress={handleCancel}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cancel recording"
            accessibilityHint="Tap to cancel and return to previous screen"
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>

          {/* Pause/Resume Button */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              isRecording ? styles.secondaryButton : styles.disabledButton
            ]}
            onPress={handlePauseResume}
            disabled={!isRecording || isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Resume recording' : 'Pause recording'}
            accessibilityHint={isPaused ? 'Tap to resume recording' : 'Tap to pause recording'}
          >
            <Text style={styles.buttonText}>
              {isPaused ? 'Resume' : 'Pause'}
            </Text>
          </TouchableOpacity>

          {/* Start/Stop Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isProcessing}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
            accessibilityHint={isRecording ? 'Tap to stop and save recording' : 'Tap to start recording'}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <Text
          style={styles.helpText}
          accessible={true}
          accessibilityLabel="Recording instructions"
        >
          {!isRecording
            ? 'Tap Start to begin recording your memory. Speak clearly and at a comfortable volume.'
            : isPaused
            ? 'Recording is paused. Tap Resume to continue or Stop to save.'
            : 'Speak clearly. You can pause anytime or tap Stop when finished.'
          }
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default RecordingScreen;