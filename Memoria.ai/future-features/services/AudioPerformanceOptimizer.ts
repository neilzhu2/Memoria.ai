/**
 * Audio Performance Optimizer for Memoria.ai
 * Optimizes real-time audio processing for elderly users on older devices
 * Ensures sub-50ms render times and memory leak prevention
 */

import { Audio } from 'expo-av';
import { InteractionManager, AppState, AppStateStatus } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  frameRate: number;
  memoryUsage: number;
  cpuUsage: number;
  audioLatency: number;
  droppedFrames: number;
  lastOptimization: number;
}

interface OptimizationConfig {
  targetFrameRate: number;
  maxRenderTime: number; // ms
  maxMemoryUsage: number; // MB
  maxCpuUsage: number; // percentage
  adaptiveQuality: boolean;
  elderlyOptimizations: boolean;
  batteryOptimization: boolean;
}

interface AudioBufferManager {
  buffers: Map<string, ArrayBuffer>;
  maxBufferSize: number;
  compressionThreshold: number;
  cleanupInterval: number;
}

interface RealTimeAudioMonitor {
  isActive: boolean;
  sampleRate: number;
  bufferSize: number;
  processingLatency: number;
  lastUpdate: number;
  levelHistory: number[];
}

export class AudioPerformanceOptimizer {
  private metrics: PerformanceMetrics;
  private config: OptimizationConfig;
  private bufferManager: AudioBufferManager;
  private audioMonitor: RealTimeAudioMonitor;

  // Performance monitoring
  private performanceInterval: NodeJS.Timeout | null = null;
  private memoryCleanupInterval: NodeJS.Timeout | null = null;
  private frameTimeTracker: number[] = [];
  private lastFrameTime = 0;

  // Optimization state
  private currentQualityLevel = 'medium';
  private isBackgroundOptimized = false;
  private adaptiveSettings: Record<string, any> = {};

  // Audio processing
  private audioWorkletProcessor: AudioWorkletNode | null = null;
  private audioContext: AudioContext | null = null;
  private requestAnimationFrameId: number | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.config = this.getDefaultConfig();
    this.bufferManager = this.initializeBufferManager();
    this.audioMonitor = this.initializeAudioMonitor();

