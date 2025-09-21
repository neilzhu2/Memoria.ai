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
  LoadingState
} from '../types';

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

    lastError: null,
    loadingState: { isLoading: false },

    // Recording actions
    startRecording: async (config) => {
      try {
        set({ loadingState: { isLoading: true } });

        // Check microphone permission first
        const hasPermission = await get().requestMicrophonePermission();
        if (!hasPermission) {
          throw new Error('Microphone permission denied');
        }

        const finalConfig = { ...get().recordingConfig, ...config };

        // Create new recording
        const recording: AudioRecording = {
          id: Date.now().toString(),
          filePath: '', // Will be set by audio service
          duration: 0,
          fileSize: 0,
          quality: finalConfig.quality,
          sampleRate: get().getRecordingQualitySettings(finalConfig.quality).sampleRate,
          bitRate: get().getRecordingQualitySettings(finalConfig.quality).bitRate,
          createdAt: new Date(),
          isProcessing: false,
        };

        set({
          isRecording: true,
          currentRecording: recording,
          recordingStartTime: new Date(),
          recordingDuration: 0,
          recordingConfig: finalConfig,
          loadingState: { isLoading: false },
        });

        // Start duration tracking
        const durationInterval = setInterval(() => {
          const { isRecording, recordingStartTime, recordingConfig } = get();
          if (!isRecording || !recordingStartTime) {
            clearInterval(durationInterval);
            return;
          }

          const duration = Math.floor((Date.now() - recordingStartTime.getTime()) / 1000);
          set({ recordingDuration: duration });

          // Auto-stop if max duration reached
          if (recordingConfig.autoStop && duration >= recordingConfig.maxDuration) {
            clearInterval(durationInterval);
            get().stopRecording();
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

        // Update recording with final duration
        const finalRecording: AudioRecording = {
          ...currentRecording,
          duration: recordingDuration,
          isProcessing: true,
        };

        set({
          isRecording: false,
          currentRecording: null,
          recordingStartTime: null,
          recordingDuration: 0,
          loadingState: { isLoading: false },
        });

        return finalRecording;
      } catch (error) {
        get().setError({
          code: 'RECORDING_STOP_FAILED',
          message: error instanceof Error ? error.message : 'Failed to stop recording',
          timestamp: new Date(),
        });
        return null;
      }
    },

    pauseRecording: () => {
      // Implementation would depend on audio service
      console.log('Pause recording - to be implemented with audio service');
    },

    resumeRecording: () => {
      // Implementation would depend on audio service
      console.log('Resume recording - to be implemented with audio service');
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
      // Implementation would use Expo AV
      // For now, simulate permission grant
      set({
        permissions: {
          ...get().permissions,
          microphone: 'granted',
        },
      });
      return true;
    },

    requestMediaLibraryPermission: async () => {
      // Implementation would use Expo Media Library
      set({
        permissions: {
          ...get().permissions,
          mediaLibrary: 'granted',
        },
      });
      return true;
    },

    checkPermissions: async () => {
      // Would check actual permissions
      console.log('Check permissions - to be implemented');
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
  }))
);