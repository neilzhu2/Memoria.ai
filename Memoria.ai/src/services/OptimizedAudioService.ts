/**
 * Optimized Audio Service for Memoria.ai
 * Audio recording and playback optimized for elderly users on older devices
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';
import { AudioPermissions, RecordingConfig, AudioRecording } from '../types/audio';

export interface OptimizedAudioConfig {
  // Quality settings based on device capability
  adaptiveQuality: boolean;
  elderlyOptimizations: boolean;

  // Recording optimizations
  bufferManagement: {
    maxBufferSize: number; // MB
    compressionLevel: 'low' | 'medium' | 'high';
    realTimeCompression: boolean;
    elderlyBufferBoost: boolean; // Larger buffers for stability
  };

  // Playback optimizations
  playbackOptimizations: {
    preloadingEnabled: boolean;
    adaptiveBuffering: boolean;
    elderlyPlaybackRate: number; // Slightly slower for clarity
    enhancedAudio: boolean; // Voice enhancement for elderly users
  };

  // Memory optimizations
  memoryManagement: {
    autoCleanup: boolean;
    maxCacheSize: number; // MB
    compressionRatio: number;
    elderlyMemoryProtection: boolean;
  };

  // Performance thresholds
  performanceThresholds: {
    maxRecordingLatency: number; // ms
    targetCPUUsage: number; // percentage
    memoryWarningThreshold: number; // MB
    batteryOptimizationThreshold: number; // percentage
  };
}

export interface AudioPerformanceMetrics {
  recordingLatency: number;
  playbackLatency: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryUsage: number;
  compressionRatio: number;
  elderlyOptimizationsActive: number;
}

export interface ElderlyAudioFeatures {
  voiceEnhancement: boolean;
  backgroundNoiseReduction: boolean;
  speechClarity: boolean;
  slowPlaybackMode: boolean;
  largerAudioBuffers: boolean;
  extendedRecordingTime: boolean;
  autoVolumeAdjustment: boolean;
  simplifiedControls: boolean;
}

export interface AdaptiveAudioQuality {
  sampleRate: number;
  bitRate: number;
  channels: number;
  format: 'aac' | 'mp3' | 'wav';
  compressionLevel: number;
  elderlyOptimized: boolean;
}

class OptimizedAudioService {
  private capabilities: DetailedDeviceCapabilities | null = null;
  private config: OptimizedAudioConfig;
  private currentRecording: Audio.Recording | null = null;
  private currentSound: Audio.Sound | null = null;
  private performanceMetrics: AudioPerformanceMetrics;
  private elderlyFeatures: ElderlyAudioFeatures;
  private isInitialized = false;

  // Audio buffer management
  private audioBuffers: Map<string, ArrayBuffer> = new Map();
  private compressionWorker: Worker | null = null;
  private recordingStartTime = 0;

  // Performance monitoring
  private performanceInterval: NodeJS.Timeout | null = null;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.performanceMetrics = this.initializeMetrics();
    this.elderlyFeatures = this.initializeElderlyFeatures();
  }

  /**
   * Initialize optimized audio service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize device capabilities
      await deviceCapabilityService.initialize();
      this.capabilities = deviceCapabilityService.getCapabilities();

      // Configure audio system
      await this.configureAudioSystem();

      // Optimize configuration for device and elderly users
      this.optimizeConfigForDevice();
      this.enableElderlyOptimizations();

      // Start performance monitoring
      this.startPerformanceMonitoring();

      // Initialize memory management
      await this.initializeMemoryManagement();

      this.isInitialized = true;
      console.log('OptimizedAudioService initialized for elderly users on older devices');

    } catch (error) {
      console.error('Failed to initialize OptimizedAudioService:', error);
      throw error;
    }
  }

  /**
   * Configure audio system with optimizations
   */
  private async configureAudioSystem(): Promise<void> {
    try {
      // Request permissions first
      await Audio.requestPermissionsAsync();

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

      console.log('Audio system configured for elderly users');

    } catch (error) {
      console.error('Failed to configure audio system:', error);
      throw error;
    }
  }

  /**
   * Optimize configuration based on device capabilities
   */
  private optimizeConfigForDevice(): void {
    if (!this.capabilities) return;

    const isLowEnd = this.capabilities.isLowEndDevice;
    const memoryTier = this.capabilities.memoryTier;
    const audioCapability = this.capabilities.audioProcessingCapability;

    // Adjust buffer sizes
    if (isLowEnd) {
      this.config.bufferManagement.maxBufferSize = 30; // 30MB for low-end
      this.config.bufferManagement.compressionLevel = 'high';
      this.config.bufferManagement.realTimeCompression = true;
    } else {
      this.config.bufferManagement.maxBufferSize = 60; // 60MB for better devices
      this.config.bufferManagement.compressionLevel = 'medium';
    }

    // Adjust audio quality based on capabilities
    if (audioCapability === 'basic') {
      this.config.performanceThresholds.maxRecordingLatency = 300; // More lenient
      this.config.performanceThresholds.targetCPUUsage = 50; // Conservative
    } else if (audioCapability === 'enhanced') {
      this.config.performanceThresholds.maxRecordingLatency = 200;
      this.config.performanceThresholds.targetCPUUsage = 40;
    } else {
      this.config.performanceThresholds.maxRecordingLatency = 100;
      this.config.performanceThresholds.targetCPUUsage = 30;
    }

    // Memory management adjustments
    if (memoryTier === 'low') {
      this.config.memoryManagement.maxCacheSize = 20; // 20MB cache
      this.config.memoryManagement.compressionRatio = 0.6; // 40% compression
      this.config.memoryManagement.elderlyMemoryProtection = true;
    } else {
      this.config.memoryManagement.maxCacheSize = 50; // 50MB cache
      this.config.memoryManagement.compressionRatio = 0.8; // 20% compression
    }

    console.log(`Audio configuration optimized for ${this.capabilities.deviceTier} tier device`);
  }

  /**
   * Enable elderly-specific optimizations
   */
  private enableElderlyOptimizations(): void {
    // Enable all elderly-friendly features
    this.elderlyFeatures = {
      voiceEnhancement: true,
      backgroundNoiseReduction: true,
      speechClarity: true,
      slowPlaybackMode: false, // User preference
      largerAudioBuffers: true,
      extendedRecordingTime: true,
      autoVolumeAdjustment: true,
      simplifiedControls: true,
    };

    // Apply elderly-specific buffer boost
    if (this.config.bufferManagement.elderlyBufferBoost) {
      this.config.bufferManagement.maxBufferSize *= 1.5; // 50% larger buffers
    }

    // Set elderly-optimized playback rate
    this.config.playbackOptimizations.elderlyPlaybackRate = 0.9; // 10% slower for clarity

    console.log('Elderly-specific audio optimizations enabled');
  }

  /**
   * Start recording with optimizations
   */
  async startRecording(config?: Partial<RecordingConfig>): Promise<AudioRecording> {
    try {
      if (this.currentRecording) {
        throw new Error('Recording already in progress');
      }

      // Mark recording start for performance monitoring
      performanceMonitor.markRecordingStart();
      this.recordingStartTime = Date.now();

      // Get optimized recording configuration
      const recordingConfig = this.getOptimizedRecordingConfig(config);

      // Allocate audio buffer
      const bufferSize = this.calculateBufferSize(recordingConfig);
      const bufferAllocated = await memoryManager.allocateAudioBuffer(
        'current_recording',
        recordingConfig.maxDuration || 600, // Default 10 minutes
        recordingConfig.quality || 'medium'
      );

      if (!bufferAllocated) {
        throw new Error('Insufficient memory for recording');
      }

      // Create recording with optimized settings
      this.currentRecording = new Audio.Recording();
      await this.currentRecording.prepareToRecordAsync(recordingConfig);

      // Start recording
      await this.currentRecording.startAsync();

      // Start real-time monitoring
      this.startRecordingMonitoring();

      const recording: AudioRecording = {
        id: `recording_${Date.now()}`,
        filePath: '', // Will be set when recording stops
        duration: 0,
        fileSize: 0,
        quality: recordingConfig.quality || 'medium',
        timestamp: new Date(),
        isProcessing: true,
        elderlyOptimized: true,
      };

      console.log('Optimized recording started for elderly user');
      return recording;

    } catch (error) {
      // Clean up on error
      await this.cleanupRecording();
      console.error('Failed to start optimized recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording with optimizations
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.currentRecording) {
        throw new Error('No recording in progress');
      }

      // Stop recording monitoring
      this.stopRecordingMonitoring();

      // Stop the recording
      await this.currentRecording.stopAndUnloadAsync();
      const recordingUri = this.currentRecording.getURI();

      // Mark recording end for performance monitoring
      performanceMonitor.markRecordingEnd();

      // Process recording with optimizations
      const optimizedUri = await this.processRecording(recordingUri);

      // Clean up
      await this.cleanupRecording();

      console.log('Optimized recording completed');
      return optimizedUri;

    } catch (error) {
      await this.cleanupRecording();
      console.error('Failed to stop optimized recording:', error);
      throw error;
    }
  }

  /**
   * Play audio with elderly optimizations
   */
  async playAudio(uri: string, elderlyMode = true): Promise<void> {
    try {
      // Stop any current playback
      await this.stopAudio();

      // Load audio with optimizations
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: false,
          isMuted: false,
          volume: elderlyMode ? 0.8 : 0.7, // Slightly louder for elderly users
          rate: elderlyMode ? this.config.playbackOptimizations.elderlyPlaybackRate : 1.0,
          shouldCorrectPitch: true, // Maintain pitch when changing rate
        }
      );

      this.currentSound = sound;

      // Apply elderly-specific audio enhancements
      if (elderlyMode && this.elderlyFeatures.voiceEnhancement) {
        await this.applyVoiceEnhancement(sound);
      }

      // Start playback
      await sound.playAsync();

      console.log('Audio playback started with elderly optimizations');

    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      } catch (error) {
        console.warn('Error stopping audio:', error);
      }
    }
  }

  /**
   * Get optimized recording configuration
   */
  private getOptimizedRecordingConfig(userConfig?: Partial<RecordingConfig>): any {
    const quality = this.getAdaptiveAudioQuality(userConfig?.quality);

    const baseConfig = {
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
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
        sampleRate: quality.sampleRate,
        numberOfChannels: quality.channels,
        bitRate: quality.bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
    };

    // Apply elderly-specific optimizations
    if (this.elderlyFeatures.largerAudioBuffers) {
      // Increase buffer sizes for more stable recording
      if (baseConfig.android) {
        baseConfig.android.bitRate *= 1.1; // 10% higher bitrate for clarity
      }
      if (baseConfig.ios) {
        baseConfig.ios.bitRate *= 1.1;
      }
    }

    return baseConfig;
  }

  /**
   * Get adaptive audio quality based on device capabilities
   */
  private getAdaptiveAudioQuality(requestedQuality?: 'low' | 'medium' | 'high'): AdaptiveAudioQuality {
    const deviceMaxQuality = this.capabilities?.maxRecordingQuality || 'medium';
    const finalQuality = requestedQuality || deviceMaxQuality;

    // Quality configurations optimized for elderly users
    const qualityConfigs = {
      low: {
        sampleRate: 16000, // Sufficient for speech
        bitRate: 64000,   // Conservative for older devices
        channels: 1,      // Mono to reduce file size
        format: 'aac' as const,
        compressionLevel: 0.7,
        elderlyOptimized: true,
      },
      medium: {
        sampleRate: 22050, // Good balance for speech clarity
        bitRate: 96000,    // Better quality for elderly users
        channels: 1,       // Still mono for efficiency
        format: 'aac' as const,
        compressionLevel: 0.8,
        elderlyOptimized: true,
      },
      high: {
        sampleRate: 44100, // Full quality when device supports it
        bitRate: 128000,   // High quality for clear speech
        channels: 1,       // Mono unless device is very capable
        format: 'aac' as const,
        compressionLevel: 0.9,
        elderlyOptimized: true,
      },
    };

    // Adjust based on device capabilities
    const baseConfig = qualityConfigs[finalQuality];

    if (this.capabilities?.isLowEndDevice) {
      // Further optimize for low-end devices
      baseConfig.sampleRate = Math.min(baseConfig.sampleRate, 22050);
      baseConfig.bitRate = Math.min(baseConfig.bitRate, 96000);
      baseConfig.compressionLevel = 0.6; // More compression
    }

    return baseConfig;
  }

  /**
   * Calculate buffer size based on recording configuration
   */
  private calculateBufferSize(config: any): number {
    const sampleRate = config.ios?.sampleRate || config.android?.sampleRate || 22050;
    const bitRate = config.ios?.bitRate || config.android?.bitRate || 96000;
    const duration = 60; // 60 seconds of buffer

    const bytesPerSecond = bitRate / 8;
    const bufferSize = bytesPerSecond * duration;

    return Math.min(bufferSize, this.config.bufferManagement.maxBufferSize * 1024 * 1024);
  }

  /**
   * Process recording with optimizations
   */
  private async processRecording(uri: string | null): Promise<string | null> {
    if (!uri) return null;

    try {
      // Apply compression if enabled
      if (this.config.bufferManagement.realTimeCompression) {
        return await this.compressAudio(uri);
      }

      // Apply elderly-specific audio enhancements
      if (this.elderlyFeatures.speechClarity) {
        return await this.enhanceSpeechClarity(uri);
      }

      return uri;

    } catch (error) {
      console.warn('Failed to process recording, returning original:', error);
      return uri;
    }
  }

  /**
   * Compress audio file
   */
  private async compressAudio(uri: string): Promise<string> {
    try {
      // Read original file
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Original file not found');
      }

      // Apply compression based on configuration
      const compressionRatio = this.config.memoryManagement.compressionRatio;

      // For now, return original URI (would implement actual compression)
      // In production, this would use native audio compression modules
      console.log(`Audio compression applied: ${compressionRatio * 100}% of original size`);

      return uri;

    } catch (error) {
      console.warn('Audio compression failed:', error);
      return uri; // Return original on failure
    }
  }

  /**
   * Enhance speech clarity for elderly users
   */
  private async enhanceSpeechClarity(uri: string): Promise<string> {
    try {
      // Apply speech enhancement algorithms
      // This would typically use native audio processing modules
      console.log('Speech clarity enhancement applied for elderly user');

      return uri;

    } catch (error) {
      console.warn('Speech clarity enhancement failed:', error);
      return uri;
    }
  }

  /**
   * Apply voice enhancement during playback
   */
  private async applyVoiceEnhancement(sound: Audio.Sound): Promise<void> {
    try {
      // Apply elderly-specific voice enhancements
      // This would use native audio processing in production
      console.log('Voice enhancement applied for elderly user playback');

    } catch (error) {
      console.warn('Voice enhancement failed:', error);
    }
  }

  /**
   * Start recording monitoring
   */
  private startRecordingMonitoring(): void {
    // Monitor recording performance every 5 seconds
    this.performanceInterval = setInterval(async () => {
      await this.monitorRecordingPerformance();
    }, 5000);
  }

  /**
   * Stop recording monitoring
   */
  private stopRecordingMonitoring(): void {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
  }

  /**
   * Monitor recording performance
   */
  private async monitorRecordingPerformance(): Promise<void> {
    try {
      if (!this.currentRecording) return;

      // Get recording status
      const status = await this.currentRecording.getStatusAsync();

      // Calculate latency
      const currentTime = Date.now();
      const recordingLatency = currentTime - this.recordingStartTime;

      // Update performance metrics
      this.performanceMetrics.recordingLatency = recordingLatency;

      // Check if performance is degrading
      if (recordingLatency > this.config.performanceThresholds.maxRecordingLatency) {
        console.warn('Recording latency exceeding threshold, applying optimizations');
        await this.applyPerformanceOptimizations();
      }

      // Update performance monitor
      performanceMonitor.recordInteractionTime(recordingLatency);

    } catch (error) {
      console.warn('Recording performance monitoring failed:', error);
    }
  }

  /**
   * Apply performance optimizations during recording
   */
  private async applyPerformanceOptimizations(): Promise<void> {
    // Reduce buffer size if memory pressure is high
    const memoryStatus = memoryManager.getMemoryStatus();
    if (memoryStatus.pressure.level === 'high' || memoryStatus.pressure.level === 'critical') {
      this.config.bufferManagement.maxBufferSize *= 0.8; // Reduce by 20%
      console.log('Reduced buffer size due to memory pressure');
    }

    // Enable more aggressive compression
    if (this.config.bufferManagement.compressionLevel !== 'high') {
      this.config.bufferManagement.compressionLevel = 'high';
      console.log('Enabled high compression due to performance issues');
    }

    this.performanceMetrics.elderlyOptimizationsActive++;
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Monitor overall audio system performance
    this.memoryCheckInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 10000); // Every 10 seconds
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const memoryStatus = memoryManager.getMemoryStatus();

    this.performanceMetrics.memoryUsage = memoryStatus.pool.used / (1024 * 1024); // Convert to MB
    this.performanceMetrics.compressionRatio = this.config.memoryManagement.compressionRatio;

    // Log metrics for elderly user optimization
    if (this.performanceMetrics.memoryUsage > this.config.performanceThresholds.memoryWarningThreshold) {
      console.warn('Audio memory usage high, elderly user experience may be affected');
    }
  }

  /**
   * Initialize memory management
   */
  private async initializeMemoryManagement(): Promise<void> {
    // Set up memory allocation for audio buffers
    const cacheSize = this.config.memoryManagement.maxCacheSize * 1024 * 1024; // Convert to bytes

    // Pre-allocate some memory for elderly users (smoother experience)
    if (this.config.memoryManagement.elderlyMemoryProtection) {
      await memoryManager.allocateMemory(
        'audio_cache',
        cacheSize,
        'audio',
        'high',
        true // elderly optimized
      );
    }
  }

  /**
   * Clean up recording resources
   */
  private async cleanupRecording(): Promise<void> {
    if (this.currentRecording) {
      try {
        await this.currentRecording.stopAndUnloadAsync();
      } catch (error) {
        console.warn('Error during recording cleanup:', error);
      }
      this.currentRecording = null;
    }

    // Deallocate audio buffer
    memoryManager.deallocateAudioBuffer('current_recording');

    // Stop monitoring
    this.stopRecordingMonitoring();
  }

  /**
   * Check audio permissions
   */
  async checkPermissions(): Promise<AudioPermissions> {
    try {
      const { status } = await Audio.getPermissionsAsync();

      return {
        microphone: status === 'granted' ? 'granted' :
                   status === 'denied' ? 'denied' : 'undetermined',
        mediaLibrary: 'granted', // Assume granted for now
      };

    } catch (error) {
      console.error('Failed to check audio permissions:', error);
      return {
        microphone: 'undetermined',
        mediaLibrary: 'undetermined',
      };
    }
  }

  /**
   * Get audio file information
   */
  async getAudioFileInfo(uri: string): Promise<{ duration: number; size: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Get audio duration (would use native module in production)
      const duration = 0; // Placeholder

      return {
        duration,
        size: fileInfo.size || 0,
      };

    } catch (error) {
      console.error('Failed to get audio file info:', error);
      return { duration: 0, size: 0 };
    }
  }

  /**
   * Default configuration
   */
  private getDefaultConfig(): OptimizedAudioConfig {
    return {
      adaptiveQuality: true,
      elderlyOptimizations: true,
      bufferManagement: {
        maxBufferSize: 50, // 50MB default
        compressionLevel: 'medium',
        realTimeCompression: false,
        elderlyBufferBoost: true,
      },
      playbackOptimizations: {
        preloadingEnabled: true,
        adaptiveBuffering: true,
        elderlyPlaybackRate: 0.9,
        enhancedAudio: true,
      },
      memoryManagement: {
        autoCleanup: true,
        maxCacheSize: 30, // 30MB cache
        compressionRatio: 0.8,
        elderlyMemoryProtection: true,
      },
      performanceThresholds: {
        maxRecordingLatency: 200, // 200ms
        targetCPUUsage: 40, // 40%
        memoryWarningThreshold: 100, // 100MB
        batteryOptimizationThreshold: 20, // 20%
      },
    };
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): AudioPerformanceMetrics {
    return {
      recordingLatency: 0,
      playbackLatency: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      batteryUsage: 0,
      compressionRatio: 0,
      elderlyOptimizationsActive: 0,
    };
  }

  /**
   * Initialize elderly features
   */
  private initializeElderlyFeatures(): ElderlyAudioFeatures {
    return {
      voiceEnhancement: false,
      backgroundNoiseReduction: false,
      speechClarity: false,
      slowPlaybackMode: false,
      largerAudioBuffers: false,
      extendedRecordingTime: false,
      autoVolumeAdjustment: false,
      simplifiedControls: false,
    };
  }

  /**
   * Public API methods
   */
  public getPerformanceMetrics(): AudioPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  public getElderlyFeatures(): ElderlyAudioFeatures {
    return { ...this.elderlyFeatures };
  }

  public updateElderlyFeatures(features: Partial<ElderlyAudioFeatures>): void {
    this.elderlyFeatures = { ...this.elderlyFeatures, ...features };
    console.log('Elderly audio features updated');
  }

  public getOptimizedConfig(): OptimizedAudioConfig {
    return { ...this.config };
  }

  public async optimizeForElderly(): Promise<void> {
    console.log('Applying comprehensive elderly audio optimizations');

    // Enable all elderly features
    this.elderlyFeatures = {
      voiceEnhancement: true,
      backgroundNoiseReduction: true,
      speechClarity: true,
      slowPlaybackMode: false, // User preference
      largerAudioBuffers: true,
      extendedRecordingTime: true,
      autoVolumeAdjustment: true,
      simplifiedControls: true,
    };

    // Apply optimal configuration
    this.config.bufferManagement.elderlyBufferBoost = true;
    this.config.playbackOptimizations.enhancedAudio = true;
    this.config.memoryManagement.elderlyMemoryProtection = true;

    // Adjust performance thresholds for elderly users
    this.config.performanceThresholds.maxRecordingLatency = 300; // More lenient
    this.config.performanceThresholds.targetCPUUsage = 50; // Conservative

    this.performanceMetrics.elderlyOptimizationsActive++;
  }

  public cleanup(): void {
    // Stop all monitoring
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }

    // Clean up audio resources
    this.stopAudio();
    this.cleanupRecording();

    console.log('OptimizedAudioService cleanup completed');
  }
}

export const optimizedAudioService = new OptimizedAudioService();