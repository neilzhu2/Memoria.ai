import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

interface RecordingCompletionModalProps {
  visible: boolean;
  duration: number;
  topic?: string;
  onSaveMemory: () => void;
  onDiscardMemory: () => void;
  onPlayback?: () => void;
  onEditTitle?: () => void;
}

export function RecordingCompletionModal({
  visible,
  duration,
  topic,
  onSaveMemory,
  onDiscardMemory,
  onPlayback,
  onEditTitle
}: RecordingCompletionModalProps) {

  React.useEffect(() => {
    if (visible) {
      setTimeout(() => {
        Speech.speak("Recording complete. Choose to save or discard your memory.", {
          language: 'en',
          rate: 0.8
        });
      }, 500);
    }
  }, [visible]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveMemory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Speech.speak("Memory saved successfully. Your family will love this.", { language: 'en' });
    onSaveMemory();
  };

  const handleDiscardMemory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      "Discard Recording?",
      "Are you sure you want to delete this memory? This action cannot be undone.",
      [
        {
          text: "Keep Recording",
          style: "cancel",
          onPress: () => {
            Speech.speak("Recording kept.", { language: 'en' });
          }
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            Speech.speak("Recording discarded.", { language: 'en' });
            onDiscardMemory();
          }
        }
      ]
    );
  };

  const handlePlayback = async () => {
    if (onPlayback) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Speech.speak("Playing back your recording.", { language: 'en' });
      onPlayback();
    }
  };

  const handleEditTitle = async () => {
    if (onEditTitle) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onEditTitle();
    }
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
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.title}>Recording Complete!</Text>
            <Text style={styles.subtitle}>
              Your memory has been recorded successfully
            </Text>
          </View>

          {/* Recording Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{formatDuration(duration)}</Text>
            </View>

            {topic && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Topic:</Text>
                <Text style={styles.summaryValue}>"{topic}"</Text>
              </View>
            )}

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          {/* Preview Actions */}
          <View style={styles.previewSection}>
            <Text style={styles.previewTitle}>Preview Options</Text>

            <View style={styles.previewButtons}>
              {onPlayback && (
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={handlePlayback}
                  accessibilityLabel="Play recording"
                  accessibilityHint="Tap to listen to your recording"
                >
                  <Text style={styles.previewButtonIcon}>▶️</Text>
                  <Text style={styles.previewButtonText}>Play Recording</Text>
                </TouchableOpacity>
              )}

              {onEditTitle && (
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={handleEditTitle}
                  accessibilityLabel="Edit title"
                  accessibilityHint="Tap to change the title of this memory"
                >
                  <Text style={styles.previewButtonIcon}>✏️</Text>
                  <Text style={styles.previewButtonText}>Edit Title</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Memory Benefits */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>What happens when you save:</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.benefitText}>Your family can access this memory</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📱</Text>
              <Text style={styles.benefitText}>Available on all your devices</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>☁️</Text>
              <Text style={styles.benefitText}>Safely backed up to the cloud</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📖</Text>
              <Text style={styles.benefitText}>Can be included in your memoir</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={handleDiscardMemory}
              accessibilityLabel="Discard recording"
              accessibilityHint="Tap to delete this recording permanently"
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveMemory}
              accessibilityLabel="Save memory"
              accessibilityHint="Tap to save this recording to your memories"
            >
              <Text style={styles.saveButtonText}>Save Memory</Text>
            </TouchableOpacity>
          </View>

          {/* Voice Guidance Note */}
          <View style={styles.guidanceNote}>
            <Text style={styles.guidanceText}>
              💬 This recording will be automatically transcribed for easy reading
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
    maxWidth: width * 0.95,
    width: '100%',
    maxHeight: height * 0.9,
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
  successIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right',
  },
  previewSection: {
    marginBottom: 25,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 120,
    minHeight: 60,
    justifyContent: 'center',
  },
  previewButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  previewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  benefitsContainer: {
    backgroundColor: '#e8f5e8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 30,
  },
  benefitText: {
    fontSize: 16,
    color: '#27ae60',
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  discardButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discardButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  guidanceNote: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  guidanceText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
});