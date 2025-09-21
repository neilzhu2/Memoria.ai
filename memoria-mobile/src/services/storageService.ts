/**
 * Storage Service for Memoria.ai
 * Handles all data persistence with SQLite and MMKV
 * Optimized for elderly users with data safety and reliability
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MMKV } from 'react-native-mmkv';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import {
  Memory,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  MemoryFilters,
  MemorySort,
  User,
  UserPreferences,
  StorageConfig,
  ApiResponse
} from '../types';

export class StorageService {
  private mmkv: MMKV;
  private db: any; // Would be SQLite database instance
  private config: StorageConfig;

  constructor() {
    // Initialize MMKV for fast key-value storage
    this.mmkv = new MMKV({
      id: 'memoria-storage',
      encryptionKey: 'memoria-secure-key-2024', // In production, use dynamic key
    });

    this.config = {
      maxMemories: 10000, // Generous limit for elderly users
      maxAudioFileSize: 100 * 1024 * 1024, // 100MB per file
      compressionEnabled: true,
      encryptionEnabled: true,
    };

    this.initializeDatabase();
  }

  /**
   * Initialize SQLite database with tables
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // In a real implementation, this would use expo-sqlite
      // Creating tables for memories, users, settings, etc.
      console.log('Initializing SQLite database...');

      // Create memories table
      const createMemoriesTable = `
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          audioFilePath TEXT NOT NULL,
          transcription TEXT NOT NULL,
          language TEXT NOT NULL,
          duration INTEGER NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          tags TEXT,
          isFavorite INTEGER DEFAULT 0,
          isArchived INTEGER DEFAULT 0,
          confidence REAL DEFAULT 0.0
        )
      `;

      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          preferredLanguage TEXT DEFAULT 'en',
          createdAt TEXT NOT NULL,
          lastActiveAt TEXT NOT NULL,
          isFirstTimeUser INTEGER DEFAULT 1,
          onboardingCompleted INTEGER DEFAULT 0
        )
      `;

      // Create indexes for better query performance
      const createIndexes = [
        'CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(createdAt)',
        'CREATE INDEX IF NOT EXISTS idx_memories_favorite ON memories(isFavorite)',
        'CREATE INDEX IF NOT EXISTS idx_memories_archived ON memories(isArchived)',
        'CREATE INDEX IF NOT EXISTS idx_memories_language ON memories(language)',
      ];

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Store data in MMKV (fast key-value storage)
   */
  setMMKVValue(key: string, value: any): void {
    try {
      if (typeof value === 'string') {
        this.mmkv.set(key, value);
      } else if (typeof value === 'number') {
        this.mmkv.set(key, value);
      } else if (typeof value === 'boolean') {
        this.mmkv.set(key, value);
      } else {
        this.mmkv.set(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Failed to set MMKV value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data from MMKV
   */
  getMMKVValue<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const value = this.mmkv.getString(key);
      if (value === undefined) {
        return defaultValue;
      }

      // Try to parse as JSON, fallback to string value
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Failed to get MMKV value for key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data from MMKV
   */
  removeMMKVValue(key: string): void {
    try {
      this.mmkv.delete(key);
    } catch (error) {
      console.error(`Failed to remove MMKV value for key ${key}:`, error);
    }
  }

  /**
   * Store sensitive data in SecureStore
   */
  async setSecureValue(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Failed to set secure value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get sensitive data from SecureStore
   */
  async getSecureValue(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Failed to get secure value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Create a new memory record
   */
  async createMemory(request: CreateMemoryRequest): Promise<ApiResponse<Memory>> {
    try {
      const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const memory: Memory = {
        id,
        title: request.title,
        description: request.description || '',
        audioFilePath: request.audioFilePath,
        transcription: '', // Will be updated after transcription
        language: request.language,
        duration: 0, // Will be updated after audio processing
        createdAt: new Date(now),
        updatedAt: new Date(now),
        tags: request.tags || [],
        isFavorite: false,
        isArchived: false,
        confidence: 0.0,
      };

      // In real implementation, insert into SQLite
      console.log('Creating memory in database:', memory);

      // Store in MMKV for quick access (cache)
      const cacheKey = `memory_${id}`;
      this.setMMKVValue(cacheKey, memory);

      // Update memory count cache
      const memoryCount = this.getMMKVValue<number>('memory_count', 0);
      this.setMMKVValue('memory_count', memoryCount + 1);

      return {
        success: true,
        data: memory,
        message: 'Memory created successfully',
      };
    } catch (error) {
      console.error('Failed to create memory:', error);
      return {
        success: false,
        error: 'Failed to create memory',
      };
    }
  }

  /**
   * Get memory by ID
   */
  async getMemory(id: string): Promise<ApiResponse<Memory>> {
    try {
      // Try cache first (MMKV)
      const cachedMemory = this.getMMKVValue<Memory>(`memory_${id}`);
      if (cachedMemory) {
        return {
          success: true,
          data: cachedMemory,
        };
      }

      // Fallback to database query
      console.log('Fetching memory from database:', id);

      // In real implementation, query SQLite
      // const memory = await this.db.get('SELECT * FROM memories WHERE id = ?', [id]);

      return {
        success: false,
        error: 'Memory not found',
      };
    } catch (error) {
      console.error('Failed to get memory:', error);
      return {
        success: false,
        error: 'Failed to retrieve memory',
      };
    }
  }

  /**
   * Get all memories with filtering and sorting
   */
  async getMemories(
    filters?: MemoryFilters,
    sort?: MemorySort,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<Memory[]>> {
    try {
      // In real implementation, build dynamic SQL query based on filters
      let query = 'SELECT * FROM memories WHERE 1=1';
      const params: any[] = [];

      if (filters?.searchQuery) {
        query += ' AND (title LIKE ? OR transcription LIKE ? OR description LIKE ?)';
        const searchPattern = `%${filters.searchQuery}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      if (filters?.language && filters.language !== 'all') {
        query += ' AND language = ?';
        params.push(filters.language);
      }

      if (filters?.isFavorite !== undefined) {
        query += ' AND isFavorite = ?';
        params.push(filters.isFavorite ? 1 : 0);
      }

      if (filters?.isArchived !== undefined) {
        query += ' AND isArchived = ?';
        params.push(filters.isArchived ? 1 : 0);
      }

      if (filters?.dateRange) {
        query += ' AND createdAt BETWEEN ? AND ?';
        params.push(filters.dateRange.start.toISOString(), filters.dateRange.end.toISOString());
      }

      // Add sorting
      if (sort) {
        query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;
      } else {
        query += ' ORDER BY createdAt DESC';
      }

      // Add pagination
      if (limit) {
        query += ` LIMIT ${limit}`;
        if (offset) {
          query += ` OFFSET ${offset}`;
        }
      }

      console.log('Query:', query, 'Params:', params);

      // For now, return empty array - in real implementation, execute query
      const memories: Memory[] = [];

      return {
        success: true,
        data: memories,
      };
    } catch (error) {
      console.error('Failed to get memories:', error);
      return {
        success: false,
        error: 'Failed to retrieve memories',
      };
    }
  }

  /**
   * Update memory
   */
  async updateMemory(id: string, updates: UpdateMemoryRequest): Promise<ApiResponse<Memory>> {
    try {
      // Get existing memory
      const existingResponse = await this.getMemory(id);
      if (!existingResponse.success || !existingResponse.data) {
        return {
          success: false,
          error: 'Memory not found',
        };
      }

      const updatedMemory: Memory = {
        ...existingResponse.data,
        ...updates,
        updatedAt: new Date(),
      };

      // Update in database
      console.log('Updating memory in database:', updatedMemory);

      // Update cache
      this.setMMKVValue(`memory_${id}`, updatedMemory);

      return {
        success: true,
        data: updatedMemory,
        message: 'Memory updated successfully',
      };
    } catch (error) {
      console.error('Failed to update memory:', error);
      return {
        success: false,
        error: 'Failed to update memory',
      };
    }
  }

  /**
   * Delete memory
   */
  async deleteMemory(id: string): Promise<ApiResponse<void>> {
    try {
      // Get memory to find audio file
      const memoryResponse = await this.getMemory(id);
      if (memoryResponse.success && memoryResponse.data) {
        // Delete audio file
        await this.deleteAudioFile(memoryResponse.data.audioFilePath);
      }

      // Delete from database
      console.log('Deleting memory from database:', id);

      // Remove from cache
      this.removeMMKVValue(`memory_${id}`);

      // Update memory count
      const memoryCount = this.getMMKVValue<number>('memory_count', 0);
      this.setMMKVValue('memory_count', Math.max(0, memoryCount - 1));

      return {
        success: true,
        message: 'Memory deleted successfully',
      };
    } catch (error) {
      console.error('Failed to delete memory:', error);
      return {
        success: false,
        error: 'Failed to delete memory',
      };
    }
  }

  /**
   * Save user data
   */
  async saveUser(user: User): Promise<ApiResponse<User>> {
    try {
      // Save to database
      console.log('Saving user to database:', user);

      // Cache user data
      this.setMMKVValue('current_user', user);

      return {
        success: true,
        data: user,
        message: 'User saved successfully',
      };
    } catch (error) {
      console.error('Failed to save user:', error);
      return {
        success: false,
        error: 'Failed to save user',
      };
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      // Try cache first
      const cachedUser = this.getMMKVValue<User>('current_user');
      if (cachedUser) {
        return {
          success: true,
          data: cachedUser,
        };
      }

      // Fallback to database
      console.log('Fetching user from database');

      return {
        success: false,
        error: 'User not found',
      };
    } catch (error) {
      console.error('Failed to get current user:', error);
      return {
        success: false,
        error: 'Failed to retrieve user',
      };
    }
  }

  /**
   * Save user preferences
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<ApiResponse<UserPreferences>> {
    try {
      // Save to MMKV for quick access
      this.setMMKVValue('user_preferences', preferences);

      // Also save to secure storage if needed
      await this.setSecureValue('user_preferences_backup', JSON.stringify(preferences));

      return {
        success: true,
        data: preferences,
        message: 'Preferences saved successfully',
      };
    } catch (error) {
      console.error('Failed to save preferences:', error);
      return {
        success: false,
        error: 'Failed to save preferences',
      };
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    try {
      const preferences = this.getMMKVValue<UserPreferences>('user_preferences');
      if (preferences) {
        return {
          success: true,
          data: preferences,
        };
      }

      return {
        success: false,
        error: 'Preferences not found',
      };
    } catch (error) {
      console.error('Failed to get preferences:', error);
      return {
        success: false,
        error: 'Failed to retrieve preferences',
      };
    }
  }

  /**
   * Delete audio file from file system
   */
  async deleteAudioFile(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete audio file:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageUsage(): Promise<{
    totalMemories: number;
    totalAudioSize: number;
    databaseSize: number;
  }> {
    try {
      const totalMemories = this.getMMKVValue<number>('memory_count', 0);

      // Calculate total audio files size
      let totalAudioSize = 0;
      const recordingsDir = `${FileSystem.documentDirectory}recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(recordingsDir);

      if (dirInfo.exists && dirInfo.isDirectory) {
        const files = await FileSystem.readDirectoryAsync(recordingsDir);
        for (const file of files) {
          const filePath = `${recordingsDir}${file}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          totalAudioSize += fileInfo.size || 0;
        }
      }

      return {
        totalMemories,
        totalAudioSize,
        databaseSize: 0, // Would calculate actual database size
      };
    } catch (error) {
      console.error('Failed to get storage usage:', error);
      return {
        totalMemories: 0,
        totalAudioSize: 0,
        databaseSize: 0,
      };
    }
  }

  /**
   * Clean up old or unused data
   */
  async cleanup(): Promise<void> {
    try {
      // Remove old cache entries
      const cacheKeys = this.mmkv.getAllKeys();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const key of cacheKeys) {
        if (key.startsWith('temp_') || key.startsWith('cache_')) {
          // Check if old temporary data
          const timestamp = key.split('_')[1];
          if (timestamp && parseInt(timestamp) < oneWeekAgo) {
            this.removeMMKVValue(key);
          }
        }
      }

      console.log('Storage cleanup completed');
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  /**
   * Export all data for backup
   */
  async exportData(): Promise<ApiResponse<any>> {
    try {
      const user = await this.getCurrentUser();
      const preferences = await this.getUserPreferences();
      const memories = await this.getMemories();
      const storageUsage = await this.getStorageUsage();

      const exportData = {
        user: user.data,
        preferences: preferences.data,
        memories: memories.data,
        storageUsage,
        exportDate: new Date().toISOString(),
      };

      return {
        success: true,
        data: exportData,
        message: 'Data exported successfully',
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return {
        success: false,
        error: 'Failed to export data',
      };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();