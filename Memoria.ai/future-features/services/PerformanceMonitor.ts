/**
 * Performance Monitor for Memoria.ai
 * Real-time performance tracking and optimization for elderly users on older devices
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';

export interface PerformanceMetrics {
  // Timing Metrics
  appStartupTime: number;
  averageFrameTime: number;
  audioRecordingLatency: number;
  transcriptionLatency: number;
  uiResponseTime: number;
  syncOperationTime: number;

  // Resource Usage
  currentMemoryUsage: number;
  peakMemoryUsage: number;
  averageMemoryUsage: number;
  cpuUsagePercentage: number;
  batteryDrainRate: number; // percentage per hour
  networkUsage: number; // bytes per session

  // Quality Metrics
  frameDropCount: number;
  memoryPressureEvents: number;
  audioDropoutCount: number;
  transcriptionErrorRate: number;
  crashCount: number;
  anrCount: number; // Application Not Responding

  // User Experience Metrics
  averageSessionDuration: number;
  totalRecordingTime: number;
  successfulSyncPercentage: number;
  elderlyAccessibilityScore: number; // Custom score for elderly usability

  // Performance Trends
  performanceTrend: 'improving' | 'stable' | 'degrading';
  lastOptimizationTimestamp: number;
  optimizationEffectiveness: number; // 0-100 score
}

export interface PerformanceAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'memory' | 'battery' | 'performance' | 'accessibility' | 'storage';
  message: string;
  recommendation: string;
  timestamp: number;
  isElderlySpecific: boolean;
  autoResolve: boolean;
}

export interface PerformanceSnapshot {
  timestamp: number;
  metrics: PerformanceMetrics;
  deviceState: {
    batteryLevel: number;
    networkType: string;
    availableStorage: number;
    isCharging: boolean;
    thermalState: 'normal' | 'warm' | 'hot';
  };
  userContext: {
    sessionDuration: number;
    currentActivity: string;
    isRecording: boolean;
    memoryCount: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private snapshots: PerformanceSnapshot[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private capabilities: DetailedDeviceCapabilities | null = null;

  // Performance tracking state
  private frameTimestamps: number[] = [];
  private memoryUsageHistory: number[] = [];
  private cpuUsageHistory: number[] = [];
  private sessionStartTime = Date.now();
  private lastFrameTime = 0;
  private recordingStartTime = 0;
  private totalRecordingDuration = 0;

  // Elderly-specific tracking
  private elderlyInteractionTimes: number[] = [];
  private accessibilityViolations: number = 0;
  private simplificationTriggers: number = 0;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupAppStateHandling();
  }

  /**
   * Initialize performance monitoring
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    await this.loadPerformanceHistory();
    this.startMonitoring();

    console.log('PerformanceMonitor initialized for elderly user optimization');
  }

  /**
   * Initialize metrics with baseline values
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      appStartupTime: 0,
      averageFrameTime: 16.67, // 60fps baseline
      audioRecordingLatency: 0,
      transcriptionLatency: 0,
      uiResponseTime: 0,
      syncOperationTime: 0,
      currentMemoryUsage: 0,
      peakMemoryUsage: 0,
      averageMemoryUsage: 0,
      cpuUsagePercentage: 0,
      batteryDrainRate: 0,
      networkUsage: 0,
      frameDropCount: 0,
      memoryPressureEvents: 0,
      audioDropoutCount: 0,
      transcriptionErrorRate: 0,
      crashCount: 0,
      anrCount: 0,
      averageSessionDuration: 0,
      totalRecordingTime: 0,
      successfulSyncPercentage: 100,
      elderlyAccessibilityScore: 100,
      performanceTrend: 'stable',
      lastOptimizationTimestamp: Date.now(),
      optimizationEffectiveness: 0,
    };
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.sessionStartTime = Date.now();

    // Adjust monitoring frequency based on device capabilities
    const monitoringInterval = this.capabilities?.isLowEndDevice ? 5000 : 2000;

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkPerformanceAlerts();
      this.applyDynamicOptimizations();
    }, monitoringInterval);

    // Frame rate monitoring
    this.startFrameRateMonitoring();

    // Memory pressure monitoring
    this.startMemoryMonitoring();

    console.log(`Performance monitoring started with ${monitoringInterval}ms interval`);
  }

  /**
   * Stop performance monitoring
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.savePerformanceHistory();
    console.log('Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    try {
      // Simulate memory usage collection (would use native modules in production)
      const currentMemory = this.estimateMemoryUsage();
      this.updateMemoryMetrics(currentMemory);

      // Simulate CPU usage (would use native modules in production)
      const currentCPU = this.estimateCPUUsage();
      this.updateCPUMetrics(currentCPU);

      // Update session metrics
      this.updateSessionMetrics();

      // Calculate elderly accessibility score
      this.updateAccessibilityScore();

      // Update performance trend
      this.updatePerformanceTrend();

      // Create snapshot for historical analysis
      this.createPerformanceSnapshot();

    } catch (error) {
      console.warn('Error collecting performance metrics:', error);
    }
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    const trackFrame = () => {
      const now = Date.now();

      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime;
        this.frameTimestamps.push(frameTime);

        // Keep only last 60 frames for average calculation
        if (this.frameTimestamps.length > 60) {
          this.frameTimestamps.shift();
        }

        // Update average frame time
        this.metrics.averageFrameTime = this.frameTimestamps.reduce((a, b) => a + b, 0) / this.frameTimestamps.length;

        // Detect frame drops (for elderly users, be more sensitive)
        const targetFrameTime = this.capabilities?.targetFrameRate === 60 ? 16.67 : 33.33;
        if (frameTime > targetFrameTime * 1.5) {
          this.metrics.frameDropCount++;
          this.handleFrameDrop(frameTime);
        }
      }

      this.lastFrameTime = now;

      if (this.isMonitoring) {
        requestAnimationFrame(trackFrame);
      }
    };

    requestAnimationFrame(trackFrame);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const checkMemoryPressure = () => {
      const currentMemory = this.estimateMemoryUsage();

      if (this.capabilities && currentMemory > this.capabilities.maxMemoryUsage * 0.9) {
        this.handleMemoryPressure(currentMemory);
      }

      if (this.isMonitoring) {
        setTimeout(checkMemoryPressure, 3000);
      }
    };

    setTimeout(checkMemoryPressure, 3000);
  }

  /**
   * Handle frame drops with elderly-specific considerations
   */
  private handleFrameDrop(frameTime: number): void {
    // Create alert for significant frame drops
    if (frameTime > 100) { // More than 100ms frame time
      this.addAlert({
        id: `frame_drop_${Date.now()}`,
        type: 'warning',
        category: 'performance',
        message: 'UI responsiveness may be reduced',
        recommendation: 'Consider reducing animation complexity or enabling simplified UI mode',
        timestamp: Date.now(),
        isElderlySpecific: true,
        autoResolve: true,
      });
    }
  }

  /**
   * Handle memory pressure
   */
  private handleMemoryPressure(currentMemory: number): void {
    this.metrics.memoryPressureEvents++;

    this.addAlert({
      id: `memory_pressure_${Date.now()}`,
      type: currentMemory > (this.capabilities?.maxMemoryUsage || 150) ? 'critical' : 'warning',
      category: 'memory',
      message: `Memory usage is high (${Math.round(currentMemory)}MB)`,
      recommendation: 'Consider clearing app cache or restarting the app',
      timestamp: Date.now(),
      isElderlySpecific: false,
      autoResolve: false,
    });
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(currentMemory: number): void {
    this.metrics.currentMemoryUsage = currentMemory;
    this.metrics.peakMemoryUsage = Math.max(this.metrics.peakMemoryUsage, currentMemory);

    this.memoryUsageHistory.push(currentMemory);
    if (this.memoryUsageHistory.length > 100) {
      this.memoryUsageHistory.shift();
    }

    this.metrics.averageMemoryUsage = this.memoryUsageHistory.reduce((a, b) => a + b, 0) / this.memoryUsageHistory.length;
  }

  /**
   * Update CPU metrics
   */
  private updateCPUMetrics(currentCPU: number): void {
    this.cpuUsageHistory.push(currentCPU);
    if (this.cpuUsageHistory.length > 20) {
      this.cpuUsageHistory.shift();
    }

    this.metrics.cpuUsagePercentage = this.cpuUsageHistory.reduce((a, b) => a + b, 0) / this.cpuUsageHistory.length;
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.metrics.averageSessionDuration = sessionDuration;
    this.metrics.totalRecordingTime = this.totalRecordingDuration;
  }

  /**
   * Update accessibility score for elderly users
   */
  private updateAccessibilityScore(): void {
    let score = 100;

    // Penalize for performance issues that affect elderly users
    if (this.metrics.averageFrameTime > 33) score -= 10; // Slow UI
    if (this.metrics.frameDropCount > 5) score -= 15; // Frame drops
    if (this.metrics.memoryPressureEvents > 0) score -= 10; // Memory issues
    if (this.accessibilityViolations > 0) score -= 20; // Accessibility violations

    // Penalize for elderly-specific issues
    const avgInteractionTime = this.elderlyInteractionTimes.length > 0
      ? this.elderlyInteractionTimes.reduce((a, b) => a + b, 0) / this.elderlyInteractionTimes.length
      : 0;

    if (avgInteractionTime > 500) score -= 15; // Slow interactions
    if (this.simplificationTriggers > 3) score -= 10; // Too many simplifications needed

    this.metrics.elderlyAccessibilityScore = Math.max(0, score);
  }

  /**
   * Update performance trend analysis
   */
  private updatePerformanceTrend(): void {
    if (this.snapshots.length < 3) {
      this.metrics.performanceTrend = 'stable';
      return;
    }

    const recent = this.snapshots.slice(-3);
    const memoryTrend = recent.map(s => s.metrics.averageMemoryUsage);
    const frameTrend = recent.map(s => s.metrics.averageFrameTime);

    const memoryIncrease = memoryTrend[2] - memoryTrend[0];
    const frameTimeIncrease = frameTrend[2] - frameTrend[0];

    if (memoryIncrease > 10 || frameTimeIncrease > 5) {
      this.metrics.performanceTrend = 'degrading';
    } else if (memoryIncrease < -5 && frameTimeIncrease < -2) {
      this.metrics.performanceTrend = 'improving';
    } else {
      this.metrics.performanceTrend = 'stable';
    }
  }

  /**
   * Create performance snapshot
   */
  private createPerformanceSnapshot(): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      metrics: { ...this.metrics },
      deviceState: {
        batteryLevel: 0, // Would get from native module
        networkType: 'unknown',
        availableStorage: 0,
        isCharging: false,
        thermalState: 'normal',
      },
      userContext: {
        sessionDuration: Date.now() - this.sessionStartTime,
        currentActivity: 'unknown',
        isRecording: this.recordingStartTime > 0,
        memoryCount: 0, // Would get from memory store
      },
    };

    this.snapshots.push(snapshot);

    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots.shift();
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(): void {
    // Memory usage alerts
    if (this.metrics.currentMemoryUsage > (this.capabilities?.maxMemoryUsage || 150) * 0.8) {
      this.addAlert({
        id: `high_memory_${Date.now()}`,
        type: 'warning',
        category: 'memory',
        message: 'Memory usage is approaching limits',
        recommendation: 'The app will automatically optimize to maintain smooth performance',
        timestamp: Date.now(),
        isElderlySpecific: true,
        autoResolve: true,
      });
    }

    // Frame rate alerts for elderly users
    if (this.metrics.frameDropCount > 10) {
      this.addAlert({
        id: `frame_drops_${Date.now()}`,
        type: 'warning',
        category: 'performance',
        message: 'UI may feel less responsive',
        recommendation: 'Consider enabling simplified interface mode',
        timestamp: Date.now(),
        isElderlySpecific: true,
        autoResolve: false,
      });
    }

    // Battery optimization alert
    if (this.metrics.batteryDrainRate > 10) {
      this.addAlert({
        id: `battery_drain_${Date.now()}`,
        type: 'warning',
        category: 'battery',
        message: 'Battery usage is higher than expected',
        recommendation: 'Battery optimization mode has been enabled automatically',
        timestamp: Date.now(),
        isElderlySpecific: true,
        autoResolve: true,
      });
    }

    // Accessibility score alert
    if (this.metrics.elderlyAccessibilityScore < 70) {
      this.addAlert({
        id: `accessibility_${Date.now()}`,
        type: 'info',
        category: 'accessibility',
        message: 'Performance optimizations are being applied for better usability',
        recommendation: 'The app is automatically adjusting to provide the best experience',
        timestamp: Date.now(),
        isElderlySpecific: true,
        autoResolve: true,
      });
    }
  }

  /**
   * Apply dynamic optimizations based on current performance
   */
  private applyDynamicOptimizations(): void {
    if (!this.capabilities) return;

    let optimizationsApplied = 0;

    // Memory-based optimizations
    if (this.metrics.currentMemoryUsage > this.capabilities.maxMemoryUsage * 0.8) {
      this.triggerMemoryOptimization();
      optimizationsApplied++;
    }

    // Frame rate optimizations
    if (this.metrics.frameDropCount > 5) {
      this.triggerPerformanceOptimization();
      optimizationsApplied++;
    }

    // Elderly-specific optimizations
    if (this.metrics.elderlyAccessibilityScore < 80) {
      this.triggerAccessibilityOptimization();
      optimizationsApplied++;
    }

    if (optimizationsApplied > 0) {
      this.metrics.lastOptimizationTimestamp = Date.now();
      console.log(`Applied ${optimizationsApplied} dynamic optimizations`);
    }
  }

  /**
   * Trigger memory optimization
   */
  private triggerMemoryOptimization(): void {
    // This would trigger memory cleanup in other services
    console.log('Triggering memory optimization for elderly user device');
  }

  /**
   * Trigger performance optimization
   */
  private triggerPerformanceOptimization(): void {
    // This would trigger UI simplification and animation reduction
    console.log('Triggering performance optimization for elderly user');
    this.simplificationTriggers++;
  }

  /**
   * Trigger accessibility optimization
   */
  private triggerAccessibilityOptimization(): void {
    // This would trigger elderly-specific UI adjustments
    console.log('Triggering accessibility optimization for elderly user');
  }

  /**
   * Add performance alert
   */
  private addAlert(alert: PerformanceAlert): void {
    // Check if similar alert already exists
    const existingAlert = this.alerts.find(a =>
      a.category === alert.category &&
      a.type === alert.type &&
      Date.now() - a.timestamp < 30000 // 30 seconds
    );

    if (!existingAlert) {
      this.alerts.push(alert);

      // Keep only last 20 alerts
      if (this.alerts.length > 20) {
        this.alerts.shift();
      }

      console.log(`Performance Alert [${alert.type}]: ${alert.message}`);
    }
  }

  /**
   * Estimation methods (would use native modules in production)
   */
  private estimateMemoryUsage(): number {
    // Simulate memory usage based on app state
    const baseMemory = 40;
    const recordingMemory = this.recordingStartTime > 0 ? 30 : 0;
    const uiMemory = 20;
    const cacheMemory = Math.min(15, this.snapshots.length * 0.5);

    return baseMemory + recordingMemory + uiMemory + cacheMemory;
  }

  private estimateCPUUsage(): number {
    // Simulate CPU usage
    const baseCPU = this.capabilities?.isLowEndDevice ? 15 : 10;
    const recordingCPU = this.recordingStartTime > 0 ? 25 : 0;
    const transcriptionCPU = 0; // Would be higher during transcription

    return Math.min(100, baseCPU + recordingCPU + transcriptionCPU);
  }

  /**
   * App state handling
   */
  private setupAppStateHandling(): void {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      this.savePerformanceHistory();
    } else if (nextAppState === 'active') {
      this.sessionStartTime = Date.now();
    }
  }

  /**
   * Persistence methods
   */
  private async loadPerformanceHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('performanceHistory');
      if (history) {
        const data = JSON.parse(history);
        this.metrics = { ...this.metrics, ...data.metrics };
        this.snapshots = data.snapshots || [];
      }
    } catch (error) {
      console.warn('Failed to load performance history:', error);
    }
  }

  private async savePerformanceHistory(): Promise<void> {
    try {
      const data = {
        metrics: this.metrics,
        snapshots: this.snapshots.slice(-10), // Keep only last 10 snapshots
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem('performanceHistory', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save performance history:', error);
    }
  }

  /**
   * Public API methods
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public getSnapshots(): PerformanceSnapshot[] {
    return [...this.snapshots];
  }

  public clearAlerts(): void {
    this.alerts = [];
  }

  public markRecordingStart(): void {
    this.recordingStartTime = Date.now();
  }

  public markRecordingEnd(): void {
    if (this.recordingStartTime > 0) {
      this.totalRecordingDuration += Date.now() - this.recordingStartTime;
      this.recordingStartTime = 0;
    }
  }

  public recordInteractionTime(duration: number): void {
    this.elderlyInteractionTimes.push(duration);
    if (this.elderlyInteractionTimes.length > 20) {
      this.elderlyInteractionTimes.shift();
    }
  }

  public recordAccessibilityViolation(): void {
    this.accessibilityViolations++;
  }

  public getPerformanceReport(): {
    summary: string;
    recommendations: string[];
    elderlyOptimizations: string[];
    deviceSuitability: string;
  } {
    const recommendations: string[] = [];
    const elderlyOptimizations: string[] = [];

    if (this.metrics.frameDropCount > 10) {
      recommendations.push('Enable simplified UI mode to improve responsiveness');
    }

    if (this.metrics.currentMemoryUsage > (this.capabilities?.maxMemoryUsage || 150) * 0.8) {
      recommendations.push('Clear app cache regularly to free up memory');
    }

    if (this.metrics.elderlyAccessibilityScore < 80) {
      elderlyOptimizations.push('Larger text and touch targets have been enabled');
      elderlyOptimizations.push('Animation complexity has been reduced');
    }

    const deviceSuitability = this.capabilities?.isLowEndDevice
      ? 'This device requires optimization for best performance'
      : 'This device provides good performance for Memoria.ai';

    return {
      summary: `Performance is ${this.metrics.performanceTrend}. Accessibility score: ${this.metrics.elderlyAccessibilityScore}/100`,
      recommendations,
      elderlyOptimizations,
      deviceSuitability,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();