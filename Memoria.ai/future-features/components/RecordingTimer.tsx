/**
 * RecordingTimer Component for Memoria.ai
 * High-precision recording timer with elderly-friendly display and accessibility
 * Features sub-50ms render times and memory-efficient updates
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../stores';

interface RecordingTimerProps {
  isRecording: boolean;
  isPaused?: boolean;
  duration: number; // in seconds
  maxDuration?: number;
  showMilliseconds?: boolean;
  showProgress?: boolean;
  warningThresholds?: number[]; // seconds remaining for warnings
  onWarning?: (timeRemaining: number) => void;
  onMaxDurationReached?: () => void;
  style?: any;
}

interface TimeDisplay {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  formatted: string;
  totalSeconds: number;
}

const DEFAULT_WARNING_THRESHOLDS = [60, 30, 10]; // 1 minute, 30 seconds, 10 seconds

const RecordingTimer: React.FC<RecordingTimerProps> = ({
  isRecording,
  isPaused = false,
  duration,
  maxDuration = 0,
  showMilliseconds = false,
  showProgress = true,
  warningThresholds = DEFAULT_WARNING_THRESHOLDS,
  onWarning,
  onMaxDurationReached,
  style,
}) => {
  const {
    getCurrentFontSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
  } = useSettingsStore();

  // State
  const [displayTime, setDisplayTime] = useState<TimeDisplay>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    formatted: '00:00',
    totalSeconds: 0,
  });

  const [hasTriggeredWarnings, setHasTriggeredWarnings] = useState<Set<number>>(new Set());
  const [isFlashing, setIsFlashing] = useState(false);

  // Animation refs
  const flashAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Performance refs
  const lastUpdateTime = useRef(0);
  const renderCount = useRef(0);
  const performanceMetrics = useRef({
    avgRenderTime: 0,
    maxRenderTime: 0,
    droppedFrames: 0,
  });

  // Settings
  const fontSize = getCurrentFontSize();
  const highContrast = shouldUseHighContrast();

  // Calculate time display with memoization for performance
  const calculateTimeDisplay = useCallback((durationSeconds: number): TimeDisplay => {
    const totalMs = durationSeconds * 1000;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const milliseconds = Math.floor((totalMs % 1000) / 10); // Two-digit milliseconds

    let formatted: string;

    if (hours > 0) {
      // Show hours:minutes:seconds for long recordings
      formatted = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      // Show minutes:seconds for normal recordings
      formatted = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;

      if (showMilliseconds && isRecording && !isPaused) {
        formatted += `.${milliseconds.toString().padStart(2, '0')}`;
      }
    }

    return {
      hours,
      minutes,
      seconds,
      milliseconds,
      formatted,
      totalSeconds: durationSeconds,
    };
  }, [showMilliseconds, isRecording, isPaused]);

  // Performance monitoring
  const monitorPerformance = useCallback(() => {
    const now = performance.now();
    const renderTime = now - lastUpdateTime.current;

    renderCount.current++;

    // Update performance metrics
    const alpha = 0.1;
    performanceMetrics.current.avgRenderTime =
      performanceMetrics.current.avgRenderTime * (1 - alpha) + renderTime * alpha;

    if (renderTime > performanceMetrics.current.maxRenderTime) {
      performanceMetrics.current.maxRenderTime = renderTime;
    }

    // Warn if render times are too high
    if (renderTime > 50) {
      performanceMetrics.current.droppedFrames++;
      console.warn(`Timer render time: ${renderTime.toFixed(2)}ms (target: <50ms)`);
    }

    lastUpdateTime.current = now;
  }, []);

  // Update display time with performance monitoring
  useEffect(() => {
    const startTime = performance.now();

    const newDisplayTime = calculateTimeDisplay(duration);
    setDisplayTime(newDisplayTime);

    monitorPerformance();

    // Check for warnings
    if (maxDuration > 0 && isRecording && !isPaused) {
      const timeRemaining = maxDuration - duration;

      for (const threshold of warningThresholds) {
        if (
          timeRemaining <= threshold &&
          timeRemaining > threshold - 1 &&
          !hasTriggeredWarnings.has(threshold)
        ) {
          // Trigger warning
          setHasTriggeredWarnings(prev => new Set([...prev, threshold]));

          // Haptic feedback
          if (hapticFeedbackEnabled) {
            if (threshold <= 10) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }

          // Flash animation for visual warning
          setIsFlashing(true);
          Animated.sequence([
            Animated.timing(flashAnim, {
              toValue: 0.3,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(flashAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setIsFlashing(false));

          // Accessibility announcement
          const timeText = threshold >= 60
            ? `${Math.floor(threshold / 60)} minute${Math.floor(threshold / 60) > 1 ? 's' : ''}`
            : `${threshold} second${threshold > 1 ? 's' : ''}`;

          AccessibilityInfo.announceForAccessibility(`${timeText} remaining`);

          // Call warning callback
          onWarning?.(timeRemaining);

          break;
        }
      }

      // Check for max duration reached
      if (timeRemaining <= 0) {
        onMaxDurationReached?.();
      }
    }
  }, [
    duration,
    maxDuration,
    isRecording,
    isPaused,
    warningThresholds,
    hasTriggeredWarnings,
    hapticFeedbackEnabled,
    calculateTimeDisplay,
    monitorPerformance,
    onWarning,
    onMaxDurationReached,
    flashAnim,
  ]);

  // Reset warnings when recording starts
  useEffect(() => {
    if (isRecording && hasTriggeredWarnings.size > 0) {
      setHasTriggeredWarnings(new Set());
    }
  }, [isRecording, hasTriggeredWarnings.size]);

  // Progress animation
  useEffect(() => {
    if (maxDuration > 0 && showProgress) {
      const progress = Math.min(duration / maxDuration, 1);
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [duration, maxDuration, showProgress, progressAnim]);

  // Scale animation for recording state
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isRecording, isPaused, scaleAnim]);

  // Memoized style calculations
  const timerColor = useMemo(() => {
    if (!isRecording) return highContrast ? '#ffffff' : '#6b7280';
    if (isPaused) return '#f59e0b';

    if (maxDuration > 0) {
      const timeRemaining = maxDuration - duration;
      if (timeRemaining <= 10) return '#ef4444'; // Red for critical
      if (timeRemaining <= 30) return '#f59e0b'; // Amber for warning
    }

    return '#10b981'; // Green for normal recording
  }, [isRecording, isPaused, duration, maxDuration, highContrast]);

  const progressColor = useMemo(() => {
    if (maxDuration > 0) {
      const progress = duration / maxDuration;
      if (progress > 0.9) return '#ef4444'; // Red when almost full
      if (progress > 0.8) return '#f59e0b'; // Amber when getting full
    }
    return timerColor;
  }, [duration, maxDuration, timerColor]);

  const accessibilityLabel = useMemo(() => {
    const timeText = displayTime.formatted;
    const stateText = isRecording
      ? (isPaused ? 'paused' : 'recording')
      : 'ready';

    let timeRemainingText = '';
    if (maxDuration > 0 && isRecording) {
      const remaining = maxDuration - duration;
      if (remaining > 0) {
        const remainingMinutes = Math.floor(remaining / 60);
        const remainingSeconds = Math.floor(remaining % 60);
        timeRemainingText = `, ${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')} remaining`;
      }
    }

    return `Recording timer: ${timeText} ${stateText}${timeRemainingText}`;
  }, [displayTime.formatted, isRecording, isPaused, duration, maxDuration]);

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: fontSize * 2,
    },
    timerText: {
      fontSize: fontSize + 20,
      fontWeight: '700',
      color: timerColor,
      fontFamily: 'monospace',
      textAlign: 'center',
      letterSpacing: 1,
    },
    statusContainer: {
      marginTop: 8,
      alignItems: 'center',
    },
    statusText: {
      fontSize: fontSize - 2,
      fontWeight: '500',
      color: timerColor,
      textAlign: 'center',
      opacity: 0.8,
    },
    progressContainer: {
      width: '100%',
      marginTop: 12,
      alignItems: 'center',
    },
    progressBarBackground: {
      width: '90%',
      height: 6,
      backgroundColor: highContrast ? '#333333' : '#e5e7eb',
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: progressColor,
      borderRadius: 3,
    },
    maxTimeContainer: {
      marginTop: 4,
      alignItems: 'center',
    },
    maxTimeText: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#9ca3af',
      textAlign: 'center',
      fontFamily: 'monospace',
    },
  });

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="timer"
      accessibilityLiveRegion="polite"
    >
      <Animated.View
        style={[
          styles.timerContainer,
          {
            opacity: isFlashing ? flashAnim : 1,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.timerText}>
          {displayTime.formatted}
        </Text>
      </Animated.View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isRecording
            ? (isPaused ? 'Recording Paused' : 'Recording')
            : 'Ready to Record'
          }
        </Text>
      </View>

      {/* Progress Bar */}
      {showProgress && maxDuration > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.maxTimeContainer}>
            <Text style={styles.maxTimeText}>
              Max: {calculateTimeDisplay(maxDuration).formatted}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default RecordingTimer;