/**
 * User and settings TypeScript interfaces for Memoria.ai
 * Designed specifically for elderly users (65+) with accessibility needs
 */

export interface User {
  id: string;
  name: string;
  email?: string;
  preferredLanguage: 'en' | 'zh';
  createdAt: Date;
  lastActiveAt: Date;
  isFirstTimeUser: boolean;
  onboardingCompleted: boolean;
}

export interface AccessibilitySettings {
  // Visual accessibility
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  highContrast: boolean;
  reducedMotion: boolean;
  colorBlindnessSupport: boolean;

  // Audio accessibility
  hearingImpaired: boolean;
  audioAmplification: boolean;
  visualAudioIndicators: boolean;

  // Motor accessibility
  largerTouchTargets: boolean; // Minimum 60px as per requirements
  slowTapTiming: boolean;
  reduceGestures: boolean;

  // Cognitive accessibility
  simplifiedInterface: boolean;
  extraConfirmations: boolean;
  voiceGuidance: boolean;
  extendedTimeouts: boolean;
}

export interface AppSettings {
  // Language and localization
  language: 'en' | 'zh';
  autoDetectLanguage: boolean;

  // Audio settings
  defaultRecordingQuality: 'low' | 'medium' | 'high';
  maxRecordingDuration: number;
  playbackSpeed: number; // 0.5-2.0

  // Storage and sync
  autoBackup: boolean;
  storageLocation: 'local' | 'cloud';
  maxLocalStorage: number; // in MB

  // Privacy
  shareUsageData: boolean;
  enableAnalytics: boolean;

  // Notifications
  reminderNotifications: boolean;
  reminderTime?: string; // HH:MM format
  reminderDays: number[]; // 0-6, Sunday = 0

  // Performance
  limitBackgroundProcessing: boolean;
  reducedAnimations: boolean;
}

export interface UserPreferences {
  accessibility: AccessibilitySettings;
  app: AppSettings;
  lastUpdated: Date;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skippable: boolean;
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  steps: OnboardingStep[];
  completedAt?: Date;
}

export interface UserStats {
  totalMemories: number;
  totalRecordingTime: number;
  averageRecordingLength: number;
  streakDays: number;
  lastRecordingDate?: Date;
  appUsageTime: number; // in minutes
}