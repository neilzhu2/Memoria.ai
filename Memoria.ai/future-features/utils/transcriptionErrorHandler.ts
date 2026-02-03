/**
 * Transcription Error Handler for Memoria.ai
 * Comprehensive error handling and retry mechanisms for elderly users
 */

import { TranscriptionError, ElderlyTranscriptionSettings } from '../types';
import * as Speech from 'expo-speech';
import { Alert } from 'react-native';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  enableUserNotification: boolean;
  enableVoiceAnnouncement: boolean;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'manual' | 'skip';
  action: string;
  userMessage: string;
  voiceMessage: string;
  shouldNotifyUser: boolean;
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  deviceInfo: {
    platform: string;
    version: string;
    memoryUsage?: number;
    networkStatus?: string;
  };
  transcriptionState: {
    isActive: boolean;
    currentLanguage?: 'en' | 'zh';
    confidence: number;
    duration: number;
  };
}

export class TranscriptionErrorHandler {
  private retryConfig: RetryConfig;
  private elderlySettings: ElderlyTranscriptionSettings;
  private errorHistory: (TranscriptionError & { context: ErrorContext })[] = [];
  private retryAttempts: Map<string, number> = new Map();
  private recoveryStrategies: Map<string, ErrorRecoveryStrategy> = new Map();

  constructor(
    elderlySettings: ElderlyTranscriptionSettings,
    retryConfig?: Partial<RetryConfig>
  ) {
    this.elderlySettings = elderlySettings;
    this.retryConfig = {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      enableUserNotification: true,
      enableVoiceAnnouncement: elderlySettings.enableVoiceGuidance,
      ...retryConfig,
    };

    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize error recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Network-related errors
    this.recoveryStrategies.set('NETWORK_ERROR', {
      type: 'retry',
      action: 'Check network connection and retry',
      userMessage: 'Network connection issue. Will retry automatically.',
      voiceMessage: 'Network connection problem. Trying again.',
      shouldNotifyUser: true,
    });

    this.recoveryStrategies.set('TIMEOUT_ERROR', {
      type: 'retry',
      action: 'Increase timeout and retry',
      userMessage: 'Request timed out. Retrying with longer timeout.',
      voiceMessage: 'Taking longer than expected. Trying again.',
      shouldNotifyUser: this.elderlySettings.enableVoiceGuidance,
    });

    // Permission-related errors
    this.recoveryStrategies.set('PERMISSION_DENIED', {
      type: 'manual',
      action: 'Request user to check permissions',
      userMessage: 'Microphone permission is required. Please check your device settings.',
      voiceMessage: 'Please allow microphone access in your device settings.',
      shouldNotifyUser: true,
    });

    this.recoveryStrategies.set('MIC_NOT_AVAILABLE', {
      type: 'manual',
      action: 'Check microphone availability',
      userMessage: 'Microphone not available. Please check if another app is using it.',
      voiceMessage: 'Microphone is busy. Please close other apps and try again.',
      shouldNotifyUser: true,
    });

    // Service-related errors
    this.recoveryStrategies.set('SERVICE_UNAVAILABLE', {
      type: 'fallback',
      action: 'Switch to offline mode',
      userMessage: 'Transcription service unavailable. Switching to basic mode.',
      voiceMessage: 'Switching to basic transcription mode.',
      shouldNotifyUser: true,
    });

    this.recoveryStrategies.set('QUOTA_EXCEEDED', {
      type: 'fallback',
      action: 'Use local transcription',
      userMessage: 'Daily transcription limit reached. Using offline mode.',
      voiceMessage: 'Using offline transcription for now.',
      shouldNotifyUser: true,
    });

    // Language-related errors
    this.recoveryStrategies.set('LANGUAGE_NOT_SUPPORTED', {
      type: 'fallback',
      action: 'Switch to supported language',
      userMessage: 'Language not supported. Switching to English.',
      voiceMessage: 'Switching to English transcription.',
      shouldNotifyUser: true,
    });

    this.recoveryStrategies.set('LANGUAGE_DETECTION_FAILED', {
      type: 'retry',
      action: 'Retry with manual language selection',
      userMessage: 'Could not detect language. Please select manually.',
      voiceMessage: 'Please choose your language manually.',
      shouldNotifyUser: true,
    });

    // Processing errors
    this.recoveryStrategies.set('PROCESSING_ERROR', {
      type: 'retry',
      action: 'Retry with reduced quality',
      userMessage: 'Processing error. Retrying with different settings.',
      voiceMessage: 'Having trouble processing. Trying different approach.',
      shouldNotifyUser: this.elderlySettings.enableVoiceGuidance,
    });

    this.recoveryStrategies.set('MEMORY_ERROR', {
      type: 'fallback',
      action: 'Reduce quality and buffer size',
      userMessage: 'Memory issue. Reducing quality to continue.',
      voiceMessage: 'Adjusting settings to reduce memory usage.',
      shouldNotifyUser: false,
    });

    // Real-time specific errors
    this.recoveryStrategies.set('REALTIME_START_FAILED', {
      type: 'retry',
      action: 'Restart real-time transcription',
      userMessage: 'Failed to start real-time transcription. Retrying.',
      voiceMessage: 'Restarting live transcription.',
      shouldNotifyUser: this.elderlySettings.enableVoiceGuidance,
    });

    this.recoveryStrategies.set('REALTIME_STOP_FAILED', {
      type: 'manual',
      action: 'Manual intervention required',
      userMessage: 'Could not stop transcription properly. Recording will continue.',
      voiceMessage: 'Transcription continues running. This is okay.',
      shouldNotifyUser: true,
    });

    // Audio quality errors
    this.recoveryStrategies.set('AUDIO_QUALITY_LOW', {
      type: 'skip',
      action: 'Continue with warning',
      userMessage: 'Audio quality is low. Please speak closer to the microphone.',
      voiceMessage: 'Please speak closer to your device.',
      shouldNotifyUser: true,
    });

    this.recoveryStrategies.set('NOISE_LEVEL_HIGH', {
      type: 'skip',
      action: 'Continue with noise reduction',
      userMessage: 'Background noise detected. Moving to a quieter location may help.',
      voiceMessage: 'Background noise detected. A quieter location would help.',
      shouldNotifyUser: this.elderlySettings.enableVoiceGuidance,
    });
  }

