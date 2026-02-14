/**
 * Transcription Service
 *
 * Main service for managing audio transcription.
 * Uses provider pattern to support multiple transcription backends.
 */

import { ITranscriptionProvider, TranscriptionResult, TranscriptionOptions } from './ITranscriptionProvider';
import { ExpoSpeechProvider } from './ExpoSpeechProvider';
import { GeminiTranscriptionProvider } from './GeminiTranscriptionProvider';

export type TranscriptionProvider = 'expo-speech' | 'gemini' | 'whisper-api';

export class TranscriptionService {
  private currentProvider: ITranscriptionProvider;
  private providerType: TranscriptionProvider;

  constructor(providerType: TranscriptionProvider = 'gemini') {
    this.providerType = providerType;
    this.currentProvider = this.createProvider(providerType);
  }

  private createProvider(type: TranscriptionProvider): ITranscriptionProvider {
    switch (type) {
      case 'expo-speech':
        return new ExpoSpeechProvider();
      case 'gemini':
        return new GeminiTranscriptionProvider();
      case 'whisper-api':
        // Future: return new WhisperAPIProvider();
        throw new Error('Whisper API provider not yet implemented');
      default:
        return new GeminiTranscriptionProvider();
    }
  }

  /**
   * Switch transcription provider
   */
  async switchProvider(newProvider: TranscriptionProvider): Promise<void> {
    await this.currentProvider.cleanup();
    this.providerType = newProvider;
    this.currentProvider = this.createProvider(newProvider);
  }

  /**
   * Get current provider type
   */
  getProviderType(): TranscriptionProvider {
    return this.providerType;
  }

  /**
   * Get provider name for debugging
   */
  getProviderName(): string {
    return this.currentProvider.getProviderName();
  }

  /**
   * Check if transcription is available
   */
  async isAvailable(): Promise<boolean> {
    return this.currentProvider.isAvailable();
  }

  /**
   * Request transcription permissions
   */
  async requestPermissions(): Promise<boolean> {
    return this.currentProvider.requestPermissions();
  }

  /**
   * Transcribe an audio file
   * @param audioUri - Path to audio file
   * @param options - Transcription options
   * @returns Promise<TranscriptionResult>
   */
  async transcribe(
    audioUri: string,
    options?: TranscriptionOptions
  ): Promise<TranscriptionResult> {
    // Elderly-optimized default options
    const elderlyOptions: TranscriptionOptions = {
      language: options?.language || 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1,

      // Elderly-specific optimizations
      pauseThreshold: 2000, // 2 seconds (vs standard 1 second)
      noiseReduction: true,
      slowSpeechOptimization: true,

      ...options,
    };

    try {
      await this.currentProvider.startTranscription(audioUri, elderlyOptions);
      const result = await this.currentProvider.stopTranscription();
      return result;
    } catch (error) {
      console.error('Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Start real-time transcription with callbacks
   */
  async startRealtime(
    audioUri: string,
    onResult: (result: TranscriptionResult) => void,
    onError?: (error: Error) => void,
    options?: TranscriptionOptions
  ): Promise<void> {
    this.currentProvider.onResult(onResult);
    if (onError) {
      this.currentProvider.onError(onError);
    }

    await this.currentProvider.startTranscription(audioUri, options);
  }

  /**
   * Stop real-time transcription
   */
  async stopRealtime(): Promise<TranscriptionResult> {
    return this.currentProvider.stopTranscription();
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<string[]> {
    return this.currentProvider.getSupportedLanguages();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    return this.currentProvider.cleanup();
  }

  /**
   * Get provider-specific info for analytics/debugging
   */
  getProviderInfo(): {
    type: TranscriptionProvider;
    name: string;
  } {
    return {
      type: this.providerType,
      name: this.currentProvider.getProviderName(),
    };
  }
}

// Singleton instance for app-wide use
let transcriptionServiceInstance: TranscriptionService | null = null;

export function getTranscriptionService(): TranscriptionService {
  if (!transcriptionServiceInstance) {
    transcriptionServiceInstance = new TranscriptionService('gemini');
  }
  return transcriptionServiceInstance;
}

export function setTranscriptionProvider(provider: TranscriptionProvider): Promise<void> {
  const service = getTranscriptionService();
  return service.switchProvider(provider);
}
