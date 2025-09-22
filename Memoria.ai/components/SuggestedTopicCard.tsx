import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
  View,
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface SuggestedTopicCardProps {
  topic: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  isRecording?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const SuggestedTopicCard: React.FC<SuggestedTopicCardProps> = ({
  topic,
  onPress,
  disabled = false,
  style,
  textStyle,
  isRecording = false,
}) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const fadeValue = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Fade out when recording starts
    Animated.timing(fadeValue, {
      toValue: isRecording ? 0.5 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRecording, fadeValue]);

  const handlePressIn = async () => {
    if (!disabled && !isRecording) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
      }).start();
    }
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
    if (!disabled && !isRecording) {
      onPress();
    }
  };

  const cardStyles = [
    styles.card,
    disabled && styles.cardDisabled,
    isRecording && styles.cardRecording,
    style,
  ];

  const textStyles = [
    styles.topicText,
    disabled && styles.topicTextDisabled,
    isRecording && styles.topicTextRecording,
    textStyle,
  ];

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleValue }],
        opacity: fadeValue,
      }}
    >
      <TouchableOpacity
        style={cardStyles}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isRecording}
        accessibilityLabel={`Suggested topic: ${topic}`}
        accessibilityHint="Tap to start recording about this topic"
        accessibilityRole="button"
        accessibilityState={{
          disabled: disabled || isRecording,
        }}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>💭</Text>
        </View>
        <Text style={textStyles}>
          {topic}
        </Text>
        {!isRecording && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Tap to record</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 20,
    minWidth: Math.min(screenWidth * 0.85, 320),
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardDisabled: {
    backgroundColor: '#F7FAFC',
    borderColor: '#CBD5E0',
  },
  cardRecording: {
    borderColor: '#FEB2B2',
    backgroundColor: '#FEF5E7',
  },
  iconContainer: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  topicText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  topicTextDisabled: {
    color: '#A0AEC0',
  },
  topicTextRecording: {
    color: '#975A16',
  },
  hintContainer: {
    marginTop: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});