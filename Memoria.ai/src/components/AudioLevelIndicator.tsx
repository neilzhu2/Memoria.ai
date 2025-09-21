/**
 * Audio Level Indicator Component for Memoria.ai
 * Visual feedback for recording audio levels optimized for elderly users
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useSettingsStore } from '../stores';

interface AudioLevelIndicatorProps {
  audioLevel: number; // 0-1 normalized audio level
  isRecording: boolean;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({
  audioLevel,
  isRecording,
  showLabel = true,
  size = 'medium',
  style,
}) => {
  const { getCurrentFontSize, shouldUseHighContrast } = useSettingsStore();

  const animatedLevel = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const fontSize = getCurrentFontSize();
  const highContrast = shouldUseHighContrast();

  // Animate audio level changes
  useEffect(() => {
    Animated.timing(animatedLevel, {
      toValue: audioLevel,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [audioLevel]);

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { height: 60, barCount: 8, barWidth: 4, spacing: 2 };
      case 'large':
        return { height: 120, barCount: 16, barWidth: 8, spacing: 4 };
      default:
        return { height: 80, barCount: 12, barWidth: 6, spacing: 3 };
    }
  };

  const config = getSizeConfig();
  const totalWidth = config.barCount * config.barWidth + (config.barCount - 1) * config.spacing;

  const getBarHeight = (index: number) => {
    const normalizedIndex = index / (config.barCount - 1);
    const threshold = normalizedIndex;
    return audioLevel > threshold ? config.height * (0.3 + 0.7 * audioLevel) : config.height * 0.1;
  };

  const getBarColor = (index: number) => {
    const normalizedIndex = index / (config.barCount - 1);

    if (!isRecording) {
      return highContrast ? '#666666' : '#e5e7eb';
    }

    if (audioLevel > normalizedIndex) {
      if (normalizedIndex < 0.6) {
        return '#10b981'; // Green for good levels
      } else if (normalizedIndex < 0.8) {
        return '#f59e0b'; // Yellow for high levels
      } else {
        return '#ef4444'; // Red for very high levels
      }
    }

    return highContrast ? '#333333' : '#e5e7eb';
  };

  const getLevelText = () => {
    if (!isRecording) return 'Ready';

    if (audioLevel < 0.1) return 'Too quiet';
    if (audioLevel < 0.3) return 'Low';
    if (audioLevel < 0.7) return 'Good';
    if (audioLevel < 0.9) return 'High';
    return 'Too loud';
  };

  const getLevelColor = () => {
    if (!isRecording) return highContrast ? '#ffffff' : '#6b7280';

    if (audioLevel < 0.1 || audioLevel > 0.9) {
      return '#ef4444'; // Red for problematic levels
    }
    if (audioLevel < 0.3 || audioLevel > 0.7) {
      return '#f59e0b'; // Yellow for suboptimal levels
    }
    return '#10b981'; // Green for good levels
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: config.height,
      width: totalWidth,
      marginBottom: showLabel ? 12 : 0,
    },
    bar: {
      width: config.barWidth,
      marginRight: config.spacing,
      borderRadius: config.barWidth / 2,
      backgroundColor: '#e5e7eb',
    },
    lastBar: {
      marginRight: 0,
    },
    labelContainer: {
      alignItems: 'center',
    },
    levelText: {
      fontSize: fontSize - 2,
      fontWeight: '600',
      color: getLevelColor(),
      textAlign: 'center',
    },
    instructionText: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#9ca3af',
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: pulseAnim }] },
        style,
      ]}
      accessible={true}
      accessibilityLabel={`Audio level: ${getLevelText()}`}
      accessibilityHint="Visual indicator of microphone input level"
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(audioLevel * 100),
      }}
    >
      <View style={styles.levelContainer}>
        {Array.from({ length: config.barCount }, (_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              index === config.barCount - 1 && styles.lastBar,
              {
                height: animatedLevel.interpolate({
                  inputRange: [0, 1],
                  outputRange: [config.height * 0.1, getBarHeight(index)],
                  extrapolate: 'clamp',
                }),
                backgroundColor: getBarColor(index),
              },
            ]}
          />
        ))}
      </View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.levelText}>
            {getLevelText()}
          </Text>
          <Text style={styles.instructionText}>
            Speak at a comfortable volume
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

export default AudioLevelIndicator;