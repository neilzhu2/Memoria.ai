/**
 * Audio Service for Memoria.ai
 * Handles all audio recording and playback operations
 * Optimized for elderly users with accessibility considerations
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import {
  AudioRecording,
  RecordingConfig,
  PlaybackState,
  AudioPermissions,
  AudioError,
  TranscriptionResult
} from '../types';
import { AudioFileManager } from '../utils';

export class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private playbackStatus: Audio.AVPlaybackStatus | null = null;

  /**
   * Initialize audio service and set audio mode for better recording quality
   */
  async initialize(): Promise<void> {
    try {
      // Initialize audio file manager
      await AudioFileManager.initialize();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      throw this.createAudioError('AUDIO_INIT_FAILED', 'Failed to initialize audio service', error);
    }
  }

  /**
   * Check and request audio permissions
   */
  async checkPermissions(): Promise<AudioPermissions> {
    try {
      const audioPermission = await Audio.requestPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();

      return {
        microphone: audioPermission.granted ? 'granted' : 'denied',
        mediaLibrary: mediaLibraryPermission.granted ? 'granted' : 'denied',
      };
    } catch (error) {
      throw this.createAudioError('PERMISSION_CHECK_FAILED', 'Failed to check permissions', error);
    }
  }

  /**
   * Start audio recording with specified configuration
   */
  async startRecording(config: RecordingConfig): Promise<AudioRecording> {
    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      if (permissions.microphone !== 'granted') {
        throw new Error('Microphone permission denied');
      }

      // Stop any existing recording
      await this.stopRecording();

      // Create recording with optimized settings for elderly users
      const recordingOptions = this.getRecordingOptions(config);
      this.recording = new Audio.Recording();

      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();

      // Provide haptic feedback for elderly users
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Generate temporary file path - will be moved by AudioFileManager
      const fileName = AudioFileManager.generateFileName();
      const tempDir = `${FileSystem.cacheDirectory}recordings/`;

      // Ensure temp directory exists
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }

      const filePath = `${tempDir}${fileName}`;

      const audioRecording: AudioRecording = {
        id: Date.now().toString(),
        filePath,
        duration: 0,
        fileSize: 0,
        quality: config.quality,
        sampleRate: recordingOptions.android?.sampleRate || recordingOptions.ios?.sampleRate || 44100,
        bitRate: recordingOptions.android?.bitRate || recordingOptions.ios?.bitRate || 128000,
        createdAt: new Date(),
        isProcessing: false,
      };

      return audioRecording;
    } catch (error) {
      throw this.createAudioError('RECORDING_START_FAILED', 'Failed to start recording', error);
    }
  }

  /**
   * Stop audio recording and save file
   */
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      // Clean up
      this.recording = null;

      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      return uri;
    } catch (error) {
      throw this.createAudioError('RECORDING_STOP_FAILED', 'Failed to stop recording', error);
    }
  }

  /**
   * Pause audio recording
   */
  async pauseRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.pauseAsync();
      }
    } catch (error) {
      throw this.createAudioError('RECORDING_PAUSE_FAILED', 'Failed to pause recording', error);
    }
  }

  /**
   * Resume audio recording
   */
  async resumeRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.startAsync();
      }
    } catch (error) {
      throw this.createAudioError('RECORDING_RESUME_FAILED', 'Failed to resume recording', error);
    }
  }

  /**
   * Get current recording status
   */
  async getRecordingStatus(): Promise<Audio.RecordingStatus | null> {
    try {
      if (this.recording) {
        return await this.recording.getStatusAsync();
      }
      return null;
    } catch (error) {
      throw this.createAudioError('STATUS_CHECK_FAILED', 'Failed to get recording status', error);
    }
  }

  /**
   * Play audio file with enhanced controls for elderly users
   */
  async playAudio(filePath: string, playbackRate: number = 1.0): Promise<void> {
    try {
      // Stop any current playback
      await this.stopAudio();

      // Create new sound instance
      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        {
          shouldPlay: true,
          rate: Math.max(0.5, Math.min(2.0, playbackRate)), // Constrain playback rate
          volume: 1.0,
        }
      );

      this.sound = sound;

      // Set up playback status updates
      this.sound.setOnPlaybackStatusUpdate((status) => {
        this.playbackStatus = status;
      });

      // Provide haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      throw this.createAudioError('PLAYBACK_START_FAILED', 'Failed to start playback', error);
    }
  }

  /**
   * Pause audio playback
   */
  async pauseAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.pauseAsync();
      }
    } catch (error) {
      throw this.createAudioError('PLAYBACK_PAUSE_FAILED', 'Failed to pause playback', error);
    }
  }

  /**
   * Resume audio playback
   */
  async resumeAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.playAsync();
      }
    } catch (error) {
      throw this.createAudioError('PLAYBACK_RESUME_FAILED', 'Failed to resume playback', error);
    }
  }

  /**
   * Stop audio playback
   */
  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
        this.playbackStatus = null;
      }
    } catch (error) {
      throw this.createAudioError('PLAYBACK_STOP_FAILED', 'Failed to stop playback', error);
    }
  }

  /**
   * Seek to specific position in audio
   */
  async seekTo(positionMillis: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(positionMillis);
      }
    } catch (error) {
      throw this.createAudioError('SEEK_FAILED', 'Failed to seek audio position', error);
    }
  }

  /**
   * Set playback volume (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    try {
      if (this.sound) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        await this.sound.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      throw this.createAudioError('VOLUME_SET_FAILED', 'Failed to set volume', error);
    }
  }

  /**
   * Set playback rate (0.5 to 2.0) - important for elderly users
   */
  async setPlaybackRate(rate: number): Promise<void> {
    try {
      if (this.sound) {
        const clampedRate = Math.max(0.5, Math.min(2.0, rate));
        await this.sound.setRateAsync(clampedRate, true);
      }
    } catch (error) {
      throw this.createAudioError('RATE_SET_FAILED', 'Failed to set playback rate', error);
    }
  }

  /**
   * Get current playback status
   */
  getPlaybackStatus(): Audio.AVPlaybackStatus | null {
    return this.playbackStatus;
  }

  /**
   * Get audio file information
   */
  async getAudioFileInfo(filePath: string): Promise<{ duration: number; size: number }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Load sound to get duration
      const { sound } = await Audio.Sound.createAsync({ uri: filePath });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();

      return {
        duration: status.isLoaded ? (status.durationMillis || 0) / 1000 : 0,
        size: fileInfo.size || 0,
      };
    } catch (error) {
      throw this.createAudioError('FILE_INFO_FAILED', 'Failed to get audio file info', error);
    }
  }

  /**
   * Delete audio file
   */
  async deleteAudioFile(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      throw this.createAudioError('FILE_DELETE_FAILED', 'Failed to delete audio file', error);
    }
  }

  /**
   * Get optimized recording options based on quality and elderly user needs
   */
  private getRecordingOptions(config: RecordingConfig): Audio.RecordingOptions {
    const qualitySettings = {
      low: {
        sampleRate: 16000,
        numberOfChannels: 1,
        bitRate: 64000,
      },
      medium: {
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      high: {
        sampleRate: 48000,
        numberOfChannels: 2,
        bitRate: 256000,
      },
    };

    const settings = qualitySettings[config.quality];

    return {
      android: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
        sampleRate: settings.sampleRate,
        numberOfChannels: settings.numberOfChannels,
        bitRate: settings.bitRate,
      },
      ios: {
        extension: '.m4a',
        outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
        sampleRate: settings.sampleRate,
        numberOfChannels: settings.numberOfChannels,
        bitRate: settings.bitRate,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {
        mimeType: 'audio/webm',
        bitsPerSecond: settings.bitRate,
      },
    };
  }

  /**
   * Format duration in MM:SS format for display
   */
  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Create standardized audio error
   */
  private createAudioError(code: string, message: string, originalError?: any): AudioError {
    return {
      code,
      message,
      details: originalError?.message || originalError?.toString(),
      timestamp: new Date(),
    };
  }

  /**
   * Save recording with metadata management
   */
  async saveRecording(
    tempFilePath: string,
    title?: string,
    duration?: number
  ): Promise<{ recordingId: string; filePath: string }> {
    try {
      const metadata = await AudioFileManager.saveRecording(tempFilePath, title, {
        duration: duration || 0,
      });

      return {
        recordingId: metadata.id,
        filePath: metadata.filePath,
      };
    } catch (error) {
      throw this.createAudioError('RECORDING_SAVE_FAILED', 'Failed to save recording', error);
    }
  }

  /**
   * Get all recordings with metadata
   */
  async getAllRecordings() {
    try {
      return await AudioFileManager.getAllRecordings();
    } catch (error) {
      throw this.createAudioError('RECORDINGS_FETCH_FAILED', 'Failed to fetch recordings', error);
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      await AudioFileManager.deleteRecording(recordingId);
    } catch (error) {
      throw this.createAudioError('RECORDING_DELETE_FAILED', 'Failed to delete recording', error);
    }
  }

  /**
   * Backup recording to device storage
   */
  async backupRecording(recordingId: string): Promise<string | null> {
    try {
      return await AudioFileManager.backupRecording(recordingId);
    } catch (error) {
      console.warn('Failed to backup recording:', error);
      return null;
    }
  }

  /**
   * Clean up old temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      await AudioFileManager.cleanupTempFiles(24); // Clean files older than 24 hours
    } catch (error) {
      console.warn('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    try {
      return await AudioFileManager.getStorageStats();
    } catch (error) {
      console.warn('Failed to get storage stats:', error);
      return {
        totalRecordings: 0,
        totalSize: 0,
        averageSize: 0,
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopRecording();
      await this.stopAudio();
      await this.cleanupTempFiles();
    } catch (error) {
      console.warn('Error during audio service cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();