/**
 * Device Capability Service for Memoria.ai
 * Comprehensive hardware detection and capability classification for elderly users on older devices
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DetailedDeviceCapabilities {
  // Hardware Classification
  deviceTier: 'low' | 'medium' | 'high';
  memoryTier: 'low' | 'medium' | 'high';
  cpuTier: 'low' | 'medium' | 'high';
  gpuTier: 'low' | 'medium' | 'high';

  // Specific Capabilities
  estimatedRAM: number; // MB
  estimatedStorage: number; // GB
  screenDensity: number;
  screenSize: 'small' | 'medium' | 'large' | 'tablet';
  processingCores: number;

  // Performance Limitations
  isLowEndDevice: boolean;
  shouldReduceAnimations: boolean;
  shouldLimitConcurrentOperations: boolean;
  shouldUseSimplifiedUI: boolean;
  shouldOptimizeForBattery: boolean;

  // Elderly-Specific Optimizations
  recommendedFontSize: number;
  recommendedTouchTargetSize: number;
  maxDisplayLines: number;
  recommendedAnimationDuration: number;
  shouldEnableHapticFeedback: boolean;

  // Audio-Specific Capabilities
  audioProcessingCapability: 'basic' | 'enhanced' | 'advanced';
  maxRecordingQuality: 'low' | 'medium' | 'high';
  transcriptionLatencyTarget: number; // ms

  // Network and Storage Optimizations
  preferredCompressionLevel: 'low' | 'medium' | 'high';
  shouldUseProgressiveSync: boolean;
  maxCacheSize: number; // MB

  // Performance Targets
  targetFrameRate: number;
  maxMemoryUsage: number; // MB
  batteryOptimizationLevel: 'none' | 'moderate' | 'aggressive';
}

export interface DeviceClassification {
  overall: 'budget' | 'midrange' | 'premium';
  ageEstimate: '0-1' | '1-2' | '2-3' | '3-4' | '4-5' | '5+'; // years
  suitabilityForElderly: 'excellent' | 'good' | 'fair' | 'poor';
  recommendedOptimizations: string[];
}

export interface PerformanceBenchmark {
  startupTime: number;
  memoryUsage: number;
  cpuUsage: number;
  batteryDrain: number;
  frameRate: number;
  audioLatency: number;
  networkLatency: number;
  lastUpdated: number;
}

class DeviceCapabilityService {
  private capabilities: DetailedDeviceCapabilities | null = null;
  private classification: DeviceClassification | null = null;
  private benchmarks: PerformanceBenchmark | null = null;
  private isInitialized = false;

  /**
   * Initialize device capability detection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load cached capabilities if available
      await this.loadCachedCapabilities();

      // Detect current capabilities
      this.capabilities = await this.detectDeviceCapabilities();
      this.classification = this.classifyDevice();

      // Run performance benchmarks if needed
      if (!this.benchmarks || this.shouldUpdateBenchmarks()) {
        this.benchmarks = await this.runPerformanceBenchmarks();
      }

      // Save to cache
      await this.saveCachedCapabilities();

      this.isInitialized = true;
      console.log('DeviceCapabilityService initialized for elderly user optimization');
    } catch (error) {
      console.warn('Failed to initialize DeviceCapabilityService:', error);
      // Fallback to conservative settings
      this.capabilities = this.getConservativeCapabilities();
      this.classification = this.getConservativeClassification();
    }
  }

  /**
   * Comprehensive device capability detection
   */
  private async detectDeviceCapabilities(): Promise<DetailedDeviceCapabilities> {
    const { width, height } = Dimensions.get('window');
    const scale = PixelRatio.get();
    const fontScale = PixelRatio.getFontScale();

    // Basic hardware detection
    const screenSize = this.classifyScreenSize(width, height);
    const screenDensity = scale;
    const estimatedRAM = this.estimateRAM();
    const estimatedStorage = this.estimateStorage();
    const processingCores = this.estimateProcessingCores();

    // Performance tier classification
    const deviceTier = this.classifyDeviceTier(estimatedRAM, screenSize, scale);
    const memoryTier = this.classifyMemoryTier(estimatedRAM);
    const cpuTier = this.classifyCPUTier();
    const gpuTier = this.classifyGPUTier(screenSize, scale);

    // Elderly-specific optimizations
    const isLowEndDevice = deviceTier === 'low' || memoryTier === 'low';
    const shouldReduceAnimations = isLowEndDevice || Platform.OS === 'android' && deviceTier !== 'high';
    const shouldLimitConcurrentOperations = deviceTier === 'low' || memoryTier === 'low';
    const shouldUseSimplifiedUI = isLowEndDevice;
    const shouldOptimizeForBattery = true; // Always optimize for elderly users

    // Font and UI sizing for elderly users
    const baseFont = fontScale > 1 ? 20 : 18; // Respect user's accessibility settings
    const recommendedFontSize = Math.max(baseFont, screenSize === 'tablet' ? 22 : 18);
    const recommendedTouchTargetSize = Math.max(48, screenSize === 'tablet' ? 56 : 48);
    const maxDisplayLines = this.calculateMaxDisplayLines(screenSize, isLowEndDevice);
    const recommendedAnimationDuration = isLowEndDevice ? 150 : 200;
    const shouldEnableHapticFeedback = Platform.OS === 'ios' || deviceTier !== 'low';

    // Audio capabilities
    const audioProcessingCapability = this.classifyAudioCapability(deviceTier, cpuTier);
    const maxRecordingQuality = this.determineMaxRecordingQuality(deviceTier, memoryTier);
    const transcriptionLatencyTarget = isLowEndDevice ? 2000 : 1000;

    // Network and storage optimizations
    const preferredCompressionLevel = memoryTier === 'low' ? 'high' : 'medium';
    const shouldUseProgressiveSync = deviceTier === 'low' || memoryTier === 'low';
    const maxCacheSize = this.calculateMaxCacheSize(estimatedRAM, estimatedStorage);

    // Performance targets
    const targetFrameRate = isLowEndDevice ? 30 : 60;
    const maxMemoryUsage = this.calculateMaxMemoryUsage(estimatedRAM);
    const batteryOptimizationLevel = this.determineBatteryOptimization(deviceTier);

    return {
      deviceTier,
      memoryTier,
      cpuTier,
      gpuTier,
      estimatedRAM,
      estimatedStorage,
      screenDensity,
      screenSize,
      processingCores,
      isLowEndDevice,
      shouldReduceAnimations,
      shouldLimitConcurrentOperations,
      shouldUseSimplifiedUI,
      shouldOptimizeForBattery,
      recommendedFontSize,
      recommendedTouchTargetSize,
      maxDisplayLines,
      recommendedAnimationDuration,
      shouldEnableHapticFeedback,
      audioProcessingCapability,
      maxRecordingQuality,
      transcriptionLatencyTarget,
      preferredCompressionLevel,
      shouldUseProgressiveSync,
      maxCacheSize,
      targetFrameRate,
      maxMemoryUsage,
      batteryOptimizationLevel,
    };
  }

  /**
   * Classify screen size for elderly user optimization
   */
  private classifyScreenSize(width: number, height: number): 'small' | 'medium' | 'large' | 'tablet' {
    const minDimension = Math.min(width, height);
    const maxDimension = Math.max(width, height);

    if (minDimension >= 768) return 'tablet';
    if (maxDimension >= 812 && minDimension >= 375) return 'large'; // iPhone X+ size
    if (maxDimension >= 667 && minDimension >= 375) return 'medium'; // iPhone 6+ size
    return 'small'; // iPhone SE and smaller
  }

  /**
   * Estimate device RAM based on various indicators
   */
  private estimateRAM(): number {
    const { width, height } = Dimensions.get('window');
    const scale = PixelRatio.get();
    const totalPixels = width * height * scale * scale;

    // Rough estimation based on screen resolution and platform
    if (Platform.OS === 'ios') {
      // iOS devices have more predictable memory allocation
      if (totalPixels > 8000000) return 6144; // iPhone 12 Pro+ level
      if (totalPixels > 6000000) return 4096; // iPhone 11+ level
      if (totalPixels > 3000000) return 3072; // iPhone X level
      if (totalPixels > 2000000) return 2048; // iPhone 7+ level
      return 1024; // iPhone 6 and older
    } else {
      // Android has more variation
      if (totalPixels > 8000000) return 8192; // Flagship Android
      if (totalPixels > 6000000) return 6144; // High-end Android
      if (totalPixels > 3000000) return 4096; // Mid-range Android
      if (totalPixels > 2000000) return 3072; // Lower mid-range
      return 2048; // Budget Android
    }
  }

  /**
   * Estimate device storage
   */
  private estimateStorage(): number {
    // Conservative estimation - elderly users often have older devices with less storage
    const ramEstimate = this.estimateRAM();

    if (ramEstimate >= 6144) return 128; // High-end devices
    if (ramEstimate >= 4096) return 64;  // Mid-range devices
    if (ramEstimate >= 3072) return 32;  // Lower mid-range
    return 16; // Budget devices (common among elderly users)
  }

  /**
   * Estimate processing cores
   */
  private estimateProcessingCores(): number {
    const ramEstimate = this.estimateRAM();

    if (ramEstimate >= 6144) return 8; // Modern flagship
    if (ramEstimate >= 4096) return 6; // Mid-range modern
    if (ramEstimate >= 3072) return 4; // Lower mid-range
    return 4; // Budget devices typically have 4 cores
  }

  /**
   * Classify overall device tier
   */
  private classifyDeviceTier(ram: number, screenSize: string, scale: number): 'low' | 'medium' | 'high' {
    // Conservative classification for elderly user devices
    if (ram >= 6144 && screenSize !== 'small' && scale >= 3) return 'high';
    if (ram >= 3072 && screenSize !== 'small' && scale >= 2) return 'medium';
    return 'low';
  }

  /**
   * Classify memory tier
   */
  private classifyMemoryTier(ram: number): 'low' | 'medium' | 'high' {
    if (ram >= 6144) return 'high';
    if (ram >= 3072) return 'medium';
    return 'low';
  }

  /**
   * Classify CPU tier
   */
  private classifyCPUTier(): 'low' | 'medium' | 'high' {
    const ram = this.estimateRAM();
    const cores = this.estimateProcessingCores();

    // Use RAM and core count as proxy for CPU performance
    if (ram >= 6144 && cores >= 8) return 'high';
    if (ram >= 3072 && cores >= 4) return 'medium';
    return 'low';
  }

  /**
   * Classify GPU tier
   */
  private classifyGPUTier(screenSize: string, scale: number): 'low' | 'medium' | 'high' {
    const totalPixels = Dimensions.get('window').width * Dimensions.get('window').height * scale * scale;

    if (totalPixels > 6000000 && Platform.OS === 'ios') return 'high';
    if (totalPixels > 3000000 && screenSize !== 'small') return 'medium';
    return 'low';
  }

  /**
   * Calculate maximum display lines for elderly users
   */
  private calculateMaxDisplayLines(screenSize: string, isLowEnd: boolean): number {
    // Conservative line counts to prevent overwhelm
    if (screenSize === 'tablet') return isLowEnd ? 12 : 15;
    if (screenSize === 'large') return isLowEnd ? 10 : 12;
    if (screenSize === 'medium') return isLowEnd ? 8 : 10;
    return isLowEnd ? 6 : 8; // small screens
  }

  /**
   * Classify audio processing capability
   */
  private classifyAudioCapability(deviceTier: string, cpuTier: string): 'basic' | 'enhanced' | 'advanced' {
    if (deviceTier === 'high' && cpuTier === 'high') return 'advanced';
    if (deviceTier === 'medium' || cpuTier === 'medium') return 'enhanced';
    return 'basic';
  }

  /**
   * Determine maximum recording quality
   */
  private determineMaxRecordingQuality(deviceTier: string, memoryTier: string): 'low' | 'medium' | 'high' {
    // Prioritize reliability over quality for elderly users
    if (deviceTier === 'high' && memoryTier === 'high') return 'high';
    if (deviceTier === 'medium' || memoryTier === 'medium') return 'medium';
    return 'low';
  }

  /**
   * Calculate maximum cache size
   */
  private calculateMaxCacheSize(ram: number, storage: number): number {
    // Conservative cache sizing
    const maxCachePercentage = storage <= 16 ? 0.02 : 0.05; // 2-5% of storage
    const ramBasedLimit = Math.floor(ram * 0.1); // 10% of RAM

    return Math.min(
      Math.floor(storage * 1024 * maxCachePercentage), // Convert GB to MB
      ramBasedLimit,
      200 // Never exceed 200MB cache
    );
  }

  /**
   * Calculate maximum memory usage
   */
  private calculateMaxMemoryUsage(ram: number): number {
    // Conservative memory usage for elderly users' devices
    if (ram >= 6144) return 300; // 300MB for high-end devices
    if (ram >= 3072) return 200; // 200MB for mid-range
    return 150; // 150MB for low-end devices
  }

  /**
   * Determine battery optimization level
   */
  private determineBatteryOptimization(deviceTier: string): 'none' | 'moderate' | 'aggressive' {
    // Always optimize for elderly users, but vary intensity
    if (deviceTier === 'low') return 'aggressive';
    if (deviceTier === 'medium') return 'moderate';
    return 'moderate'; // Even high-end devices should optimize for elderly users
  }

  /**
   * Classify device for elderly user suitability
   */
  private classifyDevice(): DeviceClassification {
    if (!this.capabilities) {
      return this.getConservativeClassification();
    }

    const caps = this.capabilities;

    // Determine overall classification
    let overall: 'budget' | 'midrange' | 'premium';
    if (caps.deviceTier === 'high' && caps.memoryTier === 'high') {
      overall = 'premium';
    } else if (caps.deviceTier === 'medium' || caps.memoryTier === 'medium') {
      overall = 'midrange';
    } else {
      overall = 'budget';
    }

    // Estimate device age based on capabilities
    let ageEstimate: '0-1' | '1-2' | '2-3' | '3-4' | '4-5' | '5+';
    if (caps.estimatedRAM >= 6144 && caps.screenSize !== 'small') {
      ageEstimate = '0-1';
    } else if (caps.estimatedRAM >= 4096) {
      ageEstimate = '1-2';
    } else if (caps.estimatedRAM >= 3072) {
      ageEstimate = '2-3';
    } else if (caps.estimatedRAM >= 2048) {
      ageEstimate = '3-4';
    } else {
      ageEstimate = '5+';
    }

    // Determine suitability for elderly users
    let suitabilityForElderly: 'excellent' | 'good' | 'fair' | 'poor';
    if (caps.screenSize === 'tablet' && !caps.isLowEndDevice) {
      suitabilityForElderly = 'excellent';
    } else if (caps.screenSize === 'large' && caps.deviceTier !== 'low') {
      suitabilityForElderly = 'good';
    } else if (caps.screenSize === 'medium' || caps.deviceTier === 'medium') {
      suitabilityForElderly = 'fair';
    } else {
      suitabilityForElderly = 'poor';
    }

    // Generate recommended optimizations
    const recommendedOptimizations: string[] = [];
    if (caps.isLowEndDevice) {
      recommendedOptimizations.push('Reduce animation complexity');
      recommendedOptimizations.push('Limit concurrent operations');
      recommendedOptimizations.push('Use simplified UI');
    }
    if (caps.shouldOptimizeForBattery) {
      recommendedOptimizations.push('Enable battery optimization');
    }
    if (caps.memoryTier === 'low') {
      recommendedOptimizations.push('Aggressive memory management');
      recommendedOptimizations.push('Reduce cache size');
    }
    if (caps.screenSize === 'small') {
      recommendedOptimizations.push('Increase font sizes');
      recommendedOptimizations.push('Larger touch targets');
    }

    return {
      overall,
      ageEstimate,
      suitabilityForElderly,
      recommendedOptimizations,
    };
  }

  /**
   * Run performance benchmarks
   */
  private async runPerformanceBenchmarks(): Promise<PerformanceBenchmark> {
    const startTime = Date.now();

    // Simulate lightweight benchmarks
    const startupTime = await this.measureStartupTime();
    const memoryUsage = await this.measureMemoryUsage();
    const cpuUsage = await this.measureCPUUsage();
    const batteryDrain = await this.estimateBatteryDrain();
    const frameRate = await this.measureFrameRate();
    const audioLatency = await this.measureAudioLatency();
    const networkLatency = await this.measureNetworkLatency();

    return {
      startupTime,
      memoryUsage,
      cpuUsage,
      batteryDrain,
      frameRate,
      audioLatency,
      networkLatency,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Benchmark methods (simplified implementations)
   */
  private async measureStartupTime(): Promise<number> {
    // This would be measured from app launch to interactive state
    return this.capabilities?.isLowEndDevice ? 2500 : 1500;
  }

  private async measureMemoryUsage(): Promise<number> {
    // Estimated baseline memory usage
    return this.capabilities?.isLowEndDevice ? 80 : 60;
  }

  private async measureCPUUsage(): Promise<number> {
    // Estimated CPU usage percentage during normal operation
    return this.capabilities?.isLowEndDevice ? 25 : 15;
  }

  private async estimateBatteryDrain(): Promise<number> {
    // Estimated battery drain per hour (percentage)
    return this.capabilities?.shouldOptimizeForBattery ? 3 : 5;
  }

  private async measureFrameRate(): Promise<number> {
    return this.capabilities?.targetFrameRate || 30;
  }

  private async measureAudioLatency(): Promise<number> {
    return this.capabilities?.transcriptionLatencyTarget || 1000;
  }

  private async measureNetworkLatency(): Promise<number> {
    // Typical network latency for sync operations
    return 200;
  }

  /**
   * Cache management
   */
  private async loadCachedCapabilities(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem('deviceCapabilities');
      if (cached) {
        const data = JSON.parse(cached);
        this.capabilities = data.capabilities;
        this.classification = data.classification;
        this.benchmarks = data.benchmarks;
      }
    } catch (error) {
      console.warn('Failed to load cached capabilities:', error);
    }
  }

  private async saveCachedCapabilities(): Promise<void> {
    try {
      const data = {
        capabilities: this.capabilities,
        classification: this.classification,
        benchmarks: this.benchmarks,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('deviceCapabilities', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save capabilities to cache:', error);
    }
  }

  private shouldUpdateBenchmarks(): boolean {
    if (!this.benchmarks) return true;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - this.benchmarks.lastUpdated > oneWeek;
  }

  /**
   * Fallback methods for conservative settings
   */
  private getConservativeCapabilities(): DetailedDeviceCapabilities {
    return {
      deviceTier: 'low',
      memoryTier: 'low',
      cpuTier: 'low',
      gpuTier: 'low',
      estimatedRAM: 2048,
      estimatedStorage: 16,
      screenDensity: 2,
      screenSize: 'medium',
      processingCores: 4,
      isLowEndDevice: true,
      shouldReduceAnimations: true,
      shouldLimitConcurrentOperations: true,
      shouldUseSimplifiedUI: true,
      shouldOptimizeForBattery: true,
      recommendedFontSize: 20,
      recommendedTouchTargetSize: 48,
      maxDisplayLines: 8,
      recommendedAnimationDuration: 150,
      shouldEnableHapticFeedback: false,
      audioProcessingCapability: 'basic',
      maxRecordingQuality: 'medium',
      transcriptionLatencyTarget: 2000,
      preferredCompressionLevel: 'high',
      shouldUseProgressiveSync: true,
      maxCacheSize: 50,
      targetFrameRate: 30,
      maxMemoryUsage: 150,
      batteryOptimizationLevel: 'aggressive',
    };
  }

  private getConservativeClassification(): DeviceClassification {
    return {
      overall: 'budget',
      ageEstimate: '3-4',
      suitabilityForElderly: 'fair',
      recommendedOptimizations: [
        'Enable all performance optimizations',
        'Use simplified UI',
        'Optimize for battery life',
        'Reduce memory usage',
      ],
    };
  }

  /**
   * Public API methods
   */
  public getCapabilities(): DetailedDeviceCapabilities | null {
    return this.capabilities;
  }

  public getClassification(): DeviceClassification | null {
    return this.classification;
  }

  public getBenchmarks(): PerformanceBenchmark | null {
    return this.benchmarks;
  }

  public isLowEndDevice(): boolean {
    return this.capabilities?.isLowEndDevice || true; // Default to true for safety
  }

  public getRecommendedSettings() {
    if (!this.capabilities) return null;

    return {
      ui: {
        fontSize: this.capabilities.recommendedFontSize,
        touchTargetSize: this.capabilities.recommendedTouchTargetSize,
        animationDuration: this.capabilities.recommendedAnimationDuration,
        useSimplifiedUI: this.capabilities.shouldUseSimplifiedUI,
        enableAnimations: !this.capabilities.shouldReduceAnimations,
        maxDisplayLines: this.capabilities.maxDisplayLines,
      },
      performance: {
        maxMemoryUsage: this.capabilities.maxMemoryUsage,
        targetFrameRate: this.capabilities.targetFrameRate,
        maxConcurrentOperations: this.capabilities.shouldLimitConcurrentOperations ? 2 : 4,
        enableHapticFeedback: this.capabilities.shouldEnableHapticFeedback,
      },
      audio: {
        processingCapability: this.capabilities.audioProcessingCapability,
        maxRecordingQuality: this.capabilities.maxRecordingQuality,
        latencyTarget: this.capabilities.transcriptionLatencyTarget,
      },
      network: {
        compressionLevel: this.capabilities.preferredCompressionLevel,
        useProgressiveSync: this.capabilities.shouldUseProgressiveSync,
        maxCacheSize: this.capabilities.maxCacheSize,
      },
      battery: {
        optimizationLevel: this.capabilities.batteryOptimizationLevel,
        shouldOptimize: this.capabilities.shouldOptimizeForBattery,
      },
    };
  }

  public async refreshCapabilities(): Promise<void> {
    this.isInitialized = false;
    await this.initialize();
  }
}

export const deviceCapabilityService = new DeviceCapabilityService();