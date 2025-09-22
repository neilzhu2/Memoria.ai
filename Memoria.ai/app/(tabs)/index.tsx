import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { RecordingButton } from '../../components/RecordingButton';
import { SuggestedTopicCard } from '../../components/SuggestedTopicCard';
import { RecordingStatus } from '../../components/RecordingStatus';
import { RecordingPreparationModal } from '../../components/RecordingPreparationModal';
import { ActiveRecordingModal } from '../../components/ActiveRecordingModal';
import { RecordingCompletionModal } from '../../components/RecordingCompletionModal';
import { useRecording } from '../../contexts/RecordingContext';

export default function HomeScreen() {
  const { recordingTrigger, isRecording: globalIsRecording, setIsRecording: setGlobalIsRecording } = useRecording();
  const [isRecording, setIsRecording] = React.useState(false);
  const [memoryCount, setMemoryCount] = React.useState(0);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const [currentTopic, setCurrentTopic] = React.useState("Talk about your first job");
  const [showPreparationModal, setShowPreparationModal] = React.useState(false);
  const [showCompletionModal, setShowCompletionModal] = React.useState(false);
  const [lastRecordingDuration, setLastRecordingDuration] = React.useState(0);
  const durationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers on unmount
  React.useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, []);

  // Listen for recording triggers from floating button
  React.useEffect(() => {
    if (recordingTrigger > 0) {
      // Trigger recording preparation modal
      setShowPreparationModal(true);
    }
  }, [recordingTrigger]);

  // Sync local recording state with global state
  React.useEffect(() => {
    setGlobalIsRecording(isRecording);
  }, [isRecording, setGlobalIsRecording]);

  const handleRecordPress = async () => {
    try {
      if (!isRecording) {
        // Show preparation modal instead of directly starting recording
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowPreparationModal(true);
      } else {
        // Stop recording manually
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
        if (autoStopTimeoutRef.current) {
          clearTimeout(autoStopTimeoutRef.current);
          autoStopTimeoutRef.current = null;
        }

        setIsRecording(false);
        setMemoryCount(prev => prev + 1);
        setRecordingDuration(0);
        Speech.speak("Recording saved successfully.", { language: 'en' });
      }
    } catch (error) {
      Alert.alert("Error", "Unable to start recording. Please check permissions.");
    }
  };

  const handleStartRecording = async () => {
    try {
      // Close the preparation modal
      setShowPreparationModal(false);

      // Start recording simulation
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Simulate recording for demo (auto-stop after 30 seconds)
      autoStopTimeoutRef.current = setTimeout(() => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Save the current duration for the completion modal (should be around 30)
        setLastRecordingDuration(30);
        setIsRecording(false);
        setRecordingDuration(0);

        // Show completion modal
        setShowCompletionModal(true);
        Speech.speak("Recording complete.", { language: 'en' });
      }, 30000);
    } catch (error) {
      Alert.alert("Error", "Unable to start recording. Please check permissions.");
    }
  };

  const handleCancelRecording = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPreparationModal(false);
  };

  const handleStopRecording = async () => {
    try {
      // Stop recording manually
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }

      // Save the duration for the completion modal
      setLastRecordingDuration(recordingDuration);
      setIsRecording(false);
      setRecordingDuration(0);

      // Show completion modal instead of directly saving
      setShowCompletionModal(true);
    } catch (error) {
      Alert.alert("Error", "Unable to stop recording properly.");
    }
  };

  const handleSaveMemory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCompletionModal(false);
    setMemoryCount(prev => prev + 1);
    Alert.alert("Memory Saved!", "Your memory has been saved and shared with your family.");
  };

  const handleDiscardMemory = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowCompletionModal(false);
    setLastRecordingDuration(0);
  };

  const handleMemoriesPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Memories", `You have ${memoryCount} memories saved.`);
  };

  const handleSettingsPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Settings", "Access accessibility settings, family sharing, and more.");
  };

  const handleExportPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Export My Memoir", "Create a beautiful memoir from your memories.");
  };

  const handleMemoriesTabPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Memories", "View all your saved memories.");
  };

  const handleProfileTabPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Profile", "View and edit your profile information.");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <StatusBar style="auto" />

      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
        <View style={styles.navTabs}>
          <TouchableOpacity
            style={[styles.navTab, styles.activeNavTab]}
            onPress={handleMemoriesTabPress}
            accessibilityLabel="Memories tab"
          >
            <Text style={[styles.navTabText, styles.activeNavTabText]}>Memories</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navTab}
            onPress={handleProfileTabPress}
            accessibilityLabel="Profile tab"
          >
            <Text style={styles.navTabText}>Profile</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportPress}
          accessibilityLabel="Export memoir"
        >
          <Text style={styles.exportButtonText}>Export My Memoir</Text>
        </TouchableOpacity>
      </View>

      {/* Main Recording Button */}
      <View style={styles.recordingSection}>
        <RecordingButton
          isRecording={isRecording}
          onPress={handleRecordPress}
          size="large"
        />

        <RecordingStatus
          isRecording={isRecording}
          duration={recordingDuration}
        />
      </View>

      {/* Suggested Topic Card */}
      <View style={styles.suggestedTopicSection}>
        <SuggestedTopicCard
          topic={currentTopic}
          onPress={handleRecordPress}
          isRecording={isRecording}
        />
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

      {/* Recording Preparation Modal */}
      <RecordingPreparationModal
        visible={showPreparationModal}
        topic={currentTopic}
        onStartRecording={handleStartRecording}
        onCancel={handleCancelRecording}
      />

      {/* Active Recording Modal */}
      <ActiveRecordingModal
        visible={isRecording}
        duration={recordingDuration}
        topic={currentTopic}
        onStopRecording={handleStopRecording}
      />

      {/* Recording Completion Modal */}
      <RecordingCompletionModal
        visible={showCompletionModal}
        duration={lastRecordingDuration}
        topic={currentTopic}
        onSaveMemory={handleSaveMemory}
        onDiscardMemory={handleDiscardMemory}
      />
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
  topNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  navTabs: {
    flexDirection: 'row',
  },
  navTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 8,
  },
  activeNavTab: {
    backgroundColor: '#3498db',
  },
  navTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  activeNavTabText: {
    color: 'white',
  },
  exportButton: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  suggestedTopicSection: {
    alignItems: 'center',
    marginBottom: 30,
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
