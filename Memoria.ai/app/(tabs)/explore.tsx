import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function RecordScreen() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingTime, setRecordingTime] = React.useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleRecordPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      if (!isRecording) {
        // Start recording
        setIsRecording(true);
        setRecordingTime(0);
        Speech.speak("Recording started. Share your memory.", {
          language: 'en',
          rate: 0.8 // Slower speech for elderly users
        });
      } else {
        // Stop recording
        setIsRecording(false);
        Speech.speak("Recording saved successfully.", {
          language: 'en',
          rate: 0.8
        });
        Alert.alert(
          "Memory Saved",
          "Your memory has been recorded and saved successfully.",
          [{ text: "OK", style: "default" }],
          { cancelable: false }
        );
      }
    } catch (error) {
      Alert.alert("Error", "Unable to start recording. Please check permissions.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const suggestedTopics = [
    "Talk about your childhood home",
    "Share a memory of your parents",
    "Describe your wedding day",
    "Tell about your first job",
    "Recall a favorite holiday",
    "Remember a good friend",
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.contentContainer}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.elderlyHighContrast }]}>
          Record Memory
        </Text>
        <Text style={[styles.subtitle, { color: colors.elderlyMediumContrast }]}>
          Tap the button below to start recording
        </Text>
      </View>

      {/* Main Recording Button */}
      <View style={styles.recordingSection}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? colors.elderlyError : colors.elderlyTabActive,
            }
          ]}
          onPress={handleRecordPress}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          accessibilityHint="Large button to start or stop recording your memory"
          accessibilityRole="button"
        >
          <Text style={styles.recordButtonIcon}>
            {isRecording ? "⏹️" : "🎙️"}
          </Text>
          <Text style={styles.recordButtonText}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Text>
        </TouchableOpacity>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <Text style={[styles.recordingTime, { color: colors.elderlyError }]}>
              🔴 {formatTime(recordingTime)}
            </Text>
            <Text style={[styles.recordingStatus, { color: colors.elderlyMediumContrast }]}>
              Speak clearly and naturally
            </Text>
          </View>
        )}
      </View>

      {/* Suggested Topics */}
      {!isRecording && (
        <View style={styles.suggestedSection}>
          <Text style={[styles.sectionTitle, { color: colors.elderlyHighContrast }]}>
            Memory Suggestions
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.elderlyMediumContrast }]}>
            Tap any topic to start recording about it
          </Text>

          {suggestedTopics.map((topic, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.topicCard, { backgroundColor: colors.tabBarBackground }]}
              onPress={handleRecordPress}
              accessibilityLabel={`Record about: ${topic}`}
              accessibilityHint="Tap to start recording about this topic"
              accessibilityRole="button"
            >
              <Text style={[styles.topicText, { color: colors.elderlyMediumContrast }]}>
                {topic}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recording Tips */}
      <View style={[styles.tipsSection, { backgroundColor: colors.tabBarBackground }]}>
        <Text style={[styles.tipsTitle, { color: colors.elderlyHighContrast }]}>
          💡 Recording Tips
        </Text>
        <Text style={[styles.tipText, { color: colors.elderlyMediumContrast }]}>
          • Find a quiet place to record{'\n'}
          • Speak clearly and at a comfortable pace{'\n'}
          • Take your time - there's no rush{'\n'}
          • You can record multiple memories{'\n'}
          • Tap stop when you're finished
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100, // Extra space for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 24,
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    paddingVertical: 24,
    paddingHorizontal: 32,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    minHeight: 120,
    minWidth: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  recordButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  recordingIndicator: {
    marginTop: 20,
    alignItems: 'center',
  },
  recordingTime: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recordingStatus: {
    fontSize: 16,
    textAlign: 'center',
  },
  suggestedSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  topicCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 60,
    justifyContent: 'center',
  },
  topicText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  tipsSection: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
