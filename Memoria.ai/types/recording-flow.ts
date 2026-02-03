/**
 * Recording Flow Type Definitions for Memoria.ai Phase 2
 *
 * Comprehensive TypeScript types for the recording flow system,
 * optimized for elderly users with progressive disclosure and
 * robust error handling.
 */

import { MemoryItem } from './memory';

// ========================================
// Core Recording Flow Types
// ========================================

export interface RecordingFlowState {
  currentPhase: RecordingPhase;
  sessionId: string;
  topic?: DailyTopic;
  startTime?: Date;
  duration: number;
  isPaused: boolean;
  quality: AudioQuality;

  // Elderly-specific settings
  elderlyMode: boolean;
  voiceGuidanceEnabled: boolean;
  hapticFeedbackEnabled: boolean;

  // Error and recovery
  lastError?: RecordingError;
  recoveryState?: RecordingRecoveryState;

  // Progressive disclosure
  advancedFeaturesEnabled: boolean;
  firstTimeUser: boolean;
}

export type RecordingPhase =
  | 'idle'
  | 'preparation'
  | 'permission-check'
  | 'audio-test'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'stopped'
  | 'processing'
  | 'review'
  | 'editing'
  | 'saving'
  | 'completed'
  | 'error';

export interface RecordingSession {
  id: string;
  topic?: DailyTopic;
  filePath?: string;
  duration: number;
  quality: AudioQuality;
  timestamp: Date;
  phase: RecordingPhase;

  // Metadata for elderly users
  elderlyOptimized: boolean;
  voiceGuidanceUsed: boolean;
  pauseCount: number;
  retryCount: number;

  // Processing state
  isProcessing: boolean;
  transcriptionStatus?: TranscriptionStatus;
  audioAnalysis?: AudioAnalysis;

  // Memory integration
  memoryId?: string;
  isShared: boolean;
  familyMembers: string[];
  tags: string[];

  // Performance metrics
  startLatency?: number;
  recordingLatency?: number;
  processingTime?: number;
}

// ========================================
// Audio Quality & Configuration
// ========================================

export interface AudioQuality {
  sampleRate: number;
  bitRate: number;
  channels: number;
  format: AudioFormat;
  elderlyOptimized: boolean;
  compressionLevel: number;
  noiseReduction: boolean;
  voiceEnhancement: boolean;
}

export type AudioFormat = 'aac' | 'mp3' | 'wav' | 'm4a';

export interface AudioConfiguration {
  quality: AudioQuality;
  maxDuration: number; // seconds
  bufferSize: number;
  elderlyBufferBoost: boolean;
  realTimeProcessing: boolean;
  backgroundNoiseReduction: boolean;
  autoGainControl: boolean;
}

export interface AudioAnalysis {
  averageVolume: number;
  peakVolume: number;
  silencePeriods: number[];
  speechClarityScore: number;
  backgroundNoiseLevel: number;
  recommendedPlaybackRate: number;
}

// ========================================
// Topics & Content
// ========================================

export interface DailyTopic {
  id: number;
  title: string;
  description: string;
  category: TopicCategory;
  elderlyFriendly: boolean;
  suggestedDuration: number; // minutes
  voicePrompts: VoicePrompt[];
  difficulty: TopicDifficulty;
  tags: string[];

  // Progressive disclosure
  basicPrompts: string[];
  advancedPrompts: string[];

  // Accessibility
  largeTextVersion?: string;
  audioDescription?: string;
}

export type TopicCategory =
  | 'childhood'
  | 'family'
  | 'career'
  | 'travel'
  | 'achievements'
  | 'traditions'
  | 'relationships'
  | 'life-lessons'
  | 'current-events'
  | 'creative'
  | 'custom';

export type TopicDifficulty = 'simple' | 'moderate' | 'detailed' | 'reflective';

export interface VoicePrompt {
  id: string;
  text: string;
  elderlyOptimized: string; // Slower, clearer version
  timing: number; // When to play during recording (seconds)
  priority: 'low' | 'medium' | 'high';
  interruptible: boolean;
}

// ========================================
// Navigation & Screen Management
// ========================================

export interface RecordingFlowNavigation {
  currentScreen: RecordingScreen;
  previousScreen?: RecordingScreen;
  navigationHistory: RecordingScreen[];
  canGoBack: boolean;
  canSkip: boolean;
  skipReasons: SkipReason[];

