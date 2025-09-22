import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { FloatingRecordButton } from './FloatingRecordButton';

interface FloatingTabOverlayProps {
  onRecordPress: () => void;
  isRecording?: boolean;
}

export function FloatingTabOverlay({
  onRecordPress,
  isRecording = false
}: FloatingTabOverlayProps) {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.buttonContainer}>
        <FloatingRecordButton
          onPress={onRecordPress}
          isRecording={isRecording}
          size={70}
        />
      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: Platform.select({
      ios: 44, // Half overlap with iOS tab bar (88 / 2)
      default: 40, // Half overlap with Android tab bar (80 / 2)
    }),
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
    zIndex: 1000,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});