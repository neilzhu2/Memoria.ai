/**
 * Audio File Manager for Memoria.ai
 * Manages audio file storage, organization, and metadata for elderly users
 */

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { AudioRecording } from '../types/audio';

export interface AudioFileMetadata {
  id: string;
  fileName: string;
  filePath: string;
  originalPath: string;
  title: string;
  duration: number;
  fileSize: number;
  quality: 'low' | 'medium' | 'high';
  createdAt: Date;
  lastPlayed?: Date;
  playCount: number;
  isBackedUp: boolean;
  transcriptionId?: string;
  tags: string[];
}

export class AudioFileManager {
  private static readonly RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings/`;
  private static readonly BACKUP_DIR = `${FileSystem.documentDirectory}backups/`;
  private static readonly METADATA_FILE = `${FileSystem.documentDirectory}audio_metadata.json`;

  /**
   * Initialize the audio file manager
   */
  static async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await this.ensureDirectoryExists(this.RECORDINGS_DIR);
      await this.ensureDirectoryExists(this.BACKUP_DIR);

      // Initialize metadata file if it doesn't exist
      const metadataExists = await FileSystem.getInfoAsync(this.METADATA_FILE);
      if (!metadataExists.exists) {
        await this.saveMetadata({});
      }
    } catch (error) {
      console.error('Failed to initialize AudioFileManager:', error);
      throw error;
    }
  }

  /**
   * Generate a unique filename for a new recording
   */
  static generateFileName(date: Date = new Date()): string {
    const timestamp = date.toISOString().replace(/[:.]/g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `memoria_${timestamp}_${randomSuffix}.m4a`;
  }

  /**
   * Generate a user-friendly title for elderly users
   */
  static generateUserFriendlyTitle(date: Date = new Date()): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    return `Memory from ${date.toLocaleDateString('en-US', options)}`;
  }

  /**
   * Save an audio recording with metadata
   */
  static async saveRecording(
    tempFilePath: string,
    title?: string,
    additionalMetadata?: Partial<AudioFileMetadata>
  ): Promise<AudioFileMetadata> {
    try {
      const recordingId = Date.now().toString();
      const fileName = this.generateFileName();
      const finalPath = `${this.RECORDINGS_DIR}${fileName}`;

      // Move temp file to permanent location
      await FileSystem.moveAsync({
        from: tempFilePath,
        to: finalPath,
      });

      // Get file information
      const fileInfo = await FileSystem.getInfoAsync(finalPath);

      // Create metadata
      const metadata: AudioFileMetadata = {
        id: recordingId,
        fileName,
        filePath: finalPath,
        originalPath: tempFilePath,
        title: title || this.generateUserFriendlyTitle(),
        duration: 0, // Will be updated by audio service
        fileSize: fileInfo.size || 0,
        quality: 'medium',
        createdAt: new Date(),
        playCount: 0,
        isBackedUp: false,
        tags: [],
        ...additionalMetadata,
      };

      // Save metadata
      await this.addMetadata(recordingId, metadata);

      return metadata;
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  }

  /**
   * Get recording metadata by ID
   */
  static async getRecordingMetadata(recordingId: string): Promise<AudioFileMetadata | null> {
    try {
      const allMetadata = await this.loadMetadata();
      return allMetadata[recordingId] || null;
    } catch (error) {
      console.error('Failed to get recording metadata:', error);
      return null;
    }
  }

  /**
   * Get all recordings metadata
   */
  static async getAllRecordings(): Promise<AudioFileMetadata[]> {
    try {
      const allMetadata = await this.loadMetadata();
      return Object.values(allMetadata).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    } catch (error) {
      console.error('Failed to get all recordings:', error);
      return [];
    }
  }

  /**
   * Update recording metadata
   */
  static async updateRecordingMetadata(
    recordingId: string,
    updates: Partial<AudioFileMetadata>
  ): Promise<void> {
    try {
      const allMetadata = await this.loadMetadata();
      if (allMetadata[recordingId]) {
        allMetadata[recordingId] = {
          ...allMetadata[recordingId],
          ...updates,
        };
        await this.saveMetadata(allMetadata);
      }
    } catch (error) {
      console.error('Failed to update recording metadata:', error);
      throw error;
    }
  }

  /**
   * Delete a recording and its metadata
   */
  static async deleteRecording(recordingId: string): Promise<void> {
    try {
      const metadata = await this.getRecordingMetadata(recordingId);
      if (!metadata) return;

      // Delete physical file
      const fileInfo = await FileSystem.getInfoAsync(metadata.filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(metadata.filePath);
      }

      // Remove from metadata
      const allMetadata = await this.loadMetadata();
      delete allMetadata[recordingId];
      await this.saveMetadata(allMetadata);
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  /**
   * Create a backup of a recording to device storage
   */
  static async backupRecording(recordingId: string): Promise<string | null> {
    try {
      const metadata = await this.getRecordingMetadata(recordingId);
      if (!metadata) return null;

      // Check permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission denied');
      }

      // Create backup copy
      const backupFileName = `backup_${metadata.fileName}`;
      const backupPath = `${this.BACKUP_DIR}${backupFileName}`;

      await FileSystem.copyAsync({
        from: metadata.filePath,
        to: backupPath,
      });

      // Save to device media library
      const asset = await MediaLibrary.createAssetAsync(backupPath);

      // Update metadata
      await this.updateRecordingMetadata(recordingId, {
        isBackedUp: true,
      });

      return asset.uri;
    } catch (error) {
      console.error('Failed to backup recording:', error);
      return null;
    }
  }

  /**
   * Clean up old temporary files
   */
  static async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const tempDir = `${FileSystem.cacheDirectory}recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(tempDir);

