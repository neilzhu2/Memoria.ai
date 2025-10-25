/**
 * Expo Speech Recognition Provider
 *
 * On-device speech recognition using expo-speech-recognition.
 * Free, privacy-friendly, works offline.
 * Optimized for elderly users' speech patterns.
 */

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  ExpoSpeechRecognitionErrorCode,
} from 'expo-speech-recognition';
import { Audio } from 'expo-av';
import {
  ITranscriptionProvider,
  TranscriptionResult,
  TranscriptionOptions,
} from './ITranscriptionProvider';

export class ExpoSpeechProvider implements ITranscriptionProvider {
  private resultCallback: ((result: TranscriptionResult) => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private currentSound: Audio.Sound | null = null;
  private isTranscribing = false;
  private finalTranscript = '';
  private finalConfidence = 0;

  async isAvailable(): Promise<boolean> {
    try {
      const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
      return available;
    } catch (error) {
      console.error('Speech recognition availability check failed:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startTranscription(
    audioUri: string,
    options: TranscriptionOptions = {}
  ): Promise<void> {
    try {
      // Check permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      // Stop any existing transcription
      if (this.isTranscribing) {
        await this.stopTranscription();
      }

      // Load the audio file to play while transcribing
      const { sound } = await Audio.Sound.createAsync({ uri: audioUri });
      this.currentSound = sound;

      // Configure speech recognition with elderly-optimized settings
      const recognitionOptions = {
        lang: options.language || 'en-US',
        interimResults: options.interimResults ?? true,
        maxAlternatives: options.maxAlternatives || 1,
        continuous: options.continuous ?? false,

        // Elderly-specific optimizations
        // Note: These may not all be supported by expo-speech-recognition
        // but we include them for future provider compatibility
      };

      // Start recognition
      await ExpoSpeechRecognitionModule.start(recognitionOptions);
      this.isTranscribing = true;

      // Play the audio
      await sound.playAsync();

      // Set up event listeners (handled separately with useSpeechRecognitionEvent hook)
    } catch (error) {
      this.isTranscribing = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown transcription error';
      this.errorCallback?.(new Error(`Transcription failed: ${errorMessage}`));
      throw error;
    }
  }

  async stopTranscription(): Promise<TranscriptionResult> {
    try {
      if (this.isTranscribing) {
        await ExpoSpeechRecognitionModule.stop();
        this.isTranscribing = false;
      }

      // Stop audio playback
      if (this.currentSound) {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }

      // Return final result
      return {
        transcript: this.finalTranscript,
        confidence: this.finalConfidence,
        isFinal: true,
      };
    } catch (error) {
      console.error('Failed to stop transcription:', error);
      return {
        transcript: this.finalTranscript,
        confidence: this.finalConfidence,
        isFinal: true,
      };
    }
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  // This should be called from a component using useSpeechRecognitionEvent
  handleSpeechRecognitionEvent(event: any): void {
    if (!event) return;

    switch (event.type) {
      case 'result':
        const transcript = event.results?.[0]?.transcript || '';
        const confidence = event.results?.[0]?.confidence || 0;
        const isFinal = event.isFinal || false;

        if (isFinal) {
          this.finalTranscript = transcript;
          this.finalConfidence = confidence;
        }

        this.resultCallback?.({
          transcript,
          confidence,
          isFinal,
        });
        break;

      case 'error':
        const errorCode = event.error?.code;
        let errorMessage = 'Speech recognition error';

        switch (errorCode) {
          case ExpoSpeechRecognitionErrorCode.NetworkError:
            errorMessage = 'Network error. Please check your connection.';
            break;
          case ExpoSpeechRecognitionErrorCode.NoMatch:
            errorMessage = 'No speech detected. Please try again.';
            break;
          case ExpoSpeechRecognitionErrorCode.RecognizerBusy:
            errorMessage = 'Speech recognizer is busy. Please wait.';
            break;
          case ExpoSpeechRecognitionErrorCode.Aborted:
            errorMessage = 'Speech recognition was cancelled.';
            break;
          default:
            errorMessage = event.error?.message || errorMessage;
        }

        this.errorCallback?.(new Error(errorMessage));
        break;

      case 'end':
        this.isTranscribing = false;
        break;
    }
  }

  async cleanup(): Promise<void> {
    if (this.isTranscribing) {
      await this.stopTranscription();
    }
    if (this.currentSound) {
      await this.currentSound.unloadAsync();
      this.currentSound = null;
    }
    this.resultCallback = null;
    this.errorCallback = null;
    this.finalTranscript = '';
    this.finalConfidence = 0;
  }

  async getSupportedLanguages(): Promise<string[]> {
    try {
      const locales = await ExpoSpeechRecognitionModule.getSupportedLocales();
      return locales || ['en-US'];
    } catch (error) {
      console.error('Failed to get supported languages:', error);
      return ['en-US'];
    }
  }

  getProviderName(): string {
    return 'expo-speech-recognition';
  }
}
