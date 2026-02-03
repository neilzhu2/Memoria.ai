/**
 * Performance Optimizer for Memoria.ai
 * Optimizes real-time transcription performance for elderly users on older devices
 */

import { Platform, Dimensions } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceCapabilities {
  isLowEndDevice: boolean;
  memoryConstraints: 'low' | 'medium' | 'high';
  processingPower: 'low' | 'medium' | 'high';
  recommendedUpdateInterval: number;
  recommendedBufferSize: number;
  shouldReduceAnimations: boolean;
  shouldLimitConcurrentOperations: boolean;
  maxDisplayLines: number;
  recommendedFontSize: number;
}

export interface PerformanceConfig {
  updateInterval: number;
  bufferSize: number;
  enableAnimations: boolean;
  enableRealTimeUpdates: boolean;
  textProcessingDelay: number;
  maxConcurrentOperations: number;
  memoryThreshold: number;
  enableDebouncing: boolean;
  debounceDelay: number;
}

export class PerformanceOptimizer {
  private deviceCapabilities: DeviceCapabilities;
  private performanceConfig: PerformanceConfig;
  private memoryUsageHistory: number[] = [];
  private performanceMetrics: {
    averageUpdateTime: number;
    frameDropCount: number;
    memoryPressureEvents: number;
    transcriptionLatency: number;
  };

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.performanceConfig = this.generateOptimalConfig();
    this.performanceMetrics = {
      averageUpdateTime: 0,
      frameDropCount: 0,
      memoryPressureEvents: 0,
      transcriptionLatency: 0,
    };

