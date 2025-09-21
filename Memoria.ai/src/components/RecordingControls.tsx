/**
 * Recording Controls Component for Memoria.ai
 * Control panel for audio recording optimized for elderly users
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { AccessibleButton } from './accessibility';
import { useSettingsStore } from '../stores';

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  isProcessing: boolean;
  onStartStop: () => void;
  onPauseResume: () => void;
  onCancel: () => void;
  style?: ViewStyle;
  showCancel?: boolean;
  showPauseResume?: boolean;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  isPaused,
  isProcessing,
  onStartStop,
  onPauseResume,
  onCancel,
  style,
  showCancel = true,
  showPauseResume = true,
}) => {
  const {
    getCurrentFontSize,
    shouldUseHighContrast,
  } = useSettingsStore();

  const fontSize = getCurrentFontSize();
  const highContrast = shouldUseHighContrast();

  const getStartStopButtonProps = () => {
    if (isRecording) {
      return {
        title: 'Stop Recording',
        variant: 'danger' as const,
        accessibilityLabel: 'Stop recording',
        accessibilityHint: 'Tap to stop recording and save your memory',
      };
    }
    return {
      title: 'Start Recording',
      variant: 'primary' as const,
      accessibilityLabel: 'Start recording',
      accessibilityHint: 'Tap to begin recording your memory',
    };
  };

  const getPauseResumeButtonProps = () => {
    if (isPaused) {
      return {
        title: 'Resume',
        variant: 'primary' as const,
        accessibilityLabel: 'Resume recording',
        accessibilityHint: 'Tap to continue recording where you left off',
      };
    }
    return {
      title: 'Pause',
      variant: 'secondary' as const,
      accessibilityLabel: 'Pause recording',
      accessibilityHint: 'Tap to temporarily pause recording',
    };
  };

  const startStopProps = getStartStopButtonProps();
  const pauseResumeProps = getPauseResumeButtonProps();

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      paddingHorizontal: 20,
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    primaryControlContainer: {
      flex: 2,
      alignItems: 'center',
    },
    secondaryControlContainer: {
      flex: 1,
      alignItems: 'center',
    },
    singleButtonContainer: {
      alignItems: 'center',
      width: '100%',
    },
    instructionsContainer: {
      marginTop: 24,
      paddingHorizontal: 16,
    },
    instructionsText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      lineHeight: (fontSize - 2) * 1.5,
    },
    statusContainer: {
      marginBottom: 16,
      alignItems: 'center',
    },
    statusText: {
      fontSize: fontSize,
      fontWeight: '600',
      color: isRecording
        ? (isPaused ? '#f59e0b' : '#dc2626')
        : (highContrast ? '#ffffff' : '#374151'),
      textAlign: 'center',
    },
  });

  const getInstructionsText = () => {
    if (isProcessing) {
      return 'Processing your recording... Please wait.';
    }
    if (isRecording && isPaused) {
      return 'Recording paused. Tap Resume to continue or Stop to save your memory.';
    }
    if (isRecording) {
      return 'Recording in progress. Speak clearly and at a comfortable volume. You can pause or stop anytime.';
    }
    return 'Ready to record your memory. Tap Start Recording when you\'re ready to begin sharing your story.';
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (isRecording && isPaused) return 'Paused';
    if (isRecording) return 'Recording';
    return 'Ready';
  };

  // Layout for when all controls are available
  const renderFullControls = () => (
    <View style={styles.controlsRow}>
      {showCancel && (
        <View style={styles.secondaryControlContainer}>
          <AccessibleButton
            title="Cancel"
            onPress={onCancel}
            variant="secondary"
            size="medium"
            disabled={isProcessing}
            accessibilityLabel="Cancel recording"
            accessibilityHint="Tap to cancel recording and return to previous screen"
          />
        </View>
      )}

      <View style={styles.primaryControlContainer}>
        <AccessibleButton
          title={startStopProps.title}
          onPress={onStartStop}
          variant={startStopProps.variant}
          size="large"
          disabled={isProcessing}
          accessibilityLabel={startStopProps.accessibilityLabel}
          accessibilityHint={startStopProps.accessibilityHint}
        />
      </View>

      {showPauseResume && (
        <View style={styles.secondaryControlContainer}>
          <AccessibleButton
            title={pauseResumeProps.title}
            onPress={onPauseResume}
            variant={pauseResumeProps.variant}
            size="medium"
            disabled={!isRecording || isProcessing}
            accessibilityLabel={pauseResumeProps.accessibilityLabel}
            accessibilityHint={pauseResumeProps.accessibilityHint}
          />
        </View>
      )}
    </View>
  );

  // Simplified layout for just start/stop
  const renderSimplifiedControls = () => (
    <View style={styles.singleButtonContainer}>
      <AccessibleButton
        title={startStopProps.title}
        onPress={onStartStop}
        variant={startStopProps.variant}
        size="large"
        disabled={isProcessing}
        accessibilityLabel={startStopProps.accessibilityLabel}
        accessibilityHint={startStopProps.accessibilityHint}
      />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Status Display */}
      <View style={styles.statusContainer}>
        <Text
          style={styles.statusText}
          accessible={true}
          accessibilityLabel={`Recording status: ${getStatusText()}`}
        >
          {getStatusText()}
        </Text>
      </View>

      {/* Control Buttons */}
      {showCancel || showPauseResume ? renderFullControls() : renderSimplifiedControls()}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text
          style={styles.instructionsText}
          accessible={true}
          accessibilityLabel="Instructions"
        >
          {getInstructionsText()}
        </Text>
      </View>
    </View>
  );
};

export default RecordingControls;