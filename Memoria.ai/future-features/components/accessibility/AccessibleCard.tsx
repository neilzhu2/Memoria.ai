/**
 * Accessible Card Component for Memoria.ai
 * High-contrast, readable card component for elderly users
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../stores';

interface AccessibleCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  elevated?: boolean;
  variant?: 'default' | 'highlight' | 'warning' | 'success';
}

const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  subtitle,
  description,
  onPress,
  style,
  children,
  accessibilityLabel,
  accessibilityHint,
  elevated = true,
  variant = 'default',
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
    if (!onPress) return;

    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    onPress(event);
  };

  const getBackgroundColor = () => {
    if (highContrast) {
      return {
        default: '#333333',
        highlight: '#1e40af',
        warning: '#b45309',
        success: '#166534',
      }[variant];
    }

    return {
      default: '#ffffff',
      highlight: '#eff6ff',
      warning: '#fef3c7',
      success: '#d1fae5',
    }[variant];
  };

  const getBorderColor = () => {
    if (highContrast) return '#666666';

    return {
      default: '#e5e7eb',
      highlight: '#2563eb',
      warning: '#f59e0b',
      success: '#10b981',
    }[variant];
  };

  const getTextColor = (type: 'title' | 'subtitle' | 'description') => {
    if (highContrast) {
      return type === 'description' ? '#cccccc' : '#ffffff';
    }

    const colors = {
      default: {
        title: '#1f2937',
        subtitle: '#374151',
        description: '#6b7280',
      },
      highlight: {
        title: '#1e40af',
        subtitle: '#3730a3',
        description: '#4338ca',
      },
      warning: {
        title: '#b45309',
        subtitle: '#d97706',
        description: '#f59e0b',
      },
      success: {
        title: '#166534',
        subtitle: '#059669',
        description: '#10b981',
      },
    };

    return colors[variant][type];
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: getBackgroundColor(),
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      minHeight: onPress ? touchTargetSize : 'auto',
      borderWidth: 1,
      borderColor: getBorderColor(),
      ...(elevated && {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: highContrast ? 0.3 : 0.1,
        shadowRadius: 4,
        elevation: 3,
      }),
    },
    pressable: {
      opacity: 1,
    },
    pressed: {
      opacity: 0.8,
      transform: [{ scale: 0.98 }],
    },
    header: {
      marginBottom: children || description ? 12 : 0,
    },
    title: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: getTextColor('title'),
      marginBottom: subtitle ? 4 : 0,
      lineHeight: (fontSize + 2) * 1.3,
    },
    subtitle: {
      fontSize: fontSize - 1,
      fontWeight: '500',
      color: getTextColor('subtitle'),
      lineHeight: (fontSize - 1) * 1.3,
    },
    description: {
      fontSize: fontSize,
      color: getTextColor('description'),
      lineHeight: fontSize * 1.5,
      marginTop: 8,
    },
    content: {
      flex: 1,
    },
  });

  const CardContent = () => (
    <View style={styles.card}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && (
            <Text
              style={styles.title}
              accessible={true}
              accessibilityRole="header"
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={styles.subtitle}
              accessible={true}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}

      {description && (
        <Text
          style={styles.description}
          accessible={true}
        >
          {description}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.pressable, style]}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return (
    <View style={style}>
      <CardContent />
    </View>
  );
};

export default AccessibleCard;