  /**
   * Handle transcription error with elderly-friendly approach
   */
  async handleError(
    error: TranscriptionError,
    context: ErrorContext,
    onRecovery?: (strategy: ErrorRecoveryStrategy) => Promise<boolean>
  ): Promise<boolean> {
    // Add to error history
    this.errorHistory.push({ ...error, context });

    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift();
    }

    console.error('Transcription error:', error);

    // Get recovery strategy
    const strategy = this.getRecoveryStrategy(error);

    // Check retry limits
    if (strategy.type === 'retry' && !this.canRetry(error.code)) {
      // Convert to manual intervention if max retries exceeded
      strategy.type = 'manual';
      strategy.userMessage = 'Multiple attempts failed. Please try again later.';
      strategy.voiceMessage = 'Having persistent trouble. Please try again later.';
    }

    // Notify user if needed
    if (strategy.shouldNotifyUser) {
      await this.notifyUser(error, strategy);
    }

    // Apply recovery strategy
    return await this.applyRecoveryStrategy(error, strategy, context, onRecovery);
  }

  /**
   * Get appropriate recovery strategy for error
   */
  private getRecoveryStrategy(error: TranscriptionError): ErrorRecoveryStrategy {
    const strategy = this.recoveryStrategies.get(error.code);

    if (strategy) {
      return { ...strategy };
    }

    // Default strategy for unknown errors
    return {
      type: 'retry',
      action: 'Generic retry',
      userMessage: 'An error occurred. Trying again.',
      voiceMessage: 'Something went wrong. Trying again.',
      shouldNotifyUser: this.elderlySettings.enableVoiceGuidance,
    };
  }

  /**
   * Check if error can be retried
   */
  private canRetry(errorCode: string): boolean {
    const attemptCount = this.retryAttempts.get(errorCode) || 0;
    return attemptCount < this.retryConfig.maxRetries;
  }

  /**
   * Notify user about error with elderly-friendly approach
   */
  private async notifyUser(
    error: TranscriptionError,
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    // Voice announcement for elderly users
    if (this.retryConfig.enableVoiceAnnouncement && strategy.voiceMessage) {
      try {
        await Speech.speak(strategy.voiceMessage, {
          language: this.elderlySettings.voiceGuidanceLanguage === 'zh' ? 'zh-CN' : 'en-US',
          rate: this.elderlySettings.speechRate,
          pitch: 1.0,
        });
      } catch (speechError) {
        console.warn('Failed to announce error:', speechError);
      }
    }

    // Visual notification
    if (this.retryConfig.enableUserNotification && this.elderlySettings.simplifiedControls) {
      // Use simple alert for elderly users
      const title = this.getSimplifiedErrorTitle(error.code);
      const message = strategy.userMessage;

      if (strategy.type === 'manual') {
        Alert.alert(
          title,
          message,
          [
            { text: 'OK', style: 'default' },
            { text: 'Help', onPress: () => this.showErrorHelp(error.code) }
          ]
        );
      } else {
        // Auto-dismissing notification for retry/fallback
        Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
      }
    }
  }

  /**
   * Get simplified error title for elderly users
   */
  private getSimplifiedErrorTitle(errorCode: string): string {
    const titles: Record<string, string> = {
      'NETWORK_ERROR': 'Connection Issue',
      'PERMISSION_DENIED': 'Permission Needed',
      'MIC_NOT_AVAILABLE': 'Microphone Busy',
      'SERVICE_UNAVAILABLE': 'Service Issue',
      'QUOTA_EXCEEDED': 'Daily Limit Reached',
      'LANGUAGE_NOT_SUPPORTED': 'Language Issue',
      'LANGUAGE_DETECTION_FAILED': 'Language Selection',
      'PROCESSING_ERROR': 'Processing Issue',
      'MEMORY_ERROR': 'Memory Issue',
      'REALTIME_START_FAILED': 'Startup Issue',
      'REALTIME_STOP_FAILED': 'Stop Issue',
      'AUDIO_QUALITY_LOW': 'Audio Quality',
      'NOISE_LEVEL_HIGH': 'Background Noise',
    };

    return titles[errorCode] || 'Technical Issue';
  }

  /**
   * Show error help for elderly users
   */
  private showErrorHelp(errorCode: string): void {
    const helpMessages: Record<string, string> = {
      'PERMISSION_DENIED': 'Go to Settings → Privacy → Microphone → Memoria and turn it on.',
      'MIC_NOT_AVAILABLE': 'Close other apps that might be using the microphone, then try again.',
      'NETWORK_ERROR': 'Check your WiFi or mobile data connection.',
      'SERVICE_UNAVAILABLE': 'The transcription service is temporarily unavailable. Recording will continue.',
      'LANGUAGE_NOT_SUPPORTED': 'Try selecting English or Chinese from the language options.',
      'AUDIO_QUALITY_LOW': 'Hold your device closer to your mouth when speaking.',
      'NOISE_LEVEL_HIGH': 'Try moving to a quieter room or location.',
    };

    const helpMessage = helpMessages[errorCode] || 'Please try again in a few moments.';

    Alert.alert('How to Fix This', helpMessage, [{ text: 'OK', style: 'default' }]);
  }

  /**
   * Apply recovery strategy
   */
  private async applyRecoveryStrategy(
    error: TranscriptionError,
    strategy: ErrorRecoveryStrategy,
    context: ErrorContext,
    onRecovery?: (strategy: ErrorRecoveryStrategy) => Promise<boolean>
  ): Promise<boolean> {
    switch (strategy.type) {
      case 'retry':
        return await this.handleRetry(error, context, onRecovery);

      case 'fallback':
        if (onRecovery) {
          return await onRecovery(strategy);
        }
        return true; // Assume fallback succeeded

      case 'manual':
        // Manual intervention required - user needs to take action
        return false;

      case 'skip':
        // Continue operation despite error
        return true;

      default:
        return false;
    }
  }

  /**
   * Handle retry with exponential backoff
   */
  private async handleRetry(
    error: TranscriptionError,
    context: ErrorContext,
    onRecovery?: (strategy: ErrorRecoveryStrategy) => Promise<boolean>
  ): Promise<boolean> {
    const attemptCount = this.retryAttempts.get(error.code) || 0;
    this.retryAttempts.set(error.code, attemptCount + 1);

    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.retryConfig.initialDelay * Math.pow(this.retryConfig.backoffMultiplier, attemptCount),
      this.retryConfig.maxDelay
    );

    // Wait before retry (longer delays for elderly users)
    await new Promise(resolve => setTimeout(resolve, delay));

    if (onRecovery) {
      const strategy = this.getRecoveryStrategy(error);
      return await onRecovery(strategy);
    }

    return false;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    averageRetryCount: number;
    mostCommonErrors: Array<{ code: string; count: number }>;
  } {
    const errorsByType: Record<string, number> = {};
    let totalRetries = 0;

    this.errorHistory.forEach(error => {
      errorsByType[error.code] = (errorsByType[error.code] || 0) + 1;
    });

    this.retryAttempts.forEach(count => {
      totalRetries += count;
    });

    const mostCommonErrors = Object.entries(errorsByType)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      averageRetryCount: totalRetries / Math.max(this.retryAttempts.size, 1),
      mostCommonErrors,
    };
  }

  /**
   * Clear error history and retry counts
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.retryAttempts.clear();
  }

  /**
   * Update elderly settings
   */
  updateElderlySettings(settings: Partial<ElderlyTranscriptionSettings>): void {
    this.elderlySettings = { ...this.elderlySettings, ...settings };

    // Update voice announcement setting
    this.retryConfig.enableVoiceAnnouncement = this.elderlySettings.enableVoiceGuidance;

    // Reinitialize strategies with new settings
    this.initializeRecoveryStrategies();
  }

  /**
   * Update retry configuration
   */
  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: TranscriptionError): boolean {
    const nonRecoverableErrors = [
      'PERMISSION_DENIED',
      'SERVICE_PERMANENTLY_UNAVAILABLE',
      'DEVICE_NOT_SUPPORTED',
      'CRITICAL_SYSTEM_ERROR',
    ];

    return !nonRecoverableErrors.includes(error.code) && error.recoverable !== false;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: TranscriptionError): string {
    const strategy = this.getRecoveryStrategy(error);
    return strategy.userMessage;
  }

  /**
   * Log error for debugging
   */
  logError(error: TranscriptionError, context: ErrorContext): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        code: error.code,
        message: error.message,
        context: error.context,
        recoverable: error.recoverable,
      },
      context,
      retryAttempt: this.retryAttempts.get(error.code) || 0,
    };

    console.log('Transcription Error Log:', JSON.stringify(logData, null, 2));

    // In a real app, this would send to error tracking service
  }
}

export default TranscriptionErrorHandler;