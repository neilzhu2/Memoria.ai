import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface RecordingStatusProps {
  isRecording: boolean;
  duration?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const RecordingStatus: React.FC<RecordingStatusProps> = ({
  isRecording,
  duration = 0,
  style,
  textStyle,
}) => {
  const fadeValue = React.useRef(new Animated.Value(0)).current;
  const pulseValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      // Fade in and start pulsing
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      // Fade out
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      pulseValue.setValue(1);
    }
  }, [isRecording, fadeValue, pulseValue]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeValue },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.indicatorContainer,
          { transform: [{ scale: pulseValue }] },
        ]}
      >
        <View style={styles.recordingDot} />
        <Text style={[styles.statusText, textStyle]}>
          Recording...
        </Text>
      </Animated.View>

      <Text style={[styles.instructionText, textStyle]}>
        🎤 Speak clearly about your memory
      </Text>

      {duration > 0 && (
        <Text style={[styles.durationText, textStyle]}>
          {formatDuration(duration)}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9AE6B4',
    marginVertical: 16,
    minWidth: 280,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E53E3E',
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2F855A',
  },
  instructionText: {
    fontSize: 16,
    color: '#38A169',
    textAlign: 'center',
    marginBottom: 4,
  },
  durationText: {
    fontSize: 14,
    color: '#68D391',
    fontWeight: '500',
    marginTop: 4,
  },
});