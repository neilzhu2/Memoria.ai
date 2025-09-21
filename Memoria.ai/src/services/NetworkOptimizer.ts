/**
 * Network Optimizer for Memoria.ai
 * Intelligent sync and bandwidth management for elderly users with limited data plans
 */

import { NetInfo, NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';
import { performanceMonitor } from './PerformanceMonitor';

export interface NetworkConfig {
  maxBandwidthUsage: number; // bytes per second
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  priorityQueues: NetworkPriority[];
  elderlyOptimizations: {
    dataSavingMode: boolean;
    progressiveSync: boolean;
    wifiOnlyMode: boolean;
    lowDataMode: boolean;
  };
}

export interface NetworkPriority {
  type: 'audio' | 'transcription' | 'metadata' | 'backup' | 'family_sharing';
  priority: 'critical' | 'high' | 'medium' | 'low';
  maxSize: number; // bytes
  compressionEnabled: boolean;
  elderlyImportant: boolean;
}

export interface SyncOperation {
  id: string;
  type: 'upload' | 'download' | 'sync';
  category: NetworkPriority['type'];
  size: number;
  priority: NetworkPriority['priority'];
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'paused';
  elderlyOptimized: boolean;
  estimatedDataUsage: number;
  timestamp: number;
}

export interface NetworkStats {
  totalDataUsed: number; // bytes in current session
  dailyDataUsage: number; // bytes today
  monthlyDataUsage: number; // bytes this month
  averageSpeed: number; // bytes per second
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
  elderlyFriendlyScore: number; // 0-100 based on data usage and speed
}

export interface DataSavingMetrics {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dataWifiFavd: number;
  operationsDeferred: number;
  elderlyModeSavings: number;
}

export interface NetworkAlert {
  id: string;
  type: 'data_usage' | 'slow_connection' | 'wifi_recommended' | 'sync_paused';
  message: string;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
  elderlySpecific: boolean;
  timestamp: number;
}

class NetworkOptimizer {
  private config: NetworkConfig;
  private capabilities: DetailedDeviceCapabilities | null = null;
  private currentConnection: NetInfoState | null = null;
  private syncQueue: SyncOperation[] = [];
  private stats: NetworkStats;
  private dataSavingMetrics: DataSavingMetrics;
  private alerts: NetworkAlert[] = [];

  // Network monitoring
  private isMonitoring = false;
  private speedTests: number[] = [];
  private connectionHistory: string[] = [];

  // Elderly-specific settings
  private elderlyPreferences = {
    maxDailyDataUsage: 100 * 1024 * 1024, // 100MB per day
    maxMonthlyDataUsage: 2 * 1024 * 1024 * 1024, // 2GB per month
    preferWiFi: true,
    aggressiveCompression: true,
    progressiveDownloads: true,
    dataUsageAlerts: true,
  };

  // Operation timers and intervals
  private syncInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private speedTestInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.initializeConfig();
    this.stats = this.initializeStats();
    this.dataSavingMetrics = this.initializeDataSavingMetrics();
  }

  /**
   * Initialize network optimization
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    await this.loadNetworkPreferences();
    await this.loadNetworkStats();

    this.adjustConfigForDevice();
    this.setupNetworkMonitoring();
    this.startSyncProcessing();

    console.log('NetworkOptimizer initialized for elderly user optimization');
  }

  /**
   * Initialize default network configuration
   */
  private initializeConfig(): NetworkConfig {
    return {
      maxBandwidthUsage: 100 * 1024, // 100KB/s conservative default
      compressionLevel: 'high',
      priorityQueues: [
        {
          type: 'audio',
          priority: 'critical',
          maxSize: 50 * 1024 * 1024, // 50MB
          compressionEnabled: true,
          elderlyImportant: true,
        },
        {
          type: 'transcription',
          priority: 'high',
          maxSize: 10 * 1024 * 1024, // 10MB
          compressionEnabled: true,
          elderlyImportant: true,
        },
        {
          type: 'metadata',
          priority: 'medium',
          maxSize: 5 * 1024 * 1024, // 5MB
          compressionEnabled: true,
          elderlyImportant: false,
        },
        {
          type: 'backup',
          priority: 'low',
          maxSize: 100 * 1024 * 1024, // 100MB
          compressionEnabled: true,
          elderlyImportant: true,
        },
        {
          type: 'family_sharing',
          priority: 'medium',
          maxSize: 20 * 1024 * 1024, // 20MB
          compressionEnabled: true,
          elderlyImportant: true,
        },
      ],
      elderlyOptimizations: {
        dataSavingMode: true,
        progressiveSync: true,
        wifiOnlyMode: false, // Default to false, but recommend WiFi
        lowDataMode: true,
      },
    };
  }

  /**
   * Initialize network statistics
   */
  private initializeStats(): NetworkStats {
    return {
      totalDataUsed: 0,
      dailyDataUsage: 0,
      monthlyDataUsage: 0,
      averageSpeed: 0,
      connectionQuality: 'fair',
      elderlyFriendlyScore: 100,
    };
  }

  /**
   * Initialize data saving metrics
   */
  private initializeDataSavingMetrics(): DataSavingMetrics {
    return {
      originalSize: 0,
      compressedSize: 0,
      compressionRatio: 0,
      dataWifiFavd: 0,
      operationsDeferred: 0,
      elderlyModeSavings: 0,
    };
  }

  /**
   * Adjust configuration based on device capabilities
   */
  private adjustConfigForDevice(): void {
    if (!this.capabilities) return;

    // Adjust bandwidth based on device tier
    if (this.capabilities.deviceTier === 'low') {
      this.config.maxBandwidthUsage = 50 * 1024; // 50KB/s for low-end devices
      this.config.compressionLevel = 'high';
      this.config.elderlyOptimizations.progressiveSync = true;
    } else if (this.capabilities.deviceTier === 'medium') {
      this.config.maxBandwidthUsage = 100 * 1024; // 100KB/s
      this.config.compressionLevel = 'medium';
    } else {
      this.config.maxBandwidthUsage = 200 * 1024; // 200KB/s
      this.config.compressionLevel = 'medium';
    }

    // Enable WiFi-only mode for very limited devices
    if (this.capabilities.isLowEndDevice) {
      this.config.elderlyOptimizations.wifiOnlyMode = true;
    }

    console.log(`Network config adjusted for ${this.capabilities.deviceTier} tier device`);
  }

  /**
   * Setup network monitoring
   */
  private setupNetworkMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor network state changes
    NetInfo.addEventListener(state => {
      this.handleNetworkStateChange(state);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      this.currentConnection = state;
      this.assessConnectionQuality(state);
    });

    // Periodic stats updates (every 30 seconds for elderly users)
    this.statsInterval = setInterval(() => {
      this.updateNetworkStats();
      this.checkDataUsageAlerts();
    }, 30000);

    // Periodic speed tests (every 5 minutes, gentle for elderly users)
    this.speedTestInterval = setInterval(() => {
      this.performSpeedTest();
    }, 5 * 60 * 1000);

    console.log('Network monitoring started with elderly-friendly intervals');
  }

  /**
   * Handle network state changes
   */
  private handleNetworkStateChange(state: NetInfoState): void {
    const previousConnection = this.currentConnection;
    this.currentConnection = state;

    console.log(`Network changed: ${state.type} (connected: ${state.isConnected})`);

    // Track connection history for elderly users
    this.connectionHistory.push(`${Date.now()}:${state.type}:${state.isConnected}`);
    if (this.connectionHistory.length > 20) {
      this.connectionHistory.shift();
    }

    // Assess new connection quality
    this.assessConnectionQuality(state);

    // Handle connection transitions
    if (!previousConnection?.isConnected && state.isConnected) {
      this.handleConnectionRestored(state);
    } else if (previousConnection?.isConnected && !state.isConnected) {
      this.handleConnectionLost();
    } else if (state.isConnected) {
      this.handleConnectionChanged(previousConnection, state);
    }

    // Update sync operations based on new connection
    this.adjustSyncOperationsForConnection(state);
  }

  /**
   * Assess connection quality for elderly users
   */
  private assessConnectionQuality(state: NetInfoState): void {
    if (!state.isConnected) {
      this.stats.connectionQuality = 'poor';
      this.stats.elderlyFriendlyScore = 0;
      return;
    }

    let qualityScore = 0;

    // Base score by connection type
    switch (state.type) {
      case 'wifi':
        qualityScore = 100;
        break;
      case 'cellular':
        // Check cellular details if available
        if (state.details && typeof state.details === 'object' && 'cellularGeneration' in state.details) {
          const cellularDetails = state.details as any;
          switch (cellularDetails.cellularGeneration) {
            case '5g': qualityScore = 90; break;
            case '4g': qualityScore = 70; break;
            case '3g': qualityScore = 40; break;
            case '2g': qualityScore = 20; break;
            default: qualityScore = 50; break;
          }
        } else {
          qualityScore = 60; // Unknown cellular
        }
        break;
      default:
        qualityScore = 30;
    }

    // Adjust based on measured speed
    if (this.stats.averageSpeed > 0) {
      const speedMbps = (this.stats.averageSpeed * 8) / (1024 * 1024); // Convert to Mbps
      if (speedMbps >= 10) qualityScore = Math.min(100, qualityScore + 20);
      else if (speedMbps >= 5) qualityScore = Math.min(100, qualityScore + 10);
      else if (speedMbps < 1) qualityScore = Math.max(0, qualityScore - 30);
    }

    // Determine quality level
    if (qualityScore >= 80) this.stats.connectionQuality = 'excellent';
    else if (qualityScore >= 60) this.stats.connectionQuality = 'good';
    else if (qualityScore >= 40) this.stats.connectionQuality = 'fair';
    else this.stats.connectionQuality = 'poor';

    // Calculate elderly-friendly score (considers data usage and speed)
    this.stats.elderlyFriendlyScore = this.calculateElderlyFriendlyScore(qualityScore, state);
  }

  /**
   * Calculate elderly-friendly connection score
   */
  private calculateElderlyFriendlyScore(qualityScore: number, state: NetInfoState): number {
    let elderlyScore = qualityScore;

    // WiFi is always more elderly-friendly (no data charges)
    if (state.type === 'wifi') {
      elderlyScore = Math.min(100, elderlyScore + 15);
    }

    // Penalize if daily data usage is high
    const dailyUsagePercent = (this.stats.dailyDataUsage / this.elderlyPreferences.maxDailyDataUsage) * 100;
    if (dailyUsagePercent > 80) elderlyScore -= 20;
    else if (dailyUsagePercent > 60) elderlyScore -= 10;

    // Penalize if monthly data usage is high
    const monthlyUsagePercent = (this.stats.monthlyDataUsage / this.elderlyPreferences.maxMonthlyDataUsage) * 100;
    if (monthlyUsagePercent > 90) elderlyScore -= 30;
    else if (monthlyUsagePercent > 75) elderlyScore -= 15;

    return Math.max(0, Math.min(100, elderlyScore));
  }

  /**
   * Handle connection restored
   */
  private handleConnectionRestored(state: NetInfoState): void {
    console.log('Connection restored, resuming sync operations');

    this.addAlert({
      id: `connection_restored_${Date.now()}`,
      type: 'wifi_recommended',
      message: state.type === 'wifi' ? 'WiFi connected - syncing will resume' : 'Mobile connection restored',
      recommendation: state.type !== 'wifi' ? 'Consider connecting to WiFi to save data' : '',
      severity: 'info',
      elderlySpecific: true,
      timestamp: Date.now(),
    });

    // Resume paused sync operations
    this.resumePausedOperations();
  }

  /**
   * Handle connection lost
   */
  private handleConnectionLost(): void {
    console.log('Connection lost, pausing sync operations');

    this.addAlert({
      id: `connection_lost_${Date.now()}`,
      type: 'slow_connection',
      message: 'No internet connection - sync paused',
      recommendation: 'Your memories are saved locally and will sync when connection is restored',
      severity: 'warning',
      elderlySpecific: true,
      timestamp: Date.now(),
    });

    // Pause all non-critical operations
    this.pauseNonCriticalOperations();
  }

  /**
   * Handle connection type change
   */
  private handleConnectionChanged(previous: NetInfoState | null, current: NetInfoState): void {
    if (previous?.type === 'wifi' && current.type === 'cellular') {
      // Switched from WiFi to cellular
      this.addAlert({
        id: `wifi_to_cellular_${Date.now()}`,
        type: 'data_usage',
        message: 'Now using mobile data',
        recommendation: 'Large syncs will be paused to save data. Connect to WiFi for full sync.',
        severity: 'warning',
        elderlySpecific: true,
        timestamp: Date.now(),
      });

      // Enable data saving mode
      this.enableDataSavingMode();
    } else if (previous?.type === 'cellular' && current.type === 'wifi') {
      // Switched from cellular to WiFi
      this.addAlert({
        id: `cellular_to_wifi_${Date.now()}`,
        type: 'wifi_recommended',
        message: 'WiFi connected - full sync available',
        recommendation: 'All your memories will now sync without using mobile data',
        severity: 'info',
        elderlySpecific: true,
        timestamp: Date.now(),
      });

      // Disable data saving mode
      this.disableDataSavingMode();
      this.processPendingOperations();
    }
  }

  /**
   * Start sync processing
   */
  private startSyncProcessing(): void {
    // Process sync queue every 10 seconds for elderly users (gentler than rapid polling)
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, 10000);

    console.log('Sync processing started with elderly-friendly timing');
  }

  /**
   * Add sync operation to queue
   */
  public addSyncOperation(operation: Omit<SyncOperation, 'id' | 'progress' | 'status' | 'timestamp'>): string {
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const syncOp: SyncOperation = {
      ...operation,
      id,
      progress: 0,
      status: 'pending',
      timestamp: Date.now(),
    };

    // Check if operation should be deferred for elderly users
    if (this.shouldDeferOperation(syncOp)) {
      syncOp.status = 'paused';
      this.dataSavingMetrics.operationsDeferred++;
    }

    this.syncQueue.push(syncOp);
    this.sortSyncQueue();

    console.log(`Added sync operation: ${operation.category} (${Math.round(operation.size / 1024)}KB)`);
    return id;
  }

  /**
   * Check if operation should be deferred
   */
  private shouldDeferOperation(operation: SyncOperation): boolean {
    // Don't defer critical operations
    if (operation.priority === 'critical') return false;

    // Check WiFi-only mode
    if (this.config.elderlyOptimizations.wifiOnlyMode && this.currentConnection?.type !== 'wifi') {
      return true;
    }

    // Check data usage limits
    if (this.isApproachingDataLimit() && this.currentConnection?.type === 'cellular') {
      return operation.priority === 'low';
    }

    // Check connection quality
    if (this.stats.connectionQuality === 'poor') {
      return operation.priority !== 'high';
    }

    // Check size limits for cellular
    if (this.currentConnection?.type === 'cellular' && operation.size > 10 * 1024 * 1024) { // 10MB
      return true;
    }

    return false;
  }

  /**
   * Process sync queue
   */
  private processSyncQueue(): void {
    if (!this.currentConnection?.isConnected) return;

    const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
    const inProgressCount = this.syncQueue.filter(op => op.status === 'in_progress').length;

    // Limit concurrent operations for elderly users (avoid overwhelming)
    const maxConcurrent = this.capabilities?.shouldLimitConcurrentOperations ? 1 : 2;

    if (inProgressCount >= maxConcurrent) return;

    // Process next operation
    const nextOperation = pendingOperations[0];
    if (nextOperation) {
      this.executeOperation(nextOperation);
    }
  }

  /**
   * Execute sync operation
   */
  private async executeOperation(operation: SyncOperation): Promise<void> {
    console.log(`Executing ${operation.category} operation (${Math.round(operation.size / 1024)}KB)`);

    operation.status = 'in_progress';
    operation.progress = 0;

    try {
      // Apply compression if enabled
      let actualSize = operation.size;
      if (this.shouldCompressOperation(operation)) {
        actualSize = this.applyCompression(operation);
      }

      // Simulate operation execution with progress updates
      await this.simulateOperation(operation, actualSize);

      operation.status = 'completed';
      operation.progress = 100;

      // Update statistics
      this.updateDataUsageStats(actualSize);
      this.dataSavingMetrics.originalSize += operation.size;
      this.dataSavingMetrics.compressedSize += actualSize;

      console.log(`Completed ${operation.category} operation`);

    } catch (error) {
      console.error(`Failed to execute ${operation.category} operation:`, error);
      operation.status = 'failed';

      // Retry logic for elderly users (more forgiving)
      if (operation.elderlyOptimized) {
        setTimeout(() => {
          operation.status = 'pending';
          operation.progress = 0;
        }, 30000); // Retry after 30 seconds
      }
    }
  }

  /**
   * Check if operation should be compressed
   */
  private shouldCompressOperation(operation: SyncOperation): boolean {
    const priorityConfig = this.config.priorityQueues.find(p => p.type === operation.category);
    return priorityConfig?.compressionEnabled || false;
  }

  /**
   * Apply compression to operation
   */
  private applyCompression(operation: SyncOperation): number {
    let compressionRatio = 0.8; // Default 20% reduction

    // Adjust compression based on configuration and content type
    switch (this.config.compressionLevel) {
      case 'high':
        compressionRatio = operation.category === 'audio' ? 0.6 : 0.5; // More aggressive
        break;
      case 'medium':
        compressionRatio = operation.category === 'audio' ? 0.7 : 0.6;
        break;
      case 'low':
        compressionRatio = 0.8;
        break;
      case 'none':
        compressionRatio = 1.0;
        break;
    }

    const compressedSize = Math.floor(operation.size * compressionRatio);
    this.dataSavingMetrics.elderlyModeSavings += operation.size - compressedSize;

    return compressedSize;
  }

  /**
   * Simulate operation execution with progress
   */
  private async simulateOperation(operation: SyncOperation, size: number): Promise<void> {
    const chunks = 10;
    const chunkSize = size / chunks;
    const delayPerChunk = Math.max(1000, chunkSize / this.config.maxBandwidthUsage * 1000); // ms

    for (let i = 0; i < chunks; i++) {
      await new Promise(resolve => setTimeout(resolve, delayPerChunk));
      operation.progress = Math.round(((i + 1) / chunks) * 100);

      // Check if operation should be paused (e.g., connection lost)
      if (!this.currentConnection?.isConnected) {
        operation.status = 'paused';
        throw new Error('Connection lost during operation');
      }
    }
  }

  /**
   * Sort sync queue by priority and elderly preferences
   */
  private sortSyncQueue(): void {
    this.syncQueue.sort((a, b) => {
      // Elderly-important operations first
      if (a.elderlyOptimized && !b.elderlyOptimized) return -1;
      if (!a.elderlyOptimized && b.elderlyOptimized) return 1;

      // Then by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by timestamp (FIFO)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Update network statistics
   */
  private updateNetworkStats(): void {
    // Calculate compression ratio
    if (this.dataSavingMetrics.originalSize > 0) {
      this.dataSavingMetrics.compressionRatio =
        1 - (this.dataSavingMetrics.compressedSize / this.dataSavingMetrics.originalSize);
    }

    // Update speed average
    if (this.speedTests.length > 0) {
      this.stats.averageSpeed = this.speedTests.reduce((a, b) => a + b, 0) / this.speedTests.length;
    }

    // Calculate elderly-friendly score
    if (this.currentConnection) {
      this.stats.elderlyFriendlyScore = this.calculateElderlyFriendlyScore(
        this.getQualityScore(),
        this.currentConnection
      );
    }
  }

  /**
   * Perform speed test
   */
  private async performSpeedTest(): Promise<void> {
    if (!this.currentConnection?.isConnected) return;

    try {
      // Gentle speed test for elderly users (small payload)
      const testSize = 64 * 1024; // 64KB test
      const startTime = Date.now();

      // Simulate speed test (would make actual HTTP request in production)
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second test

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const speed = testSize / duration; // bytes per second

      this.speedTests.push(speed);
      if (this.speedTests.length > 10) {
        this.speedTests.shift(); // Keep only last 10 tests
      }

      console.log(`Speed test: ${Math.round(speed / 1024)}KB/s`);
    } catch (error) {
      console.warn('Speed test failed:', error);
    }
  }

  /**
   * Data usage and alert methods
   */
  private updateDataUsageStats(bytes: number): void {
    this.stats.totalDataUsed += bytes;
    this.stats.dailyDataUsage += bytes;
    this.stats.monthlyDataUsage += bytes;
  }

  private checkDataUsageAlerts(): void {
    if (!this.elderlyPreferences.dataUsageAlerts) return;

    // Daily usage alerts
    const dailyUsagePercent = (this.stats.dailyDataUsage / this.elderlyPreferences.maxDailyDataUsage) * 100;
    if (dailyUsagePercent > 80) {
      this.addAlert({
        id: `daily_usage_${Date.now()}`,
        type: 'data_usage',
        message: `You've used ${Math.round(dailyUsagePercent)}% of your daily data target`,
        recommendation: 'Consider connecting to WiFi for remaining syncs today',
        severity: 'warning',
        elderlySpecific: true,
        timestamp: Date.now(),
      });
    }

    // Monthly usage alerts
    const monthlyUsagePercent = (this.stats.monthlyDataUsage / this.elderlyPreferences.maxMonthlyDataUsage) * 100;
    if (monthlyUsagePercent > 90) {
      this.addAlert({
        id: `monthly_usage_${Date.now()}`,
        type: 'data_usage',
        message: `You've used ${Math.round(monthlyUsagePercent)}% of your monthly data target`,
        recommendation: 'Switch to WiFi-only mode to avoid additional charges',
        severity: 'critical',
        elderlySpecific: true,
        timestamp: Date.now(),
      });

      // Automatically enable WiFi-only mode
      this.config.elderlyOptimizations.wifiOnlyMode = true;
    }
  }

  private isApproachingDataLimit(): boolean {
    const dailyPercent = (this.stats.dailyDataUsage / this.elderlyPreferences.maxDailyDataUsage) * 100;
    const monthlyPercent = (this.stats.monthlyDataUsage / this.elderlyPreferences.maxMonthlyDataUsage) * 100;

    return dailyPercent > 75 || monthlyPercent > 85;
  }

  /**
   * Data saving mode management
   */
  private enableDataSavingMode(): void {
    this.config.elderlyOptimizations.dataSavingMode = true;
    this.config.compressionLevel = 'high';

    // Pause large operations
    this.syncQueue.forEach(op => {
      if (op.status === 'pending' && op.size > 5 * 1024 * 1024 && op.priority !== 'critical') {
        op.status = 'paused';
        this.dataSavingMetrics.operationsDeferred++;
      }
    });

    console.log('Data saving mode enabled for elderly user');
  }

  private disableDataSavingMode(): void {
    this.config.elderlyOptimizations.dataSavingMode = false;
    this.config.compressionLevel = this.capabilities?.preferredCompressionLevel || 'medium';

    console.log('Data saving mode disabled - WiFi available');
  }

  /**
   * Operation management
   */
  private pauseNonCriticalOperations(): void {
    this.syncQueue.forEach(op => {
      if (op.status === 'pending' && op.priority !== 'critical') {
        op.status = 'paused';
      }
    });
  }

  private resumePausedOperations(): void {
    this.syncQueue.forEach(op => {
      if (op.status === 'paused' && !this.shouldDeferOperation(op)) {
        op.status = 'pending';
      }
    });

    this.sortSyncQueue();
  }

  private processPendingOperations(): void {
    // Resume all compatible operations when WiFi is available
    this.resumePausedOperations();

    // Process immediately
    this.processSyncQueue();
  }

  /**
   * Alert management
   */
  private addAlert(alert: NetworkAlert): void {
    // Check for duplicate alerts
    const existingAlert = this.alerts.find(a =>
      a.type === alert.type &&
      Date.now() - a.timestamp < 60000 // 1 minute
    );

    if (!existingAlert) {
      this.alerts.push(alert);

      // Keep only last 10 alerts
      if (this.alerts.length > 10) {
        this.alerts.shift();
      }

      console.log(`Network Alert [${alert.severity}]: ${alert.message}`);
    }
  }

  /**
   * Helper methods
   */
  private getQualityScore(): number {
    switch (this.stats.connectionQuality) {
      case 'excellent': return 100;
      case 'good': return 75;
      case 'fair': return 50;
      case 'poor': return 25;
      default: return 50;
    }
  }

  /**
   * Persistence methods
   */
  private async loadNetworkPreferences(): Promise<void> {
    try {
      const prefs = await AsyncStorage.getItem('networkPreferences');
      if (prefs) {
        this.elderlyPreferences = { ...this.elderlyPreferences, ...JSON.parse(prefs) };
      }
    } catch (error) {
      console.warn('Failed to load network preferences:', error);
    }
  }

  private async loadNetworkStats(): Promise<void> {
    try {
      const stats = await AsyncStorage.getItem('networkStats');
      if (stats) {
        const loadedStats = JSON.parse(stats);
        this.stats = { ...this.stats, ...loadedStats };
        this.dataSavingMetrics = { ...this.dataSavingMetrics, ...loadedStats.dataSaving };
      }
    } catch (error) {
      console.warn('Failed to load network stats:', error);
    }
  }

  public async saveNetworkData(): Promise<void> {
    try {
      await AsyncStorage.setItem('networkPreferences', JSON.stringify(this.elderlyPreferences));
      await AsyncStorage.setItem('networkStats', JSON.stringify({
        ...this.stats,
        dataSaving: this.dataSavingMetrics,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.warn('Failed to save network data:', error);
    }
  }

  /**
   * Public API methods
   */
  public getNetworkStatus(): {
    connection: NetInfoState | null;
    stats: NetworkStats;
    config: NetworkConfig;
    dataSaving: DataSavingMetrics;
    alerts: NetworkAlert[];
  } {
    return {
      connection: this.currentConnection,
      stats: { ...this.stats },
      config: { ...this.config },
      dataSaving: { ...this.dataSavingMetrics },
      alerts: [...this.alerts],
    };
  }

  public getSyncQueueStatus(): {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    paused: number;
    totalSize: number;
  } {
    const pending = this.syncQueue.filter(op => op.status === 'pending').length;
    const inProgress = this.syncQueue.filter(op => op.status === 'in_progress').length;
    const completed = this.syncQueue.filter(op => op.status === 'completed').length;
    const failed = this.syncQueue.filter(op => op.status === 'failed').length;
    const paused = this.syncQueue.filter(op => op.status === 'paused').length;
    const totalSize = this.syncQueue.reduce((sum, op) => sum + op.size, 0);

    return { pending, inProgress, completed, failed, paused, totalSize };
  }

  public enableWiFiOnlyMode(): void {
    this.config.elderlyOptimizations.wifiOnlyMode = true;
    this.pauseNonCriticalOperations();
    console.log('WiFi-only mode enabled for elderly user');
  }

  public disableWiFiOnlyMode(): void {
    this.config.elderlyOptimizations.wifiOnlyMode = false;
    this.resumePausedOperations();
    console.log('WiFi-only mode disabled');
  }

  public clearAlerts(): void {
    this.alerts = [];
  }

  public getDataUsageReport(): {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
    savings: { bytes: number; percentage: number };
    recommendations: string[];
  } {
    const daily = {
      used: this.stats.dailyDataUsage,
      limit: this.elderlyPreferences.maxDailyDataUsage,
      percentage: (this.stats.dailyDataUsage / this.elderlyPreferences.maxDailyDataUsage) * 100,
    };

    const monthly = {
      used: this.stats.monthlyDataUsage,
      limit: this.elderlyPreferences.maxMonthlyDataUsage,
      percentage: (this.stats.monthlyDataUsage / this.elderlyPreferences.maxMonthlyDataUsage) * 100,
    };

    const savings = {
      bytes: this.dataSavingMetrics.elderlyModeSavings,
      percentage: this.dataSavingMetrics.compressionRatio * 100,
    };

    const recommendations: string[] = [];
    if (daily.percentage > 75) {
      recommendations.push('Consider connecting to WiFi to save mobile data');
    }
    if (monthly.percentage > 85) {
      recommendations.push('You\'re approaching your monthly data limit');
    }
    if (this.currentConnection?.type === 'cellular') {
      recommendations.push('WiFi connection recommended for large memory syncs');
    }

    return { daily, monthly, savings, recommendations };
  }

  public async optimizeForElderly(): Promise<void> {
    console.log('Applying elderly-specific network optimizations');

    // Enable all elderly-friendly features
    this.config.elderlyOptimizations.dataSavingMode = true;
    this.config.elderlyOptimizations.progressiveSync = true;
    this.config.elderlyOptimizations.lowDataMode = true;

    // Use high compression
    this.config.compressionLevel = 'high';

    // Reduce bandwidth usage
    this.config.maxBandwidthUsage = Math.min(this.config.maxBandwidthUsage, 50 * 1024);

    await this.saveNetworkData();
  }

  public cleanup(): void {
    this.isMonitoring = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    if (this.speedTestInterval) {
      clearInterval(this.speedTestInterval);
      this.speedTestInterval = null;
    }

    this.saveNetworkData();
    console.log('NetworkOptimizer cleanup completed');
  }
}

export const networkOptimizer = new NetworkOptimizer();