/**
 * Audio-related TypeScript interfaces for Memoria.ai
 * Optimized for elderly users with accessibility considerations
 */

export interface AudioRecording {
  id: string;
  filePath: string;
  duration: number;
  fileSize: number; // in bytes
  quality: 'low' | 'medium' | 'high';
  sampleRate: number;
  bitRate: number;
  createdAt: Date;
  isProcessing: boolean;
}

export interface RecordingConfig {
  quality: 'low' | 'medium' | 'high';
  maxDuration: number; // in seconds
  autoStop: boolean;
  enableNoiseCancellation: boolean;
  enableAmplification: boolean; // For elderly users with hearing difficulties
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0-1
  playbackRate: number; // 0.5-2.0, important for elderly users
  isLoading: boolean;
}

export interface AudioPermissions {
  microphone: 'granted' | 'denied' | 'undetermined';
  mediaLibrary: 'granted' | 'denied' | 'undetermined';
}

export interface AudioSettings {
  defaultQuality: 'low' | 'medium' | 'high';
  maxRecordingDuration: number;
  autoStopEnabled: boolean;
  amplificationEnabled: boolean;
  noiseCancellationEnabled: boolean;
  defaultPlaybackRate: number; // For elderly users who prefer slower playback
  hapticFeedbackEnabled: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: 'en' | 'zh';
  segments: TranscriptionSegment[];
  processingTime: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
}

export interface AudioError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}