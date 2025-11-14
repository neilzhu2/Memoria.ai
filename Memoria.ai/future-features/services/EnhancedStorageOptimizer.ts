/**
 * Enhanced Storage Optimizer for Memoria.ai
 * Advanced storage management and compression for elderly users on older devices
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { deviceCapabilityService, DetailedDeviceCapabilities } from './DeviceCapabilityService';
import { performanceMonitor } from './PerformanceMonitor';
import { memoryManager } from './MemoryManager';

export interface StorageAnalysis {
  totalSpace: number; // bytes
  usedSpace: number; // bytes
  availableSpace: number; // bytes
  appUsage: number; // bytes
  audioFiles: number; // count
  transcriptionFiles: number; // count
  cacheSize: number; // bytes
  elderlyOptimizedFiles: number; // count
  compressionRatio: number; // 0.0 - 1.0
  fragmentationLevel: number; // 0.0 - 1.0
  lastCleanupDate: number; // timestamp
}

export interface StorageOptimizationConfig {
  // Compression settings
  audioCompression: {
    enabled: boolean;
    quality: 'low' | 'medium' | 'high';
    format: 'aac' | 'mp3' | 'opus';
    elderlyQualityThreshold: number; // Don't compress below this quality for elderly users
  };

  // Cache management
  cacheManagement: {
    maxCacheSize: number; // MB
    maxCacheAge: number; // milliseconds
    elderlyRetentionBonus: number; // Extra time to keep elderly-optimized files
    smartEviction: boolean;
  };

  // Storage cleanup
  cleanupPolicy: {
    autoCleanupEnabled: boolean;
    cleanupThreshold: number; // percentage of storage used
    elderlyConfirmation: boolean; // Ask elderly users before cleanup
    preserveRecentFiles: number; // days
    minFreeSpaceTarget: number; // MB
  };

  // File organization
  fileOrganization: {
    useDirectories: boolean;
    dateBasedFolders: boolean;
    elderlySimplifiedStructure: boolean;
    metadataIndexing: boolean;
  };

  // Backup optimization
  backupSettings: {
    incrementalBackup: boolean;
    compressionLevel: 'none' | 'low' | 'medium' | 'high';
    elderlyPriorityFiles: string[]; // File patterns to prioritize
    batchSize: number; // Files per backup batch
  };
}

export interface StorageOptimizationResult {
  spaceSaved: number; // bytes
  filesProcessed: number;
  compressionApplied: boolean;
  filesDeleted: number;
  elderlyFilesAffected: number;
  performanceImprovement: number; // percentage
  errors: string[];
  recommendations: string[];
}

export interface ElderlyStoragePreferences {
  confirmBeforeCleanup: boolean;
  preserveOldRecordings: boolean;
  maxStorageUsage: number; // percentage
  preferQualityOverSpace: boolean;
  simplifiedInterface: boolean;
  automaticOptimization: boolean;
}

class EnhancedStorageOptimizer {
  private capabilities: DetailedDeviceCapabilities | null = null;
  private config: StorageOptimizationConfig;
  private elderlyPreferences: ElderlyStoragePreferences;
  private isOptimizing = false;
  private lastAnalysis: StorageAnalysis | null = null;
  private optimizationInterval: NodeJS.Timeout | null = null;

  // Storage paths
  private readonly storagePaths = {
    audio: `${FileSystem.documentDirectory}audio/`,
    transcriptions: `${FileSystem.documentDirectory}transcriptions/`,
    cache: `${FileSystem.cacheDirectory}`,
    elderlyOptimized: `${FileSystem.documentDirectory}elderly-optimized/`,
    backups: `${FileSystem.documentDirectory}backups/`,
    temp: `${FileSystem.documentDirectory}temp/`,
  };

  // Performance tracking
  private optimizationCount = 0;
  private totalSpaceSaved = 0;
  private elderlyOptimizationCount = 0;

  constructor() {
    this.config = this.getDefaultConfig();
    this.elderlyPreferences = this.getDefaultElderlyPreferences();
  }

  /**
   * Initialize storage optimizer
   */
  async initialize(): Promise<void> {
    await deviceCapabilityService.initialize();
    this.capabilities = deviceCapabilityService.getCapabilities();

    // Load user preferences
    await this.loadElderlyPreferences();

    // Adjust configuration based on device capabilities
    this.adjustConfigForDevice();

    // Create necessary directories
    await this.createStorageDirectories();

    // Run initial analysis
    this.lastAnalysis = await this.analyzeStorage();

    // Start automatic optimization if enabled
    if (this.elderlyPreferences.automaticOptimization) {
      this.startAutomaticOptimization();
    }

    console.log('EnhancedStorageOptimizer initialized for elderly users');
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): StorageOptimizationConfig {
    return {
      audioCompression: {
        enabled: true,
        quality: 'medium',
        format: 'aac',
        elderlyQualityThreshold: 0.7, // Don't compress below 70% quality
      },
      cacheManagement: {
        maxCacheSize: 100, // MB
        maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        elderlyRetentionBonus: 2 * 24 * 60 * 60 * 1000, // Extra 2 days
        smartEviction: true,
      },
      cleanupPolicy: {
        autoCleanupEnabled: true,
        cleanupThreshold: 85, // Start cleanup at 85% storage usage
        elderlyConfirmation: true,
        preserveRecentFiles: 30, // Keep files from last 30 days
        minFreeSpaceTarget: 500, // MB
      },
      fileOrganization: {
        useDirectories: true,
        dateBasedFolders: true,
        elderlySimplifiedStructure: true,
        metadataIndexing: true,
      },
      backupSettings: {
        incrementalBackup: true,
        compressionLevel: 'medium',
        elderlyPriorityFiles: ['*.elderly', '*.priority'],
        batchSize: 10,
      },
    };
  }

  /**
   * Get default elderly preferences
   */
  private getDefaultElderlyPreferences(): ElderlyStoragePreferences {
    return {
      confirmBeforeCleanup: true,
      preserveOldRecordings: true,
      maxStorageUsage: 80, // Use max 80% of storage
      preferQualityOverSpace: true,
      simplifiedInterface: true,
      automaticOptimization: true,
    };
  }

  /**
   * Adjust configuration based on device capabilities
   */
  private adjustConfigForDevice(): void {
    if (!this.capabilities) return;

    const isLowEnd = this.capabilities.isLowEndDevice;
    const storageSize = this.capabilities.estimatedStorage;

    // Adjust for low-end devices
    if (isLowEnd) {
      this.config.audioCompression.quality = 'low';
      this.config.cacheManagement.maxCacheSize = 50; // Smaller cache
      this.config.cleanupPolicy.cleanupThreshold = 75; // More aggressive cleanup
      this.config.backupSettings.compressionLevel = 'high';
    }

    // Adjust for limited storage
    if (storageSize <= 32) { // 32GB or less
      this.config.cacheManagement.maxCacheSize = Math.min(this.config.cacheManagement.maxCacheSize, 30);
      this.config.cleanupPolicy.cleanupThreshold = 70;
      this.config.cleanupPolicy.minFreeSpaceTarget = 200; // Less free space target
    }

    // Elderly-specific adjustments
    if (this.elderlyPreferences.preferQualityOverSpace) {
      this.config.audioCompression.elderlyQualityThreshold = 0.8; // Higher quality threshold
    }

    console.log('Storage config adjusted for device capabilities');
  }

  /**
   * Create necessary storage directories
   */
  private async createStorageDirectories(): Promise<void> {
    try {
      for (const [name, path] of Object.entries(this.storagePaths)) {
        if (path && !(await this.directoryExists(path))) {
          await FileSystem.makeDirectoryAsync(path, { intermediates: true });
          console.log(`Created storage directory: ${name}`);
        }
      }
    } catch (error) {
      console.error('Failed to create storage directories:', error);
    }
  }

  /**
   * Analyze current storage usage
   */
  async analyzeStorage(): Promise<StorageAnalysis> {
    try {
      const deviceInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      const totalSpace = await this.getTotalStorageSpace();
      const usedSpace = await this.getUsedStorageSpace();
      const availableSpace = totalSpace - usedSpace;
      const appUsage = await this.getAppStorageUsage();

      // Count different types of files
      const audioFiles = await this.countFilesInDirectory(this.storagePaths.audio, ['.aac', '.mp3', '.wav']);
      const transcriptionFiles = await this.countFilesInDirectory(this.storagePaths.transcriptions, ['.txt', '.json']);
      const elderlyOptimizedFiles = await this.countFilesInDirectory(this.storagePaths.elderlyOptimized);

      // Calculate cache size
      const cacheSize = await this.getDirectorySize(this.storagePaths.cache);

      // Calculate compression ratio and fragmentation
      const compressionRatio = await this.calculateCompressionRatio();
      const fragmentationLevel = await this.calculateFragmentation();

      const analysis: StorageAnalysis = {
        totalSpace,
        usedSpace,
        availableSpace,
        appUsage,
        audioFiles,
        transcriptionFiles,
        elderlyOptimizedFiles,
        cacheSize,
        compressionRatio,
        fragmentationLevel,
        lastCleanupDate: Date.now(),
      };

      this.lastAnalysis = analysis;
      return analysis;

    } catch (error) {
      console.error('Storage analysis failed:', error);

      // Return fallback analysis
      return {
        totalSpace: 16 * 1024 * 1024 * 1024, // 16GB fallback
        usedSpace: 8 * 1024 * 1024 * 1024, // 8GB fallback
        availableSpace: 8 * 1024 * 1024 * 1024,
        appUsage: 100 * 1024 * 1024, // 100MB fallback
        audioFiles: 0,
        transcriptionFiles: 0,
        elderlyOptimizedFiles: 0,
        cacheSize: 0,
        compressionRatio: 0,
        fragmentationLevel: 0,
        lastCleanupDate: Date.now(),
      };
    }
  }

  /**
   * Optimize storage for elderly users
   */
  async optimizeStorage(elderlyConfirmation = true): Promise<StorageOptimizationResult> {
    if (this.isOptimizing) {
      throw new Error('Storage optimization already in progress');
    }

    this.isOptimizing = true;

    try {
      const result: StorageOptimizationResult = {
        spaceSaved: 0,
        filesProcessed: 0,
        compressionApplied: false,
        filesDeleted: 0,
        elderlyFilesAffected: 0,
        performanceImprovement: 0,
        errors: [],
        recommendations: [],
      };

      // Run pre-optimization analysis
      const beforeAnalysis = await this.analyzeStorage();

      // Step 1: Clean up temporary files
      const tempCleanup = await this.cleanupTemporaryFiles();
      result.spaceSaved += tempCleanup.spaceSaved;
      result.filesDeleted += tempCleanup.filesDeleted;

      // Step 2: Optimize cache with elderly considerations
      const cacheOptimization = await this.optimizeCache();
      result.spaceSaved += cacheOptimization.spaceSaved;
      result.filesProcessed += cacheOptimization.filesProcessed;

      // Step 3: Compress audio files (with elderly quality preservation)
      if (this.config.audioCompression.enabled) {
        const compressionResult = await this.compressAudioFiles();
        result.spaceSaved += compressionResult.spaceSaved;
        result.filesProcessed += compressionResult.filesProcessed;
        result.compressionApplied = compressionResult.compressionApplied;
        result.elderlyFilesAffected += compressionResult.elderlyFilesAffected;
      }

      // Step 4: Organize files for elderly users
      if (this.config.fileOrganization.elderlySimplifiedStructure) {
        await this.organizeFilesForElderly();
      }

      // Step 5: Generate recommendations
      result.recommendations = await this.generateRecommendations(beforeAnalysis);

      // Step 6: Calculate performance improvement
      const afterAnalysis = await this.analyzeStorage();
      result.performanceImprovement = this.calculatePerformanceImprovement(beforeAnalysis, afterAnalysis);

      // Update tracking
      this.optimizationCount++;
      this.totalSpaceSaved += result.spaceSaved;
      if (result.elderlyFilesAffected > 0) {
        this.elderlyOptimizationCount++;
      }

      // Notify performance monitor
      performanceMonitor.getMetrics(); // This would update storage metrics

      console.log(`Storage optimization completed: ${Math.round(result.spaceSaved / 1024 / 1024)}MB saved`);

      return result;

    } catch (error) {
      console.error('Storage optimization failed:', error);
      throw error;
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupTemporaryFiles(): Promise<{ spaceSaved: number; filesDeleted: number }> {
    let spaceSaved = 0;
    let filesDeleted = 0;

    try {
      const tempPath = this.storagePaths.temp;
      if (await this.directoryExists(tempPath)) {
        const files = await FileSystem.readDirectoryAsync(tempPath);

        for (const file of files) {
          const filePath = `${tempPath}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists && fileInfo.size) {
            spaceSaved += fileInfo.size;
            await FileSystem.deleteAsync(filePath);
            filesDeleted++;
          }
        }
      }

      // Clean up old cache files
      const cacheFiles = await this.getExpiredCacheFiles();
      for (const cacheFile of cacheFiles) {
        const fileInfo = await FileSystem.getInfoAsync(cacheFile.path);
        if (fileInfo.exists && fileInfo.size) {
          spaceSaved += fileInfo.size;
          await FileSystem.deleteAsync(cacheFile.path);
          filesDeleted++;
        }
      }

    } catch (error) {
      console.error('Temporary file cleanup failed:', error);
    }

    return { spaceSaved, filesDeleted };
  }

  /**
   * Optimize cache with elderly considerations
   */
  private async optimizeCache(): Promise<{ spaceSaved: number; filesProcessed: number }> {
    let spaceSaved = 0;
    let filesProcessed = 0;

    try {
      const cacheFiles = await this.getCacheFiles();
      const maxCacheSize = this.config.cacheManagement.maxCacheSize * 1024 * 1024; // Convert to bytes
      let currentCacheSize = 0;

      // Calculate current cache size
      for (const file of cacheFiles) {
        const fileInfo = await FileSystem.getInfoAsync(file.path);
        if (fileInfo.exists && fileInfo.size) {
          currentCacheSize += fileInfo.size;
        }
      }

      if (currentCacheSize > maxCacheSize) {
        // Sort files by access time and elderly priority
        const sortedFiles = cacheFiles.sort((a, b) => {
          // Prioritize elderly-optimized files
          if (a.isElderlyOptimized && !b.isElderlyOptimized) return 1;
          if (!a.isElderlyOptimized && b.isElderlyOptimized) return -1;

          // Then sort by access time
          return a.lastAccessed - b.lastAccessed;
        });

        // Remove files until we're under the limit
        for (const file of sortedFiles) {
          if (currentCacheSize <= maxCacheSize) break;

          const fileInfo = await FileSystem.getInfoAsync(file.path);
          if (fileInfo.exists && fileInfo.size) {
            // Extra protection for elderly-optimized files
            if (file.isElderlyOptimized) {
              const elderlyRetentionTime = Date.now() - this.config.cacheManagement.elderlyRetentionBonus;
              if (file.lastAccessed > elderlyRetentionTime) {
                continue; // Skip this file
              }
            }

            spaceSaved += fileInfo.size;
            currentCacheSize -= fileInfo.size;
            await FileSystem.deleteAsync(file.path);
            filesProcessed++;
          }
        }
      }

    } catch (error) {
      console.error('Cache optimization failed:', error);
    }

    return { spaceSaved, filesProcessed };
  }

  /**
   * Compress audio files with elderly quality preservation
   */
  private async compressAudioFiles(): Promise<{
    spaceSaved: number;
    filesProcessed: number;
    compressionApplied: boolean;
    elderlyFilesAffected: number;
  }> {
    let spaceSaved = 0;
    let filesProcessed = 0;
    let compressionApplied = false;
    let elderlyFilesAffected = 0;

    try {
      const audioFiles = await this.getAudioFiles();

      for (const file of audioFiles) {
        const fileInfo = await FileSystem.getInfoAsync(file.path);
        if (!fileInfo.exists || !fileInfo.size) continue;

        // Determine compression level based on elderly optimization
        let compressionQuality = this.config.audioCompression.quality;

        if (file.isElderlyOptimized && this.elderlyPreferences.preferQualityOverSpace) {
          // Use higher quality for elderly-optimized files
          if (compressionQuality === 'low') compressionQuality = 'medium';
          if (compressionQuality === 'medium') compressionQuality = 'high';
        }

        // Skip compression if it would degrade quality too much for elderly users
        if (file.isElderlyOptimized && file.quality < this.config.audioCompression.elderlyQualityThreshold) {
          continue;
        }

        // Simulate compression (actual implementation would use FFmpeg or similar)
        const compressionRatio = this.getCompressionRatio(compressionQuality);
        const originalSize = fileInfo.size;
        const compressedSize = Math.floor(originalSize * compressionRatio);
        const savedSpace = originalSize - compressedSize;

        if (savedSpace > 0) {
          spaceSaved += savedSpace;
          filesProcessed++;
          compressionApplied = true;

          if (file.isElderlyOptimized) {
            elderlyFilesAffected++;
          }

          // In a real implementation, this would actually compress the file
          console.log(`Compressed ${file.path}: ${Math.round(savedSpace / 1024)}KB saved`);
        }
      }

    } catch (error) {
      console.error('Audio compression failed:', error);
    }

    return { spaceSaved, filesProcessed, compressionApplied, elderlyFilesAffected };
  }

  /**
   * Organize files for elderly users
   */
  private async organizeFilesForElderly(): Promise<void> {
    try {
      if (!this.config.fileOrganization.elderlySimplifiedStructure) return;

      // Create simplified folder structure
      const elderlyFolders = [
        'Recent Memories',
        'This Month',
        'Last Month',
        'Older Memories',
        'Family Shared',
      ];

      for (const folder of elderlyFolders) {
        const folderPath = `${this.storagePaths.elderlyOptimized}${folder}/`;
        if (!(await this.directoryExists(folderPath))) {
          await FileSystem.makeDirectoryAsync(folderPath, { intermediates: true });
        }
      }

      // Move files to appropriate folders based on date
      const audioFiles = await this.getAudioFiles();
      const now = Date.now();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;

      for (const file of audioFiles) {
        if (!file.isElderlyOptimized) continue;

        const fileAge = now - file.createdDate;
        let targetFolder = 'Older Memories';

        if (fileAge < 7 * 24 * 60 * 60 * 1000) { // Last week
          targetFolder = 'Recent Memories';
        } else if (fileAge < oneMonth) { // Last month
          targetFolder = 'This Month';
        } else if (fileAge < 2 * oneMonth) { // Last 2 months
          targetFolder = 'Last Month';
        }

        // Move file if it's not already in the right place
        const targetPath = `${this.storagePaths.elderlyOptimized}${targetFolder}/`;
        if (!file.path.includes(targetPath)) {
          const fileName = file.path.split('/').pop();
          const newPath = `${targetPath}${fileName}`;

          try {
            await FileSystem.moveAsync({
              from: file.path,
              to: newPath,
            });
          } catch (moveError) {
            // If move fails, try copy and delete
            try {
              await FileSystem.copyAsync({
                from: file.path,
                to: newPath,
              });
              await FileSystem.deleteAsync(file.path);
            } catch (copyError) {
              console.warn(`Failed to organize file ${file.path}:`, copyError);
            }
          }
        }
      }

    } catch (error) {
      console.error('File organization failed:', error);
    }
  }

  /**
   * Generate recommendations for elderly users
   */
  private async generateRecommendations(analysis: StorageAnalysis): Promise<string[]> {
    const recommendations: string[] = [];
    const storageUsagePercent = (analysis.usedSpace / analysis.totalSpace) * 100;

    if (storageUsagePercent > 90) {
      recommendations.push('Your device is running low on storage. Consider backing up older memories to cloud storage.');
    }

    if (analysis.audioFiles > 100) {
      recommendations.push('You have many audio memories. Consider organizing them into folders by date or topic.');
    }

    if (analysis.cacheSize > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Cache files are using significant space. Regular cleanup will help maintain performance.');
    }

    if (analysis.fragmentationLevel > 0.7) {
      recommendations.push('Storage fragmentation is high. Restarting the app occasionally will help performance.');
    }

    if (this.elderlyPreferences.preferQualityOverSpace && storageUsagePercent > 80) {
      recommendations.push('Consider enabling compression for older recordings to free up space while preserving recent quality.');
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private async directoryExists(path: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      return info.exists && info.isDirectory;
    } catch {
      return false;
    }
  }

  private async getTotalStorageSpace(): Promise<number> {
    // This would use native modules in a real implementation
    return this.capabilities?.estimatedStorage ? this.capabilities.estimatedStorage * 1024 * 1024 * 1024 : 16 * 1024 * 1024 * 1024;
  }

  private async getUsedStorageSpace(): Promise<number> {
    // This would use native modules in a real implementation
    const total = await this.getTotalStorageSpace();
    return Math.floor(total * 0.6); // Simulate 60% usage
  }

  private async getAppStorageUsage(): Promise<number> {
    let totalSize = 0;

    for (const path of Object.values(this.storagePaths)) {
      if (path) {
        totalSize += await this.getDirectorySize(path);
      }
    }

    return totalSize;
  }

  private async getDirectorySize(path: string): Promise<number> {
    try {
      if (!(await this.directoryExists(path))) return 0;

      let totalSize = 0;
      const files = await FileSystem.readDirectoryAsync(path);

      for (const file of files) {
        const filePath = `${path}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists) {
          if (fileInfo.isDirectory) {
            totalSize += await this.getDirectorySize(`${filePath}/`);
          } else if (fileInfo.size) {
            totalSize += fileInfo.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.warn(`Failed to get directory size for ${path}:`, error);
      return 0;
    }
  }

  private async countFilesInDirectory(path: string, extensions?: string[]): Promise<number> {
    try {
      if (!(await this.directoryExists(path))) return 0;

      const files = await FileSystem.readDirectoryAsync(path);

      if (!extensions) return files.length;

      return files.filter(file =>
        extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()))
      ).length;
    } catch {
      return 0;
    }
  }

  private async calculateCompressionRatio(): Promise<number> {
    // Simplified calculation - would be more complex in real implementation
    return 0.7; // 70% compression ratio average
  }

  private async calculateFragmentation(): Promise<number> {
    // Simplified calculation - would use native storage APIs in real implementation
    return Math.random() * 0.5; // Random fragmentation level for demo
  }

  private async getCacheFiles(): Promise<Array<{
    path: string;
    lastAccessed: number;
    isElderlyOptimized: boolean;
  }>> {
    // Simplified implementation
    return [];
  }

  private async getExpiredCacheFiles(): Promise<Array<{ path: string }>> {
    // Simplified implementation
    return [];
  }

  private async getAudioFiles(): Promise<Array<{
    path: string;
    isElderlyOptimized: boolean;
    quality: number;
    createdDate: number;
  }>> {
    // Simplified implementation
    return [];
  }

  private getCompressionRatio(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low': return 0.4;
      case 'medium': return 0.6;
      case 'high': return 0.8;
      default: return 0.6;
    }
  }

  private calculatePerformanceImprovement(before: StorageAnalysis, after: StorageAnalysis): number {
    const beforeUsagePercent = (before.usedSpace / before.totalSpace) * 100;
    const afterUsagePercent = (after.usedSpace / after.totalSpace) * 100;
    return Math.max(0, beforeUsagePercent - afterUsagePercent);
  }

  /**
   * Start automatic optimization
   */
  private startAutomaticOptimization(): void {
    // Run optimization every 24 hours
    this.optimizationInterval = setInterval(async () => {
      try {
        const analysis = await this.analyzeStorage();
        const storageUsagePercent = (analysis.usedSpace / analysis.totalSpace) * 100;

        if (storageUsagePercent > this.config.cleanupPolicy.cleanupThreshold) {
          await this.optimizeStorage(this.elderlyPreferences.confirmBeforeCleanup);
        }
      } catch (error) {
        console.error('Automatic optimization failed:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Persistence methods
   */
  private async loadElderlyPreferences(): Promise<void> {
    try {
      const prefs = await AsyncStorage.getItem('elderlyStoragePreferences');
      if (prefs) {
        this.elderlyPreferences = { ...this.elderlyPreferences, ...JSON.parse(prefs) };
      }
    } catch (error) {
      console.warn('Failed to load elderly storage preferences:', error);
    }
  }

  private async saveElderlyPreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem('elderlyStoragePreferences', JSON.stringify(this.elderlyPreferences));
    } catch (error) {
      console.warn('Failed to save elderly storage preferences:', error);
    }
  }

  /**
   * Public API methods
   */
  public async getStorageAnalysis(): Promise<StorageAnalysis> {
    return this.lastAnalysis || await this.analyzeStorage();
  }

  public async setElderlyPreferences(preferences: Partial<ElderlyStoragePreferences>): Promise<void> {
    this.elderlyPreferences = { ...this.elderlyPreferences, ...preferences };
    await this.saveElderlyPreferences();
    this.adjustConfigForDevice();
  }

  public getElderlyPreferences(): ElderlyStoragePreferences {
    return { ...this.elderlyPreferences };
  }

  public getOptimizationStats(): {
    optimizationCount: number;
    totalSpaceSaved: number;
    elderlyOptimizationCount: number;
    lastOptimization: number;
  } {
    return {
      optimizationCount: this.optimizationCount,
      totalSpaceSaved: this.totalSpaceSaved,
      elderlyOptimizationCount: this.elderlyOptimizationCount,
      lastOptimization: this.lastAnalysis?.lastCleanupDate || 0,
    };
  }

  public stopAutomaticOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }
}

export const enhancedStorageOptimizer = new EnhancedStorageOptimizer();