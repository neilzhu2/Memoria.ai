import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

export default function HomeScreen() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [memoryCount, setMemoryCount] = React.useState(0);

  const handleRecordPress = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (!isRecording) {
        // Start recording simulation
        setIsRecording(true);
        Speech.speak("Recording started. Share your memory.", { language: 'en' });

        // Simulate recording for demo
        setTimeout(() => {
          setIsRecording(false);
          setMemoryCount(prev => prev + 1);
          Speech.speak("Recording saved successfully.", { language: 'en' });
        }, 3000);
      } else {
        // Stop recording
        setIsRecording(false);
        setMemoryCount(prev => prev + 1);
        Speech.speak("Recording saved successfully.", { language: 'en' });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to start recording. Please check permissions.");
    }
  };

  const handleMemoriesPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Memories", `You have ${memoryCount} memories saved.`);
  };

  const handleSettingsPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Settings", "Access accessibility settings, family sharing, and more.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Memoria.ai</Text>
        <Text style={styles.subtitle}>Preserve Your Voice, Your Story</Text>
      </View>

      {/* Main Recording Button */}
      <View style={styles.recordingSection}>
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={handleRecordPress}
          accessibilityLabel={isRecording ? "Stop recording" : "Start recording"}
          accessibilityHint="Tap to start or stop recording your memory"
        >
          <Text style={styles.recordButtonText}>
            {isRecording ? "🔴 Recording..." : "🎙️ Record Memory"}
          </Text>
        </TouchableOpacity>

        {isRecording && (
          <Text style={styles.recordingStatus}>
            🟢 Listening... Speak clearly about your memory
          </Text>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{memoryCount}</Text>
          <Text style={styles.statLabel}>Memories Saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Family Members</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleMemoriesPress}
          accessibilityLabel="View memories"
          accessibilityHint="Tap to view and manage your saved memories"
        >
          <Text style={styles.actionButtonIcon}>📚</Text>
          <Text style={styles.actionButtonText}>My Memories</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSettingsPress}
          accessibilityLabel="Open settings"
          accessibilityHint="Tap to access app settings and preferences"
        >
          <Text style={styles.actionButtonIcon}>⚙️</Text>
          <Text style={styles.actionButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Demo Information */}
      <View style={styles.demoSection}>
        <Text style={styles.demoTitle}>🧪 Demo Version</Text>
        <Text style={styles.demoText}>
          This is a demonstration of Memoria.ai's elderly-friendly interface.
          Features include voice recording, family sharing, real-time transcription,
          and accessibility optimizations for users 65+.
        </Text>
        <Text style={styles.demoFeatures}>
          ✅ Large touch targets (60px+){'\n'}
          ✅ High contrast design{'\n'}
          ✅ Voice guidance{'\n'}
          ✅ Haptic feedback{'\n'}
          ✅ Simple, clear interface
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#3498db',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    minHeight: 80,
    minWidth: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#e74c3c',
  },
  recordButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  recordingStatus: {
    marginTop: 15,
    fontSize: 16,
    color: '#27ae60',
    textAlign: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minWidth: 120,
    minHeight: 80,
  },
  actionButtonIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  demoSection: {
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
  },
  demoText: {
    fontSize: 16,
    color: '#856404',
    lineHeight: 22,
    marginBottom: 15,
  },
  demoFeatures: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
