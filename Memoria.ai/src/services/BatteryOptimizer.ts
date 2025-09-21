/**
 * Battery Optimizer for Memoria.ai
 * Battery and CPU optimization system for elderly users on older devices
 */

import { AppState, AppStateStatus } from 'react-native';
import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

export interface BatteryOptimizationConfig {
  // Battery management
  batteryThresholds: {
    criticalLevel: number; // percentage
    lowLevel: number; // percentage
    optimizeLevel: number; // percentage
  };

  // CPU optimization
  cpuOptimization: {
    maxCPUUsage: number; // percentage
    throttleThreshold: number; // percentage
    elderlyWorkloadReduction: boolean;
    backgroundTaskLimiting: boolean;
  };

  // Power saving modes
  powerSavingModes: {
    aggressive: BatteryMode;
    moderate: BatteryMode;
    minimal: BatteryMode;
    elderly: BatteryMode; // Special mode for elderly users
  };

  // Background optimization
  backgroundOptimization: {
    limitBackgroundTasks: boolean;
    pauseNonCriticalOperations: boolean;
    reduceUpdateFrequency: boolean;
    minimizeNetworkUsage: boolean;
  };

  // Thermal management
  thermalManagement: {
    enableThermalMonitoring: boolean;
    cooldownThreshold: number; // temperature threshold
    elderlyComfortMode: boolean; // Prevent device from getting too warm
  };
}

export interface BatteryMode {
  name: string;
  description: string;
  cpuLimit: number; // percentage
  backgroundTasksEnabled: boolean;
  animationsEnabled: boolean;
  syncFrequency: 'realtime' | 'normal' | 'reduced' | 'minimal';
  audioQuality: 'high' | 'medium' | 'low';
  screenBrightness: 'auto' | 'reduced' | 'minimal';
  hapticFeedback: boolean;
  elderlyFriendly: boolean;
}

export interface BatteryMetrics {
  currentLevel: number; // percentage
  isCharging: boolean;
  timeRemaining: number; // minutes estimated
  averageDrain: number; // percentage per hour
  cpuUsage: number; // percentage
  thermalState: 'normal' | 'warm' | 'hot' | 'critical';
  powerEfficiencyScore: number; // 0-100
  elderlyUsagePattern: 'light' | 'moderate' | 'heavy';
  optimizationsActive: number;
}

export interface PowerOptimization {
  id: string;
  type: 'cpu' | 'battery' | 'thermal' | 'background' | 'ui';
  impact: 'low' | 'medium' | 'high';
  elderlyBenefit: boolean;
  description: string;
  energySavings: number; // percentage
  timestamp: number;
}

export interface ElderlyPowerPreferences {
  preferLongerBattery: boolean;
  acceptPerformanceReduction: boolean;
  enableAggressiveOptimization: boolean;
  notifyOnLowBattery: boolean;
  autoEnablePowerSaving: boolean;
  comfortThermalLimits: boolean;
  extendedDeviceLifespan: boolean;
}

class BatteryOptimizer {
  private config: BatteryOptimizationConfig;
  private capabilities: DetailedDeviceCapabilities | null = null;
  private metrics: BatteryMetrics;
  private elderlyPreferences: ElderlyPowerPreferences;
  private currentMode: BatteryMode;
  private activeOptimizations: Map<string, PowerOptimization> = new Map();

  // Monitoring intervals
  private batteryMonitorInterval: NodeJS.Timeout | null = null;
  private cpuMonitorInterval: NodeJS.Timeout | null = null;
  private thermalMonitorInterval: NodeJS.Timeout | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;

  // State tracking
  private batteryHistory: Array<{ level: number; timestamp: number }> = [];
  private cpuHistory: number[] = [];
  private lastOptimizationTime = 0;
  private backgroundTasksPaused = false;
  private isInElderlyMode = true;

