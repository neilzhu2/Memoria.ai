import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

interface ActiveRecordingModalProps {
  visible: boolean;
  duration: number;
  topic?: string;
  onStopRecording: () => void;
  onPauseRecording?: () => void;
  isPaused?: boolean;
}

export function ActiveRecordingModal({
  visible,
  duration,
  topic,
  onStopRecording,
  onPauseRecording,
  isPaused = false
}: ActiveRecordingModalProps) {
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;
  const waveAnimation = React.useRef(new Animated.Value(0)).current;

  // Pulse animation for recording indicator
  React.useEffect(() => {
    if (visible && !isPaused) {
      const pulseSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseSequence.start();

      return () => pulseSequence.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [visible, isPaused]);

  // Wave animation for visual feedback
  React.useEffect(() => {
    if (visible && !isPaused) {
      const waveSequence = Animated.loop(
        Animated.timing(waveAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      waveSequence.start();

      return () => waveSequence.stop();
    } else {
      waveAnimation.setValue(0);
    }
  }, [visible, isPaused]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStopRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.speak("Recording stopped. Processing your memory.", { language: 'en' });
    onStopRecording();
  };

  const handlePauseRecording = async () => {
    if (onPauseRecording) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (isPaused) {
        Speech.speak("Recording resumed.", { language: 'en' });
      } else {
        Speech.speak("Recording paused.", { language: 'en' });
      }
      onPauseRecording();
    }
  };

  // Generate animated wave bars
  const renderWaveBars = () => {
    const bars = [];
    for (let i = 0; i < 20; i++) {
      const animatedHeight = waveAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [20, Math.random() * 100 + 20],
      });

      bars.push(
        <Animated.View
          key={i}
          style={[
            styles.waveBar,
            {
              height: animatedHeight,
              backgroundColor: isPaused ? '#95a5a6' : '#e74c3c',
            },
          ]}
        />
      );
    }
    return bars;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      accessibilityViewIsModal={true}
    >
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <Animated.View
              style={[
                styles.recordingIndicator,
                {
                  transform: [{ scale: pulseAnimation }],
                  backgroundColor: isPaused ? '#f39c12' : '#e74c3c',
                },
              ]}
            />
            <Text style={styles.statusText}>
              {isPaused ? 'Recording Paused' : 'Recording Active'}
            </Text>
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            <Text style={styles.timerLabel}>Duration</Text>
          </View>
        </View>

        {/* Topic Display */}
        {topic && (
          <View style={styles.topicContainer}>
            <Text style={styles.topicLabel}>Recording About:</Text>
            <Text style={styles.topicText}>"{topic}"</Text>
          </View>
        )}

        {/* Visual Waveform */}
        <View style={styles.waveformContainer}>
          <Text style={styles.waveformLabel}>Audio Level</Text>
          <View style={styles.waveform}>
            {renderWaveBars()}
          </View>
          <Text style={styles.waveformHint}>
            {isPaused ? 'Recording is paused' : 'Speak clearly into your device'}
          </Text>
        </View>

        {/* Recording Guidelines */}
        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>Recording Tips:</Text>
          <Text style={styles.guidelineText}>• Share your memories naturally</Text>
          <Text style={styles.guidelineText}>• Include names, dates, and places</Text>
          <Text style={styles.guidelineText}>• Describe feelings and emotions</Text>
          <Text style={styles.guidelineText}>• Take breaks if you need them</Text>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {onPauseRecording && (
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={handlePauseRecording}
              accessibilityLabel={isPaused ? "Resume recording" : "Pause recording"}
              accessibilityHint={
                isPaused ? "Tap to continue recording" : "Tap to pause recording"
              }
            >
              <Text style={styles.pauseButtonIcon}>
                {isPaused ? '▶️' : '⏸️'}
              </Text>
              <Text style={styles.pauseButtonText}>
                {isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={handleStopRecording}
            accessibilityLabel="Stop recording"
            accessibilityHint="Tap to finish and save your recording"
          >
            <Text style={styles.stopButtonIcon}>⏹️</Text>
            <Text style={styles.stopButtonText}>Stop & Save</Text>
          </TouchableOpacity>
        </View>

        {/* Encouragement Message */}
        <View style={styles.encouragementContainer}>
          <Text style={styles.encouragementText}>
            💝 Your family will treasure this memory
          </Text>
        </View>

      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c3e50',
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 16,
    color: '#bdc3c7',
    marginTop: 4,
  },
  topicContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  topicLabel: {
    fontSize: 16,
    color: '#bdc3c7',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 28,
  },
  waveformContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  waveformLabel: {
    fontSize: 18,
    color: 'white',
    marginBottom: 15,
    fontWeight: '600',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'center',
    marginBottom: 15,
  },
  waveBar: {
    width: 6,
    marginHorizontal: 2,
    borderRadius: 3,
    minHeight: 20,
  },
  waveformHint: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  guidelinesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  guidelineText: {
    fontSize: 16,
    color: '#bdc3c7',
    marginBottom: 8,
    lineHeight: 22,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
    minHeight: 80,
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#f39c12',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  pauseButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  stopButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  encouragementContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  encouragementText: {
    fontSize: 18,
    color: '#27ae60',
    textAlign: 'center',
    fontWeight: '600',
  },
});