      if (!dirInfo.exists) return;

      const files = await FileSystem.readDirectoryAsync(tempDir);
      const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

      for (const file of files) {
        const filePath = `${tempDir}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime! * 1000 < cutoffTime) {
          await FileSystem.deleteAsync(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalRecordings: number;
    totalSize: number;
    averageSize: number;
    oldestRecording?: Date;
    newestRecording?: Date;
  }> {
    try {
      const recordings = await this.getAllRecordings();

      if (recordings.length === 0) {
        return {
          totalRecordings: 0,
          totalSize: 0,
          averageSize: 0,
        };
      }

      const totalSize = recordings.reduce((sum, recording) => sum + recording.fileSize, 0);
      const averageSize = totalSize / recordings.length;

      const dates = recordings.map(r => r.createdAt).sort((a, b) => a.getTime() - b.getTime());

      return {
        totalRecordings: recordings.length,
        totalSize,
        averageSize,
        oldestRecording: dates[0],
        newestRecording: dates[dates.length - 1],
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalRecordings: 0,
        totalSize: 0,
        averageSize: 0,
      };
    }
  }

  /**
   * Ensure a directory exists
   */
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
  }

  /**
   * Load metadata from storage
   */
  private static async loadMetadata(): Promise<Record<string, AudioFileMetadata>> {
    try {
      const metadataJson = await FileSystem.readAsStringAsync(this.METADATA_FILE);
      const parsed = JSON.parse(metadataJson);

      // Convert date strings back to Date objects
      Object.values(parsed).forEach((metadata: any) => {
        metadata.createdAt = new Date(metadata.createdAt);
        if (metadata.lastPlayed) {
          metadata.lastPlayed = new Date(metadata.lastPlayed);
        }
      });

      return parsed;
    } catch (error) {
      console.warn('Failed to load metadata, returning empty object:', error);
      return {};
    }
  }

  /**
   * Save metadata to storage
   */
  private static async saveMetadata(metadata: Record<string, AudioFileMetadata>): Promise<void> {
    try {
      const metadataJson = JSON.stringify(metadata, null, 2);
      await FileSystem.writeAsStringAsync(this.METADATA_FILE, metadataJson);
    } catch (error) {
      console.error('Failed to save metadata:', error);
      throw error;
    }
  }

  /**
   * Add metadata for a single recording
   */
  private static async addMetadata(recordingId: string, metadata: AudioFileMetadata): Promise<void> {
    try {
      const allMetadata = await this.loadMetadata();
      allMetadata[recordingId] = metadata;
      await this.saveMetadata(allMetadata);
    } catch (error) {
      console.error('Failed to add metadata:', error);
      throw error;
    }
  }
}

export default AudioFileManager;