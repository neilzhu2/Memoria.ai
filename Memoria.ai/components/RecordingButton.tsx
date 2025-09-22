import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface RecordingButtonProps {
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'large' | 'medium';
}

const { width: screenWidth } = Dimensions.get('window');

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording,
  onPress,
  disabled = false,
  style,
  textStyle,
  size = 'large',
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const pulseValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (isRecording) {
      // Start pulsing animation when recording
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseValue.setValue(1);
    }
  }, [isRecording, pulseValue]);

  const handlePressIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  const buttonStyles = [
    styles.button,
    size === 'large' ? styles.buttonLarge : styles.buttonMedium,
    isRecording ? styles.buttonRecording : styles.buttonIdle,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    size === 'large' ? styles.buttonTextLarge : styles.buttonTextMedium,
    isRecording ? styles.buttonTextRecording : styles.buttonTextIdle,
    disabled && styles.buttonTextDisabled,
    textStyle,
  ];

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleValue },
          { scale: isRecording ? pulseValue : 1 },
        ],
      }}
    >
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
        accessibilityHint={
          isRecording
            ? "Tap to stop recording your memory"
            : "Tap to start recording your memory"
        }
        accessibilityRole="button"
        accessibilityState={{
          disabled,
          selected: isRecording,
        }}
      >
        <Text style={textStyles}>
          {isRecording ? "🔴 Stop Recording" : "🎙️ Start Recording"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Ensure minimum touch target of 44px as per accessibility guidelines
    minHeight: 88,
    minWidth: Math.min(screenWidth * 0.85, 320),
  },
  buttonLarge: {
    paddingVertical: 28,
    paddingHorizontal: 48,
    minHeight: 96,
  },
  buttonMedium: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    minHeight: 80,
  },
  buttonIdle: {
    backgroundColor: '#2E86AB', // Strong blue for better contrast
    borderWidth: 3,
    borderColor: '#1B5E7F',
  },
  buttonRecording: {
    backgroundColor: '#E53E3E', // Strong red for recording state
    borderWidth: 3,
    borderColor: '#C53030',
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E0',
    borderColor: '#A0AEC0',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  buttonTextLarge: {
    fontSize: 22,
    lineHeight: 28,
  },
  buttonTextMedium: {
    fontSize: 18,
    lineHeight: 24,
  },
  buttonTextIdle: {
    color: '#FFFFFF',
  },
  buttonTextRecording: {
    color: '#FFFFFF',
  },
  buttonTextDisabled: {
    color: '#718096',
  },
});