/**
 * Recording Flow Container - Main orchestrator for Phase 2 recording flow
 *
 * This component manages the entire recording flow experience,
 * providing elderly-friendly navigation, error handling, and
 * accessibility features throughout the recording process.
 */

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  AppState,
  Alert,
  BackHandler,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import {
  useRecordingFlow,
  useRecordingFlowState,
  useElderlySettings,
  useRecordingActions,
} from '@/stores/useRecordingFlow';
import {
  RecordingScreen,
  DailyTopic,
  RecordingError,
} from '@/types/recording-flow';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Screen Components
import { RecordingPreparationScreen } from './RecordingPreparationScreen';
import { PermissionRequestScreen } from './PermissionRequestScreen';
import { AudioTestScreen } from './AudioTestScreen';
import { TopicSelectionScreen } from './TopicSelectionScreen';
import { ActiveRecordingScreen } from './ActiveRecordingScreen';
import { PausedRecordingScreen } from './PausedRecordingScreen';
import { PlaybackReviewScreen } from './PlaybackReviewScreen';
import { TitleEditScreen } from './TitleEditScreen';
import { CompletionScreen } from './CompletionScreen';
import { SuccessScreen } from './SuccessScreen';
import { ErrorRecoveryScreen } from './ErrorRecoveryScreen';

// UI Components
import { ElderlyNavigationHeader } from '../ui/ElderlyNavigationHeader';
import { VoiceGuidanceOverlay } from '../overlays/VoiceGuidanceOverlay';
import { ErrorBoundaryOverlay } from '../overlays/ErrorBoundaryOverlay';
import { AccessibilityOverlay } from '../overlays/AccessibilityOverlay';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ========================================
// Props & Types
// ========================================

export interface RecordingFlowContainerProps {
  // Optional initial topic from home screen
  initialTopic?: DailyTopic;

  // Callbacks for navigation
  onFlowComplete?: (memoryId: string) => void;
  onFlowCancel?: () => void;
  onError?: (error: RecordingError) => void;

  // Elderly-specific props
  elderlyMode?: boolean;
  voiceGuidanceEnabled?: boolean;
  hapticFeedbackEnabled?: boolean;
}

// ========================================
// Main Component
// ========================================

