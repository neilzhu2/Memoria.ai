/**
 * Recording Success Screen - Final step of Phase 2 recording flow
 *
 * Celebrates successful memory recording with elderly-friendly design,
 * clear next actions, and smooth transitions to other app sections.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import {
  useRecordingFlowState,
  useElderlySettings,
  useRecordingActions,
} from '@/stores/useRecordingFlow';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ========================================
// Props & Types
// ========================================

export interface SuccessScreenProps {
  session?: any;
  elderlySettings?: any;
  onComplete?: (memoryId: string) => void;
  onError?: (error: any) => void;
}

// ========================================
// Main Component
// ========================================

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  session,
  elderlySettings,
  onComplete,
  onError,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Store state
  const { flowState, session: currentSession, navigation } = useRecordingFlowState();
  const { settings } = useElderlySettings();
  const { cancel: cancelFlow } = useRecordingActions();

  // Use passed props or store values as fallback
  const effectiveSession = session || currentSession;
  const effectiveSettings = elderlySettings || settings;

  // ========================================
  // Lifecycle Effects
  // ========================================

  useEffect(() => {
    handleSuccessArrival();
  }, []);

  // ========================================
  // Event Handlers
  // ========================================

  const handleSuccessArrival = useCallback(async () => {
    try {
      // Provide success voice guidance
      if (effectiveSettings.voiceGuidanceEnabled) {
        setTimeout(() => {
          Speech.speak(
            "Congratulations! Your memory has been saved successfully. Your family will treasure this recording. What would you like to do next?",
            {
              language: effectiveSettings.voiceLanguage || 'en-US',
              rate: effectiveSettings.voiceGuidanceRate || 0.8,
              volume: effectiveSettings.voiceVolume || 0.9,
            }
          );
        }, 800); // Delay to let screen settle
      }

      // Success haptic feedback
      if (effectiveSettings.hapticFeedbackLevel !== 'none') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Additional celebration haptics for elderly users
        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 300);

        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 600);
      }

    } catch (error) {
      console.warn('Error during success screen arrival:', error);
    }
  }, [effectiveSettings]);

  const handleRecordAnother = useCallback(async () => {
    try {
      // Voice guidance for action
      if (effectiveSettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Starting a new recording session. Get ready to share another wonderful memory.",
          {
            language: effectiveSettings.voiceLanguage || 'en-US',
            rate: effectiveSettings.voiceGuidanceRate || 0.8,
          }
        );
      }

      // Haptic feedback
      if (effectiveSettings.confirmationHaptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Clear current session and restart flow
      cancelFlow();

      // Navigate back to home and let user initiate new recording
      router.push('/(tabs)/');

    } catch (error) {
      console.error('Error starting new recording:', error);
      onError?.(error);
    }
  }, [effectiveSettings, cancelFlow, onError]);

  const handleViewMemories = useCallback(async () => {
    try {
      // Voice guidance for action
      if (effectiveSettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Opening your memories collection where you can view all your saved recordings.",
          {
            language: effectiveSettings.voiceLanguage || 'en-US',
            rate: effectiveSettings.voiceGuidanceRate || 0.8,
          }
        );
      }

      // Haptic feedback
      if (effectiveSettings.confirmationHaptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Clean up recording flow state
      cancelFlow();

      // Navigate to My Life tab with memories section
      router.push('/(tabs)/mylife?section=memories');

    } catch (error) {
      console.error('Error navigating to memories:', error);
      onError?.(error);
    }
  }, [effectiveSettings, cancelFlow, onError]);

  const handleReturnHome = useCallback(async () => {
    try {
      // Voice guidance for action
      if (effectiveSettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Returning to the home screen. Thank you for sharing your memories!",
          {
            language: effectiveSettings.voiceLanguage || 'en-US',
            rate: effectiveSettings.voiceGuidanceRate || 0.8,
          }
        );
      }

      // Haptic feedback
      if (effectiveSettings.confirmationHaptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Clean up recording flow state
      cancelFlow();

      // Navigate to home tab
      router.push('/(tabs)/');

    } catch (error) {
      console.error('Error navigating to home:', error);
      onError?.(error);
    }
  }, [effectiveSettings, cancelFlow, onError]);

  const handleShareMemory = useCallback(async () => {
    if (effectiveSettings.confirmationDialogs) {
      Alert.alert(
        "Share Memory",
        "Would you like to share this memory with family members now, or you can share it later from your memories collection?",
        [
          {
            text: "Share Later",
            style: "cancel",
            onPress: async () => {
              if (effectiveSettings.voiceGuidanceEnabled) {
                await Speech.speak("You can share this memory anytime from your memories collection.", {
                  language: effectiveSettings.voiceLanguage || 'en-US',
                  rate: effectiveSettings.voiceGuidanceRate || 0.8,
                });
              }
            }
          },
          {
            text: "Share Now",
            onPress: async () => {
              if (effectiveSettings.voiceGuidanceEnabled) {
                await Speech.speak("Opening sharing options for your memory.", {
                  language: effectiveSettings.voiceLanguage || 'en-US',
                  rate: effectiveSettings.voiceGuidanceRate || 0.8,
                });
              }
              // Future: Navigate to sharing screen
              // For now, just go to memories where sharing options are available
              handleViewMemories();
            }
          }
        ]
      );
    } else {
      handleViewMemories();
    }
  }, [effectiveSettings, handleViewMemories]);

  // ========================================
  // Render Helpers
  // ========================================

  const formatSessionInfo = () => {
    if (!effectiveSession) return null;

    const duration = effectiveSession.duration || flowState.duration || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

    return (
      <View style={[styles.sessionInfoContainer, { backgroundColor: colors.surfaceVariant }]}>
        <View style={styles.sessionInfoRow}>
          <Text style={[styles.sessionInfoLabel, { color: colors.onSurfaceVariant }]}>Duration:</Text>
          <Text style={[styles.sessionInfoValue, { color: colors.onSurface }]}>{formattedDuration}</Text>
        </View>

        {effectiveSession.topic && (
          <View style={styles.sessionInfoRow}>
            <Text style={[styles.sessionInfoLabel, { color: colors.onSurfaceVariant }]}>Topic:</Text>
            <Text style={[styles.sessionInfoValue, { color: colors.onSurface }]} numberOfLines={2}>
              "{effectiveSession.topic.title}"
            </Text>
          </View>
        )}

        <View style={styles.sessionInfoRow}>
          <Text style={[styles.sessionInfoLabel, { color: colors.onSurfaceVariant }]}>Date:</Text>
          <Text style={[styles.sessionInfoValue, { color: colors.onSurface }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </View>
      </View>
    );
  };

  // ========================================
  // Render
  // ========================================

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Success Header */}
        <View style={styles.headerContainer}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.primaryContainer }]}>
            <Text style={styles.successIcon}>🎉</Text>
          </View>

          <Text style={[styles.successTitle, { color: colors.primary }]}>
            Memory Saved!
          </Text>

          <Text style={[styles.successSubtitle, { color: colors.onSurfaceVariant }]}>
            Your precious memory has been safely saved and is ready to be treasured by your family.
          </Text>
        </View>

        {/* Session Information */}
        {formatSessionInfo()}

        {/* Memory Benefits */}
        <View style={[styles.benefitsContainer, { backgroundColor: colors.tertiaryContainer }]}>
          <Text style={[styles.benefitsTitle, { color: colors.onTertiaryContainer }]}>
            Your memory is now:
          </Text>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💾</Text>
              <Text style={[styles.benefitText, { color: colors.onTertiaryContainer }]}>
                Safely stored on your device
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={[styles.benefitText, { color: colors.onTertiaryContainer }]}>
                Ready to share with family
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎧</Text>
              <Text style={[styles.benefitText, { color: colors.onTertiaryContainer }]}>
                Available for playback anytime
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>📖</Text>
              <Text style={[styles.benefitText, { color: colors.onTertiaryContainer }]}>
                Part of your life story collection
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={[styles.actionsTitle, { color: colors.onSurface }]}>
            What would you like to do next?
          </Text>

          {/* Primary Action: Record Another */}
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              { backgroundColor: colors.primary },
              effectiveSettings.largeButtons && styles.largeButton
            ]}
            onPress={handleRecordAnother}
            accessibilityLabel="Record another memory"
            accessibilityHint="Tap to start recording a new memory"
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionIcon}>🎙️</Text>
            <Text style={[styles.primaryActionText, { color: colors.onPrimary }]}>
              Record Another Memory
            </Text>
          </TouchableOpacity>

          {/* Secondary Actions */}
          <View style={styles.secondaryActionsContainer}>
            <TouchableOpacity
              style={[
                styles.secondaryActionButton,
                { backgroundColor: colors.secondaryContainer },
                effectiveSettings.largeButtons && styles.largeButton
              ]}
              onPress={handleViewMemories}
              accessibilityLabel="View my memories"
              accessibilityHint="Tap to see all your saved memories"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionIcon}>📖</Text>
              <Text style={[styles.secondaryActionText, { color: colors.onSecondaryContainer }]}>
                View My Memories
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryActionButton,
                { backgroundColor: colors.secondaryContainer },
                effectiveSettings.largeButtons && styles.largeButton
              ]}
              onPress={handleShareMemory}
              accessibilityLabel="Share this memory"
              accessibilityHint="Tap to share this memory with family"
              accessibilityRole="button"
            >
              <Text style={styles.secondaryActionIcon}>💌</Text>
              <Text style={[styles.secondaryActionText, { color: colors.onSecondaryContainer }]}>
                Share Memory
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tertiary Action: Return Home */}
          <TouchableOpacity
            style={[
              styles.tertiaryActionButton,
              { borderColor: colors.outline },
              effectiveSettings.largeButtons && styles.largeButton
            ]}
            onPress={handleReturnHome}
            accessibilityLabel="Return to home"
            accessibilityHint="Tap to go back to the main screen"
            accessibilityRole="button"
          >
            <Text style={styles.tertiaryActionIcon}>🏠</Text>
            <Text style={[styles.tertiaryActionText, { color: colors.onSurface }]}>
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Encouragement Message */}
        <View style={[styles.encouragementContainer, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.encouragementText, { color: colors.onSurfaceVariant }]}>
            Thank you for sharing your precious memories. Each story you record helps preserve your legacy for future generations.
            {effectiveSession?.topic ? ` Your "${effectiveSession.topic.title}" memory` : ' Your memory'} will be treasured forever.
          </Text>
        </View>

      </ScrollView>
    </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingBottom: 40,
  },

  // Header Styles
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Session Info Styles
  sessionInfoContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sessionInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },

  // Benefits Styles
  benefitsContainer: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 28,
  },
  benefitText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },

  // Actions Styles
  actionsContainer: {
    marginBottom: 24,
  },
  actionsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },

  // Primary Action Button (Record Another)
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 20,
    minHeight: 80,
  },
  primaryActionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  primaryActionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Secondary Actions Container
  secondaryActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  // Secondary Action Buttons (View Memories, Share)
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    minHeight: 80,
  },
  secondaryActionIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Tertiary Action Button (Return Home)
  tertiaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 64,
  },
  tertiaryActionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  tertiaryActionText: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Large button variant for elderly users
  largeButton: {
    minHeight: 88,
    paddingVertical: 24,
  },

  // Encouragement Styles
  encouragementContainer: {
    padding: 20,
    borderRadius: 16,
    marginTop: 8,
  },
  encouragementText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SuccessScreen;