/**
 * Memory Manager for Memoria.ai
 * Intelligent memory allocation and cleanup for elderly users on older devices
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { performanceMonitor } from './PerformanceMonitor';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';

export interface MemoryAllocation {
  id: string;
  type: 'audio' | 'transcription' | 'ui' | 'cache' | 'image' | 'metadata';
  size: number; // bytes
  priority: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
  elderlyOptimized: boolean;
  canCompress: boolean;
  canEvict: boolean;
}

export interface MemoryPool {
  total: number;
  used: number;
  available: number;
  reserved: number; // Reserved for critical operations
  elderlyBuffer: number; // Extra buffer for elderly users
}

export interface MemoryPressureLevel {
  level: 'normal' | 'moderate' | 'high' | 'critical';
  percentage: number;
  actions: string[];
  elderlyImpact: 'none' | 'minor' | 'moderate' | 'severe';
}

export interface MemoryOptimizationResult {
  bytesFreed: number;
  allocationsEvicted: number;
  compressionApplied: boolean;
  elderlyFeaturesAffected: string[];
  performanceImprovement: number; // percentage
}

export interface AudioMemoryConfig {
  maxRecordingBuffer: number; // MB
  maxTranscriptionCache: number; // MB
  compressionLevel: 'low' | 'medium' | 'high';
  elderlyOptimizations: {
    largerBuffers: boolean;
    aggressiveCleanup: boolean;
    prioritizeStability: boolean;
  };
}

class MemoryManager {
  private allocations: Map<string, MemoryAllocation> = new Map();
  private memoryPool: MemoryPool;
  private capabilities: DetailedDeviceCapabilities | null = null;
  private isMonitoring = false;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private pressureCheckInterval: NodeJS.Timeout | null = null;

  // Audio-specific memory management
  private audioBuffers: Map<string, ArrayBuffer> = new Map();
  private transcriptionCache: Map<string, string> = new Map();
  private imageCache: Map<string, string> = new Map();

  // Elderly-specific memory configuration
  private elderlyConfig = {
    memoryBufferPercentage: 20, // 20% extra buffer for stability
    aggressiveCleanupThreshold: 70, // Start cleanup at 70% instead of 80%
    prioritizeCriticalFeatures: true,
    preventMemoryFragmentation: true,
  };

  // Performance tracking
  private cleanupCount = 0;
  private compressionCount = 0;
  private elderlyOptimizationCount = 0;

  constructor() {
    this.memoryPool = this.initializeMemoryPool();
  }

  /**
   * Initialize memory management
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    if (this.capabilities) {
      this.adjustMemoryPoolForDevice();
    }

    await this.loadMemoryConfiguration();
    this.startMemoryMonitoring();

    console.log('MemoryManager initialized for elderly user optimization');
  }

  /**
   * Initialize memory pool based on device capabilities
   */
  private initializeMemoryPool(): MemoryPool {
    // Conservative default values for elderly users
    const defaultTotal = 150 * 1024 * 1024; // 150MB
    const elderlyBuffer = defaultTotal * 0.2; // 20% buffer
    const reserved = defaultTotal * 0.1; // 10% reserved

    return {
      total: defaultTotal,
      used: 0,
      available: defaultTotal - reserved - elderlyBuffer,
      reserved,
      elderlyBuffer,
    };
  }

  /**
   * Adjust memory pool based on device capabilities
   */
  private adjustMemoryPoolForDevice(): void {
    if (!this.capabilities) return;

    const deviceMemoryLimit = this.capabilities.maxMemoryUsage * 1024 * 1024; // Convert MB to bytes
    const elderlyBuffer = deviceMemoryLimit * (this.elderlyConfig.memoryBufferPercentage / 100);
    const reserved = deviceMemoryLimit * 0.1;

    this.memoryPool = {
      total: deviceMemoryLimit,
      used: 0,
      available: deviceMemoryLimit - reserved - elderlyBuffer,
      reserved,
      elderlyBuffer,
    };

    console.log(`Memory pool adjusted for device: ${Math.round(deviceMemoryLimit / 1024 / 1024)}MB total`);
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Memory cleanup interval - more frequent for elderly users
    const cleanupInterval = this.capabilities?.isLowEndDevice ? 30000 : 60000; // 30s or 60s
    this.cleanupInterval = setInterval(() => {
      this.performMaintenanceCleanup();
    }, cleanupInterval);

    // Memory pressure check - frequent for elderly users
    this.pressureCheckInterval = setInterval(() => {
      this.checkMemoryPressure();
    }, 5000); // Every 5 seconds

    console.log('Memory monitoring started with elderly optimizations');
  }

  /**
   * Stop memory monitoring
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.pressureCheckInterval) {
      clearInterval(this.pressureCheckInterval);
      this.pressureCheckInterval = null;
    }
  }

  /**
   * Allocate memory with elderly-specific considerations
   */
  public async allocateMemory(
    id: string,
    size: number,
    type: MemoryAllocation['type'],
    priority: MemoryAllocation['priority'] = 'medium',
    elderlyOptimized = true
  ): Promise<boolean> {
    // Check if allocation is possible
    if (!this.canAllocate(size)) {
      // Try to free memory for elderly users
      const freed = await this.attemptMemoryRecovery(size, priority);
      if (!freed) {
        console.warn(`Cannot allocate ${Math.round(size / 1024)}KB for ${type} (elderly user)`);
        return false;
      }
    }

    // Create allocation record
    const allocation: MemoryAllocation = {
      id,
      type,
      size,
      priority,
      timestamp: Date.now(),
      elderlyOptimized,
      canCompress: this.canCompress(type),
      canEvict: this.canEvict(type, priority),
    };

    this.allocations.set(id, allocation);
    this.memoryPool.used += size;
    this.memoryPool.available -= size;

    console.log(`Allocated ${Math.round(size / 1024)}KB for ${type} (elderly optimized: ${elderlyOptimized})`);
    return true;
  }

  /**
   * Deallocate memory
   */
  public deallocateMemory(id: string): boolean {
    const allocation = this.allocations.get(id);
    if (!allocation) return false;

    this.allocations.delete(id);
    this.memoryPool.used -= allocation.size;
    this.memoryPool.available += allocation.size;

    // Clean up associated data
    this.cleanupAssociatedData(id, allocation.type);

    console.log(`Deallocated ${Math.round(allocation.size / 1024)}KB for ${allocation.type}`);
    return true;
  }

  /**
   * Check if memory can be allocated
   */
  private canAllocate(size: number): boolean {
    return this.memoryPool.available >= size;
  }

  /**
   * Attempt memory recovery for elderly users
   */
  private async attemptMemoryRecovery(requestedSize: number, priority: MemoryAllocation['priority']): Promise<boolean> {
    console.log(`Attempting memory recovery for ${Math.round(requestedSize / 1024)}KB (elderly user)`);

    // Strategy 1: Compress existing allocations
    const compressionResult = await this.compressAllocations();
    if (compressionResult.bytesFreed >= requestedSize) {
      return true;
    }

    // Strategy 2: Evict low-priority allocations (elderly-friendly)
    const evictionResult = await this.evictLowPriorityAllocations(requestedSize, priority);
    if (evictionResult.bytesFreed >= requestedSize) {
      return true;
    }

    // Strategy 3: Emergency cleanup (preserve elderly features)
    const emergencyResult = await this.performEmergencyCleanup(requestedSize);
    return emergencyResult.bytesFreed >= requestedSize;
  }

  /**
   * Compress allocations to free memory
   */
  private async compressAllocations(): Promise<MemoryOptimizationResult> {
    let bytesFreed = 0;
    let compressionApplied = false;
    const elderlyFeaturesAffected: string[] = [];

    for (const [id, allocation] of this.allocations.entries()) {
      if (allocation.canCompress && allocation.type !== 'audio') {
        // Simulate compression (would implement actual compression)
        const compressionRatio = this.getCompressionRatio(allocation.type);
        const bytesSaved = Math.floor(allocation.size * compressionRatio);

        allocation.size -= bytesSaved;
        bytesFreed += bytesSaved;
        compressionApplied = true;
        this.compressionCount++;

        if (allocation.elderlyOptimized) {
          elderlyFeaturesAffected.push(`${allocation.type} compressed`);
        }
      }
    }

    this.memoryPool.used -= bytesFreed;
    this.memoryPool.available += bytesFreed;

    console.log(`Compression freed ${Math.round(bytesFreed / 1024)}KB`);

    return {
      bytesFreed,
      allocationsEvicted: 0,
      compressionApplied,
      elderlyFeaturesAffected,
      performanceImprovement: bytesFreed > 0 ? 10 : 0,
    };
  }

  /**
   * Evict low-priority allocations (elderly-friendly)
   */
  private async evictLowPriorityAllocations(
    targetSize: number,
    protectedPriority: MemoryAllocation['priority']
  ): Promise<MemoryOptimizationResult> {
    let bytesFreed = 0;
    let allocationsEvicted = 0;
    const elderlyFeaturesAffected: string[] = [];

    // Sort allocations by priority and elderly optimization
    const sortedAllocations = Array.from(this.allocations.entries())
      .filter(([_, allocation]) => allocation.canEvict)
      .sort(([_, a], [__, b]) => {
        // Protect elderly-optimized features
        if (a.elderlyOptimized && !b.elderlyOptimized) return 1;
        if (!a.elderlyOptimized && b.elderlyOptimized) return -1;

        // Priority order: low -> medium -> high -> critical
        const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    const protectedPriorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };

    for (const [id, allocation] of sortedAllocations) {
      if (bytesFreed >= targetSize) break;

      // Don't evict allocations with same or higher priority
      if (protectedPriorityOrder[allocation.priority] >= protectedPriorityOrder[protectedPriority]) {
        continue;
      }

      // Be extra careful with elderly-optimized features
      if (allocation.elderlyOptimized && allocation.priority !== 'low') {
        continue;
      }

      this.deallocateMemory(id);
      bytesFreed += allocation.size;
      allocationsEvicted++;

      if (allocation.elderlyOptimized) {
        elderlyFeaturesAffected.push(`${allocation.type} temporarily removed`);
      }
    }

    console.log(`Eviction freed ${Math.round(bytesFreed / 1024)}KB (${allocationsEvicted} allocations)`);

    return {
      bytesFreed,
      allocationsEvicted,
      compressionApplied: false,
      elderlyFeaturesAffected,
      performanceImprovement: bytesFreed > 0 ? 15 : 0,
    };
  }

  /**
   * Emergency cleanup preserving elderly features
   */
  private async performEmergencyCleanup(targetSize: number): Promise<MemoryOptimizationResult> {
    console.warn('Performing emergency memory cleanup for elderly user');

    let bytesFreed = 0;
    const elderlyFeaturesAffected: string[] = [];

    // Clear non-critical caches first
    const cacheCleared = this.clearNonCriticalCaches();
    bytesFreed += cacheCleared;

    // Clear image cache (keep most recent for elderly users)
    const imageCleared = this.clearImageCache(true); // keepRecent = true
    bytesFreed += imageCleared;

    // Clear transcription cache (keep current session for elderly users)
    const transcriptionCleared = this.clearTranscriptionCache(true);
    bytesFreed += transcriptionCleared;

    if (bytesFreed < targetSize) {
      elderlyFeaturesAffected.push('Some cached content temporarily cleared');
    }

    this.memoryPool.used -= bytesFreed;
    this.memoryPool.available += bytesFreed;

    return {
      bytesFreed,
      allocationsEvicted: 0,
      compressionApplied: false,
      elderlyFeaturesAffected,
      performanceImprovement: 20,
    };
  }

  /**
   * Perform maintenance cleanup
   */
  private performMaintenanceCleanup(): void {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes for elderly users (longer than usual)
    let freedBytes = 0;

    // Clean up old allocations
    for (const [id, allocation] of this.allocations.entries()) {
      if (allocation.canEvict &&
          allocation.priority === 'low' &&
          now - allocation.timestamp > maxAge &&
          !allocation.elderlyOptimized) {
        freedBytes += allocation.size;
        this.deallocateMemory(id);
      }
    }

    // Clean up audio buffers (keep recent for elderly users)
    freedBytes += this.cleanupAudioBuffers();

    // Clean up transcription cache
    freedBytes += this.cleanupTranscriptionCache();

    if (freedBytes > 0) {
      this.cleanupCount++;
      console.log(`Maintenance cleanup freed ${Math.round(freedBytes / 1024)}KB`);
    }
  }

  /**
   * Check memory pressure and respond appropriately
   */
  private checkMemoryPressure(): void {
    const pressureLevel = this.getMemoryPressureLevel();

    if (pressureLevel.level !== 'normal') {
      this.handleMemoryPressure(pressureLevel);
    }
  }

  /**
   * Get current memory pressure level
   */
  private getMemoryPressureLevel(): MemoryPressureLevel {
    const usagePercentage = (this.memoryPool.used / this.memoryPool.total) * 100;

    // More conservative thresholds for elderly users
    if (usagePercentage >= 90) {
      return {
        level: 'critical',
        percentage: usagePercentage,
        actions: ['Emergency cleanup', 'Disable non-essential features', 'Notify user'],
        elderlyImpact: 'severe',
      };
    } else if (usagePercentage >= 80) {
      return {
        level: 'high',
        percentage: usagePercentage,
        actions: ['Aggressive cleanup', 'Compress data', 'Reduce cache size'],
        elderlyImpact: 'moderate',
      };
    } else if (usagePercentage >= this.elderlyConfig.aggressiveCleanupThreshold) {
      return {
        level: 'moderate',
        percentage: usagePercentage,
        actions: ['Proactive cleanup', 'Gentle optimization'],
        elderlyImpact: 'minor',
      };
    }

    return {
      level: 'normal',
      percentage: usagePercentage,
      actions: [],
      elderlyImpact: 'none',
    };
  }

  /**
   * Handle memory pressure with elderly considerations
   */
  private async handleMemoryPressure(pressure: MemoryPressureLevel): Promise<void> {
    console.log(`Memory pressure: ${pressure.level} (${pressure.percentage.toFixed(1)}%) - elderly impact: ${pressure.elderlyImpact}`);

    // Notify performance monitor
    performanceMonitor.getMetrics(); // This would trigger the memory pressure event

    switch (pressure.level) {
      case 'moderate':
        await this.compressAllocations();
        break;

      case 'high':
        await this.compressAllocations();
        await this.evictLowPriorityAllocations(this.memoryPool.elderlyBuffer, 'medium');
        break;

      case 'critical':
        await this.performEmergencyCleanup(this.memoryPool.elderlyBuffer);
        this.elderlyOptimizationCount++;
        break;
    }
  }

  /**
   * Audio-specific memory management
   */
  public async allocateAudioBuffer(id: string, sizeInSeconds: number, quality: 'low' | 'medium' | 'high'): Promise<boolean> {
    const sampleRate = quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 16000;
    const bytesPerSample = 2; // 16-bit audio
    const channels = 1; // Mono for elderly users (smaller files)
    const bufferSize = sizeInSeconds * sampleRate * bytesPerSample * channels;

    // Adjust buffer size for elderly users (slightly larger for stability)
    const elderlyAdjustment = this.capabilities?.isLowEndDevice ? 1.0 : 1.1;
    const adjustedSize = Math.floor(bufferSize * elderlyAdjustment);

    return await this.allocateMemory(id, adjustedSize, 'audio', 'high', true);
  }

  public deallocateAudioBuffer(id: string): boolean {
    this.audioBuffers.delete(id);
    return this.deallocateMemory(id);
  }

  public async cacheTranscription(memoryId: string, transcription: string): Promise<boolean> {
    const size = transcription.length * 2; // UTF-16 characters
    const allocated = await this.allocateMemory(`transcription_${memoryId}`, size, 'transcription', 'medium', true);

    if (allocated) {
      this.transcriptionCache.set(memoryId, transcription);
    }

    return allocated;
  }

  /**
   * Cache management methods
   */
  private clearNonCriticalCaches(): number {
    // Clear caches that don't affect elderly user experience
    let freedBytes = 0;

    // Clear old image previews (keep recent ones)
    const imageEntries = Array.from(this.imageCache.entries());
    const keepCount = Math.max(5, Math.floor(imageEntries.length * 0.3)); // Keep 30% or at least 5

    imageEntries.slice(keepCount).forEach(([id, _]) => {
      const allocation = this.allocations.get(`image_${id}`);
      if (allocation) {
        freedBytes += allocation.size;
        this.deallocateMemory(`image_${id}`);
      }
      this.imageCache.delete(id);
    });

    return freedBytes;
  }

  private clearImageCache(keepRecent = false): number {
    let freedBytes = 0;

    if (keepRecent) {
      // Keep 3 most recent images for elderly users
      const entries = Array.from(this.imageCache.entries());
      const toDelete = entries.slice(3);

      toDelete.forEach(([id, _]) => {
        const allocation = this.allocations.get(`image_${id}`);
        if (allocation) {
          freedBytes += allocation.size;
          this.deallocateMemory(`image_${id}`);
        }
        this.imageCache.delete(id);
      });
    } else {
      // Clear all
      for (const id of this.imageCache.keys()) {
        const allocation = this.allocations.get(`image_${id}`);
        if (allocation) {
          freedBytes += allocation.size;
          this.deallocateMemory(`image_${id}`);
        }
      }
      this.imageCache.clear();
    }

    return freedBytes;
  }

  private clearTranscriptionCache(keepCurrent = false): number {
    let freedBytes = 0;

    if (keepCurrent) {
      // Keep current session transcriptions for elderly users
      const now = Date.now();
      const currentSessionThreshold = 60 * 60 * 1000; // 1 hour

      for (const [id, _] of this.transcriptionCache.entries()) {
        const allocation = this.allocations.get(`transcription_${id}`);
        if (allocation && now - allocation.timestamp > currentSessionThreshold) {
          freedBytes += allocation.size;
          this.deallocateMemory(`transcription_${id}`);
          this.transcriptionCache.delete(id);
        }
      }
    } else {
      // Clear all
      for (const id of this.transcriptionCache.keys()) {
        const allocation = this.allocations.get(`transcription_${id}`);
        if (allocation) {
          freedBytes += allocation.size;
          this.deallocateMemory(`transcription_${id}`);
        }
      }
      this.transcriptionCache.clear();
    }

    return freedBytes;
  }

  private cleanupAudioBuffers(): number {
    let freedBytes = 0;
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes for audio buffers

    for (const [id, _] of this.audioBuffers.entries()) {
      const allocation = this.allocations.get(id);
      if (allocation && now - allocation.timestamp > maxAge) {
        freedBytes += allocation.size;
        this.deallocateAudioBuffer(id);
      }
    }

    return freedBytes;
  }

  private cleanupTranscriptionCache(): number {
    return this.clearTranscriptionCache(true);
  }

  /**
   * Helper methods
   */
  private canCompress(type: MemoryAllocation['type']): boolean {
    return ['transcription', 'metadata', 'cache'].includes(type);
  }

  private canEvict(type: MemoryAllocation['type'], priority: MemoryAllocation['priority']): boolean {
    if (priority === 'critical') return false;
    if (type === 'audio') return false; // Never evict audio during recording
    return true;
  }

  private getCompressionRatio(type: MemoryAllocation['type']): number {
    switch (type) {
      case 'transcription': return 0.3; // 30% savings
      case 'metadata': return 0.4; // 40% savings
      case 'cache': return 0.5; // 50% savings
      default: return 0.1; // 10% savings
    }
  }

  private cleanupAssociatedData(id: string, type: MemoryAllocation['type']): void {
    switch (type) {
      case 'audio':
        this.audioBuffers.delete(id);
        break;
      case 'transcription':
        // Extract memory ID from transcription allocation ID
        const memoryId = id.replace('transcription_', '');
        this.transcriptionCache.delete(memoryId);
        break;
      case 'image':
        const imageId = id.replace('image_', '');
        this.imageCache.delete(imageId);
        break;
    }
  }

  /**
   * Configuration management
   */
  private async loadMemoryConfiguration(): Promise<void> {
    try {
      const config = await AsyncStorage.getItem('memoryConfig');
      if (config) {
        this.elderlyConfig = { ...this.elderlyConfig, ...JSON.parse(config) };
      }
    } catch (error) {
      console.warn('Failed to load memory configuration:', error);
    }
  }

  public async saveMemoryConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem('memoryConfig', JSON.stringify(this.elderlyConfig));
    } catch (error) {
      console.warn('Failed to save memory configuration:', error);
    }
  }

  /**
   * Public API methods
   */
  public getMemoryStatus(): {
    pool: MemoryPool;
    pressure: MemoryPressureLevel;
    allocations: number;
    elderlyOptimizations: number;
    recommendations: string[];
  } {
    const pressure = this.getMemoryPressureLevel();
    const recommendations: string[] = [];

    if (pressure.level !== 'normal') {
      recommendations.push('Memory usage is high. Some optimizations may be applied automatically.');
    }

    if (this.capabilities?.isLowEndDevice) {
      recommendations.push('Your device would benefit from regular app restarts to maintain optimal performance.');
    }

    return {
      pool: { ...this.memoryPool },
      pressure,
      allocations: this.allocations.size,
      elderlyOptimizations: this.elderlyOptimizationCount,
      recommendations,
    };
  }

  public getAudioMemoryConfig(): AudioMemoryConfig {
    const quality = this.capabilities?.maxRecordingQuality || 'medium';
    const isLowEnd = this.capabilities?.isLowEndDevice || false;

    return {
      maxRecordingBuffer: isLowEnd ? 30 : 60, // MB
      maxTranscriptionCache: isLowEnd ? 10 : 20, // MB
      compressionLevel: isLowEnd ? 'high' : 'medium',
      elderlyOptimizations: {
        largerBuffers: !isLowEnd, // Larger buffers for stability on capable devices
        aggressiveCleanup: isLowEnd,
        prioritizeStability: true,
      },
    };
  }

  public async optimizeForElderly(): Promise<MemoryOptimizationResult> {
    console.log('Applying elderly-specific memory optimizations');

    const result = await this.compressAllocations();
    result.elderlyFeaturesAffected.push('Memory optimized for better stability');

    this.elderlyOptimizationCount++;
    return result;
  }

  public getOptimizationStats(): {
    cleanupCount: number;
    compressionCount: number;
    elderlyOptimizationCount: number;
    memoryEfficiency: number;
  } {
    const efficiency = this.memoryPool.total > 0
      ? ((this.memoryPool.total - this.memoryPool.used) / this.memoryPool.total) * 100
      : 0;

    return {
      cleanupCount: this.cleanupCount,
      compressionCount: this.compressionCount,
      elderlyOptimizationCount: this.elderlyOptimizationCount,
      memoryEfficiency: efficiency,
    };
  }
}

export const memoryManager = new MemoryManager();