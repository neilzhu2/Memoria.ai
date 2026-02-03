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
  isRealtime?: boolean;
  detectedLanguage?: 'en' | 'zh';
  hasCodeSwitching?: boolean;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  confidence: number;
  isFinal?: boolean;
  language?: 'en' | 'zh';
  words?: TranscriptionWord[];
}

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  language?: 'en' | 'zh';
}

// Real-time transcription interfaces
export interface RealtimeTranscriptionConfig {
  language: 'en' | 'zh' | 'auto';
  enableLanguageDetection: boolean;
  enableCodeSwitching: boolean;
  confidenceThreshold: number;
  updateInterval: number; // milliseconds
  bufferSize: number; // number of words to buffer
  enableElderlyOptimizations: boolean;
  fontSize: number;
  highContrast: boolean;
  enableVoiceConfirmation: boolean;
}

export interface RealtimeTranscriptionState {
  isActive: boolean;
  currentText: string;
  pendingText: string;
  finalizedText: string;
  confidence: number;
  detectedLanguage: 'en' | 'zh' | null;
  isLanguageSwitching: boolean;
  wordCount: number;
  sessionDuration: number;
  lastUpdateTime: number;
}

export interface TranscriptionDisplayOptions {
  showConfidence: boolean;
  highlightLowConfidence: boolean;
  showLanguageIndicator: boolean;
  enableWordHighlighting: boolean;
  scrollToLatest: boolean;
  maxDisplayLines: number;
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
  highlightColor: string;
}

export interface TranscriptionExportOptions {
  format: 'txt' | 'pdf' | 'json';
  includeTimestamps: boolean;
  includeConfidence: boolean;
  includeLanguageMarkers: boolean;
  fontSize: number;
  includeMetadata: boolean;
}

export interface ElderlyTranscriptionSettings {
  speechRate: number; // 0.5-1.0 for slower speech
  pauseDuration: number; // longer pause between sentences
  enableVoiceGuidance: boolean;
  voiceGuidanceLanguage: 'en' | 'zh';
  simplifiedControls: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
  enableHapticFeedback: boolean;
  autoSaveInterval: number;
}

// Chinese language and cultural support
export interface ChineseLanguageSupport {
  characterSet: 'simplified' | 'traditional' | 'both';
  dialectSupport: 'mandarin' | 'cantonese' | 'regional';
  toneRecognition: boolean;
  culturalTermsEnabled: boolean;
  familyRelationshipTerms: boolean;
  honorificsRecognition: boolean;
  dateFormatPreference: 'lunar' | 'gregorian' | 'both';
}

export interface CulturalSpeechPatterns {
  enableFillerWordRemoval: boolean;
  recognizeRepetitivePatterns: boolean;
  honorificsNormalization: boolean;
  familyTermCorrection: boolean;
  culturalExpressionPreservation: boolean;
  idiomRecognition: boolean;
}

export interface LanguageDetectionConfig {
  autoDetectionEnabled: boolean;
  codeSwitchingEnabled: boolean;
  confidenceThreshold: number;
  minimumSegmentLength: number; // characters
  switchingIndicators: boolean;
  fallbackLanguage: 'en' | 'zh';
}

export interface AudioError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  context?: 'recording' | 'transcription' | 'playback' | 'general';
  recoverable?: boolean;
  retryCount?: number;
}

export interface TranscriptionError extends AudioError {
  context: 'transcription';
  transcriptionId?: string;
  partialResult?: string;
  confidence?: number;
  suggestedAction?: string;
}