/**
 * Adaptive Quality Service for Memoria.ai
 * Dynamic quality adaptation system for elderly users on older devices
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

export interface QualityProfile {
  id: string;
  name: string;
  description: string;
  elderlyFriendly: boolean;

  // Audio quality settings
  audio: {
    sampleRate: number;
    bitRate: number;
    channels: 1 | 2;
    format: 'aac' | 'mp3' | 'wav';
    compressionLevel: 'low' | 'medium' | 'high';
    bufferSize: number; // MB
    voiceEnhancement: boolean;
    noiseReduction: boolean;
  };

  // UI quality settings
  ui: {
    animationComplexity: 'none' | 'simple' | 'full';
    imageQuality: 'low' | 'medium' | 'high';
    renderingPriority: 'performance' | 'balanced' | 'quality';
    enableVirtualization: boolean;
    maxConcurrentAnimations: number;
    touchResponseDelay: number; // ms for elderly users
  };

  // Memory settings
  memory: {
    maxAppMemory: number; // MB
    cacheSize: number; // MB
    aggressiveCleanup: boolean;
    compressionLevel: 'low' | 'medium' | 'high';
    elderlyMemoryBuffer: number; // Extra buffer percentage
  };

  // Network settings
  network: {
    maxConcurrentRequests: number;
    timeoutDuration: number; // ms
    retryAttempts: number;
    compressionEnabled: boolean;
    batchingEnabled: boolean;
  };

  // Performance thresholds
  thresholds: {
    frameRateTarget: number;
    memoryWarning: number; // percentage
    cpuWarning: number; // percentage
    batteryWarning: number; // percentage per hour
  };
}

export interface QualityAdaptationRule {
  id: string;
  condition: QualityCondition;
  action: QualityAction;
  priority: number;
  elderlySpecific: boolean;
  description: string;
}

export interface QualityCondition {
  type: 'memory' | 'cpu' | 'battery' | 'network' | 'framerate' | 'device_age' | 'user_interaction';
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: number | [number, number];
  duration?: number; // ms - condition must persist for this long
}

export interface QualityAction {
  type: 'change_profile' | 'adjust_audio' | 'adjust_ui' | 'adjust_memory' | 'adjust_network';
  parameters: {
    profileId?: string;
    audioQuality?: 'low' | 'medium' | 'high';
    uiComplexity?: 'simple' | 'normal' | 'full';
    memoryAggression?: 'low' | 'medium' | 'high';
    networkOptimization?: boolean;
  };
  elderlyNotification?: string;
}

export interface AdaptationHistory {
  timestamp: number;
  fromProfile: string;
  toProfile: string;
  trigger: string;
  userNotified: boolean;
  performanceImprovement: number; // percentage
  elderlyFeedback?: 'positive' | 'negative' | 'neutral';
}

class AdaptiveQualityService {
  private capabilities: DetailedDeviceCapabilities | null = null;
  private currentProfile: QualityProfile | null = null;
  private profiles: Map<string, QualityProfile> = new Map();
  private adaptationRules: QualityAdaptationRule[] = [];
  private adaptationHistory: AdaptationHistory[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Elderly-specific state
  private elderlyPreferences = {
    preferStability: true,
    acceptQualityReduction: true,
    wantNotifications: true,
    maxAdaptationsPerHour: 3,
  };

  // Performance tracking
  private lastAdaptationTime = 0;
  private adaptationCount = 0;
  private performanceImprovements: number[] = [];

  /**
   * Initialize adaptive quality system
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    // Load user preferences and history
    await this.loadElderlyPreferences();
    await this.loadAdaptationHistory();

    // Initialize quality profiles
    this.initializeQualityProfiles();
    this.initializeAdaptationRules();

    // Select optimal initial profile
    await this.selectOptimalProfile();

    // Start monitoring
    this.startAdaptationMonitoring();

    console.log('AdaptiveQualityService initialized for elderly user optimization');
  }

  /**
   * Initialize quality profiles for different device capabilities
   */
  private initializeQualityProfiles(): void {
    // Conservative profile for very old devices
    this.profiles.set('conservative', {
      id: 'conservative',
      name: 'Maximum Stability',
      description: 'Optimized for reliability on older devices',
      elderlyFriendly: true,
      audio: {
        sampleRate: 16000,
        bitRate: 64000,
        channels: 1,
        format: 'aac',
        compressionLevel: 'high',
        bufferSize: 10,
        voiceEnhancement: true,
        noiseReduction: true,
      },
      ui: {
        animationComplexity: 'none',
        imageQuality: 'low',
        renderingPriority: 'performance',
        enableVirtualization: true,
        maxConcurrentAnimations: 0,
        touchResponseDelay: 300,
      },
      memory: {
        maxAppMemory: 120,
        cacheSize: 20,
        aggressiveCleanup: true,
        compressionLevel: 'high',
        elderlyMemoryBuffer: 25,
      },
      network: {
        maxConcurrentRequests: 2,
        timeoutDuration: 15000,
        retryAttempts: 2,
        compressionEnabled: true,
        batchingEnabled: true,
      },
      thresholds: {
        frameRateTarget: 30,
        memoryWarning: 70,
        cpuWarning: 60,
        batteryWarning: 8,
      },
    });

    // Balanced profile for 3-4 year old devices
    this.profiles.set('balanced', {
      id: 'balanced',
      name: 'Balanced Performance',
      description: 'Good balance of quality and performance',
      elderlyFriendly: true,
      audio: {
        sampleRate: 22050,
        bitRate: 96000,
        channels: 1,
        format: 'aac',
        compressionLevel: 'medium',
        bufferSize: 20,
        voiceEnhancement: true,
        noiseReduction: true,
      },
      ui: {
        animationComplexity: 'simple',
        imageQuality: 'medium',
        renderingPriority: 'balanced',
        enableVirtualization: true,
        maxConcurrentAnimations: 2,
        touchResponseDelay: 200,
      },
      memory: {
        maxAppMemory: 180,
        cacheSize: 40,
        aggressiveCleanup: false,
        compressionLevel: 'medium',
        elderlyMemoryBuffer: 20,
      },
      network: {
        maxConcurrentRequests: 3,
        timeoutDuration: 12000,
        retryAttempts: 3,
        compressionEnabled: true,
        batchingEnabled: false,
      },
      thresholds: {
        frameRateTarget: 45,
        memoryWarning: 75,
        cpuWarning: 70,
        batteryWarning: 6,
      },
    });

    // Performance profile for newer devices (1-2 years old)
    this.profiles.set('performance', {
      id: 'performance',
      name: 'High Quality',
      description: 'Best quality for capable devices',
      elderlyFriendly: true,
      audio: {
        sampleRate: 44100,
        bitRate: 128000,
        channels: 1,
        format: 'aac',
        compressionLevel: 'low',
        bufferSize: 40,
        voiceEnhancement: true,
        noiseReduction: true,
      },
      ui: {
        animationComplexity: 'full',
        imageQuality: 'high',
        renderingPriority: 'quality',
        enableVirtualization: false,
        maxConcurrentAnimations: 5,
        touchResponseDelay: 100,
      },
      memory: {
        maxAppMemory: 250,
        cacheSize: 80,
        aggressiveCleanup: false,
        compressionLevel: 'low',
        elderlyMemoryBuffer: 15,
      },
      network: {
        maxConcurrentRequests: 5,
        timeoutDuration: 10000,
        retryAttempts: 3,
        compressionEnabled: false,
        batchingEnabled: false,
      },
      thresholds: {
        frameRateTarget: 60,
        memoryWarning: 80,
        cpuWarning: 75,
        batteryWarning: 5,
      },
    });

    // Emergency profile for critical performance issues
    this.profiles.set('emergency', {
      id: 'emergency',
      name: 'Emergency Mode',
      description: 'Minimal features for severe performance issues',
      elderlyFriendly: true,
      audio: {
        sampleRate: 11025,
        bitRate: 32000,
        channels: 1,
        format: 'aac',
        compressionLevel: 'high',
        bufferSize: 5,
        voiceEnhancement: false,
        noiseReduction: false,
      },
      ui: {
        animationComplexity: 'none',
        imageQuality: 'low',
        renderingPriority: 'performance',
        enableVirtualization: true,
        maxConcurrentAnimations: 0,
        touchResponseDelay: 500,
      },
      memory: {
        maxAppMemory: 80,
        cacheSize: 10,
        aggressiveCleanup: true,
        compressionLevel: 'high',
        elderlyMemoryBuffer: 30,
      },
      network: {
        maxConcurrentRequests: 1,
        timeoutDuration: 20000,
        retryAttempts: 1,
        compressionEnabled: true,
        batchingEnabled: true,
      },
      thresholds: {
        frameRateTarget: 15,
        memoryWarning: 60,
        cpuWarning: 50,
        batteryWarning: 10,
      },
    });
  }

  /**
   * Initialize adaptation rules for elderly users
   */
  private initializeAdaptationRules(): void {
    // Memory pressure rules
    this.adaptationRules.push({
      id: 'memory_high',
      condition: {
        type: 'memory',
        operator: 'greater_than',
        value: 85,
        duration: 10000,
      },
      action: {
        type: 'change_profile',
        parameters: { profileId: 'conservative' },
        elderlyNotification: 'The app is optimizing memory usage for better performance.',
      },
      priority: 1,
      elderlySpecific: true,
      description: 'Switch to conservative mode when memory usage is high',
    });

    // Battery optimization rules
    this.adaptationRules.push({
      id: 'battery_drain',
      condition: {
        type: 'battery',
        operator: 'greater_than',
        value: 8, // 8% per hour
        duration: 300000, // 5 minutes
      },
      action: {
        type: 'adjust_audio',
        parameters: { audioQuality: 'low' },
        elderlyNotification: 'Audio quality adjusted to save battery.',
      },
      priority: 2,
      elderlySpecific: true,
      description: 'Reduce audio quality when battery drain is high',
    });

    // Frame rate degradation rules
    this.adaptationRules.push({
      id: 'framerate_low',
      condition: {
        type: 'framerate',
        operator: 'less_than',
        value: 20,
        duration: 15000,
      },
      action: {
        type: 'adjust_ui',
        parameters: { uiComplexity: 'simple' },
        elderlyNotification: 'Interface simplified for smoother operation.',
      },
      priority: 1,
      elderlySpecific: true,
      description: 'Simplify UI when frame rate drops',
    });

    // Device age based rules
    this.adaptationRules.push({
      id: 'old_device',
      condition: {
        type: 'device_age',
        operator: 'greater_than',
        value: 4, // 4+ years old
      },
      action: {
        type: 'change_profile',
        parameters: { profileId: 'conservative' },
        elderlyNotification: 'Your device has been optimized for the best experience.',
      },
      priority: 3,
      elderlySpecific: true,
      description: 'Use conservative profile for very old devices',
    });

    // User interaction delay rules (elderly-specific)
    this.adaptationRules.push({
      id: 'slow_interactions',
      condition: {
        type: 'user_interaction',
        operator: 'greater_than',
        value: 500, // 500ms average interaction time
        duration: 60000,
      },
      action: {
        type: 'adjust_ui',
        parameters: { uiComplexity: 'simple' },
        elderlyNotification: 'Interface adjusted for easier use.',
      },
      priority: 2,
      elderlySpecific: true,
      description: 'Simplify interface for slow user interactions',
    });
  }

  /**
   * Select optimal initial profile based on device capabilities
   */
  private async selectOptimalProfile(): Promise<void> {
    if (!this.capabilities) {
      this.currentProfile = this.profiles.get('conservative') || null;
      return;
    }

    let profileId: string;

    // Select profile based on device tier and age
    if (this.capabilities.deviceTier === 'low' || this.capabilities.isLowEndDevice) {
      profileId = 'conservative';
    } else if (this.capabilities.deviceTier === 'medium') {
      profileId = 'balanced';
    } else {
      profileId = 'performance';
    }

    // Override for elderly preferences
    if (this.elderlyPreferences.preferStability) {
      if (profileId === 'performance') {
        profileId = 'balanced';
      }
    }

    await this.switchProfile(profileId, 'initial_selection');
    console.log(`Selected initial profile: ${profileId} for elderly user`);
  }

  /**
   * Start adaptation monitoring
   */
  private startAdaptationMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor more frequently for elderly users to catch issues early
    const monitoringInterval = this.capabilities?.isLowEndDevice ? 3000 : 5000;

    this.monitoringInterval = setInterval(() => {
      this.evaluateAdaptationRules();
    }, monitoringInterval);

    console.log('Adaptive quality monitoring started for elderly users');
  }

  /**
   * Evaluate adaptation rules and apply changes
   */
  private evaluateAdaptationRules(): void {
    if (!this.currentProfile) return;

    // Check if we've reached the adaptation limit for elderly users
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const recentAdaptations = this.adaptationHistory.filter(
      h => now - h.timestamp < oneHour
    ).length;

    if (recentAdaptations >= this.elderlyPreferences.maxAdaptationsPerHour) {
      return; // Don't overwhelm elderly users with too many changes
    }

    // Get current performance metrics
    const metrics = performanceMonitor.getMetrics();
    const memoryStatus = memoryManager.getMemoryStatus();

    // Sort rules by priority (elderly-specific rules get preference)
    const sortedRules = this.adaptationRules.sort((a, b) => {
      if (a.elderlySpecific && !b.elderlySpecific) return -1;
      if (!a.elderlySpecific && b.elderlySpecific) return 1;
      return a.priority - b.priority;
    });

    for (const rule of sortedRules) {
      if (this.evaluateCondition(rule.condition, metrics, memoryStatus)) {
        this.applyAdaptationRule(rule);
        break; // Apply only one rule at a time for elderly users
      }
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: QualityCondition,
    metrics: any,
    memoryStatus: any
  ): boolean {
    let currentValue: number;

    switch (condition.type) {
      case 'memory':
        currentValue = (memoryStatus.pool.used / memoryStatus.pool.total) * 100;
        break;
      case 'cpu':
        currentValue = metrics.cpuUsagePercentage;
        break;
      case 'battery':
        currentValue = metrics.batteryDrainRate;
        break;
      case 'framerate':
        currentValue = 1000 / Math.max(metrics.averageFrameTime, 1);
        break;
      case 'device_age':
        // Estimate device age from capabilities
        const ram = this.capabilities?.estimatedRAM || 2048;
        if (ram >= 6144) currentValue = 0; // New device
        else if (ram >= 4096) currentValue = 1.5;
        else if (ram >= 3072) currentValue = 2.5;
        else if (ram >= 2048) currentValue = 4;
        else currentValue = 6; // Very old device
        break;
      case 'user_interaction':
        currentValue = metrics.uiResponseTime || 0;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'greater_than':
        return currentValue > condition.value;
      case 'less_than':
        return currentValue < condition.value;
      case 'equals':
        return currentValue === condition.value;
      case 'between':
        if (Array.isArray(condition.value)) {
          return currentValue >= condition.value[0] && currentValue <= condition.value[1];
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Apply an adaptation rule
   */
  private async applyAdaptationRule(rule: QualityAdaptationRule): Promise<void> {
    console.log(`Applying adaptation rule: ${rule.description}`);

    const now = Date.now();
    const fromProfile = this.currentProfile?.id || 'unknown';

    switch (rule.action.type) {
      case 'change_profile':
        if (rule.action.parameters.profileId) {
          await this.switchProfile(rule.action.parameters.profileId, rule.id);
        }
        break;

      case 'adjust_audio':
        await this.adjustAudioQuality(rule.action.parameters.audioQuality);
        break;

      case 'adjust_ui':
        await this.adjustUIComplexity(rule.action.parameters.uiComplexity);
        break;

      case 'adjust_memory':
        await this.adjustMemoryAggression(rule.action.parameters.memoryAggression);
        break;

      case 'adjust_network':
        await this.adjustNetworkOptimization(rule.action.parameters.networkOptimization);
        break;
    }

    // Record adaptation for elderly users
    this.adaptationHistory.push({
      timestamp: now,
      fromProfile,
      toProfile: this.currentProfile?.id || 'unknown',
      trigger: rule.id,
      userNotified: !!rule.action.elderlyNotification,
      performanceImprovement: 0, // Will be measured later
    });

    // Notify elderly user if specified
    if (rule.action.elderlyNotification && this.elderlyPreferences.wantNotifications) {
      this.notifyElderlyUser(rule.action.elderlyNotification);
    }

    this.lastAdaptationTime = now;
    this.adaptationCount++;
  }

  /**
   * Switch to a different quality profile
   */
  private async switchProfile(profileId: string, trigger: string): Promise<void> {
    const newProfile = this.profiles.get(profileId);
    if (!newProfile || newProfile === this.currentProfile) return;

    const oldProfile = this.currentProfile;
    this.currentProfile = newProfile;

    // Apply profile settings to other services
    await this.applyProfileToServices(newProfile);

    // Save current profile
    await this.saveCurrentProfile();

    console.log(`Switched to profile: ${profileId} (trigger: ${trigger}) for elderly user`);
  }

  /**
   * Apply profile settings to other services
   */
  private async applyProfileToServices(profile: QualityProfile): Promise<void> {
    // Apply memory settings
    if (memoryManager) {
      await memoryManager.optimizeForElderly();
    }

    // The actual implementation would apply settings to:
    // - Audio service
    // - UI renderer
    // - Memory manager
    // - Network service
    // etc.
  }

  /**
   * Individual adjustment methods
   */
  private async adjustAudioQuality(quality?: 'low' | 'medium' | 'high'): Promise<void> {
    if (!quality || !this.currentProfile) return;

    const audioSettings = { ...this.currentProfile.audio };

    switch (quality) {
      case 'low':
        audioSettings.sampleRate = 16000;
        audioSettings.bitRate = 64000;
        audioSettings.compressionLevel = 'high';
        break;
      case 'medium':
        audioSettings.sampleRate = 22050;
        audioSettings.bitRate = 96000;
        audioSettings.compressionLevel = 'medium';
        break;
      case 'high':
        audioSettings.sampleRate = 44100;
        audioSettings.bitRate = 128000;
        audioSettings.compressionLevel = 'low';
        break;
    }

    this.currentProfile.audio = audioSettings;
    await this.saveCurrentProfile();
  }

  private async adjustUIComplexity(complexity?: 'simple' | 'normal' | 'full'): Promise<void> {
    if (!complexity || !this.currentProfile) return;

    const uiSettings = { ...this.currentProfile.ui };

    switch (complexity) {
      case 'simple':
        uiSettings.animationComplexity = 'none';
        uiSettings.imageQuality = 'low';
        uiSettings.maxConcurrentAnimations = 0;
        uiSettings.touchResponseDelay = 300;
        break;
      case 'normal':
        uiSettings.animationComplexity = 'simple';
        uiSettings.imageQuality = 'medium';
        uiSettings.maxConcurrentAnimations = 2;
        uiSettings.touchResponseDelay = 200;
        break;
      case 'full':
        uiSettings.animationComplexity = 'full';
        uiSettings.imageQuality = 'high';
        uiSettings.maxConcurrentAnimations = 5;
        uiSettings.touchResponseDelay = 100;
        break;
    }

    this.currentProfile.ui = uiSettings;
    await this.saveCurrentProfile();
  }

  private async adjustMemoryAggression(aggression?: 'low' | 'medium' | 'high'): Promise<void> {
    if (!aggression || !this.currentProfile) return;

    const memorySettings = { ...this.currentProfile.memory };

    switch (aggression) {
      case 'low':
        memorySettings.aggressiveCleanup = false;
        memorySettings.compressionLevel = 'low';
        memorySettings.cacheSize = Math.max(memorySettings.cacheSize, 40);
        break;
      case 'medium':
        memorySettings.aggressiveCleanup = false;
        memorySettings.compressionLevel = 'medium';
        break;
      case 'high':
        memorySettings.aggressiveCleanup = true;
        memorySettings.compressionLevel = 'high';
        memorySettings.cacheSize = Math.min(memorySettings.cacheSize, 20);
        break;
    }

    this.currentProfile.memory = memorySettings;
    await this.saveCurrentProfile();
  }

  private async adjustNetworkOptimization(enabled?: boolean): Promise<void> {
    if (enabled === undefined || !this.currentProfile) return;

    const networkSettings = { ...this.currentProfile.network };

    if (enabled) {
      networkSettings.compressionEnabled = true;
      networkSettings.batchingEnabled = true;
      networkSettings.maxConcurrentRequests = Math.min(networkSettings.maxConcurrentRequests, 2);
    } else {
      networkSettings.compressionEnabled = false;
      networkSettings.batchingEnabled = false;
    }

    this.currentProfile.network = networkSettings;
    await this.saveCurrentProfile();
  }

  /**
   * Notify elderly user about adaptations
   */
  private notifyElderlyUser(message: string): void {
    // This would show a gentle, non-intrusive notification
    console.log(`🔧 Optimization: ${message}`);

    // In a real implementation, this would:
    // - Show a gentle toast notification
    // - Use larger text for elderly users
    // - Auto-dismiss after a reasonable time
    // - Not interrupt current tasks
  }

  /**
   * Persistence methods
   */
  private async loadElderlyPreferences(): Promise<void> {
    try {
      const prefs = await AsyncStorage.getItem('elderlyPreferences');
      if (prefs) {
        this.elderlyPreferences = { ...this.elderlyPreferences, ...JSON.parse(prefs) };
      }
    } catch (error) {
      console.warn('Failed to load elderly preferences:', error);
    }
  }

  private async saveElderlyPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('elderlyPreferences', JSON.stringify(this.elderlyPreferences));
    } catch (error) {
      console.warn('Failed to save elderly preferences:', error);
    }
  }

  private async loadAdaptationHistory(): Promise<void> {
    try {
      const history = await AsyncStorage.getItem('adaptationHistory');
      if (history) {
        this.adaptationHistory = JSON.parse(history);
        // Keep only recent history (last 7 days)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.adaptationHistory = this.adaptationHistory.filter(h => h.timestamp > weekAgo);
      }
    } catch (error) {
      console.warn('Failed to load adaptation history:', error);
    }
  }

  private async saveAdaptationHistory(): Promise<void> {
    try {
      await AsyncStorage.setItem('adaptationHistory', JSON.stringify(this.adaptationHistory));
    } catch (error) {
      console.warn('Failed to save adaptation history:', error);
    }
  }

  private async saveCurrentProfile(): Promise<void> {
    try {
      await AsyncStorage.setItem('currentQualityProfile', JSON.stringify(this.currentProfile));
    } catch (error) {
      console.warn('Failed to save current profile:', error);
    }
  }

  /**
   * Public API methods
   */
  public getCurrentProfile(): QualityProfile | null {
    return this.currentProfile;
  }

  public getAvailableProfiles(): QualityProfile[] {
    return Array.from(this.profiles.values());
  }

  public getAdaptationHistory(): AdaptationHistory[] {
    return [...this.adaptationHistory];
  }

  public async setElderlyPreferences(preferences: Partial<typeof this.elderlyPreferences>): Promise<void> {
    this.elderlyPreferences = { ...this.elderlyPreferences, ...preferences };
    await this.saveElderlyPreferences();
  }

  public getPerformanceReport(): {
    currentProfile: string;
    adaptationsToday: number;
    averagePerformanceImprovement: number;
    elderlyOptimizationsActive: string[];
    recommendations: string[];
  } {
    const today = new Date().toDateString();
    const todayAdaptations = this.adaptationHistory.filter(
      h => new Date(h.timestamp).toDateString() === today
    );

    const avgImprovement = this.performanceImprovements.length > 0
      ? this.performanceImprovements.reduce((a, b) => a + b, 0) / this.performanceImprovements.length
      : 0;

    const elderlyOptimizations: string[] = [];
    if (this.currentProfile?.elderlyFriendly) {
      elderlyOptimizations.push('Elderly-friendly interface active');
    }
    if (this.currentProfile?.audio.voiceEnhancement) {
      elderlyOptimizations.push('Voice enhancement enabled');
    }
    if (this.currentProfile?.ui.touchResponseDelay > 200) {
      elderlyOptimizations.push('Extended touch response time');
    }

    const recommendations: string[] = [];
    if (todayAdaptations.length > 5) {
      recommendations.push('Consider restarting the app to refresh performance');
    }
    if (this.currentProfile?.id === 'emergency') {
      recommendations.push('Your device may benefit from closing other apps');
    }

    return {
      currentProfile: this.currentProfile?.name || 'Unknown',
      adaptationsToday: todayAdaptations.length,
      averagePerformanceImprovement: avgImprovement,
      elderlyOptimizationsActive: elderlyOptimizations,
      recommendations,
    };
  }

  public stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.saveAdaptationHistory();
  }
}

export const adaptiveQualityService = new AdaptiveQualityService();