    this.startPerformanceMonitoring();
  }

  /**
   * Detect device capabilities for elderly users
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const screenSize = width * height;
    const isTablet = Math.min(width, height) >= 768;

    // Detect low-end devices based on multiple factors
    const isLowEndDevice = this.isLowEndDevice();

    // Memory constraints estimation
    const memoryConstraints = this.estimateMemoryConstraints();

    // Processing power estimation
    const processingPower = this.estimateProcessingPower();

    // Optimize for elderly users - more conservative settings
    const recommendedUpdateInterval = isLowEndDevice ? 1000 : 500; // Slower updates for stability
    const recommendedBufferSize = isLowEndDevice ? 5 : 10; // Smaller buffer for memory
    const shouldReduceAnimations = isLowEndDevice || Platform.OS === 'android';
    const shouldLimitConcurrentOperations = isLowEndDevice;
    const maxDisplayLines = isTablet ? 15 : (isLowEndDevice ? 8 : 12);
    const recommendedFontSize = isTablet ? 20 : (isLowEndDevice ? 16 : 18);

    return {
      isLowEndDevice,
      memoryConstraints,
      processingPower,
      recommendedUpdateInterval,
      recommendedBufferSize,
      shouldReduceAnimations,
      shouldLimitConcurrentOperations,
      maxDisplayLines,
      recommendedFontSize,
    };
  }

  /**
   * Check if device is low-end based on various factors
   */
  private isLowEndDevice(): boolean {
    // Platform-specific checks
    if (Platform.OS === 'android') {
      // Android-specific low-end device detection
      return this.isLowEndAndroid();
    } else {
      // iOS-specific low-end device detection
      return this.isLowEndIOS();
    }
  }

  /**
   * Detect low-end Android devices
   */
  private isLowEndAndroid(): boolean {
    // Check for common indicators of low-end Android devices
    const { width, height } = Dimensions.get('window');
    const screenDensity = Dimensions.get('window').scale;
    const screenSize = width * height;

    // Low resolution screens
    if (screenSize < 1000000) return true; // Less than ~1MP screen

    // Low density screens (older devices)
    if (screenDensity < 2) return true;

    // Memory pressure indicators (would need native module for accurate detection)
    // For now, assume devices with small screens are lower-end
    if (Math.min(width, height) < 320) return true;

    return false;
  }

  /**
   * Detect low-end iOS devices
   */
  private isLowEndIOS(): boolean {
    // iOS device detection would typically use device model
    // For now, use screen size as indicator
    const { width, height } = Dimensions.get('window');
    const screenSize = width * height;

    // Older iPhones and iPads with smaller screens
    if (screenSize < 800000) return true; // Roughly iPhone 6 and below

    return false;
  }

  /**
   * Estimate memory constraints
   */
  private estimateMemoryConstraints(): 'low' | 'medium' | 'high' {
    if (this.deviceCapabilities?.isLowEndDevice) return 'low';

    const { width, height } = Dimensions.get('window');
    const screenSize = width * height;

    if (screenSize > 2000000) return 'high'; // High-res tablets
    if (screenSize > 1000000) return 'medium'; // Standard phones
    return 'low'; // Older/smaller devices
  }

  /**
   * Estimate processing power
   */
  private estimateProcessingPower(): 'low' | 'medium' | 'high' {
    if (this.deviceCapabilities?.isLowEndDevice) return 'low';

    // Use screen density and size as proxy for processing power
    const { scale } = Dimensions.get('window');
    const { width, height } = Dimensions.get('window');

    if (scale >= 3 && width * height > 1500000) return 'high';
    if (scale >= 2 && width * height > 800000) return 'medium';
    return 'low';
  }

  /**
   * Generate optimal configuration based on device capabilities
   */
  private generateOptimalConfig(): PerformanceConfig {
    const caps = this.deviceCapabilities;

    return {
      updateInterval: caps.recommendedUpdateInterval,
      bufferSize: caps.recommendedBufferSize,
      enableAnimations: !caps.shouldReduceAnimations,
      enableRealTimeUpdates: caps.processingPower !== 'low',
      textProcessingDelay: caps.isLowEndDevice ? 100 : 50,
      maxConcurrentOperations: caps.shouldLimitConcurrentOperations ? 2 : 4,
      memoryThreshold: caps.memoryConstraints === 'low' ? 50 : 100, // MB
      enableDebouncing: caps.isLowEndDevice,
      debounceDelay: caps.isLowEndDevice ? 300 : 150,
    };
  }

  /**
   * Start performance monitoring for elderly users
   */
  private startPerformanceMonitoring(): void {
    // Monitor memory usage periodically
    setInterval(() => {
      this.monitorMemoryUsage();
    }, 5000); // Check every 5 seconds

    // Monitor frame drops (simplified detection)
    this.monitorFrameRate();
  }

  /**
   * Monitor memory usage
   */
  private monitorMemoryUsage(): void {
    // In a real implementation, this would use native modules to get actual memory usage
    // For now, we'll simulate based on app state and usage patterns

    const estimatedMemoryUsage = this.estimateMemoryUsage();
    this.memoryUsageHistory.push(estimatedMemoryUsage);

    // Keep only last 10 readings
    if (this.memoryUsageHistory.length > 10) {
      this.memoryUsageHistory.shift();
    }

    // Check for memory pressure
    if (estimatedMemoryUsage > this.performanceConfig.memoryThreshold) {
      this.handleMemoryPressure();
    }
  }

  /**
   * Estimate current memory usage
   */
  private estimateMemoryUsage(): number {
    // Simplified estimation based on app activity
    // In reality, this would use native memory APIs
    const baseUsage = 30; // Base app memory usage in MB
    const transcriptionUsage = 20; // Estimated transcription memory usage
    const uiUsage = 15; // UI and animations memory usage

    return baseUsage + transcriptionUsage + uiUsage;
  }

  /**
   * Handle memory pressure for elderly users
   */
  private handleMemoryPressure(): void {
    console.warn('Memory pressure detected - applying optimizations for elderly users');

    this.performanceMetrics.memoryPressureEvents++;

    // Reduce update frequency
    this.performanceConfig.updateInterval = Math.max(
      this.performanceConfig.updateInterval * 1.5,
      1000
    );

    // Reduce buffer size
    this.performanceConfig.bufferSize = Math.max(
      Math.floor(this.performanceConfig.bufferSize * 0.8),
      3
    );

    // Disable animations
    this.performanceConfig.enableAnimations = false;

    // Enable more aggressive debouncing
    this.performanceConfig.enableDebouncing = true;
    this.performanceConfig.debounceDelay = Math.min(
      this.performanceConfig.debounceDelay * 1.2,
      500
    );
  }

  /**
   * Monitor frame rate (simplified)
   */
  private monitorFrameRate(): void {
    let lastFrameTime = Date.now();
    let frameCount = 0;

    const checkFrameRate = () => {
      const now = Date.now();
      frameCount++;

      if (now - lastFrameTime > 1000) { // Check every second
        const fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;

        // Detect frame drops for elderly users (be more conservative)
        if (fps < 45) { // Lower threshold for elderly users
          this.handleFrameDrops();
        }
      }

      requestAnimationFrame(checkFrameRate);
    };

    requestAnimationFrame(checkFrameRate);
  }

  /**
   * Handle frame drops
   */
  private handleFrameDrops(): void {
    console.warn('Frame drops detected - optimizing for elderly users');

    this.performanceMetrics.frameDropCount++;

    // Reduce animation complexity
    this.performanceConfig.enableAnimations = false;

    // Increase update intervals
    this.performanceConfig.updateInterval = Math.min(
      this.performanceConfig.updateInterval * 1.3,
      2000
    );

    // Reduce concurrent operations
    this.performanceConfig.maxConcurrentOperations = Math.max(
      this.performanceConfig.maxConcurrentOperations - 1,
      1
    );
  }

  /**
   * Get optimized transcription configuration for elderly users
   */
  getOptimizedTranscriptionConfig(): {
    updateInterval: number;
    bufferSize: number;
    enableAnimations: boolean;
    maxDisplayLines: number;
    fontSize: number;
    enableDebouncing: boolean;
    debounceDelay: number;
  } {
    return {
      updateInterval: this.performanceConfig.updateInterval,
      bufferSize: this.performanceConfig.bufferSize,
      enableAnimations: this.performanceConfig.enableAnimations,
      maxDisplayLines: this.deviceCapabilities.maxDisplayLines,
      fontSize: this.deviceCapabilities.recommendedFontSize,
      enableDebouncing: this.performanceConfig.enableDebouncing,
      debounceDelay: this.performanceConfig.debounceDelay,
    };
  }

  /**
   * Get device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Apply elderly-specific optimizations
   */
  applyElderlyOptimizations(): void {
    // Increase touch target sizes (handled in UI components)
    // Reduce motion sensitivity
    this.performanceConfig.enableAnimations = false;

    // Increase timeouts for better accessibility
    this.performanceConfig.debounceDelay = Math.max(
      this.performanceConfig.debounceDelay,
      300
    );

    // Reduce cognitive load by limiting updates
    this.performanceConfig.updateInterval = Math.max(
      this.performanceConfig.updateInterval,
      800
    );

    // Ensure text is large enough
    this.deviceCapabilities.recommendedFontSize = Math.max(
      this.deviceCapabilities.recommendedFontSize,
      18
    );
  }

  /**
   * Optimize for battery life (important for elderly users)
   */
  optimizeForBattery(): void {
    // Reduce update frequency
    this.performanceConfig.updateInterval = Math.max(
      this.performanceConfig.updateInterval,
      1000
    );

    // Disable animations
    this.performanceConfig.enableAnimations = false;

    // Reduce concurrent operations
    this.performanceConfig.maxConcurrentOperations = Math.min(
      this.performanceConfig.maxConcurrentOperations,
      2
    );

    // Enable aggressive debouncing
    this.performanceConfig.enableDebouncing = true;
    this.performanceConfig.debounceDelay = Math.max(
      this.performanceConfig.debounceDelay,
      400
    );
  }

  /**
   * Reset optimizations to defaults
   */
  resetOptimizations(): void {
    this.performanceConfig = this.generateOptimalConfig();
  }

  /**
   * Update performance metrics
   */
  updateMetrics(metrics: {
    updateTime?: number;
    transcriptionLatency?: number;
  }): void {
    if (metrics.updateTime) {
      this.performanceMetrics.averageUpdateTime =
        (this.performanceMetrics.averageUpdateTime + metrics.updateTime) / 2;
    }

    if (metrics.transcriptionLatency) {
      this.performanceMetrics.transcriptionLatency =
        (this.performanceMetrics.transcriptionLatency + metrics.transcriptionLatency) / 2;
    }
  }

  /**
   * Check if device should use simplified UI
   */
  shouldUseSimplifiedUI(): boolean {
    return this.deviceCapabilities.isLowEndDevice ||
           this.deviceCapabilities.processingPower === 'low';
  }

  /**
   * Get recommended text processing settings
   */
  getTextProcessingSettings(): {
    maxLength: number;
    chunkSize: number;
    processingDelay: number;
    enableStreamProcessing: boolean;
  } {
    const isLowEnd = this.deviceCapabilities.isLowEndDevice;

    return {
      maxLength: isLowEnd ? 1000 : 2000, // Character limit for processing
      chunkSize: isLowEnd ? 50 : 100, // Characters per processing chunk
      processingDelay: this.performanceConfig.textProcessingDelay,
      enableStreamProcessing: !isLowEnd,
    };
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();