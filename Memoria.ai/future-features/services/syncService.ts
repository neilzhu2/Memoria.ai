/**
 * Sync Service for Memoria.ai
 * Handles data synchronization and backup operations
 * Designed with elderly users' data safety in mind
 */

import * as FileSystem from 'expo-file-system';
import { Memory, User, UserPreferences, ApiResponse } from '../types';
import { storageService } from './storageService';

export interface SyncConfig {
  autoSyncEnabled: boolean;
  syncInterval: number; // in minutes
  wifiOnlySync: boolean;
  maxRetries: number;
  backupRetentionDays: number;
}

export interface SyncStatus {
  lastSyncTime: Date | null;
  isCurrentlySyncing: boolean;
  pendingChanges: number;
  lastError: string | null;
  nextScheduledSync: Date | null;
}

export interface BackupData {
  version: string;
  timestamp: Date;
  user: User | null;
  preferences: UserPreferences | null;
  memories: Memory[];
  audioFiles: { memoryId: string; filePath: string; base64Data: string }[];
}

export class SyncService {
  private config: SyncConfig;
  private status: SyncStatus;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = {
      autoSyncEnabled: true,
      syncInterval: 60, // 1 hour - conservative for elderly users
      wifiOnlySync: true, // Save data costs
      maxRetries: 3,
      backupRetentionDays: 30,
    };

    this.status = {
      lastSyncTime: null,
      isCurrentlySyncing: false,
      pendingChanges: 0,
      lastError: null,
      nextScheduledSync: null,
    };

