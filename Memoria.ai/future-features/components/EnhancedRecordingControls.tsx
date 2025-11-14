/**
 * EnhancedRecordingControls Component for Memoria.ai
 * Advanced recording controls with haptic feedback, accessibility, and elderly-friendly design
 * Features 80px+ touch targets and comprehensive feedback systems
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  AccessibilityInfo,
  Alert,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '../stores';
import { VoiceGuidanceService } from './VoiceGuidance';

interface ControlButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning';
  size?: 'small' | 'medium' | 'large';
  accessibilityHint?: string;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
}

interface EnhancedRecordingControlsProps {
  isRecording: boolean;
  isPaused?: boolean;
  isProcessing?: boolean;
  onStart: () => Promise<void> | void;
  onStop: () => Promise<void> | void;
  onPause: () => Promise<void> | void;
  onResume: () => Promise<void> | void;
  onCancel?: () => void;
  showCancel?: boolean;
  showPauseResume?: boolean;
  enableVoiceGuidance?: boolean;
  confirmActions?: boolean;
  style?: any;
}

const MINIMUM_TOUCH_TARGET = 80; // Minimum 80px as per elderly user requirements

const EnhancedRecordingControls: React.FC<EnhancedRecordingControlsProps> = ({
  isRecording,
  isPaused = false,
  isProcessing = false,
  onStart,
  onStop,
  onPause,
  onResume,
  onCancel,
  showCancel = true,
  showPauseResume = true,
  enableVoiceGuidance = true,
  confirmActions = true,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
  } = useSettingsStore();

  // State
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState(0);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({
    record: new Animated.Value(1),
    pause: new Animated.Value(1),
    stop: new Animated.Value(1),
    cancel: new Animated.Value(1),
  }).current;

  // Settings
  const fontSize = getCurrentFontSize();
  const baseTouchTargetSize = getCurrentTouchTargetSize();
  const touchTargetSize = Math.max(baseTouchTargetSize, MINIMUM_TOUCH_TARGET);
  const highContrast = shouldUseHighContrast();

  // Debounce helper to prevent accidental double-taps
  const debounce = useCallback((action: () => void, delay: number = 300) => {
    const now = Date.now();
    if (now - lastActionTime < delay) {
      console.log('Action debounced');
      return;
    }
    setLastActionTime(now);
    action();
  }, [lastActionTime]);

  // Haptic feedback handler
  const triggerHapticFeedback = useCallback(async (style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium') => {
    if (!hapticFeedbackEnabled) return;

    try {
      switch (style) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [hapticFeedbackEnabled]);

  // Voice guidance helper
  const announceAction = useCallback((message: string) => {
    if (enableVoiceGuidance) {
      VoiceGuidanceService.speak(message, { rate: 0.7 });
    }
    AccessibilityInfo.announceForAccessibility(message);
  }, [enableVoiceGuidance]);

  // Button press animation
  const animateButtonPress = useCallback((buttonKey: string) => {
    const anim = scaleAnims[buttonKey];
    if (!anim) return;

    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnims]);

  // Recording button pulse animation
  useEffect(() => {
    if (isRecording && !isPaused) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
  }, [isRecording, isPaused, pulseAnim]);

  // Action handlers with confirmation and feedback
  const handleStartRecording = useCallback(async () => {
    debounce(async () => {
      try {
        animateButtonPress('record');
        await triggerHapticFeedback('heavy');

        if (confirmActions) {
          Alert.alert(
            'Start Recording',
            'Ready to start recording your memory?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Start',
                style: 'default',
                onPress: async () => {
                  announceAction('Starting recording');
                  await onStart();
                  await triggerHapticFeedback('success');
                },
              },
            ]
          );
        } else {
          announceAction('Starting recording');
          await onStart();
          await triggerHapticFeedback('success');
        }
      } catch (error) {
        await triggerHapticFeedback('error');
        announceAction('Failed to start recording');
        console.error('Start recording error:', error);
      }
    });
  }, [debounce, animateButtonPress, triggerHapticFeedback, confirmActions, announceAction, onStart]);

  const handleStopRecording = useCallback(async () => {
    debounce(async () => {
      try {
        animateButtonPress('stop');
        await triggerHapticFeedback('medium');

        if (confirmActions) {
          Alert.alert(
            'Stop Recording',
            'Are you ready to stop and save your recording?',
            [
              { text: 'Keep Recording', style: 'cancel' },
              {
                text: 'Stop & Save',
                style: 'default',
                onPress: async () => {
                  announceAction('Stopping recording');
                  await onStop();
                  await triggerHapticFeedback('success');
                },
              },
            ]
          );
        } else {
          announceAction('Stopping recording');
          await onStop();
          await triggerHapticFeedback('success');
        }
      } catch (error) {
        await triggerHapticFeedback('error');
        announceAction('Failed to stop recording');
        console.error('Stop recording error:', error);
      }
    });
  }, [debounce, animateButtonPress, triggerHapticFeedback, confirmActions, announceAction, onStop]);

  const handlePauseRecording = useCallback(async () => {
    debounce(async () => {
      try {
        animateButtonPress('pause');
        await triggerHapticFeedback('light');

        announceAction('Pausing recording');
        await onPause();
        await triggerHapticFeedback('warning');
      } catch (error) {
        await triggerHapticFeedback('error');
        announceAction('Failed to pause recording');
        console.error('Pause recording error:', error);
      }
    });
  }, [debounce, animateButtonPress, triggerHapticFeedback, announceAction, onPause]);

  const handleResumeRecording = useCallback(async () => {
    debounce(async () => {
      try {
        animateButtonPress('pause');
        await triggerHapticFeedback('medium');

        announceAction('Resuming recording');
        await onResume();
        await triggerHapticFeedback('success');
      } catch (error) {
        await triggerHapticFeedback('error');
        announceAction('Failed to resume recording');
        console.error('Resume recording error:', error);
      }
    });
  }, [debounce, animateButtonPress, triggerHapticFeedback, announceAction, onResume]);

  const handleCancelRecording = useCallback(() => {
    debounce(() => {
      animateButtonPress('cancel');
      triggerHapticFeedback('warning');

      Alert.alert(
        'Cancel Recording',
        'Are you sure you want to cancel? Your recording will be lost.',
        [
          { text: 'Keep Recording', style: 'cancel' },
          {
            text: 'Cancel Recording',
            style: 'destructive',
            onPress: () => {
              announceAction('Recording cancelled');
              onCancel?.();
              triggerHapticFeedback('error');
            },
          },
        ]
      );
    });
  }, [debounce, animateButtonPress, triggerHapticFeedback, announceAction, onCancel]);

  // Control button component
  const ControlButton: React.FC<ControlButtonProps> = ({
    icon,
    label,
    onPress,
    disabled = false,
    variant = 'secondary',
    size = 'medium',
    accessibilityHint,
    hapticStyle = 'medium',
  }) => {
    const buttonSize = useMemo(() => {
      switch (size) {
        case 'small':
          return touchTargetSize * 0.8;
        case 'large':
          return touchTargetSize * 1.2;
        default:
          return touchTargetSize;
      }
    }, [size, touchTargetSize]);

    const buttonColors = useMemo(() => {
      if (disabled) {
        return highContrast
          ? ['#333333', '#222222']
          : ['#e5e7eb', '#d1d5db'];
      }

      switch (variant) {
        case 'primary':
          return ['#2563eb', '#3b82f6'];
        case 'danger':
          return ['#dc2626', '#ef4444'];
        case 'warning':
          return ['#d97706', '#f59e0b'];
        default:
          return highContrast
            ? ['#4a5568', '#718096']
            : ['#6b7280', '#9ca3af'];
      }
    }, [variant, disabled, highContrast]);

    const textColor = useMemo(() => {
      return disabled
        ? (highContrast ? '#666666' : '#9ca3af')
        : '#ffffff';
    }, [disabled, highContrast]);

    const buttonKey = label.toLowerCase().replace(' ', '_');

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnims[buttonKey] || new Animated.Value(1) }],
        }}
      >
        <Pressable
          style={[
            styles.controlButton,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
          onPress={async () => {
            if (!disabled) {
              await triggerHapticFeedback(hapticStyle);
              onPress();
            }
          }}
          onPressIn={() => setPressedButton(buttonKey)}
          onPressOut={() => setPressedButton(null)}
          disabled={disabled}
          accessible={true}
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled }}
        >
          <LinearGradient
            colors={buttonColors}
            style={[
              styles.buttonGradient,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
              },
            ]}
          >
            <Text style={[styles.buttonIcon, { color: textColor }]}>
              {icon}
            </Text>
            <Text style={[styles.buttonLabel, { fontSize: fontSize - 4, color: textColor }]}>
              {label}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 20,
      padding: 10,
    },
    controlButton: {
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    buttonGradient: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    buttonIcon: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    buttonLabel: {
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: fontSize - 2,
    },
    mainRecordButton: {
      elevation: 6,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    loadingIndicator: {
      position: 'absolute',
      top: -5,
      right: -5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#f59e0b',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: 10,
      color: '#ffffff',
      fontWeight: 'bold',
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Cancel Button */}
      {showCancel && isRecording && (
        <ControlButton
          icon="✕"
          label="Cancel"
          onPress={handleCancelRecording}
          disabled={isProcessing}
          variant="danger"
          accessibilityHint="Double tap to cancel current recording"
          hapticStyle="warning"
        />
      )}

      {/* Pause/Resume Button */}
      {showPauseResume && isRecording && (
        <ControlButton
          icon={isPaused ? '▶' : '⏸'}
          label={isPaused ? 'Resume' : 'Pause'}
          onPress={isPaused ? handleResumeRecording : handlePauseRecording}
          disabled={isProcessing}
          variant="warning"
          accessibilityHint={
            isPaused
              ? 'Double tap to resume recording'
              : 'Double tap to pause recording'
          }
          hapticStyle={isPaused ? 'medium' : 'light'}
        />
      )}

      {/* Main Record/Stop Button */}
      <Animated.View
        style={[
          styles.mainRecordButton,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <ControlButton
          icon={isRecording ? '⏹' : '🎙'}
          label={isRecording ? 'Stop' : 'Record'}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isProcessing}
          variant={isRecording ? 'danger' : 'primary'}
          size="large"
          accessibilityHint={
            isRecording
              ? 'Double tap to stop and save recording'
              : 'Double tap to start recording'
          }
          hapticStyle={isRecording ? 'medium' : 'heavy'}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingText}>⟳</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

export default EnhancedRecordingControls;