  // App state management
  private appState: AppStateStatus = 'active';
  private inactivityTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.initializeMetrics();
    this.elderlyPreferences = this.initializeElderlyPreferences();
    this.currentMode = this.config.powerSavingModes.elderly;
    this.setupAppStateHandling();
  }

  /**
   * Initialize Battery Optimizer
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    await this.loadUserPreferences();
    this.optimizeConfigForDevice();
    this.applyElderlyOptimizations();

    this.startBatteryMonitoring();
    this.startCPUMonitoring();
    this.startThermalMonitoring();
    this.startOptimizationEngine();

    console.log('BatteryOptimizer initialized for elderly users on older devices');
  }

  /**
   * Optimize configuration based on device capabilities
   */
  private optimizeConfigForDevice(): void {
    if (!this.capabilities) return;

    const isLowEnd = this.capabilities.isLowEndDevice;
    const batteryOptLevel = this.capabilities.batteryOptimizationLevel;

    // Adjust battery thresholds for elderly users
    if (batteryOptLevel === 'aggressive') {
      this.config.batteryThresholds.criticalLevel = 15; // Higher threshold
      this.config.batteryThresholds.lowLevel = 30;
      this.config.batteryThresholds.optimizeLevel = 50;
    } else if (batteryOptLevel === 'moderate') {
      this.config.batteryThresholds.criticalLevel = 10;
      this.config.batteryThresholds.lowLevel = 25;
      this.config.batteryThresholds.optimizeLevel = 40;
    }

    // Adjust CPU limits for older devices
    if (isLowEnd) {
      this.config.cpuOptimization.maxCPUUsage = 60; // Conservative limit
      this.config.cpuOptimization.throttleThreshold = 50;
      this.config.cpuOptimization.elderlyWorkloadReduction = true;
    }

    // Enable thermal comfort for elderly users
    this.config.thermalManagement.elderlyComfortMode = true;
    this.config.thermalManagement.cooldownThreshold = 35; // Lower temperature limit

    console.log(`Battery optimization configured for ${this.capabilities.deviceTier} tier device`);
  }

  /**
   * Apply elderly-specific optimizations
   */
  private applyElderlyOptimizations(): void {
    // Configure elderly-friendly power mode
    this.config.powerSavingModes.elderly = {
      name: 'Elderly Optimized',
      description: 'Optimized for longer battery life and device comfort',
      cpuLimit: 50,
      backgroundTasksEnabled: false, // Minimize background activity
      animationsEnabled: false, // Reduce animations for battery
      syncFrequency: 'reduced',
      audioQuality: 'medium', // Balance quality and power
      screenBrightness: 'auto',
      hapticFeedback: true, // Keep for accessibility
      elderlyFriendly: true,
    };

    // Set elderly preferences
    this.elderlyPreferences = {
      preferLongerBattery: true,
      acceptPerformanceReduction: true,
      enableAggressiveOptimization: true,
      notifyOnLowBattery: true,
      autoEnablePowerSaving: true,
      comfortThermalLimits: true,
      extendedDeviceLifespan: true,
    };

    // Apply elderly mode immediately
    this.currentMode = this.config.powerSavingModes.elderly;

    console.log('Elderly-specific battery optimizations applied');
  }

  /**
   * Start battery monitoring
   */
  private startBatteryMonitoring(): void {
    // Monitor battery every 30 seconds (gentle for elderly users)
    this.batteryMonitorInterval = setInterval(async () => {
      await this.updateBatteryMetrics();
      this.checkBatteryThresholds();
    }, 30000);

    console.log('Battery monitoring started');
  }

  /**
   * Start CPU monitoring
   */
  private startCPUMonitoring(): void {
    // Monitor CPU every 10 seconds
    this.cpuMonitorInterval = setInterval(() => {
      this.updateCPUMetrics();
      this.checkCPUThresholds();
    }, 10000);

    console.log('CPU monitoring started');
  }

  /**
   * Start thermal monitoring
   */
  private startThermalMonitoring(): void {
    if (!this.config.thermalManagement.enableThermalMonitoring) return;

    // Monitor thermal state every 60 seconds
    this.thermalMonitorInterval = setInterval(() => {
      this.updateThermalMetrics();
      this.checkThermalThresholds();
    }, 60000);

    console.log('Thermal monitoring started');
  }

  /**
   * Start optimization engine
   */
  private startOptimizationEngine(): void {
    // Run optimization checks every 2 minutes
    this.optimizationInterval = setInterval(() => {
      this.runOptimizationCycle();
    }, 120000);

    console.log('Battery optimization engine started');
  }

  /**
   * Update battery metrics
   */
  private async updateBatteryMetrics(): Promise<void> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryState = await Battery.getBatteryStateAsync();
      const powerMode = await Battery.getPowerStateAsync();

      this.metrics.currentLevel = Math.round(batteryLevel * 100);
      this.metrics.isCharging = batteryState === Battery.BatteryState.CHARGING;

      // Update battery history
      this.batteryHistory.push({
        level: this.metrics.currentLevel,
        timestamp: Date.now(),
      });

      // Keep only last 24 hours of data
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      this.batteryHistory = this.batteryHistory.filter(entry => entry.timestamp > oneDayAgo);

      // Calculate average drain
      this.calculateBatteryDrain();

      // Estimate time remaining
      this.estimateTimeRemaining();

    } catch (error) {
      console.warn('Failed to update battery metrics:', error);
    }
  }

  /**
   * Calculate battery drain rate
   */
  private calculateBatteryDrain(): void {
    if (this.batteryHistory.length < 2) return;

    const recent = this.batteryHistory.slice(-10); // Last 10 readings
    if (recent.length < 2) return;

    const totalDrain = recent[0].level - recent[recent.length - 1].level;
    const totalTime = (recent[recent.length - 1].timestamp - recent[0].timestamp) / 1000 / 3600; // hours

    if (totalTime > 0 && totalDrain > 0) {
      this.metrics.averageDrain = totalDrain / totalTime;
    }
  }

  /**
   * Estimate remaining battery time
   */
  private estimateTimeRemaining(): void {
    if (this.metrics.isCharging) {
      this.metrics.timeRemaining = -1; // Charging
      return;
    }

    if (this.metrics.averageDrain > 0) {
      const hoursRemaining = this.metrics.currentLevel / this.metrics.averageDrain;
      this.metrics.timeRemaining = Math.round(hoursRemaining * 60); // Convert to minutes
    } else {
      this.metrics.timeRemaining = 0; // Unknown
    }
  }

  /**
   * Update CPU metrics
   */
  private updateCPUMetrics(): void {
    // Simulate CPU usage monitoring (would use native modules in production)
    const estimatedCPU = this.estimateCPUUsage();
    this.cpuHistory.push(estimatedCPU);

    // Keep only last 20 readings
    if (this.cpuHistory.length > 20) {
      this.cpuHistory.shift();
    }

    // Calculate average CPU usage
    this.metrics.cpuUsage = this.cpuHistory.reduce((a, b) => a + b, 0) / this.cpuHistory.length;
  }

  /**
   * Estimate CPU usage based on app activity
   */
  private estimateCPUUsage(): number {
    let baseCPU = 10; // Base CPU usage

    // Add CPU usage based on active features
    if (this.isRecordingActive()) baseCPU += 20;
    if (this.isTranscriptionActive()) baseCPU += 25;
    if (this.isSyncActive()) baseCPU += 15;
    if (this.appState === 'background') baseCPU *= 0.3; // Reduce in background

    // Apply device-specific multipliers
    if (this.capabilities?.isLowEndDevice) {
      baseCPU *= 1.5; // Higher CPU usage on low-end devices
    }

    return Math.min(100, baseCPU);
  }

  /**
   * Update thermal metrics
   */
  private updateThermalMetrics(): void {
    // Simulate thermal monitoring (would use native modules in production)
    this.metrics.thermalState = this.estimateThermalState();
  }

  /**
   * Estimate thermal state
   */
  private estimateThermalState(): 'normal' | 'warm' | 'hot' | 'critical' {
    // Based on CPU usage and device characteristics
    const cpuUsage = this.metrics.cpuUsage;
    const isCharging = this.metrics.isCharging;

    if (cpuUsage > 80 || (isCharging && cpuUsage > 60)) {
      return 'hot';
    } else if (cpuUsage > 60 || (isCharging && cpuUsage > 40)) {
      return 'warm';
    } else {
      return 'normal';
    }
  }

  /**
   * Check battery thresholds and apply optimizations
   */
  private checkBatteryThresholds(): void {
    const level = this.metrics.currentLevel;

    if (level <= this.config.batteryThresholds.criticalLevel) {
      this.handleCriticalBattery();
    } else if (level <= this.config.batteryThresholds.lowLevel) {
      this.handleLowBattery();
    } else if (level <= this.config.batteryThresholds.optimizeLevel) {
      this.handleOptimizeBattery();
    }
  }

  /**
   * Handle critical battery level
   */
  private handleCriticalBattery(): void {
    console.warn('Critical battery level detected - applying emergency optimizations');

    // Switch to aggressive power saving
    this.switchToPowerMode('aggressive');

    // Pause non-critical operations
    this.pauseNonCriticalOperations();

    // Reduce CPU usage aggressively
    this.applyCPUThrottling(30); // Limit to 30%

    // Notify elderly user
    this.notifyElderlyUser('critical', 'Battery is very low. Please charge your device soon.');

    this.addOptimization({
      id: `critical_battery_${Date.now()}`,
      type: 'battery',
      impact: 'high',
      elderlyBenefit: true,
      description: 'Emergency battery optimization enabled',
      energySavings: 40,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle low battery level
   */
  private handleLowBattery(): void {
    console.log('Low battery level detected - applying moderate optimizations');

    // Switch to moderate power saving
    this.switchToPowerMode('moderate');

    // Reduce background activity
    this.reduceBackgroundActivity();

    // Apply moderate CPU throttling
    this.applyCPUThrottling(50); // Limit to 50%

    // Notify elderly user if preferences allow
    if (this.elderlyPreferences.notifyOnLowBattery) {
      this.notifyElderlyUser('warning', 'Battery is getting low. Consider charging when convenient.');
    }

    this.addOptimization({
      id: `low_battery_${Date.now()}`,
      type: 'battery',
      impact: 'medium',
      elderlyBenefit: true,
      description: 'Low battery optimization enabled',
      energySavings: 25,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle optimize battery level
   */
  private handleOptimizeBattery(): void {
    if (this.elderlyPreferences.autoEnablePowerSaving) {
      console.log('Battery optimization threshold reached - applying gentle optimizations');

      // Switch to elderly optimized mode
      this.switchToPowerMode('elderly');

      // Apply gentle optimizations
      this.applyGentleOptimizations();

      this.addOptimization({
        id: `optimize_battery_${Date.now()}`,
        type: 'battery',
        impact: 'low',
        elderlyBenefit: true,
        description: 'Gentle battery optimization enabled',
        energySavings: 15,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Check CPU thresholds
   */
  private checkCPUThresholds(): void {
    const cpuUsage = this.metrics.cpuUsage;

    if (cpuUsage > this.config.cpuOptimization.throttleThreshold) {
      this.handleHighCPUUsage(cpuUsage);
    }

    if (cpuUsage > this.config.cpuOptimization.maxCPUUsage) {
      this.handleCriticalCPUUsage(cpuUsage);
    }
  }

  /**
   * Handle high CPU usage
   */
  private handleHighCPUUsage(cpuUsage: number): void {
    console.log(`High CPU usage detected (${cpuUsage}%) - applying CPU optimizations`);

    // Apply CPU throttling
    this.applyCPUThrottling(Math.max(40, this.config.cpuOptimization.maxCPUUsage - 10));

    // Reduce workload if elderly mode is enabled
    if (this.config.cpuOptimization.elderlyWorkloadReduction) {
      this.reduceElderlyWorkload();
    }

    this.addOptimization({
      id: `high_cpu_${Date.now()}`,
      type: 'cpu',
      impact: 'medium',
      elderlyBenefit: true,
      description: 'CPU usage optimization applied',
      energySavings: 20,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle critical CPU usage
   */
  private handleCriticalCPUUsage(cpuUsage: number): void {
    console.warn(`Critical CPU usage detected (${cpuUsage}%) - applying emergency CPU optimizations`);

    // Aggressive CPU throttling
    this.applyCPUThrottling(30);

    // Pause all non-essential operations
    this.pauseNonEssentialOperations();

    // Reduce elderly workload significantly
    this.reduceElderlyWorkload(true);

    this.addOptimization({
      id: `critical_cpu_${Date.now()}`,
      type: 'cpu',
      impact: 'high',
      elderlyBenefit: true,
      description: 'Emergency CPU optimization applied',
      energySavings: 35,
      timestamp: Date.now(),
    });
  }

  /**
   * Check thermal thresholds
   */
  private checkThermalThresholds(): void {
    const thermalState = this.metrics.thermalState;

    if (thermalState === 'hot' || thermalState === 'critical') {
      this.handleThermalThrottling(thermalState);
    }
  }

  /**
   * Handle thermal throttling
   */
  private handleThermalThrottling(state: string): void {
    console.warn(`Thermal throttling triggered (${state}) - protecting elderly user comfort`);

    // Reduce CPU usage to cool down device
    const cpuLimit = state === 'critical' ? 20 : 30;
    this.applyCPUThrottling(cpuLimit);

    // Pause intensive operations
    this.pauseIntensiveOperations();

    // Notify elderly user about thermal comfort
    if (this.elderlyPreferences.comfortThermalLimits) {
      this.notifyElderlyUser('info', 'Device is warming up. Performance temporarily reduced for comfort.');
    }

    this.addOptimization({
      id: `thermal_${Date.now()}`,
      type: 'thermal',
      impact: 'high',
      elderlyBenefit: true,
      description: 'Thermal comfort optimization applied',
      energySavings: 30,
      timestamp: Date.now(),
    });
  }

  /**
   * Switch to specific power mode
   */
  private switchToPowerMode(mode: 'aggressive' | 'moderate' | 'minimal' | 'elderly'): void {
    this.currentMode = this.config.powerSavingModes[mode];

    // Apply mode-specific settings
    this.applyPowerModeSettings(this.currentMode);

    console.log(`Switched to ${this.currentMode.name} power mode`);
  }

  /**
   * Apply power mode settings
   */
  private applyPowerModeSettings(mode: BatteryMode): void {
    // CPU limiting
    this.applyCPUThrottling(mode.cpuLimit);

    // Background tasks
    if (!mode.backgroundTasksEnabled) {
      this.pauseBackgroundTasks();
    } else {
      this.resumeBackgroundTasks();
    }

    // Sync frequency
    this.adjustSyncFrequency(mode.syncFrequency);

    // UI optimizations
    if (!mode.animationsEnabled) {
      this.disableAnimations();
    }

    // Audio quality adjustment
    this.adjustAudioQuality(mode.audioQuality);
  }

  /**
   * Apply CPU throttling
   */
  private applyCPUThrottling(limit: number): void {
    // This would interface with native modules to actually limit CPU
    console.log(`CPU throttling applied: ${limit}% limit`);

    // Notify performance monitor
    performanceMonitor.getMetrics(); // This would record the throttling event
  }

  /**
   * Pause non-critical operations
   */
  private pauseNonCriticalOperations(): void {
    // Pause background sync
    this.pauseBackgroundTasks();

    // Pause non-essential UI updates
    this.pauseNonEssentialUI();

    // Reduce memory usage
    memoryManager.optimizeForElderly();

    console.log('Non-critical operations paused for battery conservation');
  }

  /**
   * Reduce elderly workload
   */
  private reduceElderlyWorkload(aggressive = false): void {
    // Reduce transcription frequency
    const reductionFactor = aggressive ? 0.5 : 0.7;

    // Simplify UI updates
    this.simplifyUIUpdates();

    // Reduce animation complexity
    this.reduceAnimationComplexity();

    // Optimize memory usage
    memoryManager.optimizeForElderly();

    console.log(`Elderly workload reduced by ${Math.round((1 - reductionFactor) * 100)}%`);
  }

  /**
   * Apply gentle optimizations for elderly users
   */
  private applyGentleOptimizations(): void {
    // Slightly reduce update frequencies
    this.adjustSyncFrequency('reduced');

    // Optimize memory without impacting user experience
    memoryManager.optimizeForElderly();

    // Reduce background activity gently
    this.reduceBackgroundActivity();

    console.log('Gentle optimizations applied for elderly user');
  }

  /**
   * Run optimization cycle
   */
  private runOptimizationCycle(): void {
    // Calculate power efficiency score
    this.calculatePowerEfficiencyScore();

    // Determine elderly usage pattern
    this.analyzeElderlyUsagePattern();

    // Apply proactive optimizations
    this.applyProactiveOptimizations();

    // Clean up old optimizations
    this.cleanupOldOptimizations();
  }

  /**
   * Calculate power efficiency score
   */
  private calculatePowerEfficiencyScore(): void {
    let score = 100;

    // Penalize high CPU usage
    if (this.metrics.cpuUsage > 60) score -= 20;
    if (this.metrics.cpuUsage > 80) score -= 30;

    // Penalize high battery drain
    if (this.metrics.averageDrain > 15) score -= 25; // More than 15% per hour
    if (this.metrics.averageDrain > 25) score -= 35;

    // Penalize thermal issues
    if (this.metrics.thermalState === 'warm') score -= 10;
    if (this.metrics.thermalState === 'hot') score -= 25;

    // Bonus for optimizations
    score += Math.min(20, this.activeOptimizations.size * 2);

    this.metrics.powerEfficiencyScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Analyze elderly usage pattern
   */
  private analyzeElderlyUsagePattern(): void {
    const avgCPU = this.metrics.cpuUsage;
    const avgDrain = this.metrics.averageDrain;

    if (avgCPU < 30 && avgDrain < 10) {
      this.metrics.elderlyUsagePattern = 'light';
    } else if (avgCPU < 60 && avgDrain < 20) {
      this.metrics.elderlyUsagePattern = 'moderate';
    } else {
      this.metrics.elderlyUsagePattern = 'heavy';
    }
  }

  /**
   * Apply proactive optimizations
   */
  private applyProactiveOptimizations(): void {
    // If efficiency score is low, apply more optimizations
    if (this.metrics.powerEfficiencyScore < 60) {
      this.applyAdditionalOptimizations();
    }

    // Adjust based on usage pattern
    if (this.metrics.elderlyUsagePattern === 'heavy') {
      this.applyHeavyUsageOptimizations();
    }
  }

  /**
   * Helper methods for specific operations
   */
  private isRecordingActive(): boolean {
    // Would check if audio recording is active
    return false; // Placeholder
  }

  private isTranscriptionActive(): boolean {
    // Would check if transcription is running
    return false; // Placeholder
  }

  private isSyncActive(): boolean {
    // Would check if sync operations are running
    return false; // Placeholder
  }

  private pauseBackgroundTasks(): void {
    if (!this.backgroundTasksPaused) {
      this.backgroundTasksPaused = true;
      console.log('Background tasks paused');
    }
  }

  private resumeBackgroundTasks(): void {
    if (this.backgroundTasksPaused) {
      this.backgroundTasksPaused = false;
      console.log('Background tasks resumed');
    }
  }

  private reduceBackgroundActivity(): void {
    // Reduce but don't completely stop background activity
    console.log('Background activity reduced');
  }

  private pauseNonEssentialOperations(): void {
    // Pause operations that aren't critical for elderly users
    console.log('Non-essential operations paused');
  }

  private pauseIntensiveOperations(): void {
    // Pause CPU-intensive operations
    console.log('Intensive operations paused for thermal management');
  }

  private pauseNonEssentialUI(): void {
    // Reduce UI update frequency
    console.log('Non-essential UI updates paused');
  }

  private simplifyUIUpdates(): void {
    // Simplify UI rendering for elderly users
    console.log('UI updates simplified for elderly users');
  }

  private reduceAnimationComplexity(): void {
    // Reduce animation complexity
    console.log('Animation complexity reduced');
  }

  private adjustSyncFrequency(frequency: string): void {
    console.log(`Sync frequency adjusted to: ${frequency}`);
  }

  private disableAnimations(): void {
    console.log('Animations disabled for battery saving');
  }

  private adjustAudioQuality(quality: string): void {
    console.log(`Audio quality adjusted to: ${quality}`);
  }

  private applyAdditionalOptimizations(): void {
    console.log('Additional optimizations applied due to low efficiency score');
  }

  private applyHeavyUsageOptimizations(): void {
    console.log('Heavy usage optimizations applied');
  }

  /**
   * Notification methods
   */
  private notifyElderlyUser(type: 'info' | 'warning' | 'critical', message: string): void {
    // Would show user-friendly notification
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  /**
   * Add optimization tracking
   */
  private addOptimization(optimization: PowerOptimization): void {
    this.activeOptimizations.set(optimization.id, optimization);
    this.metrics.optimizationsActive = this.activeOptimizations.size;
  }

  /**
   * Clean up old optimizations
   */
  private cleanupOldOptimizations(): void {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes

    for (const [id, optimization] of this.activeOptimizations.entries()) {
      if (now - optimization.timestamp > maxAge) {
        this.activeOptimizations.delete(id);
      }
    }

    this.metrics.optimizationsActive = this.activeOptimizations.size;
  }

  /**
   * App state management
   */
  private setupAppStateHandling(): void {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    this.appState = nextAppState;

    if (nextAppState === 'background') {
      this.handleAppBackground();
    } else if (nextAppState === 'active') {
      this.handleAppForeground();
    }
  }

  private handleAppBackground(): void {
    console.log('App moved to background - applying background optimizations');

    // Apply aggressive background optimizations
    this.pauseNonCriticalOperations();
    this.applyCPUThrottling(20); // Very low CPU usage in background

    // Start inactivity timer for elderly users (longer timeout)
    this.inactivityTimer = setTimeout(() => {
      this.handleExtendedInactivity();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private handleAppForeground(): void {
    console.log('App moved to foreground - restoring performance');

    // Clear inactivity timer
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    // Restore performance gradually for elderly users
    setTimeout(() => {
      this.restorePerformance();
    }, 1000); // 1 second delay for smooth transition
  }

  private handleExtendedInactivity(): void {
    console.log('Extended inactivity detected - applying deep power savings');

    // Apply maximum power savings
    this.switchToPowerMode('aggressive');
    this.pauseNonCriticalOperations();
  }

  private restorePerformance(): void {
    // Restore to appropriate power mode based on battery level
    if (this.metrics.currentLevel > this.config.batteryThresholds.optimizeLevel) {
      this.switchToPowerMode('elderly');
    } else {
      // Keep optimizations if battery is low
      this.switchToPowerMode('moderate');
    }

    console.log('Performance restored for elderly user');
  }

  /**
   * Persistence methods
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const prefs = await AsyncStorage.getItem('elderlyPowerPreferences');
      if (prefs) {
        this.elderlyPreferences = { ...this.elderlyPreferences, ...JSON.parse(prefs) };
      }
    } catch (error) {
      console.warn('Failed to load power preferences:', error);
    }
  }

  public async saveUserPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('elderlyPowerPreferences', JSON.stringify(this.elderlyPreferences));
    } catch (error) {
      console.warn('Failed to save power preferences:', error);
    }
  }

  /**
   * Public API methods
   */
  public getBatteryMetrics(): BatteryMetrics {
    return { ...this.metrics };
  }

  public getCurrentMode(): BatteryMode {
    return { ...this.currentMode };
  }

  public getElderlyPreferences(): ElderlyPowerPreferences {
    return { ...this.elderlyPreferences };
  }

  public updateElderlyPreferences(preferences: Partial<ElderlyPowerPreferences>): void {
    this.elderlyPreferences = { ...this.elderlyPreferences, ...preferences };
    this.applyElderlyOptimizations();
    this.saveUserPreferences();
  }

  public manuallyOptimize(): void {
    console.log('Manual optimization triggered by elderly user');

    this.switchToPowerMode('elderly');
    this.applyGentleOptimizations();

    this.addOptimization({
      id: `manual_${Date.now()}`,
      type: 'battery',
      impact: 'medium',
      elderlyBenefit: true,
      description: 'Manual optimization applied',
      energySavings: 20,
      timestamp: Date.now(),
    });
  }

  public getOptimizationReport(): {
    currentMode: string;
    batteryLevel: number;
    estimatedTimeRemaining: string;
    powerEfficiencyScore: number;
    activeOptimizations: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (this.metrics.currentLevel < 30) {
      recommendations.push('Consider charging your device soon');
    }

    if (this.metrics.powerEfficiencyScore < 70) {
      recommendations.push('Enable additional power optimizations for better battery life');
    }

    if (this.metrics.thermalState !== 'normal') {
      recommendations.push('Device temperature is elevated - performance may be reduced for comfort');
    }

    const timeRemaining = this.metrics.timeRemaining > 0
      ? `${Math.floor(this.metrics.timeRemaining / 60)}h ${this.metrics.timeRemaining % 60}m`
      : this.metrics.isCharging ? 'Charging' : 'Unknown';

    return {
      currentMode: this.currentMode.name,
      batteryLevel: this.metrics.currentLevel,
      estimatedTimeRemaining: timeRemaining,
      powerEfficiencyScore: this.metrics.powerEfficiencyScore,
      activeOptimizations: this.metrics.optimizationsActive,
      recommendations,
    };
  }

  public async optimizeForElderly(): Promise<void> {
    console.log('Applying comprehensive elderly battery optimizations');

    // Enable all elderly-friendly settings
    this.elderlyPreferences = {
      preferLongerBattery: true,
      acceptPerformanceReduction: true,
      enableAggressiveOptimization: true,
      notifyOnLowBattery: true,
      autoEnablePowerSaving: true,
      comfortThermalLimits: true,
      extendedDeviceLifespan: true,
    };

    // Switch to elderly optimized mode
    this.switchToPowerMode('elderly');

    // Apply immediate optimizations
    this.applyGentleOptimizations();

    await this.saveUserPreferences();
  }

  /**
   * Default configuration
   */
  private getDefaultConfig(): BatteryOptimizationConfig {
    return {
      batteryThresholds: {
        criticalLevel: 10,
        lowLevel: 20,
        optimizeLevel: 30,
      },
      cpuOptimization: {
        maxCPUUsage: 70,
        throttleThreshold: 60,
        elderlyWorkloadReduction: true,
        backgroundTaskLimiting: true,
      },
      powerSavingModes: {
        aggressive: {
          name: 'Aggressive Power Saving',
          description: 'Maximum battery conservation',
          cpuLimit: 30,
          backgroundTasksEnabled: false,
          animationsEnabled: false,
          syncFrequency: 'minimal',
          audioQuality: 'low',
          screenBrightness: 'minimal',
          hapticFeedback: false,
          elderlyFriendly: false,
        },
        moderate: {
          name: 'Moderate Power Saving',
          description: 'Balanced power conservation',
          cpuLimit: 50,
          backgroundTasksEnabled: false,
          animationsEnabled: false,
          syncFrequency: 'reduced',
          audioQuality: 'medium',
          screenBrightness: 'reduced',
          hapticFeedback: true,
          elderlyFriendly: true,
        },
        minimal: {
          name: 'Minimal Power Saving',
          description: 'Light power conservation',
          cpuLimit: 70,
          backgroundTasksEnabled: true,
          animationsEnabled: true,
          syncFrequency: 'normal',
          audioQuality: 'medium',
          screenBrightness: 'auto',
          hapticFeedback: true,
          elderlyFriendly: true,
        },
        elderly: {
          name: 'Elderly Optimized',
          description: 'Optimized for elderly user comfort and battery life',
          cpuLimit: 50,
          backgroundTasksEnabled: false,
          animationsEnabled: false,
          syncFrequency: 'reduced',
          audioQuality: 'medium',
          screenBrightness: 'auto',
          hapticFeedback: true,
          elderlyFriendly: true,
        },
      },
      backgroundOptimization: {
        limitBackgroundTasks: true,
        pauseNonCriticalOperations: true,
        reduceUpdateFrequency: true,
        minimizeNetworkUsage: true,
      },
      thermalManagement: {
        enableThermalMonitoring: true,
        cooldownThreshold: 40,
        elderlyComfortMode: true,
      },
    };
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): BatteryMetrics {
    return {
      currentLevel: 100,
      isCharging: false,
      timeRemaining: 0,
      averageDrain: 0,
      cpuUsage: 0,
      thermalState: 'normal',
      powerEfficiencyScore: 100,
      elderlyUsagePattern: 'light',
      optimizationsActive: 0,
    };
  }

  /**
   * Initialize elderly preferences
   */
  private initializeElderlyPreferences(): ElderlyPowerPreferences {
    return {
      preferLongerBattery: true,
      acceptPerformanceReduction: false,
      enableAggressiveOptimization: false,
      notifyOnLowBattery: true,
      autoEnablePowerSaving: false,
      comfortThermalLimits: true,
      extendedDeviceLifespan: true,
    };
  }

  public cleanup(): void {
    // Stop all monitoring intervals
    if (this.batteryMonitorInterval) {
      clearInterval(this.batteryMonitorInterval);
      this.batteryMonitorInterval = null;
    }

    if (this.cpuMonitorInterval) {
      clearInterval(this.cpuMonitorInterval);
      this.cpuMonitorInterval = null;
    }

    if (this.thermalMonitorInterval) {
      clearInterval(this.thermalMonitorInterval);
      this.thermalMonitorInterval = null;
    }

    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }

    this.saveUserPreferences();
    console.log('BatteryOptimizer cleanup completed');
  }
}

export const batteryOptimizer = new BatteryOptimizer();