  // Elderly-specific navigation
  showNavigationHelp: boolean;
  largeNavigationButtons: boolean;
  voiceNavigationEnabled: boolean;
}

export type RecordingScreen =
  | 'preparation'
  | 'permission-request'
  | 'topic-selection'
  | 'audio-test'
  | 'recording-instructions'
  | 'recording-active'
  | 'recording-paused'
  | 'playback-review'
  | 'title-edit'
  | 'transcription-review'
  | 'sharing-options'
  | 'completion'
  | 'success'
  | 'error-recovery';

export type SkipReason =
  | 'first-time-user'
  | 'permission-granted'
  | 'experienced-user'
  | 'time-constraint'
  | 'user-preference';

export interface RecordingScreenProps {
  navigation: RecordingFlowNavigation;
  session: RecordingSession;
  elderlySettings: ElderlyRecordingSettings;
  onNext: (screen: RecordingScreen, data?: any) => void;
  onBack: () => void;
  onCancel: () => void;
  onError: (error: RecordingError) => void;
  onSkip: (reason: SkipReason) => void;
}

// ========================================
// Error Handling & Recovery
// ========================================

export interface RecordingError {
  code: RecordingErrorCode;
  message: string;
  elderlyFriendlyMessage: string;
  recoverable: boolean;
  severity: ErrorSeverity;
  retryAction?: () => Promise<void>;
  timestamp: Date;
  context?: ErrorContext;

  // User assistance
  helpArticleId?: string;
  voiceExplanation?: string;
  visualAid?: string;
}

export type RecordingErrorCode =
  | 'PERMISSION_DENIED'
  | 'MICROPHONE_UNAVAILABLE'
  | 'STORAGE_FULL'
  | 'DEVICE_TOO_OLD'
  | 'AUDIO_QUALITY_LOW'
  | 'BACKGROUND_INTERRUPTION'
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'MEMORY_PRESSURE'
  | 'THERMAL_THROTTLING'
  | 'BATTERY_LOW'
  | 'APP_BACKGROUNDED'
  | 'PHONE_CALL_INTERRUPT'
  | 'HARDWARE_ERROR'
  | 'FILE_CORRUPTION'
  | 'TRANSCRIPTION_FAILED';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorContext {
  screen: RecordingScreen;
  phase: RecordingPhase;
  duration: number;
  retryCount: number;
  deviceInfo: {
    model: string;
    osVersion: string;
    availableStorage: number;
    batteryLevel: number;
  };
}

export interface RecordingRecoveryState {
  canRetry: boolean;
  maxRetries: number;
  currentRetry: number;
  recoveryOptions: RecoveryOption[];
  autoRecoveryEnabled: boolean;
  elderlyAssistanceMode: boolean;
}

export interface RecoveryOption {
  id: string;
  title: string;
  description: string;
  elderlyFriendlyDescription: string;
  action: () => Promise<void>;
  difficulty: 'simple' | 'moderate' | 'advanced';
  successRate: number;
  estimatedTime: number; // seconds
}

// ========================================
// Elderly-Specific Features
// ========================================

export interface ElderlyRecordingSettings {
  // Voice guidance
  voiceGuidanceEnabled: boolean;
  voiceGuidanceRate: number; // 0.5 to 1.0
  voiceVolume: number; // 0.0 to 1.0
  voiceLanguage: string;

  // Haptic feedback
  hapticFeedbackLevel: HapticLevel;
  confirmationHaptics: boolean;
  errorHaptics: boolean;

  // Visual accessibility
  largeButtons: boolean;
  highContrast: boolean;
  largeText: boolean;
  simplifiedInterface: boolean;

  // Timing and behavior
  extendedTimeouts: boolean;
  autoSaveEnabled: boolean;
  pauseReminderInterval: number; // seconds
  confirmationDialogs: boolean;

  // Audio enhancements
  speechEnhancement: boolean;
  noiseReduction: boolean;
  autoVolumeAdjustment: boolean;
  playbackSpeedControl: boolean;

  // Progressive disclosure
  showAdvancedOptions: boolean;
  enableExpertMode: boolean;
  hideComplexFeatures: boolean;

  // Assistance features
  smartErrorRecovery: boolean;
  contextualHelp: boolean;
  voiceCommands: boolean;
  gestureAlternatives: boolean;
}

export type HapticLevel = 'none' | 'light' | 'medium' | 'strong';

