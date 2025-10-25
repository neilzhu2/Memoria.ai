import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface RecordingTimerProps {
  duration: number; // in seconds
  isActive: boolean;
}

export function RecordingTimer({ duration, isActive }: RecordingTimerProps) {
  const colorScheme = useColorScheme();
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const textColor = Colors[colorScheme ?? 'light'].text;
  const activeColor = '#e74c3c';

  useEffect(() => {
    if (isActive) {
      // Start pulsing animation when recording is active
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      return () => {
        pulseLoop.stop();
        pulseAnimation.setValue(1);
      };
    } else {
      // Stop animation and reset scale
      pulseAnimation.setValue(1);
    }
  }, [isActive, pulseAnimation]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* Recording indicator dot */}
      {isActive && (
        <Animated.View
          style={[
            styles.recordingDot,
            {
              backgroundColor: activeColor,
              transform: [{ scale: pulseAnimation }],
            },
          ]}
        />
      )}

      {/* Timer display */}
      <Animated.Text
        style={[
          styles.timerText,
          {
            color: isActive ? activeColor : textColor,
            transform: isActive ? [{ scale: pulseAnimation }] : [],
          },
        ]}
      >
        {formatTime(duration)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '300',
    fontVariant: ['tabular-nums'], // Ensures consistent spacing for numbers
    letterSpacing: 1,
  },
});