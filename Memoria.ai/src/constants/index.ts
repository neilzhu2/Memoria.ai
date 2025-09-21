/**
 * Constants for Memoria.ai
 * App-wide constants and configuration values
 */

export const APP_CONFIG = {
  NAME: 'Memoria.ai',
  VERSION: '1.0.0',
  MIN_RECORDING_DURATION: 1, // seconds
  MAX_RECORDING_DURATION: 600, // 10 minutes
  MAX_AUDIO_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_LANGUAGES: ['en', 'zh'] as const,
  DEFAULT_LANGUAGE: 'en' as const,
};

export const ACCESSIBILITY_CONFIG = {
  MIN_TOUCH_TARGET_SIZE: 44, // iOS minimum
  RECOMMENDED_TOUCH_TARGET_SIZE: 60, // For elderly users
  MIN_FONT_SIZE: 14,
  MAX_FONT_SIZE: 32,
  DEFAULT_FONT_SIZE: 18, // Larger for elderly users
  ANIMATION_DURATION_NORMAL: 300,
  ANIMATION_DURATION_REDUCED: 0,
};

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  ACCESSIBILITY_SETTINGS: 'accessibility_settings',
  AUDIO_SETTINGS: 'audio_settings',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_SYNC_TIME: 'last_sync_time',
} as const;

export const ERROR_CODES = {
  MICROPHONE_PERMISSION_DENIED: 'MICROPHONE_PERMISSION_DENIED',
  STORAGE_PERMISSION_DENIED: 'STORAGE_PERMISSION_DENIED',
  AUDIO_RECORDING_FAILED: 'AUDIO_RECORDING_FAILED',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  SYNC_FAILED: 'SYNC_FAILED',
  STORAGE_FULL: 'STORAGE_FULL',
} as const;

export const COLORS = {
  // Primary colors
  PRIMARY: '#2563eb',
  PRIMARY_DARK: '#1d4ed8',
  SECONDARY: '#10b981',

  // Status colors
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#dc2626',
  INFO: '#3b82f6',

  // Neutral colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827',

  // High contrast mode
  HIGH_CONTRAST_BG: '#000000',
  HIGH_CONTRAST_TEXT: '#ffffff',
  HIGH_CONTRAST_BORDER: '#666666',
} as const;