export const RecordingFlowContainer: React.FC<RecordingFlowContainerProps> = ({
  initialTopic,
  onFlowComplete,
  onFlowCancel,
  onError,
  elderlyMode = true,
  voiceGuidanceEnabled = true,
  hapticFeedbackEnabled = true,
}) => {
  const colorScheme = useColorScheme();
  const appStateRef = useRef(AppState.currentState);

  // Store state and actions
  const { flowState, session, navigation, isRecording, hasError } = useRecordingFlowState();
  const { settings } = useElderlySettings();
  const { start, cancel, navigateTo, goBack } = useRecordingActions();

  // ========================================
  // Lifecycle & Initialization
  // ========================================

  useEffect(() => {
    // Initialize recording flow when component mounts
    initializeRecordingFlow();

    // Set up app state monitoring
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Set up hardware back button handling
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      appStateSubscription?.remove();
      backHandler.remove();
      cleanup();
    };
  }, []);

  useEffect(() => {
    // Start recording flow with initial topic if provided
    if (initialTopic && flowState.currentPhase === 'idle') {
      start(initialTopic);
    }
  }, [initialTopic, flowState.currentPhase]);

  // ========================================
  // Event Handlers
  // ========================================

  const initializeRecordingFlow = useCallback(async () => {
    try {
      // Provide initial voice guidance
      if (settings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Welcome to memory recording. We'll guide you through each step.",
          {
            language: settings.voiceLanguage,
            rate: settings.voiceGuidanceRate,
          }
        );
      }

      // Initial haptic feedback
      if (settings.hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

    } catch (error) {
      console.warn('Error during initialization:', error);
    }
  }, [settings]);

  const handleAppStateChange = useCallback((nextAppState: string) => {
    const currentAppState = appStateRef.current;
    appStateRef.current = nextAppState as any;

    // Handle app backgrounding during recording
    if (currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
      if (isRecording) {
        handleRecordingInterruption('app_backgrounded');
      }
    }

    // Handle app returning to foreground
    if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
      handleAppReturningToForeground();
    }
  }, [isRecording]);

  const handleBackPress = useCallback((): boolean => {
    // Custom back button behavior for elderly users
    if (navigation.canGoBack) {
      goBack();
      return true; // Prevent default back behavior
    }

    // Show confirmation for elderly users before exiting
    if (settings.confirmationDialogs && (isRecording || session)) {
      showExitConfirmation();
      return true;
    }

    return false; // Allow default back behavior
  }, [navigation.canGoBack, isRecording, session, settings.confirmationDialogs]);

  const handleRecordingInterruption = useCallback(async (reason: string) => {
    try {
      // Handle different types of interruptions
      if (reason === 'app_backgrounded') {
        // Pause recording if active
        if (isRecording) {
          // The store will handle the actual pausing
          // Just provide user feedback
          if (settings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording paused because the app went to the background.",
              { rate: settings.voiceGuidanceRate }
            );
          }
        }
      }

    } catch (error) {
      console.warn('Error handling recording interruption:', error);
    }
  }, [isRecording, settings]);

  const handleAppReturningToForeground = useCallback(async () => {
    try {
      // Provide feedback when returning
      if (settings.voiceGuidanceEnabled && session) {
        await Speech.speak(
          "Welcome back. Your recording session is still active.",
          { rate: settings.voiceGuidanceRate }
        );
      }

    } catch (error) {
      console.warn('Error handling app return to foreground:', error);
    }
  }, [session, settings]);

  const showExitConfirmation = useCallback(() => {
    Alert.alert(
      "Exit Recording?",
      isRecording
        ? "You have an active recording. Are you sure you want to exit? Your recording will be lost."
        : "You have a recording in progress. Are you sure you want to exit?",
      [
        {
          text: "Keep Recording",
          style: "cancel",
          onPress: async () => {
            if (settings.voiceGuidanceEnabled) {
              await Speech.speak("Staying in recording.", { rate: settings.voiceGuidanceRate });
            }
          }
        },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => {
            cancel();
            onFlowCancel?.();
          }
        }
      ]
    );
  }, [isRecording, settings, cancel, onFlowCancel]);

  const cleanup = useCallback(() => {
    // Clean up any resources
    Speech.stop();
  }, []);

  // ========================================
  // Flow Control
  // ========================================

  const handleFlowComplete = useCallback((memoryId: string) => {
    // Provide completion feedback
    if (settings.voiceGuidanceEnabled) {
      Speech.speak(
        "Memory saved successfully! Your family will love this.",
        { rate: settings.voiceGuidanceRate }
      );
    }

    if (settings.hapticFeedbackLevel !== 'none') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onFlowComplete?.(memoryId);
  }, [settings, onFlowComplete]);

  const handleFlowError = useCallback((error: RecordingError) => {
    // Provide error feedback
    if (settings.voiceGuidanceEnabled) {
      Speech.speak(
        error.elderlyFriendlyMessage,
        { rate: settings.voiceGuidanceRate }
      );
    }

    if (settings.errorHaptics) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    onError?.(error);
  }, [settings, onError]);

  // ========================================
  // Screen Rendering
  // ========================================

  const renderCurrentScreen = useCallback(() => {
    const commonProps = {
      session,
      elderlySettings: settings,
      onError: handleFlowError,
    };

    switch (navigation.currentScreen) {
      case 'preparation':
        return <RecordingPreparationScreen {...commonProps} />;

      case 'permission-request':
        return <PermissionRequestScreen {...commonProps} />;

      case 'topic-selection':
        return <TopicSelectionScreen {...commonProps} />;

      case 'audio-test':
        return <AudioTestScreen {...commonProps} />;

      case 'recording-active':
        return <ActiveRecordingScreen {...commonProps} />;

      case 'recording-paused':
        return <PausedRecordingScreen {...commonProps} />;

      case 'playback-review':
        return <PlaybackReviewScreen {...commonProps} />;

      case 'title-edit':
        return <TitleEditScreen {...commonProps} />;

      case 'completion':
        return <CompletionScreen {...commonProps} onComplete={handleFlowComplete} />;

      case 'success':
        return <SuccessScreen {...commonProps} onComplete={handleFlowComplete} />;

      case 'error-recovery':
        return <ErrorRecoveryScreen {...commonProps} />;

      default:
        return <RecordingPreparationScreen {...commonProps} />;
    }
  }, [navigation.currentScreen, session, settings, handleFlowError, handleFlowComplete]);

  // ========================================
  // Render
  // ========================================

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

        {/* Navigation Header */}
        <ElderlyNavigationHeader
          currentScreen={navigation.currentScreen}
          canGoBack={navigation.canGoBack}
          onBack={goBack}
          onCancel={() => {
            if (settings.confirmationDialogs) {
              showExitConfirmation();
            } else {
              cancel();
              onFlowCancel?.();
            }
          }}
          elderlyMode={elderlyMode}
        />

        {/* Main Content Area */}
        <View style={styles.contentContainer}>
          {renderCurrentScreen()}
        </View>

        {/* Overlay Components */}
        {settings.voiceGuidanceEnabled && (
          <VoiceGuidanceOverlay
            currentScreen={navigation.currentScreen}
            phase={flowState.currentPhase}
            settings={settings}
          />
        )}

        <ErrorBoundaryOverlay
          error={hasError ? flowState.lastError : null}
          onRecover={() => {
            // Handle error recovery
          }}
        />

        {settings.showAdvancedOptions && (
          <AccessibilityOverlay
            settings={settings}
            onSettingsChange={() => {
              // Handle accessibility changes
            }}
          />
        )}

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

// ========================================
// Styles
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
});

export default RecordingFlowContainer;