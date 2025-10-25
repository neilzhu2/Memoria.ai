/**
 * Transcription Provider Interface
 *
 * Abstract interface for audio transcription providers.
 * Allows switching between expo-speech-recognition (free, on-device)
 * and OpenAI Whisper API (premium, cloud-based) without changing consumer code.
 */

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  text: string;
  timestamp: number;
  confidence: number;
}

export interface TranscriptionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;

  // Elderly-specific optimizations
  pauseThreshold?: number; // ms to wait before considering speech ended
  noiseReduction?: boolean;
  slowSpeechOptimization?: boolean;
}

export interface ITranscriptionProvider {
  /**
   * Check if transcription is available on this device
   */
  isAvailable(): Promise<boolean>;

  /**
   * Request necessary permissions
   */
  requestPermissions(): Promise<boolean>;

  /**
   * Start transcription
   */
  startTranscription(audioUri: string, options?: TranscriptionOptions): Promise<void>;

  /**
   * Stop transcription and get final result
   */
  stopTranscription(): Promise<TranscriptionResult>;

  /**
   * Register callback for interim results (real-time transcription)
   */
  onResult(callback: (result: TranscriptionResult) => void): void;

  /**
   * Register callback for errors
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Cleanup resources
   */
  cleanup(): Promise<void>;

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Promise<string[]>;

  /**
   * Provider name for debugging/analytics
   */
  getProviderName(): string;
}