export interface AccessibilitySettings {
  reduceMotion: boolean;
  increaseContrast: boolean;
  largerText: boolean;
  voiceOver: boolean;
  switchControl: boolean;
  assistiveTouch: boolean;

  // Audio accessibility
  closedCaptions: boolean;
  audioDescriptions: boolean;
  signLanguageSupport: boolean;

  // Motor accessibility
  dwellControl: boolean;
  touchAccommodations: boolean;
  oneHandedMode: boolean;
}

// ========================================
// Transcription & Processing
// ========================================

export interface TranscriptionStatus {
  isProcessing: boolean;
  progress: number; // 0-100
  result?: TranscriptionResult;
  error?: TranscriptionError;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  segments: TranscriptionSegment[];
  language: string;
  processingTime: number;

  // Elderly-specific features
  simplifiedText?: string;
  keyPoints?: string[];
  emotionalTone?: string;
  topicSummary?: string;
}

export interface TranscriptionSegment {
  start: number; // seconds
  end: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface TranscriptionError {
  code: string;
  message: string;
  elderlyFriendlyMessage: string;
  retryable: boolean;
}

// ========================================
// Performance & Analytics
// ========================================

export interface RecordingPerformanceMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;

  // Latency metrics
  initializationTime: number;
  firstInteractionTime: number;
  recordingStartLatency: number;
  recordingStopLatency: number;

  // Quality metrics
  audioQualityScore: number;
  compressionRatio: number;
  fileSize: number;

  // User experience metrics
  pauseCount: number;
  retryCount: number;
  errorCount: number;
  helpRequestCount: number;

  // Device performance
  cpuUsage: number[];
  memoryUsage: number[];
  batteryDrain: number;
  thermalState: string[];

  // Elderly-specific metrics
  elderlyOptimizationsUsed: string[];
  voiceGuidanceInteractions: number;
  accessibilityFeaturesUsed: string[];
  difficultyEncountered: boolean;
}

export interface RecordingAnalytics {
  sessionMetrics: RecordingPerformanceMetrics;
  userBehavior: UserBehaviorMetrics;
  deviceInfo: DeviceInfo;
  errors: RecordingError[];
  recoveryActions: RecoveryAction[];
}

export interface UserBehaviorMetrics {
  screenTimePerPage: Record<RecordingScreen, number>;
  backNavigationCount: number;
  skipCount: number;
  helpAccessCount: number;
  settingsChanges: SettingsChange[];
  voiceGuidanceUsage: VoiceGuidanceMetrics;
}

export interface VoiceGuidanceMetrics {
  enabled: boolean;
  promptsPlayed: number;
  promptsSkipped: number;
  averagePlaybackRate: number;
  repeatedPrompts: string[];
}

export interface SettingsChange {
  setting: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  screen: RecordingScreen;
}

export interface RecoveryAction {
  errorCode: RecordingErrorCode;
  action: string;
  timestamp: Date;
  success: boolean;
  userInitiated: boolean;
}

export interface DeviceInfo {
  model: string;
  osVersion: string;
  appVersion: string;
  availableStorage: number;
  totalStorage: number;
  batteryLevel: number;
  isLowPowerMode: boolean;
  memoryTier: 'low' | 'medium' | 'high';
  audioCapabilities: string[];
}

// ========================================
// Store & State Management Types
// ========================================

export interface RecordingFlowStore {
  // Core state
  flowState: RecordingFlowState;
  navigation: RecordingFlowNavigation;
  session: RecordingSession | null;

  // Configuration
  elderlySettings: ElderlyRecordingSettings;
  accessibility: AccessibilitySettings;
  audioConfig: AudioConfiguration;

  // Runtime state
  permissions: PermissionState;
  deviceCapabilities: DeviceCapabilities;
  performanceMetrics: RecordingPerformanceMetrics | null;

  // Actions - Flow Control
  startRecordingFlow: (topic?: DailyTopic) => Promise<void>;
  cancelRecordingFlow: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;

  // Actions - Navigation
  navigateToScreen: (screen: RecordingScreen, data?: any) => void;
  goBack: () => void;
  skipScreen: (reason: SkipReason) => void;

