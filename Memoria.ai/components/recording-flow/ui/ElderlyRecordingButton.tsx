/**
 * Elderly Recording Button Component
 *
 * Large, accessible recording button optimized for elderly users
 * with clear visual states, voice feedback, and haptic confirmation.
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  RecordingPhase,
  ElderlyRecordingSettings,
  HapticLevel,
} from '@/types/recording-flow';

// ========================================
// Types & Interfaces
// ========================================

export interface ElderlyRecordingButtonProps {
  // Recording state
  phase: RecordingPhase;
  isRecording: boolean;
  isPaused: boolean;
  duration?: number;

  // Button configuration
  size?: 'small' | 'medium' | 'large' | 'extra-large';
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;

  // Elderly-specific features
  elderlyMode?: boolean;
  voiceGuidanceEnabled?: boolean;
  hapticFeedbackLevel?: HapticLevel;
  showDuration?: boolean;
  showVisualFeedback?: boolean;

  // Callbacks
  onPress?: () => void;
  onLongPress?: () => void;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;

  // Styling
  style?: ViewStyle;
  textStyle?: TextStyle;
}

type ButtonState = 'idle' | 'recording' | 'paused' | 'processing' | 'disabled';

interface ButtonConfig {
  backgroundColor: string;
  borderColor: string;
  iconName: string;
  iconColor: string;
  text: string;
  voicePrompt: string;
  elderlyVoicePrompt: string;
}

// ========================================
// Configuration
// ========================================

const BUTTON_SIZES = {
  small: 60,
  medium: 80,
  large: 100,
  'extra-large': 120,
} as const;

const ANIMATION_DURATION = 150;
const PULSE_DURATION = 1000;

// ========================================
// Main Component
// ========================================

export const ElderlyRecordingButton: React.FC<ElderlyRecordingButtonProps> = ({
  phase,
  isRecording,
  isPaused,
  duration = 0,
  size = 'extra-large',
  variant = 'primary',
  disabled = false,
  elderlyMode = true,
  voiceGuidanceEnabled = true,
  hapticFeedbackLevel = 'medium',
  showDuration = true,
  showVisualFeedback = true,
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme();

  // Animation values
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  // ========================================
  // State Calculation
  // ========================================

  const getButtonState = (): ButtonState => {
    if (disabled) return 'disabled';
    if (phase === 'processing') return 'processing';
    if (isRecording && !isPaused) return 'recording';
    if (isPaused) return 'paused';
    return 'idle';
  };

  const buttonState = getButtonState();

  // ========================================
  // Configuration
  // ========================================

  const getButtonConfig = (): ButtonConfig => {
    const colors = Colors[colorScheme ?? 'light'];

    const configs: Record<ButtonState, ButtonConfig> = {
      idle: {
        backgroundColor: variant === 'primary' ? '#e74c3c' : colors.background,
        borderColor: '#e74c3c',
        iconName: 'mic.fill',
        iconColor: variant === 'primary' ? 'white' : '#e74c3c',
        text: 'Start Recording',
        voicePrompt: 'Press to start recording',
        elderlyVoicePrompt: 'Press the red button to start recording your memory',
      },
      recording: {
        backgroundColor: '#e74c3c',
        borderColor: '#c0392b',
        iconName: 'stop.fill',
        iconColor: 'white',
        text: 'Stop Recording',
        voicePrompt: 'Recording active. Press to stop',
        elderlyVoicePrompt: 'Recording your memory now. Press the button again to stop when you\'re finished',
      },
      paused: {
        backgroundColor: '#f39c12',
        borderColor: '#e67e22',
        iconName: 'play.fill',
        iconColor: 'white',
        text: 'Resume Recording',
        voicePrompt: 'Recording paused. Press to resume',
        elderlyVoicePrompt: 'Recording is paused. Press the button to continue recording',
      },
      processing: {
        backgroundColor: '#95a5a6',
        borderColor: '#7f8c8d',
        iconName: 'hourglass',
        iconColor: 'white',
        text: 'Processing...',
        voicePrompt: 'Processing recording',
        elderlyVoicePrompt: 'Processing your recording. Please wait a moment',
      },
      disabled: {
        backgroundColor: '#bdc3c7',
        borderColor: '#95a5a6',
        iconName: 'mic.slash.fill',
        iconColor: '#7f8c8d',
        text: 'Not Available',
        voicePrompt: 'Button not available',
        elderlyVoicePrompt: 'Recording is not available right now',
      },
    };

    return configs[buttonState];
  };

  const config = getButtonConfig();
  const buttonSize = BUTTON_SIZES[size];

  // ========================================
  // Animations
  // ========================================

  useEffect(() => {
    // Pulse animation for recording state
    if (buttonState === 'recording' && showVisualFeedback) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [buttonState, showVisualFeedback]);

  useEffect(() => {
    // Opacity animation for disabled state
    Animated.timing(opacityAnimation, {
      toValue: disabled ? 0.6 : 1,
      duration: ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [disabled]);

  // ========================================
  // Event Handlers
  // ========================================

  const handlePress = async () => {
    if (disabled || !onPress) return;

    try {
      // Scale animation for press feedback
      Animated.sequence([
        Animated.timing(scaleAnimation, {
          toValue: 0.95,
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1,
          duration: ANIMATION_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback
      if (hapticFeedbackLevel !== 'none') {
        const hapticStyle =
          hapticFeedbackLevel === 'light' ? Haptics.ImpactFeedbackStyle.Light :
          hapticFeedbackLevel === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
          Haptics.ImpactFeedbackStyle.Heavy;

        await Haptics.impactAsync(hapticStyle);
      }

      // Voice feedback
      if (voiceGuidanceEnabled) {
        const message = elderlyMode ? config.elderlyVoicePrompt : config.voicePrompt;
        await Speech.speak(message, {
          rate: elderlyMode ? 0.8 : 1.0,
          volume: elderlyMode ? 0.9 : 0.7,
        });
      }

      // Execute callback
      onPress();

    } catch (error) {
      console.warn('Error in button press handler:', error);
    }
  };

  const handleLongPress = async () => {
    if (disabled || !onLongPress) return;

    try {
      // Enhanced haptic for long press
      if (hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      // Voice feedback for long press
      if (voiceGuidanceEnabled) {
        await Speech.speak(
          elderlyMode
            ? "Long press detected. Additional options available."
            : "Long press action",
          { rate: elderlyMode ? 0.8 : 1.0 }
        );
      }

      onLongPress();

    } catch (error) {
      console.warn('Error in long press handler:', error);
    }
  };

  // ========================================
  // Duration Formatting
  // ========================================

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========================================
  // Accessibility
  // ========================================

  const getAccessibilityProps = () => ({
    accessibilityRole: 'button' as const,
    accessibilityLabel: accessibilityLabel || config.text,
    accessibilityHint: accessibilityHint ||
      (elderlyMode ? config.elderlyVoicePrompt : config.voicePrompt),
    accessibilityState: {
      disabled,
      selected: buttonState === 'recording',
    },
    accessible: true,
  });

  // ========================================
  // Render
  // ========================================

  return (
    <View style={[styles.container, style]}>
      {/* Duration Display */}
      {showDuration && duration > 0 && (
        <View style={[
          styles.durationContainer,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}>
          <Text style={[
            styles.durationText,
            { color: Colors[colorScheme ?? 'light'].text },
            elderlyMode && styles.elderlyDurationText,
            textStyle,
          ]}>
            {formatDuration(duration)}
          </Text>
        </View>
      )}

      {/* Main Button */}
      <Animated.View
        style={[
          {
            transform: [
              { scale: scaleAnimation },
              { scale: pulseAnimation },
            ],
            opacity: opacityAnimation,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
            },
            elderlyMode && styles.elderlyButton,
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={elderlyMode ? 800 : 500}
          disabled={disabled}
          activeOpacity={0.8}
          {...getAccessibilityProps()}
        >
          {/* Icon */}
          <IconSymbol
            name={config.iconName as any}
            size={elderlyMode ? buttonSize * 0.4 : buttonSize * 0.35}
            color={config.iconColor}
          />

          {/* Recording indicator for visual feedback */}
          {buttonState === 'recording' && showVisualFeedback && (
            <View
              testID="recording-indicator"
              style={[
                styles.recordingIndicator,
                { backgroundColor: config.iconColor }
              ]}
            />
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Button Label */}
      <Text style={[
        styles.buttonLabel,
        { color: Colors[colorScheme ?? 'light'].text },
        elderlyMode && styles.elderlyButtonLabel,
        textStyle,
      ]}>
        {config.text}
      </Text>

      {/* Status Indicator */}
      {buttonState === 'processing' && (
        <View style={[
          styles.statusIndicator,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}>
          <Text style={[
            styles.statusText,
            { color: Colors[colorScheme ?? 'light'].text }
          ]}>
            Please wait...
          </Text>
        </View>
      )}
    </View>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  elderlyButton: {
    borderWidth: 4,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  elderlyButtonLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  durationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  elderlyDurationText: {
    fontSize: 24,
  },
  statusIndicator: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ElderlyRecordingButton;