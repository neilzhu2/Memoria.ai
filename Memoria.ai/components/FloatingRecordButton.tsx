import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface FloatingRecordButtonProps {
  onPress: () => void;
  isRecording?: boolean;
  size?: number;
}

export function FloatingRecordButton({
  onPress,
  isRecording = false,
  size = 70
}: FloatingRecordButtonProps) {
  const colorScheme = useColorScheme();
  // Use terracotta (primary) for recording button - aligns with recording affordances
  // and optimized for elderly vision (warm tones penetrate aged lenses better)
  const buttonColor = Colors[colorScheme ?? 'light'].primary;
  const buttonColorActive = Colors[colorScheme ?? 'light'].primaryDark;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.container}>
      {/* Main button */}
      <View
        style={[
          styles.buttonContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRecording ? buttonColorActive : buttonColor,
            },
          ]}
          onPress={handlePress}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          accessibilityHint="Large recording button - tap to begin sharing your memory"
          activeOpacity={0.8}
        >
          {/* Inner gradient effect */}
          <View style={[styles.innerGradient, { borderRadius: size / 2 }]}>
            <IconSymbol
              name={isRecording ? "stop.fill" : "mic.fill"}
              size={size * 0.4}
              color="white"
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  innerGradient: {
    position: 'absolute',
    width: '85%',
    height: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});