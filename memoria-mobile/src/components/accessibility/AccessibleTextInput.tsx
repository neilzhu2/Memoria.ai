/**
 * Accessible Text Input Component for Memoria.ai
 * Large, clear text input optimized for elderly users
 */

import React, { forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { useSettingsStore } from '../../stores';

interface AccessibleTextInputProps extends TextInputProps {
  label?: string;
  description?: string;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  required?: boolean;
}

const AccessibleTextInput = forwardRef<TextInput, AccessibleTextInputProps>(
  ({
    label,
    description,
    error,
    containerStyle,
    inputStyle,
    labelStyle,
    required = false,
    ...textInputProps
  }, ref) => {
    const {
      getCurrentFontSize,
      getCurrentTouchTargetSize,
      shouldUseHighContrast
    } = useSettingsStore();

    const fontSize = getCurrentFontSize();
    const touchTargetSize = getCurrentTouchTargetSize();
    const highContrast = shouldUseHighContrast();

    const styles = StyleSheet.create({
      container: {
        marginBottom: 16,
      },
      labelContainer: {
        marginBottom: 8,
      },
      label: {
        fontSize: fontSize,
        fontWeight: '600',
        color: highContrast ? '#ffffff' : '#1f2937',
        marginBottom: 4,
      },
      requiredIndicator: {
        color: '#dc2626',
        fontSize: fontSize,
      },
      description: {
        fontSize: fontSize - 2,
        color: highContrast ? '#cccccc' : '#6b7280',
        lineHeight: (fontSize - 2) * 1.4,
      },
      inputContainer: {
        position: 'relative',
      },
      input: {
        minHeight: touchTargetSize,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: fontSize,
        borderWidth: 2,
        borderColor: error
          ? '#dc2626'
          : highContrast
          ? '#666666'
          : '#d1d5db',
        borderRadius: 8,
        backgroundColor: highContrast ? '#333333' : '#ffffff',
        color: highContrast ? '#ffffff' : '#1f2937',
        textAlignVertical: 'top',
      },
      inputFocused: {
        borderColor: error ? '#dc2626' : '#2563eb',
        shadowColor: error ? '#dc2626' : '#2563eb',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      },
      error: {
        marginTop: 8,
        fontSize: fontSize - 2,
        color: '#dc2626',
        fontWeight: '500',
      },
    });

    const [isFocused, setIsFocused] = React.useState(false);

    const handleFocus = (e: any) => {
      setIsFocused(true);
      textInputProps.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      textInputProps.onBlur?.(e);
    };

    const inputId = React.useMemo(() => Math.random().toString(), []);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <View style={styles.labelContainer}>
            <Text
              style={[styles.label, labelStyle]}
              accessible={true}
              accessibilityRole="header"
            >
              {label}
              {required && <Text style={styles.requiredIndicator}> *</Text>}
            </Text>
            {description && (
              <Text
                style={styles.description}
                accessible={true}
                accessibilityLabel={`Description: ${description}`}
              >
                {description}
              </Text>
            )}
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            ref={ref}
            {...textInputProps}
            style={[
              styles.input,
              isFocused && styles.inputFocused,
              inputStyle,
            ]}
            onFocus={handleFocus}
            onBlur={handleBlur}
            accessible={true}
            accessibilityLabel={label || textInputProps.placeholder}
            accessibilityHint={description}
            accessibilityRequired={required}
            accessibilityInvalid={!!error}
            placeholderTextColor={
              highContrast ? '#999999' : '#9ca3af'
            }
            selectionColor={highContrast ? '#ffffff' : '#2563eb'}
            // Enhanced accessibility for elderly users
            autoCorrect={true}
            autoCapitalize="sentences"
            clearButtonMode="while-editing"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        </View>

        {error && (
          <Text
            style={styles.error}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel={`Error: ${error}`}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

AccessibleTextInput.displayName = 'AccessibleTextInput';

export default AccessibleTextInput;