    this.initializeSync();
  }

  /**
   * Initialize sync service and start automatic sync if enabled
   */
  private async initializeSync(): Promise<void> {
    try {
      // Load previous sync status from storage
      const savedStatus = await storageService.getMMKVValue<SyncStatus>('sync_status');
      if (savedStatus) {
        this.status = {
          ...savedStatus,
          isCurrentlySyncing: false, // Reset sync flag on app start
        };
      }

      // Start automatic sync if enabled
      if (this.config.autoSyncEnabled) {
        this.startAutoSync();
      }

      console.log('Sync service initialized');
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const intervalMs = this.config.syncInterval * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.performSync('automatic');
    }, intervalMs);

    // Set next scheduled sync
    this.status.nextScheduledSync = new Date(Date.now() + intervalMs);
    this.saveStatus();

    console.log(`Auto sync started with ${this.config.syncInterval} minute interval`);
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.status.nextScheduledSync = null;
    this.saveStatus();

    console.log('Auto sync stopped');
  }

  /**
   * Perform manual sync
   */
  async manualSync(): Promise<ApiResponse<void>> {
    return this.performSync('manual');
  }

  /**
   * Perform synchronization operation
   */
  private async performSync(type: 'automatic' | 'manual'): Promise<ApiResponse<void>> {
    try {
      // Prevent concurrent syncs
      if (this.status.isCurrentlySyncing) {
        return {
          success: false,
          error: 'Sync already in progress',
        };
      }

      // Check network conditions for automatic sync
      if (type === 'automatic' && this.config.wifiOnlySync) {
        const isWifiConnected = await this.checkWifiConnection();
        if (!isWifiConnected) {
          console.log('Skipping automatic sync - WiFi not available');
          return {
            success: false,
            error: 'WiFi connection required for automatic sync',
          };
        }
      }

      this.status.isCurrentlySyncing = true;
      this.status.lastError = null;
      this.saveStatus();

      console.log(`Starting ${type} sync...`);

      // Perform sync operations
      await this.syncUserData();
      await this.syncMemories();
      await this.syncAudioFiles();
      await this.createBackup();

      // Update sync status
      this.status.lastSyncTime = new Date();
      this.status.pendingChanges = 0;
      this.status.isCurrentlySyncing = false;

      // Schedule next sync if auto-sync is enabled
      if (this.config.autoSyncEnabled) {
        const nextSync = new Date(Date.now() + this.config.syncInterval * 60 * 1000);
        this.status.nextScheduledSync = nextSync;
      }

      this.saveStatus();

      console.log(`${type} sync completed successfully`);

      return {
        success: true,
        message: 'Sync completed successfully',
      };
    } catch (error) {
      this.status.isCurrentlySyncing = false;
      this.status.lastError = error instanceof Error ? error.message : 'Unknown sync error';
      this.saveStatus();

      console.error('Sync failed:', error);

      return {
        success: false,
        error: this.status.lastError,
      };
    }
  }

  /**
   * Sync user data
   */
  private async syncUserData(): Promise<void> {
    try {
      const userResponse = await storageService.getCurrentUser();
      const preferencesResponse = await storageService.getUserPreferences();

      if (userResponse.success && userResponse.data) {
        // In real implementation, sync to cloud service
        console.log('Syncing user data:', userResponse.data.id);
      }

      if (preferencesResponse.success && preferencesResponse.data) {
        // In real implementation, sync preferences to cloud
        console.log('Syncing user preferences');
      }
    } catch (error) {
      console.error('Failed to sync user data:', error);
      throw error;
    }
  }

  /**
   * Sync memory records
   */
  private async syncMemories(): Promise<void> {
    try {
      const memoriesResponse = await storageService.getMemories();

      if (memoriesResponse.success && memoriesResponse.data) {
        for (const memory of memoriesResponse.data) {
          // In real implementation, sync each memory to cloud
          console.log('Syncing memory:', memory.id);

          // Check if memory needs to be uploaded or updated
          const localModified = memory.updatedAt;
          // Compare with cloud version timestamp
          // Upload if local is newer
        }
      }
    } catch (error) {
      console.error('Failed to sync memories:', error);
      throw error;
    }
  }

  /**
   * Sync audio files
   */
  private async syncAudioFiles(): Promise<void> {
    try {
      const memoriesResponse = await storageService.getMemories();

      if (memoriesResponse.success && memoriesResponse.data) {
        for (const memory of memoriesResponse.data) {
          const filePath = memory.audioFilePath;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            // In real implementation, upload to cloud storage
            console.log('Syncing audio file:', filePath);

            // For large files, implement chunked upload
            // Show progress for elderly users' peace of mind
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync audio files:', error);
      throw error;
    }
  }

  /**
   * Create local backup
   */
  async createBackup(): Promise<ApiResponse<string>> {
    try {
      console.log('Creating local backup...');

      // Export all data
      const exportResponse = await storageService.exportData();
      if (!exportResponse.success) {
        throw new Error('Failed to export data for backup');
      }

      // Include audio files in backup
      const memoriesResponse = await storageService.getMemories();
      const audioFiles: BackupData['audioFiles'] = [];

      if (memoriesResponse.success && memoriesResponse.data) {
        for (const memory of memoriesResponse.data) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(memory.audioFilePath);
            if (fileInfo.exists) {
              // For small files, include in backup. For large files, reference only
              if ((fileInfo.size || 0) < 5 * 1024 * 1024) { // 5MB limit
                const base64Data = await FileSystem.readAsStringAsync(memory.audioFilePath, {
                  encoding: FileSystem.EncodingType.Base64,
                });

                audioFiles.push({
                  memoryId: memory.id,
                  filePath: memory.audioFilePath,
                  base64Data,
                });
              }
            }
          } catch (error) {
            console.warn(`Failed to backup audio file for memory ${memory.id}:`, error);
          }
        }
      }

      const backupData: BackupData = {
        version: '1.0.0',
        timestamp: new Date(),
        user: exportResponse.data?.user || null,
        preferences: exportResponse.data?.preferences || null,
        memories: exportResponse.data?.memories || [],
        audioFiles,
      };

      // Save backup to local file
      const backupFileName = `memoria_backup_${Date.now()}.json`;
      const backupPath = `${FileSystem.documentDirectory}backups/${backupFileName}`;

      // Ensure backups directory exists
      const backupsDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(backupsDir, { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(backupPath, JSON.stringify(backupData, null, 2));

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log('Backup created successfully:', backupPath);

      return {
        success: true,
        data: backupPath,
        message: 'Backup created successfully',
      };
    } catch (error) {
      console.error('Failed to create backup:', error);
      return {
        success: false,
        error: 'Failed to create backup',
      };
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupPath: string): Promise<ApiResponse<void>> {
    try {
      console.log('Restoring from backup:', backupPath);

      const backupContent = await FileSystem.readAsStringAsync(backupPath);
      const backupData: BackupData = JSON.parse(backupContent);

      // Validate backup data
      if (!backupData.version || !backupData.timestamp) {
        throw new Error('Invalid backup format');
      }

      // Restore user data
      if (backupData.user) {
        await storageService.saveUser(backupData.user);
      }

      // Restore preferences
      if (backupData.preferences) {
        await storageService.saveUserPreferences(backupData.preferences);
      }

      // Restore memories
      for (const memory of backupData.memories) {
        await storageService.createMemory({
          title: memory.title,
          description: memory.description,
          audioFilePath: memory.audioFilePath,
          language: memory.language,
          tags: memory.tags,
        });
      }

      // Restore audio files
      for (const audioFile of backupData.audioFiles) {
        try {
          await FileSystem.writeAsStringAsync(audioFile.filePath, audioFile.base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (error) {
          console.warn(`Failed to restore audio file ${audioFile.filePath}:`, error);
        }
      }

      console.log('Backup restored successfully');

      return {
        success: true,
        message: 'Backup restored successfully',
      };
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return {
        success: false,
        error: 'Failed to restore backup',
      };
    }
  }

  /**
   * Get list of available backups
   */
  async getAvailableBackups(): Promise<ApiResponse<{ path: string; date: Date; size: number }[]>> {
    try {
      const backupsDir = `${FileSystem.documentDirectory}backups/`;
      const dirInfo = await FileSystem.getInfoAsync(backupsDir);

      if (!dirInfo.exists) {
        return {
          success: true,
          data: [],
        };
      }

      const files = await FileSystem.readDirectoryAsync(backupsDir);
      const backups = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = `${backupsDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          backups.push({
            path: filePath,
            date: new Date(fileInfo.modificationTime * 1000),
            size: fileInfo.size || 0,
          });
        }
      }

      // Sort by date (newest first)
      backups.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        success: true,
        data: backups,
      };
    } catch (error) {
      console.error('Failed to get available backups:', error);
      return {
        success: false,
        error: 'Failed to get available backups',
      };
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  private async cleanupOldBackups(): Promise<void> {
    try {
      const backupsResponse = await this.getAvailableBackups();
      if (!backupsResponse.success || !backupsResponse.data) {
        return;
      }

      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - this.config.backupRetentionDays);

      for (const backup of backupsResponse.data) {
        if (backup.date < retentionDate) {
          await FileSystem.deleteAsync(backup.path);
          console.log('Deleted old backup:', backup.path);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Check WiFi connection (mock implementation)
   */
  private async checkWifiConnection(): Promise<boolean> {
    try {
      // In real implementation, check network status
      // For now, return true (assume WiFi is available)
      return true;
    } catch (error) {
      console.warn('Failed to check WiFi connection:', error);
      return false;
    }
  }

  /**
   * Update sync configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart auto-sync with new settings
    if (config.autoSyncEnabled !== undefined || config.syncInterval !== undefined) {
      this.stopAutoSync();
      if (this.config.autoSyncEnabled) {
        this.startAutoSync();
      }
    }

    // Save config to storage
    storageService.setMMKVValue('sync_config', this.config);
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Get current sync configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Save sync status to storage
   */
  private saveStatus(): void {
    storageService.setMMKVValue('sync_status', this.status);
  }

  /**
   * Force sync now (bypass WiFi restriction)
   */
  async forceSyncNow(): Promise<ApiResponse<void>> {
    const originalWifiOnly = this.config.wifiOnlySync;
    this.config.wifiOnlySync = false;

    const result = await this.performSync('manual');

    this.config.wifiOnlySync = originalWifiOnly;
    return result;
  }

  /**
   * Clean up sync service
   */
  cleanup(): void {
    this.stopAutoSync();
    console.log('Sync service cleaned up');
  }
}

// Export singleton instance
export const syncService = new SyncService();