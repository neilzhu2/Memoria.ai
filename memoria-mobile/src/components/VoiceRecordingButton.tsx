/**
 * Voice Recording Button Component for Memoria.ai
 * Large, accessible recording button optimized for elderly users
 */

import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores';

interface VoiceRecordingButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
  size?: 'medium' | 'large';
  style?: any;
}

const VoiceRecordingButton: React.FC<VoiceRecordingButtonProps> = ({
  isRecording,
  onPress,
  disabled = false,
  size = 'large',
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
  } = useSettingsStore();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;

  const fontSize = getCurrentFontSize();
  const baseTouchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  // Pulse animation when recording
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
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

  // Ripple effect animation
  useEffect(() => {
    if (isRecording) {
      const ripple = Animated.loop(
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      ripple.start();
      return () => ripple.stop();
    } else {
      rippleAnim.setValue(0);
    }
  }, [isRecording]);

  const handlePressIn = () => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (disabled) return;

    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(
        isRecording
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Medium
      );
    }

    // Announce state change for accessibility
    const announcement = isRecording ? 'Stopping recording' : 'Starting recording';
    AccessibilityInfo.announceForAccessibility(announcement);

    onPress();
  };

  const getButtonSize = () => {
    return size === 'large' ? baseTouchTargetSize + 60 : baseTouchTargetSize + 40;
  };

  const getIconSize = () => {
    return size === 'large' ? 32 : 24;
  };

  const buttonSize = getButtonSize();
  const iconSize = getIconSize();

  const getButtonStyle = () => {
    const backgroundColor = disabled
      ? (highContrast ? '#333333' : '#d1d5db')
      : isRecording
      ? '#dc2626'
      : '#2563eb';

    return {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: disabled ? 0 : 0.3,
      shadowRadius: 8,
      elevation: disabled ? 0 : 8,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getRippleStyle = (index: number) => {
    const delay = index * 0.3;
    return {
      position: 'absolute' as const,
      width: buttonSize + 40,
      height: buttonSize + 40,
      borderRadius: (buttonSize + 40) / 2,
      borderWidth: 2,
      borderColor: isRecording ? '#dc2626' : '#2563eb',
      opacity: rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 0],
      }),
      transform: [
        {
          scale: rippleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1.4],
          }),
        },
      ],
    };
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    rippleContainer: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    button: getButtonStyle(),
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    microphoneIcon: {
      width: iconSize,
      height: iconSize,
      backgroundColor: '#ffffff',
      borderRadius: 4,
    },
    stopIcon: {
      width: iconSize * 0.7,
      height: iconSize * 0.7,
      backgroundColor: '#ffffff',
      borderRadius: 2,
    },
    labelContainer: {
      marginTop: 16,
      alignItems: 'center',
    },
    primaryLabel: {
      fontSize: fontSize + 2,
      fontWeight: '700',
      color: highContrast ? '#ffffff' : '#1f2937',
      textAlign: 'center',
    },
    secondaryLabel: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      marginTop: 4,
    },
  });

  const getAccessibilityLabel = () => {
    if (disabled) return 'Recording button disabled';
    return isRecording ? 'Stop recording' : 'Start recording';
  };

  const getAccessibilityHint = () => {
    if (disabled) return 'Recording is currently unavailable';
    return isRecording
      ? 'Double tap to stop recording and save your memory'
      : 'Double tap to start recording your memory';
  };

  return (
    <View style={[styles.container, style]}>
      {/* Ripple Effects */}
      {isRecording && (
        <View style={styles.rippleContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={getRippleStyle(index)}
            />
          ))}
        </View>
      )}

      {/* Main Button */}
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim },
          ],
        }}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={getAccessibilityLabel()}
          accessibilityHint={getAccessibilityHint()}
          accessibilityState={{ disabled }}
        >
          <View style={styles.iconContainer}>
            {isRecording ? (
              <View style={styles.stopIcon} />
            ) : (
              <View style={styles.microphoneIcon} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Labels */}
      <View style={styles.labelContainer}>
        <Text style={styles.primaryLabel}>
          {disabled
            ? 'Unavailable'
            : isRecording
            ? 'Recording...'
            : 'Start Recording'
          }
        </Text>
        <Text style={styles.secondaryLabel}>
          {disabled
            ? 'Check permissions'
            : isRecording
            ? 'Tap to stop'
            : 'Tap to begin'
          }
        </Text>
      </View>
    </View>
  );
};

export default VoiceRecordingButton;