  // Actions - Session Management
  createSession: (topic?: DailyTopic) => string;
  updateSession: (updates: Partial<RecordingSession>) => void;
  saveSession: (memoryData: Partial<MemoryItem>, addMemoryCallback?: (memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>) => Promise<void>;
  discardSession: () => Promise<void>;

  // Actions - Error Handling
  handleError: (error: RecordingError) => void;
  retryLastAction: () => Promise<void>;
  clearError: () => void;

  // Actions - Elderly Features
  enableVoiceGuidance: (enabled: boolean) => void;
  adjustAudioQuality: (quality: Partial<AudioQuality>) => void;
  updateElderlySettings: (settings: Partial<ElderlyRecordingSettings>) => void;

  // Actions - Performance
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  optimizeForDevice: () => Promise<void>;

  // Actions - Session Recovery
  checkForRecoverableSession: () => boolean;
  recoverSession: () => Promise<boolean>;
  clearSessionRecovery: () => void;
}

export interface PermissionState {
  microphone: PermissionStatus;
  mediaLibrary: PermissionStatus;
  notifications: PermissionStatus;
  lastChecked: Date;
}

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

export interface DeviceCapabilities {
  maxRecordingQuality: AudioFormat;
  supportedSampleRates: number[];
  hasNoiseReduction: boolean;
  hasVoiceEnhancement: boolean;
  batterySensitive: boolean;
  memoryConstrained: boolean;
  isElderlyOptimized: boolean;
}

// ========================================
// Integration Types
// ========================================

export interface RecordingToMemoryAdapter {
  session: RecordingSession;
  transcription?: TranscriptionResult;
  audioAnalysis?: AudioAnalysis;

  toMemoryItem(): Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>;
}

export interface ElderlyAudioService {
  initialize(): Promise<void>;
  startRecording(config: AudioConfiguration): Promise<RecordingSession>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  stopRecording(): Promise<string>;

  // Elderly-specific methods
  enableElderlyMode(): Promise<void>;
  adjustForHearingImpairment(level: 'mild' | 'moderate' | 'severe'): Promise<void>;
  enableVoiceEnhancement(): Promise<void>;
  setPlaybackSpeed(rate: number): Promise<void>;
}

// ========================================
// Hook Types
// ========================================

export interface UseRecordingFlowResult {
  // State
  state: RecordingFlowState;
  session: RecordingSession | null;
  navigation: RecordingFlowNavigation;

  // Actions
  start: (topic?: DailyTopic) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;

  // Navigation
  next: (data?: any) => void;
  back: () => void;
  skip: (reason: SkipReason) => void;

  // Utilities
  isRecording: boolean;
  canGoBack: boolean;
  canSkip: boolean;
  error: RecordingError | null;
}

export interface UseElderlyOptimizationResult {
  settings: ElderlyRecordingSettings;
  updateSettings: (settings: Partial<ElderlyRecordingSettings>) => void;
  optimizeForUser: (userProfile: ElderlyUserProfile) => void;
  resetToDefaults: () => void;
}

export interface ElderlyUserProfile {
  age: number;
  hearingLevel: 'normal' | 'mild-loss' | 'moderate-loss' | 'severe-loss';
  visionLevel: 'normal' | 'mild-impairment' | 'moderate-impairment' | 'severe-impairment';
  motorSkills: 'normal' | 'mild-difficulty' | 'moderate-difficulty' | 'severe-difficulty';
  techSavviness: 'beginner' | 'intermediate' | 'advanced';
  preferredInteractionStyle: 'visual' | 'audio' | 'haptic' | 'mixed';
}

// ========================================
// Event Types
// ========================================

export interface RecordingFlowEvent {
  type: RecordingFlowEventType;
  timestamp: Date;
  screen: RecordingScreen;
  phase: RecordingPhase;
  data?: any;
  elderlyContext?: ElderlyEventContext;
}

export type RecordingFlowEventType =
  | 'flow_started'
  | 'screen_changed'
  | 'recording_started'
  | 'recording_paused'
  | 'recording_resumed'
  | 'recording_stopped'
  | 'error_occurred'
  | 'error_recovered'
  | 'user_went_back'
  | 'user_skipped'
  | 'voice_guidance_played'
  | 'help_requested'
  | 'settings_changed'
  | 'flow_completed'
  | 'flow_cancelled';

export interface ElderlyEventContext {
  voiceGuidanceActive: boolean;
  hapticFeedbackUsed: boolean;
  assistanceRequested: boolean;
  difficultyLevel: 'easy' | 'moderate' | 'challenging';
  errorRecoveryMethod?: string;
}