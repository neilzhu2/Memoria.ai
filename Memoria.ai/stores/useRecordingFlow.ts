/**
 * Recording Flow Store for Memoria.ai Phase 2
 *
 * Zustand store managing the complete recording flow state,
 * optimized for elderly users with comprehensive error handling,
 * voice guidance, and accessibility features.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import {
  RecordingFlowStore,
  RecordingFlowState,
  RecordingSession,
  RecordingPhase,
  RecordingScreen,
  RecordingError,
  RecordingErrorCode,
  DailyTopic,
  ElderlyRecordingSettings,
  AccessibilitySettings,
  AudioConfiguration,
  AudioQuality,
  PermissionState,
  DeviceCapabilities,
  RecordingPerformanceMetrics,
  SkipReason,
  HapticLevel,
  RecordingFlowNavigation,
} from '../types/recording-flow';
import { MemoryItem } from '../types/memory';
import { optimizedAudioService } from '../src/services/OptimizedAudioService';

// ========================================
// Default Configurations
// ========================================

const DEFAULT_ELDERLY_SETTINGS: ElderlyRecordingSettings = {
  // Voice guidance
  voiceGuidanceEnabled: true,
  voiceGuidanceRate: 0.8, // Slightly slower for clarity
  voiceVolume: 0.9, // Louder for elderly users
  voiceLanguage: 'en-US',

  // Haptic feedback
  hapticFeedbackLevel: 'medium',
  confirmationHaptics: true,
  errorHaptics: true,

  // Visual accessibility
  largeButtons: true,
  highContrast: false,
  largeText: true,
  simplifiedInterface: true,

  // Timing and behavior
  extendedTimeouts: true,
  autoSaveEnabled: true,
  pauseReminderInterval: 300, // 5 minutes
  confirmationDialogs: true,

  // Audio enhancements
  speechEnhancement: true,
  noiseReduction: true,
  autoVolumeAdjustment: true,
  playbackSpeedControl: true,

  // Progressive disclosure
  showAdvancedOptions: false,
  enableExpertMode: false,
  hideComplexFeatures: true,

  // Assistance features
  smartErrorRecovery: true,
  contextualHelp: true,
  voiceCommands: false, // Disabled by default to avoid confusion
  gestureAlternatives: true,
};

const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reduceMotion: false,
  increaseContrast: false,
  largerText: true,
  voiceOver: false,
  switchControl: false,
  assistiveTouch: false,

  // Audio accessibility
  closedCaptions: false,
  audioDescriptions: true,
  signLanguageSupport: false,

  // Motor accessibility
  dwellControl: false,
  touchAccommodations: false,
  oneHandedMode: false,
};

const DEFAULT_AUDIO_CONFIG: AudioConfiguration = {
  quality: {
    sampleRate: 22050, // Good balance for speech
    bitRate: 96000, // Conservative for older devices
    channels: 1, // Mono sufficient for speech
    format: 'aac',
    elderlyOptimized: true,
    compressionLevel: 0.8,
    noiseReduction: true,
    voiceEnhancement: true,
  },
  maxDuration: 1800, // 30 minutes max
  bufferSize: 8192,
  elderlyBufferBoost: true,
  realTimeProcessing: false,
  backgroundNoiseReduction: true,
  autoGainControl: true,
};

const INITIAL_FLOW_STATE: RecordingFlowState = {
  currentPhase: 'idle',
  sessionId: '',
  duration: 0,
  isPaused: false,
  quality: DEFAULT_AUDIO_CONFIG.quality,
  elderlyMode: true,
  voiceGuidanceEnabled: true,
  hapticFeedbackEnabled: true,
  advancedFeaturesEnabled: false,
  firstTimeUser: true,
};

const INITIAL_NAVIGATION: RecordingFlowNavigation = {
  currentScreen: 'preparation',
  navigationHistory: [],
  canGoBack: false,
  canSkip: false,
  skipReasons: [],
  showNavigationHelp: true,
  largeNavigationButtons: true,
  voiceNavigationEnabled: true,
};

// ========================================
// Utility Functions
// ========================================

const generateSessionId = (): string => {
  return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createElderlyFriendlyError = (
  code: RecordingErrorCode,
  technicalMessage: string,
  context?: any
): RecordingError => {
  const elderlyMessages: Record<RecordingErrorCode, string> = {
    'PERMISSION_DENIED': 'We need permission to use your microphone to record your memories. Please allow access in your device settings.',
    'MICROPHONE_UNAVAILABLE': 'Your microphone seems to be busy with another app. Please close other apps and try again.',
    'STORAGE_FULL': 'Your device storage is full. Would you like help freeing up space for your recordings?',
    'DEVICE_TOO_OLD': 'Your device may need an update for the best recording experience. You can still record, but quality might be reduced.',
    'AUDIO_QUALITY_LOW': 'The audio quality is low. Try moving to a quieter location or speaking closer to your device.',
    'BACKGROUND_INTERRUPTION': 'A phone call or notification interrupted your recording. Don\'t worry, we saved what we recorded so far.',
    'NETWORK_ERROR': 'Internet connection is needed for some features like transcription. You can still record without internet.',
    'TIMEOUT_ERROR': 'The recording took longer than expected. This sometimes happens - let\'s try again.',
    'MEMORY_PRESSURE': 'Your device is running low on memory. Try closing other apps before recording.',
    'THERMAL_THROTTLING': 'Your device is getting warm. Let it cool down for a few minutes before trying again.',
    'BATTERY_LOW': 'Your battery is low. Please charge your device to ensure your recording isn\'t interrupted.',
    'APP_BACKGROUNDED': 'The app went to the background during recording. Your recording was saved up to that point.',
    'PHONE_CALL_INTERRUPT': 'An incoming call interrupted your recording. Don\'t worry, we saved what was recorded.',
    'HARDWARE_ERROR': 'There\'s an issue with your device\'s microphone. Try restarting your device.',
    'FILE_CORRUPTION': 'The recording file was damaged. This is rare - let\'s try recording again.',
    'TRANSCRIPTION_FAILED': 'We couldn\'t convert your speech to text, but your voice recording is perfectly safe.',
  };

  return {
    code,
    message: technicalMessage,
    elderlyFriendlyMessage: elderlyMessages[code] || 'Something unexpected happened, but don\'t worry - we\'ll help you through it.',
    recoverable: !['DEVICE_TOO_OLD', 'HARDWARE_ERROR'].includes(code),
    severity: code === 'PERMISSION_DENIED' ? 'critical' :
              ['HARDWARE_ERROR', 'DEVICE_TOO_OLD'].includes(code) ? 'error' : 'warning',
    timestamp: new Date(),
    context,
  };
};

const createNewSession = (topic?: DailyTopic): RecordingSession => {
  return {
    id: generateSessionId(),
    topic,
    duration: 0,
    quality: DEFAULT_AUDIO_CONFIG.quality,
    timestamp: new Date(),
    phase: 'preparation',
    elderlyOptimized: true,
    voiceGuidanceUsed: true,
    pauseCount: 0,
    retryCount: 0,
    isProcessing: false,
    isShared: false,
    familyMembers: [],
    tags: topic ? [topic.category] : [],
  };
};

// ========================================
// Store Implementation
// ========================================

export const useRecordingFlow = create<RecordingFlowStore>()(
  persist(
    immer((set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      flowState: INITIAL_FLOW_STATE,
      navigation: INITIAL_NAVIGATION,
      session: null,
      elderlySettings: DEFAULT_ELDERLY_SETTINGS,
      accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
      audioConfig: DEFAULT_AUDIO_CONFIG,
      permissions: {
        microphone: 'undetermined',
        mediaLibrary: 'undetermined',
        notifications: 'undetermined',
        lastChecked: new Date(),
      },
      deviceCapabilities: {
        maxRecordingQuality: 'aac',
        supportedSampleRates: [22050, 44100],
        hasNoiseReduction: true,
        hasVoiceEnhancement: true,
        batterySensitive: true,
        memoryConstrained: false,
        isElderlyOptimized: true,
      },
      performanceMetrics: null,

      // ========================================
      // Flow Control Actions
      // ========================================
      startRecordingFlow: async (topic?: DailyTopic) => {
        const state = get();

        try {
          // Create new session
          const session = createNewSession(topic);

          // Initialize audio service for elderly users
          await optimizedAudioService.initialize();
          await optimizedAudioService.optimizeForElderly();

          // Update state
          set((draft) => {
            draft.session = session;
            draft.flowState = {
              ...INITIAL_FLOW_STATE,
              currentPhase: 'preparation',
              sessionId: session.id,
              topic,
              startTime: new Date(),
              elderlyMode: state.elderlySettings.largeButtons,
              voiceGuidanceEnabled: state.elderlySettings.voiceGuidanceEnabled,
              hapticFeedbackEnabled: state.elderlySettings.hapticFeedbackLevel !== 'none',
            };
            draft.navigation = {
              ...INITIAL_NAVIGATION,
              currentScreen: 'preparation',
              navigationHistory: ['preparation'],
              showNavigationHelp: state.elderlySettings.contextualHelp,
            };
          });

          // Start voice guidance if enabled
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              topic
                ? `Ready to record about ${topic.title}? Follow the instructions on screen.`
                : "Ready to record your memory? Follow the instructions on screen.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
                volume: state.elderlySettings.voiceVolume,
              }
            );
          }

          // Haptic feedback
          if (state.elderlySettings.hapticFeedbackLevel !== 'none') {
            await Haptics.impactAsync(
              state.elderlySettings.hapticFeedbackLevel === 'light'
                ? Haptics.ImpactFeedbackStyle.Light
                : state.elderlySettings.hapticFeedbackLevel === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Heavy
            );
          }

          // Start performance monitoring
          get().startPerformanceMonitoring();

        } catch (error) {
          console.error('Failed to start recording flow:', error);
          get().handleError(
            createElderlyFriendlyError(
              'TIMEOUT_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              { action: 'startRecordingFlow', topic }
            )
          );
        }
      },

      cancelRecordingFlow: async () => {
        const state = get();

        try {
          // Stop any active recording
          if (state.flowState.currentPhase === 'recording') {
            await optimizedAudioService.stopRecording();
          }

          // Voice guidance for cancellation
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording cancelled. You can start a new recording anytime.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Reset state
          set((draft) => {
            draft.session = null;
            draft.flowState = INITIAL_FLOW_STATE;
            draft.navigation = INITIAL_NAVIGATION;
            draft.performanceMetrics = null;
          });

          // Stop performance monitoring
          get().stopPerformanceMonitoring();

        } catch (error) {
          console.error('Failed to cancel recording flow:', error);
        }
      },

      pauseRecording: async () => {
        const state = get();

        try {
          if (state.flowState.currentPhase !== 'recording') {
            throw new Error('Cannot pause - not currently recording');
          }

          await optimizedAudioService.pauseRecording();

          set((draft) => {
            draft.flowState.currentPhase = 'paused';
            draft.flowState.isPaused = true;
            if (draft.session) {
              draft.session.pauseCount++;
              draft.session.phase = 'paused';
            }
            draft.navigation.currentScreen = 'recording-paused';
          });

          // Voice guidance for pause
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording paused. Take your time. Tap resume when you're ready to continue.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Confirmation haptic
          if (state.elderlySettings.confirmationHaptics) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }

        } catch (error) {
          console.error('Failed to pause recording:', error);
          get().handleError(
            createElderlyFriendlyError(
              'TIMEOUT_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              { action: 'pauseRecording' }
            )
          );
        }
      },

      resumeRecording: async () => {
        const state = get();

        try {
          if (state.flowState.currentPhase !== 'paused') {
            throw new Error('Cannot resume - not currently paused');
          }

          await optimizedAudioService.resumeRecording();

          set((draft) => {
            draft.flowState.currentPhase = 'recording';
            draft.flowState.isPaused = false;
            if (draft.session) {
              draft.session.phase = 'recording';
            }
            draft.navigation.currentScreen = 'recording-active';
          });

          // Voice guidance for resume
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording resumed. Continue sharing your memory.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Confirmation haptic
          if (state.elderlySettings.confirmationHaptics) {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }

        } catch (error) {
          console.error('Failed to resume recording:', error);
          get().handleError(
            createElderlyFriendlyError(
              'TIMEOUT_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              { action: 'resumeRecording' }
            )
          );
        }
      },

      stopRecording: async () => {
        const state = get();

        try {
          if (!['recording', 'paused'].includes(state.flowState.currentPhase)) {
            throw new Error('Cannot stop - not currently recording');
          }

          const audioFilePath = await optimizedAudioService.stopRecording();

          set((draft) => {
            draft.flowState.currentPhase = 'stopped';
            draft.flowState.isPaused = false;
            if (draft.session) {
              draft.session.phase = 'stopped';
              draft.session.filePath = audioFilePath || undefined;
              draft.session.duration = draft.flowState.duration;
            }
            draft.navigation.currentScreen = 'playback-review';
            draft.navigation.canGoBack = true;
          });

          // Voice guidance for stop
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording complete! Now you can listen to your memory and save it.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Success haptic
          if (state.elderlySettings.confirmationHaptics) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

        } catch (error) {
          console.error('Failed to stop recording:', error);
          get().handleError(
            createElderlyFriendlyError(
              'TIMEOUT_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              { action: 'stopRecording' }
            )
          );
        }
      },

      // ========================================
      // Navigation Actions
      // ========================================
      navigateToScreen: (screen: RecordingScreen, data?: any) => {
        set((draft) => {
          // Add current screen to history if not already there
          if (draft.navigation.currentScreen !== screen) {
            draft.navigation.navigationHistory.push(draft.navigation.currentScreen);
          }

          draft.navigation.previousScreen = draft.navigation.currentScreen;
          draft.navigation.currentScreen = screen;

          // Update navigation capabilities
          draft.navigation.canGoBack = draft.navigation.navigationHistory.length > 0 &&
            !['recording-active'].includes(screen);

          draft.navigation.canSkip = ['permission-request', 'audio-test', 'topic-selection'].includes(screen);

          // Update skip reasons based on screen
          draft.navigation.skipReasons = [];
          if (screen === 'permission-request' && draft.permissions.microphone === 'granted') {
            draft.navigation.skipReasons.push('permission-granted');
          }
          if (screen === 'audio-test' && !draft.flowState.firstTimeUser) {
            draft.navigation.skipReasons.push('experienced-user');
          }
        });

        // Update session phase if applicable
        const phaseMap: Partial<Record<RecordingScreen, RecordingPhase>> = {
          'preparation': 'preparation',
          'permission-request': 'permission-check',
          'audio-test': 'ready',
          'recording-active': 'recording',
          'recording-paused': 'paused',
          'playback-review': 'review',
          'title-edit': 'editing',
          'completion': 'completed',
        };

        const newPhase = phaseMap[screen];
        if (newPhase) {
          set((draft) => {
            draft.flowState.currentPhase = newPhase;
            if (draft.session) {
              draft.session.phase = newPhase;
            }
          });
        }
      },

      goBack: () => {
        const state = get();

        if (state.navigation.canGoBack && state.navigation.navigationHistory.length > 0) {
          const previousScreen = state.navigation.navigationHistory.pop();

          if (previousScreen) {
            set((draft) => {
              draft.navigation.currentScreen = previousScreen;
              draft.navigation.canGoBack = draft.navigation.navigationHistory.length > 0;
            });

            // Voice guidance for navigation
            if (state.elderlySettings.voiceGuidanceEnabled) {
              Speech.speak("Going back to the previous step.", {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              });
            }
          }
        }
      },

      skipScreen: (reason: SkipReason) => {
        const state = get();

        if (state.navigation.canSkip) {
          // Determine next screen based on current screen
          const nextScreenMap: Partial<Record<RecordingScreen, RecordingScreen>> = {
            'permission-request': 'audio-test',
            'audio-test': 'recording-active',
            'topic-selection': 'recording-active',
          };

          const nextScreen = nextScreenMap[state.navigation.currentScreen];

          if (nextScreen) {
            get().navigateToScreen(nextScreen);

            // Voice guidance for skip
            if (state.elderlySettings.voiceGuidanceEnabled) {
              Speech.speak("Skipping this step.", {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              });
            }
          }
        }
      },

      // ========================================
      // Session Management Actions
      // ========================================
      createSession: (topic?: DailyTopic): string => {
        const session = createNewSession(topic);

        set((draft) => {
          draft.session = session;
          draft.flowState.sessionId = session.id;
          draft.flowState.topic = topic;
        });

        return session.id;
      },

      updateSession: (updates: Partial<RecordingSession>) => {
        set((draft) => {
          if (draft.session) {
            Object.assign(draft.session, updates);
          }
        });
      },

      saveSession: async (memoryData: Partial<MemoryItem>, addMemoryCallback?: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>) => {
        const state = get();

        if (!state.session) {
          throw new Error('No session to save');
        }

        try {
          const memoryItem: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'> = {
            title: memoryData.title || state.session.topic?.title || 'Untitled Memory',
            description: memoryData.description || state.session.topic?.description,
            date: new Date(),
            duration: state.session.duration,
            audioPath: state.session.filePath,
            transcription: memoryData.transcription,
            tags: [...(state.session.tags || []), ...(memoryData.tags || [])],
            isShared: state.session.isShared,
            familyMembers: state.session.familyMembers,
          };

          // Use callback to save memory (passed from component that has access to context)
          if (addMemoryCallback) {
            await addMemoryCallback(memoryItem);
          } else {
            throw new Error('No memory save callback provided');
          }

          set((draft) => {
            draft.flowState.currentPhase = 'completed';
            draft.navigation.currentScreen = 'success';
            if (draft.session) {
              draft.session.phase = 'completed';
            }
          });

          // Voice guidance for save success
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Your memory has been saved successfully! Your family will love hearing this.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Success haptic
          if (state.elderlySettings.confirmationHaptics) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }

        } catch (error) {
          console.error('Failed to save session:', error);
          get().handleError(
            createElderlyFriendlyError(
              'TIMEOUT_ERROR',
              error instanceof Error ? error.message : 'Unknown error',
              { action: 'saveSession' }
            )
          );
        }
      },

      discardSession: async () => {
        const state = get();

        // Show confirmation dialog for elderly users
        if (state.elderlySettings.confirmationDialogs) {
          // This would show a confirmation dialog in the UI
          // For now, we'll just proceed with discard
        }

        try {
          // Delete audio file if it exists
          if (state.session?.filePath) {
            await optimizedAudioService.deleteAudioFile(state.session.filePath);
          }

          // Voice guidance for discard
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "Recording discarded. You can start a new recording anytime.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          // Reset state
          set((draft) => {
            draft.session = null;
            draft.flowState = INITIAL_FLOW_STATE;
            draft.navigation = INITIAL_NAVIGATION;
          });

        } catch (error) {
          console.error('Failed to discard session:', error);
        }
      },

      // ========================================
      // Error Handling Actions
      // ========================================
      handleError: (error: RecordingError) => {
        set((draft) => {
          draft.flowState.lastError = error;
          draft.flowState.currentPhase = 'error';
          draft.navigation.currentScreen = 'error-recovery';
        });

        const state = get();

        // Voice guidance for error
        if (state.elderlySettings.voiceGuidanceEnabled) {
          Speech.speak(error.elderlyFriendlyMessage, {
            language: state.elderlySettings.voiceLanguage,
            rate: state.elderlySettings.voiceGuidanceRate,
          });
        }

        // Error haptic
        if (state.elderlySettings.errorHaptics) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      },

      retryLastAction: async () => {
        const state = get();

        if (state.flowState.lastError?.retryAction) {
          try {
            await state.flowState.lastError.retryAction();
            get().clearError();
          } catch (error) {
            // Handle retry failure
            console.error('Retry failed:', error);
          }
        }
      },

      clearError: () => {
        set((draft) => {
          draft.flowState.lastError = undefined;
          if (draft.flowState.currentPhase === 'error') {
            draft.flowState.currentPhase = 'idle';
            draft.navigation.currentScreen = 'preparation';
          }
        });
      },

      // ========================================
      // Elderly Features Actions
      // ========================================
      enableVoiceGuidance: (enabled: boolean) => {
        set((draft) => {
          draft.elderlySettings.voiceGuidanceEnabled = enabled;
          draft.flowState.voiceGuidanceEnabled = enabled;
        });
      },

      adjustAudioQuality: (quality: Partial<AudioQuality>) => {
        set((draft) => {
          draft.audioConfig.quality = { ...draft.audioConfig.quality, ...quality };
          draft.flowState.quality = draft.audioConfig.quality;
        });
      },

      updateElderlySettings: (settings: Partial<ElderlyRecordingSettings>) => {
        set((draft) => {
          draft.elderlySettings = { ...draft.elderlySettings, ...settings };

          // Update flow state based on settings
          draft.flowState.voiceGuidanceEnabled = draft.elderlySettings.voiceGuidanceEnabled;
          draft.flowState.hapticFeedbackEnabled = draft.elderlySettings.hapticFeedbackLevel !== 'none';
          draft.flowState.advancedFeaturesEnabled = draft.elderlySettings.showAdvancedOptions;

          // Update navigation based on settings
          draft.navigation.showNavigationHelp = draft.elderlySettings.contextualHelp;
          draft.navigation.largeNavigationButtons = draft.elderlySettings.largeButtons;
          draft.navigation.voiceNavigationEnabled = draft.elderlySettings.voiceCommands;
        });
      },

      // ========================================
      // Performance Actions
      // ========================================
      startPerformanceMonitoring: () => {
        const startTime = Date.now();

        set((draft) => {
          draft.performanceMetrics = {
            sessionId: draft.session?.id || '',
            startTime: new Date(),
            totalDuration: 0,
            initializationTime: 0,
            firstInteractionTime: 0,
            recordingStartLatency: 0,
            recordingStopLatency: 0,
            audioQualityScore: 0,
            compressionRatio: 0,
            fileSize: 0,
            pauseCount: 0,
            retryCount: 0,
            errorCount: 0,
            helpRequestCount: 0,
            cpuUsage: [],
            memoryUsage: [],
            batteryDrain: 0,
            thermalState: [],
            elderlyOptimizationsUsed: [],
            voiceGuidanceInteractions: 0,
            accessibilityFeaturesUsed: [],
            difficultyEncountered: false,
          };
        });
      },

      stopPerformanceMonitoring: () => {
        set((draft) => {
          if (draft.performanceMetrics) {
            draft.performanceMetrics.endTime = new Date();
            draft.performanceMetrics.totalDuration =
              Date.now() - draft.performanceMetrics.startTime.getTime();
          }
        });
      },

      optimizeForDevice: async () => {
        try {
          await optimizedAudioService.optimizeForElderly();

          set((draft) => {
            draft.deviceCapabilities.isElderlyOptimized = true;
            if (draft.performanceMetrics) {
              draft.performanceMetrics.elderlyOptimizationsUsed.push('device-optimization');
            }
          });
        } catch (error) {
          console.error('Failed to optimize for device:', error);
        }
      },

      // ========================================
      // Session Recovery Actions
      // ========================================
      checkForRecoverableSession: () => {
        // This will be populated by Zustand persistence when store is rehydrated
        const persistedState = AsyncStorage.getItem('memoria-recording-flow');
        return !!persistedState;
      },

      recoverSession: async () => {
        try {
          const storedData = await AsyncStorage.getItem('memoria-recording-flow');
          if (!storedData) return false;

          const parsedData = JSON.parse(storedData);
          const recoveryData = parsedData?.state?.sessionRecovery;

          if (!recoveryData) return false;

          // Check if session is recent (within last 24 hours)
          const sessionTime = new Date(recoveryData.timestamp);
          const now = new Date();
          const hoursAgo = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);

          if (hoursAgo > 24) {
            // Session too old, clear it
            get().clearSessionRecovery();
            return false;
          }

          // Restore session state
          set((draft) => {
            draft.session = {
              ...recoveryData.session,
              timestamp: new Date(recoveryData.session.timestamp),
              isProcessing: false,
              memoryId: undefined, // Reset memory ID for recovery
            };

            draft.flowState = {
              ...draft.flowState,
              ...recoveryData.flowState,
              currentPhase: 'review', // Always start recovery in review phase
              elderlyMode: recoveryData.flowState.elderlyMode,
            };

            draft.navigation = {
              ...draft.navigation,
              currentScreen: 'playback-review', // Recovery starts at review
              navigationHistory: recoveryData.navigation.navigationHistory,
              canGoBack: true,
            };
          });

          // Voice guidance for session recovery
          const state = get();
          if (state.elderlySettings.voiceGuidanceEnabled) {
            await Speech.speak(
              "We found your previous recording session. You can continue where you left off.",
              {
                language: state.elderlySettings.voiceLanguage,
                rate: state.elderlySettings.voiceGuidanceRate,
              }
            );
          }

          console.log('Session recovered successfully');
          return true;

        } catch (error) {
          console.error('Failed to recover session:', error);
          get().clearSessionRecovery();
          return false;
        }
      },

      clearSessionRecovery: () => {
        // This will be handled by the persistence layer
        // when the session is successfully completed or cancelled
        console.log('Session recovery data cleared');
      },
    })),
    {
      name: 'memoria-recording-flow',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist user preferences and partial session state for recovery
        elderlySettings: state.elderlySettings,
        accessibility: state.accessibility,
        audioConfig: state.audioConfig,
        permissions: state.permissions,
        deviceCapabilities: state.deviceCapabilities,

        // Session recovery data (only if in critical phases)
        sessionRecovery: state.session && ['recording', 'paused', 'stopped'].includes(state.session.phase) ? {
          session: {
            id: state.session.id,
            topic: state.session.topic,
            filePath: state.session.filePath,
            duration: state.session.duration,
            quality: state.session.quality,
            timestamp: state.session.timestamp,
            phase: state.session.phase,
            elderlyOptimized: state.session.elderlyOptimized,
            voiceGuidanceUsed: state.session.voiceGuidanceUsed,
            pauseCount: state.session.pauseCount,
            retryCount: state.session.retryCount,
            tags: state.session.tags,
          },
          flowState: {
            currentPhase: state.flowState.currentPhase,
            sessionId: state.flowState.sessionId,
            duration: state.flowState.duration,
            isPaused: state.flowState.isPaused,
            elderlyMode: state.flowState.elderlyMode,
          },
          navigation: {
            currentScreen: state.navigation.currentScreen,
            navigationHistory: state.navigation.navigationHistory,
          },
          timestamp: new Date().toISOString(),
        } : null,
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle migration for future versions
        return persistedState;
      },
    }
  )
);

// ========================================
// Derived State Hooks
// ========================================

export const useRecordingFlowState = () => {
  const flowState = useRecordingFlow(state => state.flowState);
  const session = useRecordingFlow(state => state.session);
  const navigation = useRecordingFlow(state => state.navigation);

  return {
    flowState,
    session,
    navigation,
    isRecording: flowState.currentPhase === 'recording',
    isPaused: flowState.currentPhase === 'paused',
    isProcessing: flowState.currentPhase === 'processing',
    hasError: flowState.currentPhase === 'error',
    canGoBack: navigation.canGoBack,
    canSkip: navigation.canSkip,
  };
};

export const useElderlySettings = () => {
  const settings = useRecordingFlow(state => state.elderlySettings);
  const updateSettings = useRecordingFlow(state => state.updateElderlySettings);

  return {
    settings,
    updateSettings,
    isElderlyModeEnabled: settings.simplifiedInterface,
    isVoiceGuidanceEnabled: settings.voiceGuidanceEnabled,
    hapticLevel: settings.hapticFeedbackLevel,
  };
};

export const useRecordingActions = () => {
  const {
    startRecordingFlow,
    cancelRecordingFlow,
    pauseRecording,
    resumeRecording,
    stopRecording,
    navigateToScreen,
    goBack,
    skipScreen,
    saveSession,
    discardSession,
    checkForRecoverableSession,
    recoverSession,
    clearSessionRecovery,
  } = useRecordingFlow();

  return {
    start: startRecordingFlow,
    cancel: cancelRecordingFlow,
    pause: pauseRecording,
    resume: resumeRecording,
    stop: stopRecording,
    navigateTo: navigateToScreen,
    goBack,
    skip: skipScreen,
    save: saveSession,
    discard: discardSession,
    checkRecoverable: checkForRecoverableSession,
    recover: recoverSession,
    clearRecovery: clearSessionRecovery,
  };
};