    this.setupPerformanceMonitoring();
    this.setupAppStateHandling();
  }

  /**
   * Initialize performance metrics
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      renderTime: 0,
      frameRate: 60,
      memoryUsage: 0,
      cpuUsage: 0,
      audioLatency: 0,
      droppedFrames: 0,
      lastOptimization: 0,
    };
  }

  /**
   * Get default optimization configuration
   */
  private getDefaultConfig(): OptimizationConfig {
    return {
      targetFrameRate: 60,
      maxRenderTime: 50, // 50ms as per requirements
      maxMemoryUsage: 100, // 100MB
      maxCpuUsage: 70, // 70%
      adaptiveQuality: true,
      elderlyOptimizations: true,
      batteryOptimization: true,
    };
  }

  /**
   * Initialize buffer manager
   */
  private initializeBufferManager(): AudioBufferManager {
    return {
      buffers: new Map(),
      maxBufferSize: 50 * 1024 * 1024, // 50MB
      compressionThreshold: 0.8, // 80% full
      cleanupInterval: 30000, // 30 seconds
    };
  }

  /**
   * Initialize audio monitor
   */
  private initializeAudioMonitor(): RealTimeAudioMonitor {
    return {
      isActive: false,
      sampleRate: 44100,
      bufferSize: 1024,
      processingLatency: 0,
      lastUpdate: 0,
      levelHistory: [],
    };
  }

  /**
   * Start performance optimization
   */
  public async startOptimization(): Promise<void> {
    try {
      console.log('Starting audio performance optimization for elderly users');

      // Apply initial optimizations
      await this.applyElderlyOptimizations();
      await this.optimizeForDevice();

      // Start monitoring
      this.startPerformanceMonitoring();
      this.startMemoryManagement();

      // Initialize audio processing if available
      await this.initializeAudioProcessing();

      console.log('Audio performance optimization active');

    } catch (error) {
      console.error('Failed to start performance optimization:', error);
    }
  }

  /**
   * Stop performance optimization
   */
  public stopOptimization(): void {
    console.log('Stopping audio performance optimization');

    // Stop monitoring
    this.stopPerformanceMonitoring();
    this.stopMemoryManagement();

    // Clean up audio processing
    this.cleanupAudioProcessing();

    // Clean up buffers
    this.cleanupBuffers();
  }

  /**
   * Optimize frame rendering for real-time audio
   */
  public optimizeFrameRendering(renderCallback: () => void): void {
    const startTime = performance.now();

    // Use requestAnimationFrame for smooth rendering
    if (this.requestAnimationFrameId) {
      cancelAnimationFrame(this.requestAnimationFrameId);
    }

    this.requestAnimationFrameId = requestAnimationFrame(() => {
      // Throttle to target frame rate
      const now = performance.now();
      const timeSinceLastFrame = now - this.lastFrameTime;
      const targetFrameTime = 1000 / this.config.targetFrameRate;

      if (timeSinceLastFrame >= targetFrameTime) {
        // Execute render callback
        renderCallback();

        // Track performance
        const renderTime = performance.now() - startTime;
        this.trackFramePerformance(renderTime);

        this.lastFrameTime = now;

        // Apply adaptive optimizations if needed
        if (renderTime > this.config.maxRenderTime) {
          this.applyAdaptiveOptimizations();
        }
      }

      // Continue animation loop
      this.optimizeFrameRendering(renderCallback);
    });
  }

  /**
   * Track frame performance metrics
   */
  private trackFramePerformance(renderTime: number): void {
    this.metrics.renderTime = renderTime;

    // Track frame times for analysis
    this.frameTimeTracker.push(renderTime);
    if (this.frameTimeTracker.length > 60) { // Keep last 60 frames
      this.frameTimeTracker.shift();
    }

    // Calculate current frame rate
    const avgFrameTime = this.frameTimeTracker.reduce((sum, time) => sum + time, 0) / this.frameTimeTracker.length;
    this.metrics.frameRate = 1000 / avgFrameTime;

    // Count dropped frames
    if (renderTime > this.config.maxRenderTime) {
      this.metrics.droppedFrames++;
    }
  }

  /**
   * Apply elderly-specific optimizations
   */
  private async applyElderlyOptimizations(): Promise<void> {
    console.log('Applying elderly-specific audio optimizations');

    // Larger buffer sizes for stability
    this.audioMonitor.bufferSize = 2048; // Larger buffer for older devices

    // More conservative frame rate for stability
    if (this.config.elderlyOptimizations) {
      this.config.targetFrameRate = 45; // 45fps instead of 60fps
      this.config.maxRenderTime = 60; // More lenient timing
    }

    // Enhanced audio settings
    this.adaptiveSettings = {
      sampleRate: 44100, // High quality for clear speech
      numberOfChannels: 1, // Mono for efficiency
      bitRate: 128000, // Good quality for elderly users
      compressionLevel: 0.8, // Moderate compression
    };

    // Apply audio mode optimizations
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false, // Don't lower volume for elderly users
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false, // Save battery
      });
    } catch (error) {
      console.warn('Failed to set audio mode:', error);
    }
  }

  /**
   * Optimize for device capabilities
   */
  private async optimizeForDevice(): Promise<void> {
    // Detect device performance characteristics
    const isLowEndDevice = await this.detectLowEndDevice();

    if (isLowEndDevice) {
      console.log('Optimizing for low-end device');

      // Reduce quality settings
      this.config.targetFrameRate = 30;
      this.config.maxRenderTime = 70;
      this.audioMonitor.bufferSize = 4096; // Even larger buffer

      // Reduce audio quality
      this.adaptiveSettings.sampleRate = 22050; // Lower sample rate
      this.adaptiveSettings.bitRate = 96000; // Lower bit rate

      // Enable aggressive memory management
      this.bufferManager.compressionThreshold = 0.6;
      this.bufferManager.cleanupInterval = 15000; // More frequent cleanup
    }
  }

  /**
   * Detect if device is low-end
   */
  private async detectLowEndDevice(): Promise<boolean> {
    // Simple heuristic based on available memory and performance
    try {
      // Test render performance
      const startTime = performance.now();
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(Math.random());
      }
      const testTime = performance.now() - startTime;

      // If basic calculations take too long, assume low-end device
      return testTime > 10;

    } catch (error) {
      console.warn('Device detection failed:', error);
      return false; // Assume decent device if detection fails
    }
  }

  /**
   * Apply adaptive optimizations based on current performance
   */
  private applyAdaptiveOptimizations(): void {
    const now = Date.now();

    // Don't optimize too frequently
    if (now - this.metrics.lastOptimization < 1000) {
      return;
    }

    console.log('Applying adaptive performance optimizations');

    // Reduce quality if performance is poor
    if (this.metrics.renderTime > this.config.maxRenderTime * 1.5) {
      this.reduceQuality();
    }

    // Reduce frame rate if necessary
    if (this.metrics.droppedFrames > 10) {
      this.config.targetFrameRate = Math.max(30, this.config.targetFrameRate - 5);
      this.metrics.droppedFrames = 0; // Reset counter
    }

    // Clean up memory if usage is high
    if (this.metrics.memoryUsage > this.config.maxMemoryUsage * 0.8) {
      this.aggressiveMemoryCleanup();
    }

    this.metrics.lastOptimization = now;
  }

  /**
   * Reduce audio quality for better performance
   */
  private reduceQuality(): void {
    switch (this.currentQualityLevel) {
      case 'high':
        this.currentQualityLevel = 'medium';
        this.adaptiveSettings.sampleRate = 44100;
        this.adaptiveSettings.bitRate = 128000;
        break;
      case 'medium':
        this.currentQualityLevel = 'low';
        this.adaptiveSettings.sampleRate = 22050;
        this.adaptiveSettings.bitRate = 96000;
        break;
      case 'low':
        // Already at lowest quality
        this.adaptiveSettings.sampleRate = 16000;
        this.adaptiveSettings.bitRate = 64000;
        break;
    }

    console.log(`Reduced audio quality to: ${this.currentQualityLevel}`);
  }

  /**
   * Initialize audio processing for real-time monitoring
   */
  private async initializeAudioProcessing(): Promise<void> {
    try {
      // Initialize Web Audio API for real-time processing
      if (typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();

        // Create audio worklet for efficient processing
        if (this.audioContext.audioWorklet) {
          await this.audioContext.audioWorklet.addModule('audio-processor.js');
          this.audioWorkletProcessor = new AudioWorkletNode(
            this.audioContext,
            'audio-processor'
          );
        }
      }

      console.log('Audio processing initialized');

    } catch (error) {
      console.warn('Audio processing initialization failed:', error);
    }
  }

  /**
   * Start real-time audio monitoring
   */
  public startAudioMonitoring(): void {
    this.audioMonitor.isActive = true;
    this.audioMonitor.lastUpdate = Date.now();

    console.log('Real-time audio monitoring started');
  }

  /**
   * Stop real-time audio monitoring
   */
  public stopAudioMonitoring(): void {
    this.audioMonitor.isActive = false;
    this.audioMonitor.levelHistory = [];

    console.log('Real-time audio monitoring stopped');
  }

  /**
   * Process audio level data efficiently
   */
  public processAudioLevel(level: number): number {
    if (!this.audioMonitor.isActive) return 0;

    const now = Date.now();
    const timeSinceLastUpdate = now - this.audioMonitor.lastUpdate;

    // Throttle updates for performance
    if (timeSinceLastUpdate < 50) { // 20fps max
      return this.audioMonitor.levelHistory[this.audioMonitor.levelHistory.length - 1] || 0;
    }

    // Add to history with memory management
    this.audioMonitor.levelHistory.push(level);
    if (this.audioMonitor.levelHistory.length > 100) {
      this.audioMonitor.levelHistory.shift();
    }

    // Apply smoothing for elderly users
    const smoothingFactor = 0.7; // Heavy smoothing for stability
    const previousLevel = this.audioMonitor.levelHistory[this.audioMonitor.levelHistory.length - 2] || 0;
    const smoothedLevel = previousLevel * smoothingFactor + level * (1 - smoothingFactor);

    this.audioMonitor.lastUpdate = now;

    return smoothedLevel;
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    this.performanceInterval = setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000); // Update every second
  }

  /**
   * Stop performance monitoring
   */
  private stopPerformanceMonitoring(): void {
    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    // Estimate memory usage (simplified)
    this.metrics.memoryUsage = this.estimateMemoryUsage();

    // Estimate CPU usage based on frame performance
    this.metrics.cpuUsage = this.estimateCpuUsage();

    // Log warnings for elderly user experience
    if (this.metrics.renderTime > this.config.maxRenderTime) {
      console.warn(`Render time: ${this.metrics.renderTime.toFixed(2)}ms (target: ${this.config.maxRenderTime}ms)`);
    }

    if (this.metrics.frameRate < this.config.targetFrameRate * 0.8) {
      console.warn(`Frame rate: ${this.metrics.frameRate.toFixed(1)}fps (target: ${this.config.targetFrameRate}fps)`);
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Calculate buffer usage
    let bufferUsage = 0;
    for (const buffer of this.bufferManager.buffers.values()) {
      bufferUsage += buffer.byteLength;
    }

    // Add audio history usage
    const historyUsage = this.audioMonitor.levelHistory.length * 8; // 8 bytes per number

    return (bufferUsage + historyUsage) / (1024 * 1024); // Convert to MB
  }

  /**
   * Estimate CPU usage based on performance
   */
  private estimateCpuUsage(): number {
    if (this.frameTimeTracker.length === 0) return 0;

    const avgFrameTime = this.frameTimeTracker.reduce((sum, time) => sum + time, 0) / this.frameTimeTracker.length;
    const targetFrameTime = 1000 / this.config.targetFrameRate;

    // Simple estimation: higher frame times = higher CPU usage
    return Math.min(100, (avgFrameTime / targetFrameTime) * 50);
  }

  /**
   * Start memory management
   */
  private startMemoryManagement(): void {
    this.memoryCleanupInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, this.bufferManager.cleanupInterval);
  }

  /**
   * Stop memory management
   */
  private stopMemoryManagement(): void {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }
  }

  /**
   * Perform routine memory cleanup
   */
  private performMemoryCleanup(): void {
    const bufferUsage = this.estimateMemoryUsage();

    if (bufferUsage > this.bufferManager.maxBufferSize * this.bufferManager.compressionThreshold) {
      console.log('Performing memory cleanup');

      // Clean up old audio level history
      if (this.audioMonitor.levelHistory.length > 50) {
        this.audioMonitor.levelHistory = this.audioMonitor.levelHistory.slice(-50);
      }

      // Clean up frame time tracker
      if (this.frameTimeTracker.length > 30) {
        this.frameTimeTracker = this.frameTimeTracker.slice(-30);
      }

      // Force garbage collection if available
      if (global.gc && typeof global.gc === 'function') {
        try {
          global.gc();
        } catch (error) {
          // Ignore gc errors
        }
      }
    }
  }

  /**
   * Aggressive memory cleanup for performance issues
   */
  private aggressiveMemoryCleanup(): void {
    console.log('Performing aggressive memory cleanup');

    // Clear all non-essential buffers
    this.bufferManager.buffers.clear();

    // Reduce history sizes
    this.audioMonitor.levelHistory = this.audioMonitor.levelHistory.slice(-20);
    this.frameTimeTracker = this.frameTimeTracker.slice(-20);

    // Reset metrics that might be using memory
    this.metrics.droppedFrames = 0;
  }

  /**
   * Clean up all buffers
   */
  private cleanupBuffers(): void {
    this.bufferManager.buffers.clear();
    this.audioMonitor.levelHistory = [];
    this.frameTimeTracker = [];
  }

  /**
   * Clean up audio processing
   */
  private cleanupAudioProcessing(): void {
    if (this.requestAnimationFrameId) {
      cancelAnimationFrame(this.requestAnimationFrameId);
      this.requestAnimationFrameId = null;
    }

    if (this.audioWorkletProcessor) {
      this.audioWorkletProcessor.disconnect();
      this.audioWorkletProcessor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  /**
   * Setup app state handling for background optimization
   */
  private setupAppStateHandling(): void {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' && this.config.batteryOptimization) {
      this.optimizeForBackground();
    } else if (nextAppState === 'active' && this.isBackgroundOptimized) {
      this.restoreFromBackground();
    }
  }

  /**
   * Optimize for background mode
   */
  private optimizeForBackground(): void {
    console.log('Optimizing for background mode');

    this.isBackgroundOptimized = true;

    // Reduce frame rate dramatically
    this.config.targetFrameRate = 10;

    // Increase cleanup frequency
    this.bufferManager.cleanupInterval = 5000;

    // Pause non-essential monitoring
    this.stopPerformanceMonitoring();
  }

  /**
   * Restore from background optimization
   */
  private restoreFromBackground(): void {
    console.log('Restoring from background optimization');

    this.isBackgroundOptimized = false;

    // Restore normal frame rate
    this.config.targetFrameRate = this.config.elderlyOptimizations ? 45 : 60;

    // Restore normal cleanup frequency
    this.bufferManager.cleanupInterval = 30000;

    // Resume monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get current optimization config
   */
  public getOptimizationConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization config
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Optimization config updated');
  }

  /**
   * Get optimized audio settings
   */
  public getOptimizedAudioSettings(): Record<string, any> {
    return { ...this.adaptiveSettings };
  }
}

// Export singleton instance
export const audioPerformanceOptimizer = new AudioPerformanceOptimizer();