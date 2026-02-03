import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

interface RecordingPreparationModalProps {
  visible: boolean;
  topic?: string;
  onStartRecording: () => void;
  onCancel: () => void;
}

export function RecordingPreparationModal({
  visible,
  topic,
  onStartRecording,
  onCancel
}: RecordingPreparationModalProps) {

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => {
        Speech.speak("Ready to record? Follow the instructions on screen.", {
          language: 'en',
          rate: 0.8
        });
      }, 500);
    }
  }, [visible]);

  const handleStartRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.speak("Recording started. Please speak clearly.", { language: 'en' });
    onStartRecording();
  };

  const handleCancel = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      accessibilityViewIsModal={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Ready to Record?</Text>
            <Text style={styles.subtitle}>
              Share your memory with your family
            </Text>
          </View>

          {/* Topic Display */}
          {topic && (
            <View style={styles.topicContainer}>
              <Text style={styles.topicLabel}>Today's Topic:</Text>
              <Text style={styles.topicText}>"{topic}"</Text>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Recording Tips:</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎤</Text>
              <Text style={styles.tipText}>Speak clearly and at normal volume</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>⏱️</Text>
              <Text style={styles.tipText}>Take your time - there's no rush</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>💭</Text>
              <Text style={styles.tipText}>Share details, feelings, and stories</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>✋</Text>
              <Text style={styles.tipText}>Tap stop when you're finished</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              accessibilityLabel="Cancel recording"
              accessibilityHint="Tap to go back without recording"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStartRecording}
              accessibilityLabel="Start recording"
              accessibilityHint="Tap to begin recording your memory"
            >
              <Text style={styles.startButtonText}>Start Recording</Text>
            </TouchableOpacity>
          </View>

          {/* Voice Guidance Note */}
          <View style={styles.guidanceNote}>
            <Text style={styles.guidanceText}>
              🔊 Voice guidance is active to help you through each step
            </Text>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    maxWidth: width * 0.9,
    width: '100%',
    maxHeight: height * 0.85,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  topicContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  topicLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  topicText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 28,
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
  },
  tipText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  startButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  guidanceNote: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27ae60',
  },
  guidanceText: {
    fontSize: 14,
    color: '#27ae60',
    textAlign: 'center',
    lineHeight: 20,
  },
});