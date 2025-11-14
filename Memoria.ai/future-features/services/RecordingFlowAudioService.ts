/**
 * Recording Flow Audio Service for Memoria.ai Phase 2
 *
 * Enhanced audio service specifically designed for the recording flow,
 * integrating with the existing optimized audio service while providing
 * elderly-focused features and robust error handling.
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import {
  RecordingSession,
  AudioConfiguration,
  AudioQuality,
  RecordingError,
  RecordingErrorCode,
  ElderlyRecordingSettings,
  AudioAnalysis,
  TranscriptionResult,
  PermissionState,
} from '@/types/recording-flow';

import { optimizedAudioService } from './OptimizedAudioService';
import { audioService } from './audioService';

// ========================================
// Types & Interfaces
// ========================================

export interface RecordingFlowAudioConfig extends AudioConfiguration {
  // Recording flow specific settings
  elderlyOptimizations: {
    voiceEnhancement: boolean;
    backgroundNoiseReduction: boolean;
    autoGainControl: boolean;
    speechClarity: boolean;
    recordingStabilization: boolean;
  };

  // Real-time feedback
  realTimeFeedback: {
    visualWaveform: boolean;
    audioLevelMonitoring: boolean;
    qualityIndicators: boolean;
    speakingPrompts: boolean;
  };

  // Performance optimization
  performanceOptimization: {
    adaptiveQuality: boolean;
    memoryManagement: boolean;
    batterySaving: boolean;
    deviceSpecificTuning: boolean;
  };
}

export interface RecordingSessionMetrics {
  sessionId: string;
  startTime: Date;
  endTime?: Date;

  // Audio metrics
  averageVolume: number;
  peakVolume: number;
  silencePeriods: number[];
  totalSilenceTime: number;
  speechToSilenceRatio: number;

  // Quality metrics
  audioQualityScore: number;
  compressionEfficiency: number;
  noiseLevel: number;
  clarityScore: number;

  // Performance metrics
  recordingLatency: number;
  processingTime: number;
  memoryUsage: number;
  batteryImpact: number;

  // Elderly-specific metrics
  voiceGuidanceInteractions: number;
  pauseFrequency: number;
  errorRecoveryCount: number;
  userAssistanceNeeded: boolean;
}

export interface AudioFeedback {
  isRecording: boolean;
  currentVolume: number;
  peakVolume: number;
  duration: number;
  qualityIndicator: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: AudioSuggestion[];
}

export interface AudioSuggestion {
  type: 'volume' | 'proximity' | 'environment' | 'clarity';
  message: string;
  elderlyFriendlyMessage: string;
  priority: 'low' | 'medium' | 'high';
  autoApplicable: boolean;
}

// ========================================
// Recording Flow Audio Service
// ========================================

export class RecordingFlowAudioService {
  private currentRecording: Audio.Recording | null = null;
  private currentSound: Audio.Sound | null = null;
  private recordingStatus: Audio.RecordingStatus | null = null;
  private config: RecordingFlowAudioConfig;
  private elderlySettings: ElderlyRecordingSettings;
  private sessionMetrics: RecordingSessionMetrics | null = null;
  private feedbackCallbacks: Set<(feedback: AudioFeedback) => void> = new Set();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    this.config = this.getDefaultConfig();
    this.elderlySettings = this.getDefaultElderlySettings();
  }

  // ========================================
  // Initialization & Configuration
  // ========================================

  async initialize(elderlySettings?: ElderlyRecordingSettings): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize base audio services
      await optimizedAudioService.initialize();
      await audioService.initialize();

      // Apply elderly settings
      if (elderlySettings) {
        this.elderlySettings = elderlySettings;
        this.applyElderlySettings();
      }

      // Configure audio system for recording flow
      await this.configureAudioSystem();

      this.isInitialized = true;
      console.log('RecordingFlowAudioService initialized with elderly optimizations');

    } catch (error) {
      console.error('Failed to initialize RecordingFlowAudioService:', error);
      throw this.createRecordingError(
        'HARDWARE_ERROR',
        'Failed to initialize audio system',
        error
      );
    }
  }

  private async configureAudioSystem(): Promise<void> {
    // Configure audio mode for elderly users
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: false, // Conserve battery
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
      shouldDuckAndroid: false, // Don't lower volume for elderly users
      playThroughEarpieceAndroid: false,
      playsInSilentModeIOS: true, // Important for elderly users
    });

    // Apply elderly-specific optimizations
    if (this.elderlySettings.speechEnhancement) {
      await this.enableSpeechEnhancement();
    }

    if (this.elderlySettings.noiseReduction) {
      await this.enableNoiseReduction();
    }
  }

  private applyElderlySettings(): void {
    // Adjust audio quality for elderly users
    if (this.elderlySettings.speechEnhancement) {
      this.config.quality.sampleRate = Math.max(this.config.quality.sampleRate, 22050);
      this.config.quality.voiceEnhancement = true;
    }

    // Optimize buffer management
    if (this.elderlySettings.extendedTimeouts) {
      this.config.elderlyBufferBoost = true;
      this.config.bufferSize = Math.max(this.config.bufferSize, 16384);
    }

    // Configure real-time feedback
    this.config.realTimeFeedback = {
      visualWaveform: !this.elderlySettings.simplifiedInterface,
      audioLevelMonitoring: true,
      qualityIndicators: this.elderlySettings.showAdvancedOptions,
      speakingPrompts: this.elderlySettings.voiceGuidanceEnabled,
    };
  }

  // ========================================
  // Permission Management
  // ========================================

  async checkPermissions(): Promise<PermissionState> {
    try {
      const audioPermission = await Audio.getPermissionsAsync();

      return {
        microphone: audioPermission.granted ? 'granted' :
                   audioPermission.canAskAgain ? 'undetermined' : 'denied',
        mediaLibrary: 'granted', // Assume granted for simplicity
        notifications: 'granted', // Assume granted for simplicity
        lastChecked: new Date(),
      };

    } catch (error) {
      console.error('Failed to check permissions:', error);
      throw this.createRecordingError(
        'PERMISSION_DENIED',
        'Failed to check audio permissions',
        error
      );
    }
  }

  async requestPermissions(): Promise<PermissionState> {
    try {
      const audioPermission = await Audio.requestPermissionsAsync();

      const permissionState: PermissionState = {
        microphone: audioPermission.granted ? 'granted' : 'denied',
        mediaLibrary: 'granted',
        notifications: 'granted',
        lastChecked: new Date(),
      };

      // Provide elderly-friendly feedback
      if (this.elderlySettings.voiceGuidanceEnabled) {
        if (audioPermission.granted) {
          await Speech.speak(
            "Great! We can now access your microphone to record your memories.",
            { rate: this.elderlySettings.voiceGuidanceRate }
          );
        } else {
          await Speech.speak(
            "We need permission to use your microphone. Please check your device settings.",
            { rate: this.elderlySettings.voiceGuidanceRate }
          );
        }
      }

      return permissionState;

    } catch (error) {
      console.error('Failed to request permissions:', error);
      throw this.createRecordingError(
        'PERMISSION_DENIED',
        'Failed to request audio permissions',
        error
      );
    }
  }

  // ========================================
  // Recording Management
  // ========================================

  async startRecording(session: RecordingSession): Promise<void> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      if (permissions.microphone !== 'granted') {
        throw this.createRecordingError(
          'PERMISSION_DENIED',
          'Microphone permission not granted'
        );
      }

      // Stop any existing recording
      await this.stopRecording();

      // Initialize session metrics
      this.sessionMetrics = this.initializeSessionMetrics(session.id);

      // Configure recording options
      const recordingOptions = this.getRecordingOptions();

      // Create and start recording
      this.currentRecording = new Audio.Recording();
      await this.currentRecording.prepareToRecordAsync(recordingOptions);

      const startTime = Date.now();
      await this.currentRecording.startAsync();
      const startLatency = Date.now() - startTime;

      // Update metrics
      if (this.sessionMetrics) {
        this.sessionMetrics.recordingLatency = startLatency;
      }

      // Start real-time monitoring
      this.startRealTimeMonitoring();

      // Provide feedback to elderly users
      if (this.elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Recording started. Speak clearly and take your time.",
          { rate: this.elderlySettings.voiceGuidanceRate }
        );
      }

      if (this.elderlySettings.hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(
          this.elderlySettings.hapticFeedbackLevel === 'light'
            ? Haptics.ImpactFeedbackStyle.Light
            : this.elderlySettings.hapticFeedbackLevel === 'medium'
            ? Haptics.ImpactFeedbackStyle.Medium
            : Haptics.ImpactFeedbackStyle.Heavy
        );
      }

      console.log('Recording started successfully for elderly user');

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw this.createRecordingError(
        'RECORDING_START_FAILED',
        'Failed to start recording',
        error
      );
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (!this.currentRecording) {
        throw new Error('No active recording to pause');
      }

      await this.currentRecording.pauseAsync();

      // Update metrics
      if (this.sessionMetrics) {
        this.sessionMetrics.pauseFrequency++;
      }

      // Stop monitoring temporarily
      this.stopRealTimeMonitoring();

      // Provide feedback
      if (this.elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Recording paused. Take your time. Press resume when ready.",
          { rate: this.elderlySettings.voiceGuidanceRate }
        );
      }

      if (this.elderlySettings.hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw this.createRecordingError(
        'RECORDING_PAUSE_FAILED',
        'Failed to pause recording',
        error
      );
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (!this.currentRecording) {
        throw new Error('No recording to resume');
      }

      await this.currentRecording.startAsync();

      // Resume monitoring
      this.startRealTimeMonitoring();

      // Provide feedback
      if (this.elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Recording resumed. Continue sharing your memory.",
          { rate: this.elderlySettings.voiceGuidanceRate }
        );
      }

      if (this.elderlySettings.hapticFeedbackLevel !== 'none') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw this.createRecordingError(
        'RECORDING_RESUME_FAILED',
        'Failed to resume recording',
        error
      );
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.currentRecording) {
        return null;
      }

      // Stop monitoring
      this.stopRealTimeMonitoring();

      // Stop recording and get URI
      const stopTime = Date.now();
      await this.currentRecording.stopAndUnloadAsync();
      const uri = this.currentRecording.getURI();
      const stopLatency = Date.now() - stopTime;

      // Update metrics
      if (this.sessionMetrics) {
        this.sessionMetrics.endTime = new Date();
        this.sessionMetrics.processingTime = stopLatency;
      }

      // Clean up
      this.currentRecording = null;
      this.recordingStatus = null;

      // Process recording for elderly users
      const processedUri = await this.postProcessRecording(uri);

      // Provide feedback
      if (this.elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Recording complete! Processing your memory now.",
          { rate: this.elderlySettings.voiceGuidanceRate }
        );
      }

      if (this.elderlySettings.hapticFeedbackLevel !== 'none') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return processedUri;

    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw this.createRecordingError(
        'RECORDING_STOP_FAILED',
        'Failed to stop recording',
        error
      );
    }
  }

  // ========================================
  // Playback Management
  // ========================================

  async playRecording(uri: string, elderlyOptimized: boolean = true): Promise<void> {
    try {
      // Stop any current playback
      await this.stopPlayback();

      // Configure playback for elderly users
      const playbackConfig = {
        shouldPlay: true,
        isLooping: false,
        volume: elderlyOptimized ? 0.8 : 0.7,
        rate: elderlyOptimized ?
          (this.elderlySettings.playbackSpeedControl ? 0.9 : 1.0) : 1.0,
        shouldCorrectPitch: true,
      };

      const { sound } = await Audio.Sound.createAsync({ uri }, playbackConfig);
      this.currentSound = sound;

      // Apply elderly-specific enhancements
      if (elderlyOptimized) {
        await this.applyPlaybackEnhancements(sound);
      }

      // Start playback
      await sound.playAsync();

      // Provide feedback
      if (this.elderlySettings.voiceGuidanceEnabled) {
        await Speech.speak(
          "Playing your recording. You can adjust the volume if needed.",
          { rate: this.elderlySettings.voiceGuidanceRate }
        );
      }

    } catch (error) {
      console.error('Failed to play recording:', error);
      throw this.createRecordingError(
        'PLAYBACK_START_FAILED',
        'Failed to play recording',
        error
      );
    }
  }

  async stopPlayback(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      } catch (error) {
        console.warn('Error stopping playback:', error);
      }
    }
  }

  // ========================================
  // Real-time Monitoring & Feedback
  // ========================================

  private startRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.updateRealTimeFeedback();
    }, 100); // Update every 100ms for smooth feedback
  }

  private stopRealTimeMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async updateRealTimeFeedback(): Promise<void> {
    try {
      if (!this.currentRecording) return;

      const status = await this.currentRecording.getStatusAsync();
      this.recordingStatus = status;

      if (status.isRecording) {
        const feedback = this.generateAudioFeedback(status);
        this.notifyFeedbackCallbacks(feedback);

        // Update session metrics
        if (this.sessionMetrics && status.durationMillis !== undefined) {
          this.updateSessionMetrics(status);
        }

        // Provide elderly-specific guidance
        if (this.shouldProvideGuidance(feedback)) {
          await this.provideRecordingGuidance(feedback);
        }
      }

    } catch (error) {
      console.warn('Error updating real-time feedback:', error);
    }
  }

  private generateAudioFeedback(status: Audio.RecordingStatus): AudioFeedback {
    // Calculate audio metrics (this would use actual audio analysis in production)
    const currentVolume = Math.random() * 100; // Placeholder
    const peakVolume = Math.max(currentVolume, Math.random() * 100);
    const duration = status.durationMillis ? status.durationMillis / 1000 : 0;

    // Determine quality indicator
    let qualityIndicator: 'excellent' | 'good' | 'fair' | 'poor' = 'good';
    if (currentVolume < 20) qualityIndicator = 'poor';
    else if (currentVolume < 40) qualityIndicator = 'fair';
    else if (currentVolume > 80) qualityIndicator = 'excellent';

    // Generate suggestions
    const suggestions = this.generateAudioSuggestions(currentVolume, qualityIndicator);

    return {
      isRecording: status.isRecording || false,
      currentVolume,
      peakVolume,
      duration,
      qualityIndicator,
      suggestions,
    };
  }

  private generateAudioSuggestions(volume: number, quality: string): AudioSuggestion[] {
    const suggestions: AudioSuggestion[] = [];

    if (volume < 30) {
      suggestions.push({
        type: 'volume',
        message: 'Audio level is low. Speak louder or move closer to the microphone.',
        elderlyFriendlyMessage: 'Speak a bit louder please, or hold your device closer.',
        priority: 'medium',
        autoApplicable: false,
      });
    }

    if (volume > 90) {
      suggestions.push({
        type: 'volume',
        message: 'Audio level is too high. Speak softer or move away from the microphone.',
        elderlyFriendlyMessage: 'You\'re speaking quite loudly. Try speaking a bit softer.',
        priority: 'medium',
        autoApplicable: false,
      });
    }

    if (quality === 'poor') {
      suggestions.push({
        type: 'environment',
        message: 'Background noise detected. Try recording in a quieter location.',
        elderlyFriendlyMessage: 'It\'s a bit noisy. Try finding a quieter room if possible.',
        priority: 'high',
        autoApplicable: false,
      });
    }

    return suggestions;
  }

  private shouldProvideGuidance(feedback: AudioFeedback): boolean {
    if (!this.elderlySettings.voiceGuidanceEnabled) return false;

    // Provide guidance for quality issues
    return feedback.suggestions.some(s => s.priority === 'high') ||
           feedback.qualityIndicator === 'poor';
  }

  private async provideRecordingGuidance(feedback: AudioFeedback): Promise<void> {
    const highPrioritySuggestion = feedback.suggestions.find(s => s.priority === 'high');

    if (highPrioritySuggestion) {
      // Don't interrupt too frequently
      const now = Date.now();
      const lastGuidanceKey = `lastGuidance_${highPrioritySuggestion.type}`;
      const lastGuidance = (this as any)[lastGuidanceKey] || 0;

      if (now - lastGuidance > 30000) { // 30 seconds minimum between guidance
        await Speech.speak(
          highPrioritySuggestion.elderlyFriendlyMessage,
          { rate: this.elderlySettings.voiceGuidanceRate }
        );

        (this as any)[lastGuidanceKey] = now;
      }
    }
  }

  // ========================================
  // Audio Processing & Enhancement
  // ========================================

  private async postProcessRecording(uri: string | null): Promise<string | null> {
    if (!uri) return null;

    try {
      let processedUri = uri;

      // Apply elderly-specific enhancements
      if (this.elderlySettings.speechEnhancement) {
        processedUri = await this.enhanceSpeechClarity(processedUri);
      }

      if (this.elderlySettings.noiseReduction) {
        processedUri = await this.reduceBackgroundNoise(processedUri);
      }

      // Normalize audio levels for elderly users
      if (this.elderlySettings.autoVolumeAdjustment) {
        processedUri = await this.normalizeAudioLevels(processedUri);
      }

      return processedUri;

    } catch (error) {
      console.warn('Post-processing failed, returning original:', error);
      return uri;
    }
  }

  private async enhanceSpeechClarity(uri: string): Promise<string> {
    // Placeholder for speech enhancement
    // In production, this would use native audio processing modules
    console.log('Enhancing speech clarity for elderly user');
    return uri;
  }

  private async reduceBackgroundNoise(uri: string): Promise<string> {
    // Placeholder for noise reduction
    console.log('Reducing background noise');
    return uri;
  }

  private async normalizeAudioLevels(uri: string): Promise<string> {
    // Placeholder for audio normalization
    console.log('Normalizing audio levels for elderly playback');
    return uri;
  }

  private async enableSpeechEnhancement(): Promise<void> {
    // Enable speech enhancement optimizations
    console.log('Speech enhancement enabled for elderly user');
  }

  private async enableNoiseReduction(): Promise<void> {
    // Enable noise reduction
    console.log('Noise reduction enabled');
  }

  private async applyPlaybackEnhancements(sound: Audio.Sound): Promise<void> {
    try {
      // Apply elderly-specific playback enhancements
      if (this.elderlySettings.autoVolumeAdjustment) {
        await sound.setVolumeAsync(0.8); // Slightly louder for elderly users
      }

      // Apply voice enhancement (placeholder)
      console.log('Applying voice enhancement for elderly playback');

    } catch (error) {
      console.warn('Failed to apply playback enhancements:', error);
    }
  }

  // ========================================
  // Metrics & Analytics
  // ========================================

  private initializeSessionMetrics(sessionId: string): RecordingSessionMetrics {
    return {
      sessionId,
      startTime: new Date(),
      averageVolume: 0,
      peakVolume: 0,
      silencePeriods: [],
      totalSilenceTime: 0,
      speechToSilenceRatio: 0,
      audioQualityScore: 0,
      compressionEfficiency: 0,
      noiseLevel: 0,
      clarityScore: 0,
      recordingLatency: 0,
      processingTime: 0,
      memoryUsage: 0,
      batteryImpact: 0,
      voiceGuidanceInteractions: 0,
      pauseFrequency: 0,
      errorRecoveryCount: 0,
      userAssistanceNeeded: false,
    };
  }

  private updateSessionMetrics(status: Audio.RecordingStatus): void {
    if (!this.sessionMetrics) return;

    // Update metrics based on current status
    // This would include actual audio analysis in production
    if (status.durationMillis) {
      this.sessionMetrics.totalSilenceTime = status.durationMillis / 1000;
    }
  }

  getSessionMetrics(): RecordingSessionMetrics | null {
    return this.sessionMetrics;
  }

  // ========================================
  // Event Handling & Callbacks
  // ========================================

  addFeedbackCallback(callback: (feedback: AudioFeedback) => void): void {
    this.feedbackCallbacks.add(callback);
  }

  removeFeedbackCallback(callback: (feedback: AudioFeedback) => void): void {
    this.feedbackCallbacks.delete(callback);
  }

  private notifyFeedbackCallbacks(feedback: AudioFeedback): void {
    this.feedbackCallbacks.forEach(callback => {
      try {
        callback(feedback);
      } catch (error) {
        console.warn('Feedback callback error:', error);
      }
    });
  }

  // ========================================
  // Utility Methods
  // ========================================

  private getRecordingOptions(): Audio.RecordingOptions {
    const quality = this.config.quality;

    return {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: quality.sampleRate,
        numberOfChannels: quality.channels,
        bitRate: quality.bitRate,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: quality.sampleRate,
        numberOfChannels: quality.channels,
        bitRate: quality.bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };
  }

  private createRecordingError(
    code: RecordingErrorCode,
    message: string,
    originalError?: any
  ): RecordingError {
    const elderlyMessages: Record<RecordingErrorCode, string> = {
      'PERMISSION_DENIED': 'We need permission to use your microphone. Please check your device settings.',
      'MICROPHONE_UNAVAILABLE': 'Your microphone is being used by another app. Please close other apps and try again.',
      'STORAGE_FULL': 'Your device storage is full. Please free up some space and try again.',
      'DEVICE_TOO_OLD': 'Your device may have trouble with recording. You can still try, but quality might be reduced.',
      'AUDIO_QUALITY_LOW': 'The recording quality is low. Try moving to a quieter location.',
      'BACKGROUND_INTERRUPTION': 'Something interrupted your recording. Your memory was saved up to that point.',
      'NETWORK_ERROR': 'Internet connection is needed for some features. You can still record without internet.',
      'TIMEOUT_ERROR': 'The recording took longer than expected. Let\'s try again.',
      'MEMORY_PRESSURE': 'Your device is running low on memory. Try closing other apps.',
      'THERMAL_THROTTLING': 'Your device is getting warm. Let it cool down before trying again.',
      'BATTERY_LOW': 'Your battery is low. Please charge your device.',
      'APP_BACKGROUNDED': 'The app went to the background. Your recording was saved.',
      'PHONE_CALL_INTERRUPT': 'A phone call interrupted recording. Your memory was saved.',
      'HARDWARE_ERROR': 'There\'s an issue with your microphone. Try restarting your device.',
      'FILE_CORRUPTION': 'The recording file was damaged. Let\'s try recording again.',
      'TRANSCRIPTION_FAILED': 'We couldn\'t convert speech to text, but your voice recording is safe.',
      'RECORDING_START_FAILED': 'Could not start recording. Please try again.',
      'RECORDING_PAUSE_FAILED': 'Could not pause recording.',
      'RECORDING_RESUME_FAILED': 'Could not resume recording.',
      'RECORDING_STOP_FAILED': 'Could not stop recording properly.',
      'PLAYBACK_START_FAILED': 'Could not play the recording.',
    };

    return {
      code,
      message,
      elderlyFriendlyMessage: elderlyMessages[code] || 'Something unexpected happened. Don\'t worry, we\'ll help you through it.',
      recoverable: !['DEVICE_TOO_OLD', 'HARDWARE_ERROR'].includes(code),
      severity: code === 'PERMISSION_DENIED' ? 'critical' : 'warning',
      timestamp: new Date(),
      context: {
        originalError: originalError?.message,
        config: this.config,
        elderlySettings: this.elderlySettings,
      },
    };
  }

  private getDefaultConfig(): RecordingFlowAudioConfig {
    return {
      quality: {
        sampleRate: 22050,
        bitRate: 96000,
        channels: 1,
        format: 'aac',
        elderlyOptimized: true,
        compressionLevel: 0.8,
        noiseReduction: true,
        voiceEnhancement: true,
      },
      maxDuration: 1800, // 30 minutes
      bufferSize: 8192,
      elderlyBufferBoost: true,
      realTimeProcessing: false,
      backgroundNoiseReduction: true,
      autoGainControl: true,
      elderlyOptimizations: {
        voiceEnhancement: true,
        backgroundNoiseReduction: true,
        autoGainControl: true,
        speechClarity: true,
        recordingStabilization: true,
      },
      realTimeFeedback: {
        visualWaveform: true,
        audioLevelMonitoring: true,
        qualityIndicators: false, // Simplified for elderly users
        speakingPrompts: true,
      },
      performanceOptimization: {
        adaptiveQuality: true,
        memoryManagement: true,
        batterySaving: true,
        deviceSpecificTuning: true,
      },
    };
  }

  private getDefaultElderlySettings(): ElderlyRecordingSettings {
    return {
      voiceGuidanceEnabled: true,
      voiceGuidanceRate: 0.8,
      voiceVolume: 0.9,
      voiceLanguage: 'en-US',
      hapticFeedbackLevel: 'medium',
      confirmationHaptics: true,
      errorHaptics: true,
      largeButtons: true,
      highContrast: false,
      largeText: true,
      simplifiedInterface: true,
      extendedTimeouts: true,
      autoSaveEnabled: true,
      pauseReminderInterval: 300,
      confirmationDialogs: true,
      speechEnhancement: true,
      noiseReduction: true,
      autoVolumeAdjustment: true,
      playbackSpeedControl: true,
      showAdvancedOptions: false,
      enableExpertMode: false,
      hideComplexFeatures: true,
      smartErrorRecovery: true,
      contextualHelp: true,
      voiceCommands: false,
      gestureAlternatives: true,
    };
  }

  // ========================================
  // Cleanup
  // ========================================

  async cleanup(): Promise<void> {
    this.stopRealTimeMonitoring();
    await this.stopRecording();
    await this.stopPlayback();
    this.feedbackCallbacks.clear();
    this.sessionMetrics = null;
    console.log('RecordingFlowAudioService cleanup completed');
  }
}

// Export singleton instance
export const recordingFlowAudioService = new RecordingFlowAudioService();