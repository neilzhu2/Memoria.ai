/**
 * Cloud Backup Service for Memoria.ai
 * Zero-knowledge architecture with end-to-end encryption
 * Elderly-friendly design with comprehensive error handling and progress tracking
 */

import * as FileSystem from 'expo-file-system';
import * as Network from 'expo-network';
import * as Battery from 'expo-battery';
import {
  CloudBackupConfig,
  CloudBackupMetadata,
  BackupProgress,
  RestoreProgress,
  CloudBackupStatus,
  BackupListItem,
  CloudBackupResponse,
  CloudBackupError,
  BackupValidation,
  ElderlyFriendlySettings
} from '../types/cloudBackup';
import { Memory } from '../types/memory';
import { storageService } from './storageService';
import { encryptionService } from './encryptionService';

export interface CloudBackupServiceConfig {
  baseUrl: string;
  region: string;
  maxRetries: number;
  retryDelayMs: number;
  chunkSizeBytes: number;
  maxConcurrentUploads: number;
  elderlyMode: boolean;
}

export class CloudBackupService {
  private config: CloudBackupServiceConfig;
  private currentBackupConfig: CloudBackupConfig | null = null;
  private elderlySettings: ElderlyFriendlySettings;
  private isInitialized = false;

  constructor() {
    this.config = {
      baseUrl: 'https://api.memoria.ai/backup',
      region: 'us-east',
      maxRetries: 3,
      retryDelayMs: 2000,
      chunkSizeBytes: 1024 * 1024, // 1MB chunks for elderly users' slower networks
      maxConcurrentUploads: 2, // Conservative for elderly users
      elderlyMode: true,
    };

    this.elderlySettings = {
      showSimpleInterface: true,
      useVoiceGuidance: false,
      largeTextMode: true,
      highContrastMode: false,
      extraConfirmations: true,
      slowAnimations: true,
      offlineFirstMode: true,
      batteryOptimized: true,
      dataConservative: true,
    };
  }

