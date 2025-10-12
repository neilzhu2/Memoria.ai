/**
 * Recording Preparation Screen - Phase 2 Recording Flow
 *
 * Elderly-friendly preparation screen that guides users through
 * the recording setup with clear instructions, voice guidance,
 * and accessible design elements.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useRecordingFlowState,
  useElderlySettings,
  useRecordingActions,
} from '@/stores/useRecordingFlow';
import {
  RecordingSession,
  ElderlyRecordingSettings,
  RecordingError,
} from '@/types/recording-flow';

// ========================================
// Types & Interfaces
// ========================================

export interface RecordingPreparationScreenProps {
  session?: RecordingSession | null;
  elderlySettings?: ElderlyRecordingSettings;
  onError?: (error: RecordingError) => void;
}

interface TipItem {
  icon: string;
  text: string;
  elderlyText: string;
}

// ========================================
// Configuration
// ========================================

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const RECORDING_TIPS: TipItem[] = [
  {
    icon: '🎤',
    text: 'Speak clearly and at normal volume',
    elderlyText: 'Speak clearly and at normal volume - just like having a conversation',
  },
  {
    icon: '⏱️',
    text: 'Take your time - there\'s no rush',
    elderlyText: 'Take your time - there\'s no rush. Pause whenever you need to',
  },
  {
    icon: '💭',
    text: 'Share details, feelings, and stories',
    elderlyText: 'Share all the details, feelings, and stories that come to mind',
  },
  {
    icon: '✋',
    text: 'Tap stop when you\'re finished',
    elderlyText: 'Tap the stop button when you\'re finished sharing your memory',
  },
];

// ========================================
// Main Component
// ========================================

export const RecordingPreparationScreen: React.FC<RecordingPreparationScreenProps> = ({
  session,
  elderlySettings: propElderlySettings,
  onError,
}) => {
  const colorScheme = useColorScheme();
  const voiceGuidanceTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);

  // Store state and actions
  const { flowState, navigation } = useRecordingFlowState();
  const { settings: storeElderlySettings } = useElderlySettings();
  const { navigateTo } = useRecordingActions();

  // Use settings from props or store
  const elderlySettings = propElderlySettings || storeElderlySettings;

  // ========================================
  // Lifecycle & Effects
  // ========================================

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (voiceGuidanceTimeoutRef.current) {
        clearTimeout(voiceGuidanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Provide voice guidance when screen becomes active
    if (elderlySettings.voiceGuidanceEnabled) {
      voiceGuidanceTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          provideVoiceGuidance();
        }
      }, 500);
    }

    return () => {
      if (voiceGuidanceTimeoutRef.current) {
        clearTimeout(voiceGuidanceTimeoutRef.current);
      }
    };
  }, [elderlySettings.voiceGuidanceEnabled]);

  // ========================================
  // Voice Guidance
  // ========================================

  const provideVoiceGuidance = useCallback(async () => {
    try {
      if (!elderlySettings.voiceGuidanceEnabled || !isMountedRef.current) {
        return;
      }

      let message = 'Ready to record? Follow the instructions on screen.';

      if (session?.topic) {
        message = `Ready to record about ${session.topic.title}? Follow the instructions on screen.`;
      }

      await Speech.speak(message, {
        language: elderlySettings.voiceLanguage,
        rate: elderlySettings.voiceGuidanceRate,
        volume: elderlySettings.voiceVolume,
      });
    } catch (error) {
      console.warn('Voice guidance error:', error);
    }
  }, [elderlySettings, session?.topic]);

  // ========================================
  // Event Handlers
  // ========================================

  const handleStartRecording = useCallback(async () => {
    try {
      // Haptic feedback
      if (elderlySettings.hapticFeedbackLevel !== 'none') {
        const hapticStyle =
          elderlySettings.hapticFeedbackLevel === 'light' ? Haptics.ImpactFeedbackStyle.Light :
          elderlySettings.hapticFeedbackLevel === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
          Haptics.ImpactFeedbackStyle.Heavy;

        await Haptics.impactAsync(hapticStyle);
      }

      // Voice feedback
      if (elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak('Recording started. Please speak clearly.', {
          language: elderlySettings.voiceLanguage,
          rate: elderlySettings.voiceGuidanceRate,
        });
      }

      // Navigate to next screen (permission check or audio test)
      navigateTo('permission-request');

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.({
        code: 'TIMEOUT_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        elderlyFriendlyMessage: 'Something unexpected happened while starting. Let\'s try again.',
        recoverable: true,
        severity: 'warning',
        timestamp: new Date(),
      });
    }
  }, [elderlySettings, navigateTo, onError]);

  const handleCancel = useCallback(async () => {
    try {
      // Light haptic feedback for cancel
      if (elderlySettings.hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Voice feedback
      if (elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak('Recording cancelled.', {
          language: elderlySettings.voiceLanguage,
          rate: elderlySettings.voiceGuidanceRate,
        });
      }

      // Go back or exit the flow
      if (navigation.canGoBack) {
        navigateTo('preparation'); // Stay on preparation or go to home
      }

    } catch (error) {
      console.warn('Error cancelling:', error);
    }
  }, [elderlySettings, navigation.canGoBack, navigateTo]);

  // ========================================
  // Render Helpers
  // ========================================

  const renderTipItem = (tip: TipItem, index: number) => {
    const isElderlyMode = elderlySettings.simplifiedInterface;

    return (
      <View key={index} style={styles.tipItem} testID={`tip-item-${index}`}>
        <Text style={[
          styles.tipIcon,
          isElderlyMode && styles.elderlyTipIcon,
        ]}>
          {tip.icon}
        </Text>
        <ThemedText style={[
          styles.tipText,
          isElderlyMode && styles.elderlyTipText,
        ]}>
          {isElderlyMode ? tip.elderlyText : tip.text}
        </ThemedText>
      </View>
    );
  };

  const renderTopicSection = () => {
    if (!session?.topic) return null;

    return (
      <View style={[
        styles.topicContainer,
        { backgroundColor: Colors[colorScheme ?? 'light'].background },
      ]}>
        <ThemedText style={styles.topicLabel}>Today's Topic:</ThemedText>
        <ThemedText style={[
          styles.topicText,
          elderlySettings.largeText && styles.elderlyTopicText,
        ]}>
          "{session.topic.title}"
        </ThemedText>
        {session.topic.description && (
          <ThemedText style={[
            styles.topicDescription,
            elderlySettings.largeText && styles.elderlyTopicDescription,
          ]}>
            {session.topic.description}
          </ThemedText>
        )}
      </View>
    );
  };

  // ========================================
  // Render
  // ========================================

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={Colors[colorScheme ?? 'light'].background}
      />

      <ThemedView
        style={styles.container}
        testID="recording-preparation-screen"
        accessibilityViewIsModal={true}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            elderlySettings.simplifiedInterface && styles.elderlyScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <ThemedText style={[
              styles.title,
              { color: '#2c3e50' },
              elderlySettings.largeText && styles.elderlyTitle,
            ]}>
              Ready to Record?
            </ThemedText>
            <ThemedText style={[
              styles.subtitle,
              { color: '#7f8c8d' },
              elderlySettings.largeText && styles.elderlySubtitle,
            ]}>
              Share your memory with your family
            </ThemedText>
          </View>

          {/* Topic Section */}
          {renderTopicSection()}

          {/* Instructions Section */}
          <View style={styles.instructionsContainer}>
            <ThemedText style={[
              styles.instructionsTitle,
              { color: '#2c3e50' },
              elderlySettings.largeText && styles.elderlyInstructionsTitle,
            ]}>
              Recording Tips:
            </ThemedText>

            {RECORDING_TIPS.map((tip, index) => renderTipItem(tip, index))}
          </View>

          {/* Voice Guidance Indicator */}
          <View style={[
            styles.guidanceNote,
            {
              backgroundColor: '#e8f5e8',
              borderColor: '#27ae60',
            },
          ]}>
            <ThemedText style={[
              styles.guidanceText,
              { color: '#27ae60' },
              elderlySettings.largeText && styles.elderlyGuidanceText,
            ]}>
              🔊 Voice guidance is active to help you through each step
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={[
            styles.buttonContainer,
            elderlySettings.largeButtons && styles.elderlyButtonContainer,
          ]}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                elderlySettings.largeButtons && styles.elderlyCancelButton,
              ]}
              onPress={handleCancel}
              accessibilityLabel="Cancel recording"
              accessibilityHint="Tap to go back without recording"
              accessibilityRole="button"
              testID="cancel-button"
            >
              <ThemedText style={[
                styles.cancelButtonText,
                elderlySettings.largeText && styles.elderlyCancelButtonText,
              ]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.startButton,
                elderlySettings.largeButtons && styles.elderlyStartButton,
              ]}
              onPress={handleStartRecording}
              accessibilityLabel="Start recording"
              accessibilityHint="Tap to begin recording your memory"
              accessibilityRole="button"
              testID="start-button"
            >
              <IconSymbol
                name="mic.fill"
                size={elderlySettings.largeButtons ? 28 : 24}
                color="white"
                style={styles.startButtonIcon}
              />
              <ThemedText style={[
                styles.startButtonText,
                elderlySettings.largeText && styles.elderlyStartButtonText,
              ]}>
                Start Recording
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  elderlyScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 36,
  },
  elderlyTitle: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.8,
  },
  elderlySubtitle: {
    fontSize: 22,
    lineHeight: 30,
  },

  // Topic Section
  topicContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 8,
  },
  elderlyTopicText: {
    fontSize: 24,
    lineHeight: 32,
  },
  topicDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
  },
  elderlyTopicDescription: {
    fontSize: 18,
    lineHeight: 26,
  },

  // Instructions
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  elderlyInstructionsTitle: {
    fontSize: 24,
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  elderlyTipIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 36,
  },
  tipText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 24,
    color: '#2c3e50',
  },
  elderlyTipText: {
    fontSize: 18,
    lineHeight: 26,
  },

  // Voice Guidance
  guidanceNote: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27ae60',
    marginBottom: 30,
  },
  guidanceText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  elderlyGuidanceText: {
    fontSize: 16,
    lineHeight: 22,
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 10,
  },
  elderlyButtonContainer: {
    gap: 20,
    marginTop: 20,
  },

  // Cancel Button
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  elderlyCancelButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 64,
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  elderlyCancelButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Start Button
  startButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  elderlyStartButton: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 64,
    elevation: 4,
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  elderlyStartButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default RecordingPreparationScreen;