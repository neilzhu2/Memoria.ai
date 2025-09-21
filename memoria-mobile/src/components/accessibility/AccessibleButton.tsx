/**
 * Accessible Button Component for Memoria.ai
 * Large, high-contrast button optimized for elderly users
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../stores';

interface AccessibleButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled
  } = useSettingsStore();

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const handlePress = async (event: GestureResponderEvent) => {
    if (disabled) return;

    if (hapticFeedback && hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress(event);
  };

  const getButtonStyle = (): ViewStyle => {
    const baseSize = {
      small: touchTargetSize,
      medium: touchTargetSize + 10,
      large: touchTargetSize + 20,
    }[size];

    const backgroundColor = disabled
      ? (highContrast ? '#333333' : '#d1d5db')
      : {
          primary: '#2563eb',
          secondary: highContrast ? '#666666' : '#e5e7eb',
          danger: '#dc2626',
        }[variant] || (variant === 'destructive' ? '#dc2626' : '#2563eb');

    return {
      backgroundColor,
      minHeight: baseSize,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: disabled ? 0 : 0.15,
      shadowRadius: 4,
      elevation: disabled ? 0 : 4,
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const textColor = disabled
      ? (highContrast ? '#999999' : '#9ca3af')
      : variant === 'secondary'
      ? (highContrast ? '#ffffff' : '#374151')
      : '#ffffff';

    const fontSizeAdjustment = {
      small: fontSize - 2,
      medium: fontSize,
      large: fontSize + 2,
    }[size];

    return {
      color: textColor,
      fontSize: fontSizeAdjustment,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: fontSizeAdjustment * 1.2,
    };
  };

  const styles = StyleSheet.create({
    button: getButtonStyle(),
    text: getTextStyle(),
  });

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, textStyle]} numberOfLines={2}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default AccessibleButton;