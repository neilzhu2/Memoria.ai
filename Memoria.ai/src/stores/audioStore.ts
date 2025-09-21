/**
 * Audio Store using Zustand for Memoria.ai
 * Manages audio recording and playback optimized for elderly users
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  AudioRecording,
  RecordingConfig,
  PlaybackState,
  AudioPermissions,
  AudioSettings,
  TranscriptionResult,
  AudioError,
  LoadingState,
  RealtimeTranscriptionConfig,
  RealtimeTranscriptionState,
  TranscriptionDisplayOptions,
  ElderlyTranscriptionSettings,
  ChineseLanguageSupport,
  CulturalSpeechPatterns,
  LanguageDetectionConfig,
  TranscriptionError
} from '../types';
import { audioService } from '../services/audioService';
import { transcriptionService } from '../services/transcriptionService';

interface AudioState {
  // Recording state
  isRecording: boolean;
  currentRecording: AudioRecording | null;
  recordingConfig: RecordingConfig;
  recordingStartTime: Date | null;
  recordingDuration: number; // in seconds

  // Playback state
  playbackState: PlaybackState;
  currentlyPlaying: string | null; // memory ID

  // Permissions
  permissions: AudioPermissions;

  // Settings
  settings: AudioSettings;

  // Transcription
  transcriptionResults: Record<string, TranscriptionResult>;
  isTranscribing: boolean;

  // Real-time transcription
  realtimeTranscription: {
    isActive: boolean;
    config: RealtimeTranscriptionConfig;
    state: RealtimeTranscriptionState;
    displayOptions: TranscriptionDisplayOptions;
    elderlySettings: ElderlyTranscriptionSettings;
    chineseSupport: ChineseLanguageSupport;
    culturalPatterns: CulturalSpeechPatterns;
    languageDetection: LanguageDetectionConfig;
    lastError: TranscriptionError | null;
  };

  // Error handling
  lastError: AudioError | null;
  loadingState: LoadingState;

  // Actions - Recording
  startRecording: (config?: Partial<RecordingConfig>) => Promise<void>;
  stopRecording: () => Promise<AudioRecording | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;
  setRecordingConfig: (config: Partial<RecordingConfig>) => void;

  // Actions - Playback
  playAudio: (memoryId: string, filePath: string) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  seekTo: (position: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;

  // Actions - Permissions
  requestMicrophonePermission: () => Promise<boolean>;
  requestMediaLibraryPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;

  // Actions - Settings
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  resetAudioSettings: () => void;

  // Actions - Transcription
  transcribeAudio: (filePath: string, language: 'en' | 'zh' | 'auto') => Promise<TranscriptionResult>;
  getTranscriptionResult: (audioId: string) => TranscriptionResult | null;

  // Actions - Real-time Transcription
  startRealtimeTranscription: (audioStream?: any) => Promise<void>;
  stopRealtimeTranscription: () => Promise<TranscriptionResult | null>;
  pauseRealtimeTranscription: () => void;
  resumeRealtimeTranscription: () => void;
  updateRealtimeConfig: (config: Partial<RealtimeTranscriptionConfig>) => void;
  updateRealtimeDisplayOptions: (options: Partial<TranscriptionDisplayOptions>) => void;
  updateElderlyTranscriptionSettings: (settings: Partial<ElderlyTranscriptionSettings>) => void;
  updateChineseSupport: (support: Partial<ChineseLanguageSupport>) => void;
  updateCulturalPatterns: (patterns: Partial<CulturalSpeechPatterns>) => void;
  updateLanguageDetection: (detection: Partial<LanguageDetectionConfig>) => void;
  getRealtimeTranscriptionState: () => RealtimeTranscriptionState;
  clearRealtimeTranscriptionError: () => void;

  // Actions - Error handling
  setError: (error: AudioError) => void;
  clearError: () => void;
  setLoading: (isLoading: boolean, error?: string) => void;

  // Utility actions
  formatDuration: (seconds: number) => string;
  getRecordingQualitySettings: (quality: 'low' | 'medium' | 'high') => Record<string, any>;
}

const defaultAudioSettings: AudioSettings = {
  defaultQuality: 'medium',
  maxRecordingDuration: 600, // 10 minutes - good for elderly users
  autoStopEnabled: true,
  amplificationEnabled: false,
  noiseCancellationEnabled: true,
  defaultPlaybackRate: 1.0,
  hapticFeedbackEnabled: true,
};

const defaultRecordingConfig: RecordingConfig = {
  quality: 'medium',
  maxDuration: 600,
  autoStop: true,
  enableNoiseCancellation: true,
  enableAmplification: false,
};

const defaultPlaybackState: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8, // Slightly lower default for elderly users
  playbackRate: 1.0,
  isLoading: false,
};

// Default real-time transcription configuration
const defaultRealtimeConfig: RealtimeTranscriptionConfig = {
  language: 'auto',
  enableLanguageDetection: true,
  enableCodeSwitching: true,
  confidenceThreshold: 0.6,
  updateInterval: 500,
  bufferSize: 10,
  enableElderlyOptimizations: true,
  fontSize: 18,
  highContrast: false,
  enableVoiceConfirmation: true,
};

const defaultRealtimeState: RealtimeTranscriptionState = {
  isActive: false,
  currentText: '',
  pendingText: '',
  finalizedText: '',
  confidence: 0,
  detectedLanguage: null,
  isLanguageSwitching: false,
  wordCount: 0,
  sessionDuration: 0,
  lastUpdateTime: 0,
};

const defaultDisplayOptions: TranscriptionDisplayOptions = {
  showConfidence: true,
  highlightLowConfidence: true,
  showLanguageIndicator: true,
  enableWordHighlighting: false,
  scrollToLatest: true,
  maxDisplayLines: 10,
  fontSize: 18,
  lineHeight: 24,
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  highlightColor: '#2563eb',
};

const defaultElderlyTranscriptionSettings: ElderlyTranscriptionSettings = {
  speechRate: 0.7,
  pauseDuration: 1000,
  enableVoiceGuidance: true,
  voiceGuidanceLanguage: 'en',
  simplifiedControls: true,
  largeTextMode: true,
  highContrastMode: false,
  enableHapticFeedback: true,
  autoSaveInterval: 30000,
};

const defaultChineseSupport: ChineseLanguageSupport = {
  characterSet: 'both',
  dialectSupport: 'mandarin',
  toneRecognition: true,
  culturalTermsEnabled: true,
  familyRelationshipTerms: true,
  honorificsRecognition: true,
  dateFormatPreference: 'both',
};

const defaultCulturalPatterns: CulturalSpeechPatterns = {
  enableFillerWordRemoval: true,
  recognizeRepetitivePatterns: true,
  honorificsNormalization: true,
  familyTermCorrection: true,
  culturalExpressionPreservation: true,
  idiomRecognition: true,
};

const defaultLanguageDetection: LanguageDetectionConfig = {
  autoDetectionEnabled: true,
  codeSwitchingEnabled: true,
  confidenceThreshold: 0.8,
  minimumSegmentLength: 5,
  switchingIndicators: true,
  fallbackLanguage: 'en',
};

export const useAudioStore = create<AudioState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isRecording: false,
    currentRecording: null,
    recordingConfig: defaultRecordingConfig,
    recordingStartTime: null,
    recordingDuration: 0,

    playbackState: defaultPlaybackState,
    currentlyPlaying: null,

    permissions: {
      microphone: 'undetermined',
      mediaLibrary: 'undetermined',
    },

    settings: defaultAudioSettings,

    transcriptionResults: {},
    isTranscribing: false,

    // Real-time transcription initial state
    realtimeTranscription: {
      isActive: false,
      config: defaultRealtimeConfig,
      state: defaultRealtimeState,
      displayOptions: defaultDisplayOptions,
      elderlySettings: defaultElderlyTranscriptionSettings,
      chineseSupport: defaultChineseSupport,
      culturalPatterns: defaultCulturalPatterns,
      languageDetection: defaultLanguageDetection,
      lastError: null,
    },

    lastError: null,
    loadingState: { isLoading: false },

    // Recording actions
    startRecording: async (config) => {
      try {
        set({ loadingState: { isLoading: true } });

        // Initialize audio service
        await audioService.initialize();

        // Check permissions
        const permissions = await audioService.checkPermissions();
        if (permissions.microphone !== 'granted') {
          throw new Error('Microphone permission denied');
        }

        const finalConfig = { ...get().recordingConfig, ...config };

        // Start recording using audio service
        const recording = await audioService.startRecording(finalConfig);

        set({
          isRecording: true,
          currentRecording: recording,
          recordingStartTime: new Date(),
          recordingDuration: 0,
          recordingConfig: finalConfig,
          permissions,
          loadingState: { isLoading: false },
        });

        // Start duration tracking with real-time status updates
        const durationInterval = setInterval(async () => {
          const { isRecording, recordingStartTime, recordingConfig } = get();
          if (!isRecording || !recordingStartTime) {
            clearInterval(durationInterval);
            return;
          }

          // Get actual recording status from audio service
          const status = await audioService.getRecordingStatus();
          if (status?.isRecording) {
            const duration = Math.floor((status.durationMillis || 0) / 1000);
            set({ recordingDuration: duration });

            // Auto-stop if max duration reached
            if (recordingConfig.autoStop && duration >= recordingConfig.maxDuration) {
              clearInterval(durationInterval);
              get().stopRecording();
            }
          }
        }, 1000);

      } catch (error) {
        get().setError({
          code: 'RECORDING_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start recording',
          timestamp: new Date(),
        });
        set({ loadingState: { isLoading: false } });
      }
    },

    stopRecording: async () => {
      try {
        const { currentRecording, recordingDuration } = get();
        if (!currentRecording) return null;

        set({ loadingState: { isLoading: true } });

        // Stop recording using audio service
        const recordingUri = await audioService.stopRecording();

        if (recordingUri) {
          // Get file information
          const fileInfo = await audioService.getAudioFileInfo(recordingUri);

          // Update recording with final data
          const finalRecording: AudioRecording = {
            ...currentRecording,
            filePath: recordingUri,
            duration: fileInfo.duration,
            fileSize: fileInfo.size,
            isProcessing: false,
          };

          set({
            isRecording: false,
            currentRecording: null,
            recordingStartTime: null,
            recordingDuration: 0,
            loadingState: { isLoading: false },
          });

          return finalRecording;
        }

        throw new Error('Failed to get recording file');
      } catch (error) {
        get().setError({
          code: 'RECORDING_STOP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to stop recording',
          timestamp: new Date(),
        });
        set({ loadingState: { isLoading: false } });
        return null;
      }
    },

    pauseRecording: async () => {
      try {
        await audioService.pauseRecording();
        // Note: The recording state remains true, but we can track pause state separately
      } catch (error) {
        get().setError({
          code: 'RECORDING_PAUSE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to pause recording',
          timestamp: new Date(),
        });
      }
    },

    resumeRecording: async () => {
      try {
        await audioService.resumeRecording();
      } catch (error) {
        get().setError({
          code: 'RECORDING_RESUME_FAILED',
          message: error instanceof Error ? error.message : 'Failed to resume recording',
          timestamp: new Date(),
        });
      }
    },

    cancelRecording: () => {
      set({
        isRecording: false,
        currentRecording: null,
        recordingStartTime: null,
        recordingDuration: 0,
      });
    },

    setRecordingConfig: (config) => {
      set({ recordingConfig: { ...get().recordingConfig, ...config } });
    },

    // Playback actions
    playAudio: async (memoryId, filePath) => {
      try {
        // Stop any current playback
        get().stopAudio();

        set({
          currentlyPlaying: memoryId,
          playbackState: {
            ...get().playbackState,
            isLoading: true,
          },
        });

        // Audio service would handle actual playback
        // This is a simplified state update
        set({
          playbackState: {
            ...get().playbackState,
            isPlaying: true,
            isLoading: false,
          },
        });
      } catch (error) {
        get().setError({
          code: 'PLAYBACK_FAILED',
          message: error instanceof Error ? error.message : 'Failed to play audio',
          timestamp: new Date(),
        });
      }
    },

    pauseAudio: () => {
      set({
        playbackState: {
          ...get().playbackState,
          isPlaying: false,
          isPaused: true,
        },
      });
    },

    resumeAudio: () => {
      set({
        playbackState: {
          ...get().playbackState,
          isPlaying: true,
          isPaused: false,
        },
      });
    },

    stopAudio: () => {
      set({
        currentlyPlaying: null,
        playbackState: defaultPlaybackState,
      });
    },

    seekTo: (position) => {
      set({
        playbackState: {
          ...get().playbackState,
          currentTime: position,
        },
      });
    },

    setVolume: (volume) => {
      set({
        playbackState: {
          ...get().playbackState,
          volume: Math.max(0, Math.min(1, volume)),
        },
      });
    },

    setPlaybackRate: (rate) => {
      set({
        playbackState: {
          ...get().playbackState,
          playbackRate: Math.max(0.5, Math.min(2.0, rate)),
        },
      });
    },

    // Permission actions
    requestMicrophonePermission: async () => {
      try {
        const permissions = await audioService.checkPermissions();
        set({ permissions });
        return permissions.microphone === 'granted';
      } catch (error) {
        get().setError({
          code: 'PERMISSION_REQUEST_FAILED',
          message: 'Failed to request microphone permission',
          timestamp: new Date(),
        });
        return false;
      }
    },

    requestMediaLibraryPermission: async () => {
      try {
        const permissions = await audioService.checkPermissions();
        set({ permissions });
        return permissions.mediaLibrary === 'granted';
      } catch (error) {
        get().setError({
          code: 'PERMISSION_REQUEST_FAILED',
          message: 'Failed to request media library permission',
          timestamp: new Date(),
        });
        return false;
      }
    },

    checkPermissions: async () => {
      try {
        const permissions = await audioService.checkPermissions();
        set({ permissions });
      } catch (error) {
        get().setError({
          code: 'PERMISSION_CHECK_FAILED',
          message: 'Failed to check permissions',
          timestamp: new Date(),
        });
      }
    },

    // Settings actions
    updateAudioSettings: (settings) => {
      set({ settings: { ...get().settings, ...settings } });
    },

    resetAudioSettings: () => {
      set({ settings: defaultAudioSettings });
    },

    // Transcription actions
    transcribeAudio: async (filePath, language) => {
      try {
        set({ isTranscribing: true });

        // Simulate transcription - would use actual service
        const result: TranscriptionResult = {
          text: 'Transcription would be generated by service',
          confidence: 0.9,
          language: language === 'auto' ? 'en' : language,
          segments: [],
          processingTime: 2000,
        };

        set({
          transcriptionResults: {
            ...get().transcriptionResults,
            [filePath]: result,
          },
          isTranscribing: false,
        });

        return result;
      } catch (error) {
        set({ isTranscribing: false });
        throw error;
      }
    },

    getTranscriptionResult: (audioId) => {
      return get().transcriptionResults[audioId] || null;
    },

    // Error handling
    setError: (error) => {
      set({ lastError: error });
    },

    clearError: () => {
      set({ lastError: null });
    },

    setLoading: (isLoading, error) => {
      set({ loadingState: { isLoading, error } });
    },

    // Utility functions
    formatDuration: (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getRecordingQualitySettings: (quality) => {
      const settings = {
        low: { sampleRate: 16000, bitRate: 64000 },
        medium: { sampleRate: 44100, bitRate: 128000 },
        high: { sampleRate: 48000, bitRate: 256000 },
      };
      return settings[quality];
    },

    // Real-time transcription actions
    startRealtimeTranscription: async (audioStream) => {
      try {
        const { realtimeTranscription } = get();

        if (realtimeTranscription.isActive) {
          throw new Error('Real-time transcription already active');
        }

        set({
          realtimeTranscription: {
            ...realtimeTranscription,
            isActive: true,
            lastError: null,
          },
        });

        // Setup transcription service event listeners
        transcriptionService.addEventListener('transcription:update', (data) => {
          const currentState = get().realtimeTranscription;
          set({
            realtimeTranscription: {
              ...currentState,
              state: {
                ...currentState.state,
                ...data.state,
                currentText: data.text,
                confidence: data.confidence,
                lastUpdateTime: Date.now(),
              },
            },
          });
        });

        transcriptionService.addEventListener('language:switched', (data) => {
          const currentState = get().realtimeTranscription;
          set({
            realtimeTranscription: {
              ...currentState,
              state: {
                ...currentState.state,
                detectedLanguage: data.to,
                isLanguageSwitching: true,
              },
            },
          });

          // Reset language switching flag after a delay
          setTimeout(() => {
            const state = get().realtimeTranscription;
            set({
              realtimeTranscription: {
                ...state,
                state: {
                  ...state.state,
                  isLanguageSwitching: false,
                },
              },
            });
          }, 2000);
        });

        // Start the transcription service
        await transcriptionService.startRealtimeTranscription(
          audioStream,
          realtimeTranscription.config
        );

        console.log('Real-time transcription started');
      } catch (error) {
        const errorObj: TranscriptionError = {
          code: 'REALTIME_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start real-time transcription',
          timestamp: new Date(),
          context: 'transcription',
          recoverable: true,
          retryCount: 0,
        };

        set({
          realtimeTranscription: {
            ...get().realtimeTranscription,
            isActive: false,
            lastError: errorObj,
          },
        });

        throw error;
      }
    },

    stopRealtimeTranscription: async () => {
      try {
        const { realtimeTranscription } = get();

        if (!realtimeTranscription.isActive) {
          return null;
        }

        // Stop the transcription service
        const result = await transcriptionService.stopRealtimeTranscription();

        // Clean up event listeners
        transcriptionService.removeEventListener('transcription:update');
        transcriptionService.removeEventListener('language:switched');

        // Reset state
        set({
          realtimeTranscription: {
            ...realtimeTranscription,
            isActive: false,
            state: defaultRealtimeState,
            lastError: null,
          },
        });

        console.log('Real-time transcription stopped');
        return result;
      } catch (error) {
        const errorObj: TranscriptionError = {
          code: 'REALTIME_STOP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to stop real-time transcription',
          timestamp: new Date(),
          context: 'transcription',
          recoverable: false,
          retryCount: 0,
        };

        set({
          realtimeTranscription: {
            ...get().realtimeTranscription,
            lastError: errorObj,
          },
        });

        return null;
      }
    },

    pauseRealtimeTranscription: () => {
      const { realtimeTranscription } = get();
      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          state: {
            ...realtimeTranscription.state,
            isActive: false,
          },
        },
      });
    },

    resumeRealtimeTranscription: () => {
      const { realtimeTranscription } = get();
      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          state: {
            ...realtimeTranscription.state,
            isActive: true,
          },
        },
      });
    },

    updateRealtimeConfig: (config) => {
      const { realtimeTranscription } = get();
      const updatedConfig = { ...realtimeTranscription.config, ...config };

      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          config: updatedConfig,
        },
      });

      // Update transcription service configuration
      transcriptionService.updateRealtimeConfig(updatedConfig);
    },

    updateRealtimeDisplayOptions: (options) => {
      const { realtimeTranscription } = get();
      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          displayOptions: {
            ...realtimeTranscription.displayOptions,
            ...options,
          },
        },
      });
    },

    updateElderlyTranscriptionSettings: (settings) => {
      const { realtimeTranscription } = get();
      const updatedSettings = { ...realtimeTranscription.elderlySettings, ...settings };

      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          elderlySettings: updatedSettings,
        },
      });

      // Update transcription service settings
      transcriptionService.updateElderlySettings(updatedSettings);

      // Apply settings to real-time config if needed
      if (settings.largeTextMode !== undefined) {
        get().updateRealtimeConfig({
          fontSize: settings.largeTextMode ? 20 : 16,
        });
      }

      if (settings.highContrastMode !== undefined) {
        get().updateRealtimeConfig({
          highContrast: settings.highContrastMode,
        });

        get().updateRealtimeDisplayOptions({
          backgroundColor: settings.highContrastMode ? '#000000' : '#ffffff',
          textColor: settings.highContrastMode ? '#ffffff' : '#1f2937',
        });
      }
    },

    updateChineseSupport: (support) => {
      const { realtimeTranscription } = get();
      const updatedSupport = { ...realtimeTranscription.chineseSupport, ...support };

      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          chineseSupport: updatedSupport,
        },
      });

      // Update transcription service
      transcriptionService.updateChineseSupport(updatedSupport);
    },

    updateCulturalPatterns: (patterns) => {
      const { realtimeTranscription } = get();
      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          culturalPatterns: {
            ...realtimeTranscription.culturalPatterns,
            ...patterns,
          },
        },
      });

      // Update transcription service
      transcriptionService.updateCulturalPatterns(patterns);
    },

    updateLanguageDetection: (detection) => {
      const { realtimeTranscription } = get();
      const updatedDetection = { ...realtimeTranscription.languageDetection, ...detection };

      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          languageDetection: updatedDetection,
        },
      });

      // Update transcription service
      transcriptionService.updateLanguageDetection(updatedDetection);

      // Update real-time config based on language detection settings
      if (detection.autoDetectionEnabled !== undefined) {
        get().updateRealtimeConfig({
          enableLanguageDetection: detection.autoDetectionEnabled,
        });
      }

      if (detection.codeSwitchingEnabled !== undefined) {
        get().updateRealtimeConfig({
          enableCodeSwitching: detection.codeSwitchingEnabled,
        });
      }
    },

    getRealtimeTranscriptionState: () => {
      return get().realtimeTranscription.state;
    },

    clearRealtimeTranscriptionError: () => {
      const { realtimeTranscription } = get();
      set({
        realtimeTranscription: {
          ...realtimeTranscription,
          lastError: null,
        },
      });
    },
  }))
);