  /**
   * Initialize cloud backup service
   */
  async initialize(masterPassword: string): Promise<CloudBackupResponse<boolean>> {
    try {
      // Initialize encryption service
      const encryptionResult = await encryptionService.initialize(masterPassword, true);
      if (!encryptionResult.success) {
        return {
          success: false,
          error: 'Failed to initialize encryption',
          errorCode: 'ENCRYPTION_INIT_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Load backup configuration
      const configResult = await this.loadBackupConfig();
      if (configResult.success && configResult.data) {
        this.currentBackupConfig = configResult.data;
      } else {
        // Create default configuration for first-time users
        this.currentBackupConfig = await this.createDefaultConfig();
        await this.saveBackupConfig(this.currentBackupConfig);
      }

      // Load elderly-friendly settings
      await this.loadElderlySettings();

      this.isInitialized = true;

      return {
        success: true,
        data: true,
        message: 'Cloud backup service initialized successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initialize cloud backup service',
        errorCode: 'SERVICE_INIT_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Create a new backup with progress tracking
   */
  async createBackup(
    isManual = false,
    progressCallback?: (progress: BackupProgress) => void
  ): Promise<CloudBackupResponse<string>> {
    try {
      if (!this.isInitialized || !this.currentBackupConfig) {
        return {
          success: false,
          error: 'Service not initialized',
          errorCode: 'NOT_INITIALIZED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Check if backup is enabled
      if (!this.currentBackupConfig.enabled) {
        return {
          success: false,
          error: 'Cloud backup is disabled',
          errorCode: 'BACKUP_DISABLED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Pre-backup checks for elderly users
      const preflightResult = await this.preflightChecks(isManual);
      if (!preflightResult.success) {
        return preflightResult;
      }

      const backupId = await this.generateBackupId();

      const progress: BackupProgress = {
        backupId,
        status: 'preparing',
        progress: 0,
        currentStep: 'Preparing backup...',
        totalSteps: 5,
        bytesProcessed: 0,
        totalBytes: 0,
        timeElapsed: 0,
      };

      progressCallback?.(progress);

      // Step 1: Gather data to backup
      progress.status = 'preparing';
      progress.currentStep = 'Gathering memories to backup...';
      progress.progress = 10;
      progressCallback?.(progress);

      const memoriesToBackup = await this.getMemoriesToBackup();
      if (memoriesToBackup.length === 0) {
        return {
          success: false,
          error: 'No memories to backup',
          errorCode: 'NO_DATA',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Calculate total size
      let totalSize = 0;
      for (const memory of memoriesToBackup) {
        const fileInfo = await FileSystem.getInfoAsync(memory.audioFilePath);
        totalSize += fileInfo.size || 0;
      }

      progress.totalBytes = totalSize;
      progress.currentStep = `Found ${memoriesToBackup.length} memories to backup (${this.formatBytes(totalSize)})`;
      progress.progress = 20;
      progressCallback?.(progress);

      // Step 2: Create backup manifest
      const manifest = await this.createBackupManifest(memoriesToBackup, backupId);

      // Step 3: Encrypt and upload data
      progress.status = 'encrypting';
      progress.currentStep = 'Encrypting memories for secure cloud storage...';
      progress.progress = 30;
      progressCallback?.(progress);

      const encryptedData = await this.encryptBackupData(memoriesToBackup, (bytesProcessed) => {
        progress.bytesProcessed = bytesProcessed;
        progress.progress = 30 + Math.floor((bytesProcessed / totalSize) * 40);
        progressCallback?.(progress);
      });

      // Step 4: Upload to cloud
      progress.status = 'uploading';
      progress.currentStep = 'Uploading encrypted backup to secure cloud storage...';
      progress.progress = 70;
      progressCallback?.(progress);

      const uploadResult = await this.uploadBackupData(backupId, encryptedData, manifest, (uploadedBytes) => {
        progress.bytesProcessed = uploadedBytes;
        progress.progress = 70 + Math.floor((uploadedBytes / encryptedData.length) * 25);
        progressCallback?.(progress);
      });

      if (!uploadResult.success) {
        return uploadResult;
      }

      // Step 5: Verify backup integrity
      progress.status = 'verifying';
      progress.currentStep = 'Verifying backup integrity...';
      progress.progress = 95;
      progressCallback?.(progress);

      const verificationResult = await this.verifyBackupIntegrity(backupId, manifest);
      if (!verificationResult.success) {
        // Delete corrupted backup
        await this.deleteBackup(backupId);
        return {
          success: false,
          error: 'Backup verification failed',
          errorCode: 'VERIFICATION_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Complete
      progress.status = 'completed';
      progress.currentStep = 'Backup completed successfully!';
      progress.progress = 100;
      progressCallback?.(progress);

      // Update backup status
      await this.updateBackupStatus(backupId, memoriesToBackup.length, totalSize);

      return {
        success: true,
        data: backupId,
        message: `Backup completed successfully. ${memoriesToBackup.length} memories backed up securely.`,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      return {
        success: false,
        error: 'Backup creation failed',
        errorCode: 'BACKUP_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Restore memories from backup
   */
  async restoreFromBackup(
    backupId: string,
    progressCallback?: (progress: RestoreProgress) => void
  ): Promise<CloudBackupResponse<void>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Service not initialized',
          errorCode: 'NOT_INITIALIZED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const restoreId = await this.generateRequestId();

      const progress: RestoreProgress = {
        restoreId,
        status: 'downloading',
        progress: 0,
        currentStep: 'Downloading backup from cloud...',
        memoriesRestored: 0,
        totalMemories: 0,
      };

      progressCallback?.(progress);

      // Download backup data
      const downloadResult = await this.downloadBackupData(backupId);
      if (!downloadResult.success || !downloadResult.data) {
        return downloadResult;
      }

      progress.status = 'decrypting';
      progress.currentStep = 'Decrypting your memories...';
      progress.progress = 30;
      progressCallback?.(progress);

      // Decrypt backup data
      const decryptResult = await this.decryptBackupData(downloadResult.data);
      if (!decryptResult.success || !decryptResult.data) {
        return {
          success: false,
          error: 'Failed to decrypt backup data',
          errorCode: 'DECRYPTION_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const memories = decryptResult.data;
      progress.totalMemories = memories.length;
      progress.status = 'extracting';
      progress.currentStep = 'Restoring your memories...';
      progress.progress = 60;
      progressCallback?.(progress);

      // Restore memories one by one
      for (let i = 0; i < memories.length; i++) {
        const memory = memories[i];

        try {
          // Check if memory already exists
          const existingMemory = await storageService.getMemory(memory.id);
          if (existingMemory.success) {
            // Skip if it's the same or newer
            if (existingMemory.data && new Date(existingMemory.data.updatedAt) >= new Date(memory.updatedAt)) {
              continue;
            }
          }

          // Restore memory
          await storageService.createMemory({
            title: memory.title,
            description: memory.description,
            audioFilePath: memory.audioFilePath,
            language: memory.language,
            tags: memory.tags,
          });

          progress.memoriesRestored++;
          progress.progress = 60 + Math.floor((i / memories.length) * 35);
          progress.currentStep = `Restored ${progress.memoriesRestored} of ${progress.totalMemories} memories...`;
          progressCallback?.(progress);
        } catch (error) {
          console.warn(`Failed to restore memory ${memory.id}:`, error);
          // Continue with other memories
        }
      }

      progress.status = 'completed';
      progress.currentStep = `Restore completed! ${progress.memoriesRestored} memories restored.`;
      progress.progress = 100;
      progressCallback?.(progress);

      return {
        success: true,
        message: `Successfully restored ${progress.memoriesRestored} memories from backup`,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      console.error('Restore failed:', error);
      return {
        success: false,
        error: 'Restore operation failed',
        errorCode: 'RESTORE_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Get list of available backups
   */
  async getBackupList(): Promise<CloudBackupResponse<BackupListItem[]>> {
    try {
      if (!this.isInitialized) {
        return {
          success: false,
          error: 'Service not initialized',
          errorCode: 'NOT_INITIALIZED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // In a real implementation, this would fetch from cloud service
      // For now, return mock data
      const backups: BackupListItem[] = [
        {
          backupId: 'backup_001',
          displayName: 'Automatic Backup - Today',
          createdAt: new Date(),
          size: 15728640, // 15MB
          memoryCount: 12,
          isAutomatic: true,
          status: 'available',
          canRestore: true,
          region: this.config.region,
        },
      ];

      return {
        success: true,
        data: backups,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get backup list',
        errorCode: 'LIST_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<CloudBackupResponse<void>> {
    try {
      // In real implementation, delete from cloud service
      console.log('Deleting backup:', backupId);

      return {
        success: true,
        message: 'Backup deleted successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete backup',
        errorCode: 'DELETE_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Get current backup status
   */
  async getBackupStatus(): Promise<CloudBackupResponse<CloudBackupStatus>> {
    try {
      const statusData = storageService.getMMKVValue<CloudBackupStatus>('cloud_backup_status');

      const status: CloudBackupStatus = statusData || {
        isEnabled: false,
        isBackingUp: false,
        storageUsed: 0,
        storageLimit: 1024 * 1024 * 1024, // 1GB default
        totalBackups: 0,
        healthScore: 100,
      };

      return {
        success: true,
        data: status,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get backup status',
        errorCode: 'STATUS_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Update backup configuration
   */
  async updateBackupConfig(config: Partial<CloudBackupConfig>): Promise<CloudBackupResponse<CloudBackupConfig>> {
    try {
      if (!this.currentBackupConfig) {
        this.currentBackupConfig = await this.createDefaultConfig();
      }

      this.currentBackupConfig = { ...this.currentBackupConfig, ...config };
      await this.saveBackupConfig(this.currentBackupConfig);

      return {
        success: true,
        data: this.currentBackupConfig,
        message: 'Backup configuration updated successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update backup configuration',
        errorCode: 'CONFIG_UPDATE_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Check backup health and recommendations
   */
  async getBackupHealth(): Promise<CloudBackupResponse<{
    score: number;
    issues: string[];
    recommendations: string[];
  }>> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check if backup is enabled
      if (!this.currentBackupConfig?.enabled) {
        issues.push('Cloud backup is disabled');
        recommendations.push('Enable cloud backup to protect your precious memories');
        score -= 30;
      }

      // Check last backup date
      const status = await this.getBackupStatus();
      if (status.success && status.data) {
        const lastBackup = status.data.lastBackupTime;
        if (!lastBackup) {
          issues.push('No backups have been created yet');
          recommendations.push('Create your first backup to secure your memories');
          score -= 25;
        } else {
          const daysSinceBackup = Math.floor((Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceBackup > 7) {
            issues.push(`Last backup was ${daysSinceBackup} days ago`);
            recommendations.push('Create a new backup to keep your memories up to date');
            score -= 15;
          }
        }

        // Check storage usage
        const usagePercent = (status.data.storageUsed / status.data.storageLimit) * 100;
        if (usagePercent > 90) {
          issues.push('Cloud storage is almost full');
          recommendations.push('Consider upgrading your storage plan or deleting old backups');
          score -= 20;
        } else if (usagePercent > 75) {
          issues.push('Cloud storage is getting full');
          recommendations.push('Monitor your storage usage and consider cleanup');
          score -= 10;
        }
      }

      return {
        success: true,
        data: {
          score: Math.max(0, score),
          issues,
          recommendations,
        },
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check backup health',
        errorCode: 'HEALTH_CHECK_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  // Private helper methods

  private async preflightChecks(isManual: boolean): Promise<CloudBackupResponse<void>> {
    // Check network connectivity
    const networkState = await Network.getNetworkStateAsync();
    if (!networkState.isConnected) {
      return {
        success: false,
        error: 'No internet connection available',
        errorCode: 'NO_NETWORK',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }

    // Check WiFi requirement for automatic backups
    if (!isManual && this.currentBackupConfig?.wifiOnlyBackup && networkState.type !== Network.NetworkStateType.WIFI) {
      return {
        success: false,
        error: 'WiFi connection required for automatic backup',
        errorCode: 'WIFI_REQUIRED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }

    // Check battery level for elderly users
    if (this.elderlySettings.batteryOptimized) {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      if (batteryLevel < 0.2 && !isManual) {
        return {
          success: false,
          error: 'Battery level too low for automatic backup',
          errorCode: 'LOW_BATTERY',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }
    }

    return {
      success: true,
      timestamp: new Date(),
      requestId: await this.generateRequestId(),
    };
  }

  private async getMemoriesToBackup(): Promise<Memory[]> {
    const memoriesResponse = await storageService.getMemories();
    if (!memoriesResponse.success || !memoriesResponse.data) {
      return [];
    }

    // Filter based on backup configuration
    let memories = memoriesResponse.data;

    if (this.currentBackupConfig?.excludeArchived) {
      memories = memories.filter(memory => !memory.isArchived);
    }

    if (this.currentBackupConfig?.includeTags && this.currentBackupConfig.includeTags.length > 0) {
      memories = memories.filter(memory =>
        memory.tags.some(tag => this.currentBackupConfig!.includeTags.includes(tag))
      );
    }

    return memories;
  }

  private async createBackupManifest(memories: Memory[], backupId: string): Promise<CloudBackupMetadata> {
    let totalSize = 0;
    for (const memory of memories) {
      const fileInfo = await FileSystem.getInfoAsync(memory.audioFilePath);
      totalSize += fileInfo.size || 0;
    }

    return {
      backupId,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      memoryCount: memories.length,
      totalSize,
      encryptedSize: 0, // Will be updated after encryption
      checksum: '',
      keyId: '', // Will be set by encryption service
      compressionRatio: 1.0,
      region: this.config.region,
      compliance: ['gdpr', 'ccpa'],
    };
  }

  private async encryptBackupData(
    memories: Memory[],
    progressCallback?: (bytesProcessed: number) => void
  ): Promise<string> {
    const backupData = {
      memories,
      metadata: {
        exportedAt: new Date(),
        version: '1.0.0',
        memoryCount: memories.length,
      },
    };

    const jsonData = JSON.stringify(backupData);
    const encryptResult = await encryptionService.encryptData(jsonData);

    if (!encryptResult.success || !encryptResult.data) {
      throw new Error('Failed to encrypt backup data');
    }

    progressCallback?.(Buffer.from(jsonData).length);
    return JSON.stringify(encryptResult.data);
  }

  private async uploadBackupData(
    backupId: string,
    encryptedData: string,
    manifest: CloudBackupMetadata,
    progressCallback?: (uploadedBytes: number) => void
  ): Promise<CloudBackupResponse<void>> {
    // In real implementation, this would upload to cloud service
    // For now, simulate upload progress
    const totalBytes = Buffer.from(encryptedData).length;
    let uploadedBytes = 0;

    const uploadChunk = () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          uploadedBytes += Math.min(this.config.chunkSizeBytes, totalBytes - uploadedBytes);
          progressCallback?.(uploadedBytes);

          if (uploadedBytes >= totalBytes) {
            resolve();
          } else {
            uploadChunk().then(resolve);
          }
        }, 100); // Simulate network delay
      });
    };

    await uploadChunk();

    return {
      success: true,
      timestamp: new Date(),
      requestId: await this.generateRequestId(),
    };
  }

  private async downloadBackupData(backupId: string): Promise<CloudBackupResponse<string>> {
    // In real implementation, download from cloud service
    // For now, return mock encrypted data
    return {
      success: true,
      data: '{"data":"mock_encrypted_data","iv":"mock_iv","tag":"mock_tag","keyId":"mock_key","algorithm":"AES-256-GCM","timestamp":1234567890}',
      timestamp: new Date(),
      requestId: await this.generateRequestId(),
    };
  }

  private async decryptBackupData(encryptedData: string): Promise<CloudBackupResponse<Memory[]>> {
    try {
      const encryptedObject = JSON.parse(encryptedData);
      const decryptResult = await encryptionService.decryptData(encryptedObject);

      if (!decryptResult.success || !decryptResult.data) {
        return {
          success: false,
          error: 'Failed to decrypt backup data',
          errorCode: 'DECRYPTION_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const backupData = JSON.parse(decryptResult.data);
      return {
        success: true,
        data: backupData.memories,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid backup data format',
        errorCode: 'INVALID_FORMAT',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  private async verifyBackupIntegrity(
    backupId: string,
    manifest: CloudBackupMetadata
  ): Promise<CloudBackupResponse<BackupValidation>> {
    // In real implementation, verify backup integrity
    const validation: BackupValidation = {
      isValid: true,
      checksumMatch: true,
      decryptionSuccessful: true,
      metadataValid: true,
      memoryCountMatch: true,
      errors: [],
      warnings: [],
    };

    return {
      success: true,
      data: validation,
      timestamp: new Date(),
      requestId: await this.generateRequestId(),
    };
  }

  private async updateBackupStatus(backupId: string, memoryCount: number, totalSize: number): Promise<void> {
    const currentStatus = await this.getBackupStatus();
    const status = currentStatus.data || {
      isEnabled: true,
      isBackingUp: false,
      storageUsed: 0,
      storageLimit: 1024 * 1024 * 1024,
      totalBackups: 0,
      healthScore: 100,
    };

    status.lastBackupTime = new Date();
    status.totalBackups += 1;
    status.storageUsed += totalSize;
    status.isBackingUp = false;

    storageService.setMMKVValue('cloud_backup_status', status);
  }

  private async createDefaultConfig(): Promise<CloudBackupConfig> {
    return {
      enabled: false, // Disabled by default, user must opt-in
      autoBackupEnabled: true,
      wifiOnlyBackup: true,
      lowPowerMode: true,
      backupFrequency: 'weekly',
      backupTime: '02:00',
      maxBackupRetention: 30,
      maxBackupSize: 100,
      compressionLevel: 'medium',
      includeTags: [],
      excludeArchived: true,
      encryptionStrength: '256',
      keyRotationDays: 90,
      requireBiometricAuth: true,
      dataRegion: 'us-east',
      complianceMode: 'standard',
      enableFamilySharing: false,
      familyMemberLimit: 5,
      emergencyAccessEnabled: false,
    };
  }

  private async saveBackupConfig(config: CloudBackupConfig): Promise<void> {
    storageService.setMMKVValue('cloud_backup_config', config);
  }

  private async loadBackupConfig(): Promise<CloudBackupResponse<CloudBackupConfig>> {
    const config = storageService.getMMKVValue<CloudBackupConfig>('cloud_backup_config');
    return {
      success: !!config,
      data: config,
      timestamp: new Date(),
      requestId: await this.generateRequestId(),
    };
  }

  private async loadElderlySettings(): Promise<void> {
    const settings = storageService.getMMKVValue<ElderlyFriendlySettings>('elderly_settings');
    if (settings) {
      this.elderlySettings = { ...this.elderlySettings, ...settings };
    }
  }

  private async generateBackupId(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  private async generateRequestId(): Promise<string> {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const cloudBackupService = new CloudBackupService();