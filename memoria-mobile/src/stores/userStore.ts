/**
 * User Store using Zustand for Memoria.ai
 * Manages user data and preferences optimized for elderly users
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  User,
  UserPreferences,
  AccessibilitySettings,
  AppSettings,
  OnboardingProgress,
  UserStats,
  LoadingState
} from '../types';

interface UserState {
  // User data
  user: User | null;
  preferences: UserPreferences | null;
  onboardingProgress: OnboardingProgress | null;
  stats: UserStats | null;
  isAuthenticated: boolean;
  loadingState: LoadingState;

  // Actions - User management
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;
  clearUser: () => void;
  updateLastActivity: () => void;

  // Actions - Preferences
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  resetPreferencesToDefault: () => void;
  applyElderlyFriendlyDefaults: () => void;

  // Actions - Onboarding
  initializeOnboarding: () => void;
  updateOnboardingStep: (stepId: string, completed: boolean) => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;

  // Actions - Statistics
  updateStats: (updates: Partial<UserStats>) => void;
  incrementMemoryCount: () => void;
  addRecordingTime: (duration: number) => void;
  updateStreak: () => void;

  // Actions - Settings helpers
  getFontSize: () => number;
  getMinimumTouchTarget: () => number;
  shouldReduceMotion: () => boolean;
  shouldUseHighContrast: () => boolean;
  getPreferredLanguage: () => 'en' | 'zh';

  // Actions - Loading states
  setLoading: (isLoading: boolean, error?: string) => void;
}

// Default accessibility settings optimized for elderly users
const defaultAccessibilitySettings: AccessibilitySettings = {
  fontSize: 'large', // Larger by default for elderly users
  highContrast: false,
  reducedMotion: false,
  colorBlindnessSupport: false,
  hearingImpaired: false,
  audioAmplification: false,
  visualAudioIndicators: false,
  largerTouchTargets: true, // Always enabled for elderly users
  slowTapTiming: true, // Slower timing by default
  reduceGestures: true, // Simpler gestures
  simplifiedInterface: false,
  extraConfirmations: true, // More confirmations for safety
  voiceGuidance: false,
  extendedTimeouts: true, // Longer timeouts for elderly users
};

const defaultAppSettings: AppSettings = {
  language: 'en',
  autoDetectLanguage: true,
  defaultRecordingQuality: 'medium',
  maxRecordingDuration: 600, // 10 minutes
  playbackSpeed: 1.0,
  autoBackup: true,
  storageLocation: 'local',
  maxLocalStorage: 500, // 500MB
  shareUsageData: false, // Privacy-first for elderly users
  enableAnalytics: false,
  reminderNotifications: false,
  reminderDays: [1, 2, 3, 4, 5], // Weekdays only
  limitBackgroundProcessing: true, // Better for older devices
  reducedAnimations: false,
};

const defaultOnboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to Memoria',
    description: 'Let\'s help you get started with recording your memories',
    completed: false,
    skippable: false,
  },
  {
    id: 'accessibility',
    title: 'Accessibility Setup',
    description: 'Configure the app to work best for you',
    completed: false,
    skippable: true,
  },
  {
    id: 'permissions',
    title: 'Permissions',
    description: 'We need access to your microphone to record memories',
    completed: false,
    skippable: false,
  },
  {
    id: 'first_recording',
    title: 'Your First Recording',
    description: 'Let\'s record your first memory together',
    completed: false,
    skippable: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You\'re ready to start creating memories',
    completed: false,
    skippable: false,
  },
];

export const useUserStore = create<UserState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      user: null,
      preferences: null,
      onboardingProgress: null,
      stats: null,
      isAuthenticated: false,
      loadingState: { isLoading: false },

      // User management actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: true,
          preferences: {
            accessibility: defaultAccessibilitySettings,
            app: defaultAppSettings,
            lastUpdated: new Date(),
          },
          stats: {
            totalMemories: 0,
            totalRecordingTime: 0,
            averageRecordingLength: 0,
            streakDays: 0,
            appUsageTime: 0,
          },
        });

        // Initialize onboarding if first time user
        if (user.isFirstTimeUser) {
          get().initializeOnboarding();
        }
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              ...updates,
              lastActiveAt: new Date(),
            },
          });
        }
      },

      clearUser: () => {
        set({
          user: null,
          preferences: null,
          onboardingProgress: null,
          stats: null,
          isAuthenticated: false,
        });
      },

      updateLastActivity: () => {
        const { user } = get();
        if (user) {
          get().updateUser({ lastActiveAt: new Date() });
        }
      },

      // Preferences management
      updateAccessibilitySettings: (settings) => {
        const { preferences } = get();
        if (preferences) {
          set({
            preferences: {
              ...preferences,
              accessibility: {
                ...preferences.accessibility,
                ...settings,
              },
              lastUpdated: new Date(),
            },
          });
        }
      },

      updateAppSettings: (settings) => {
        const { preferences } = get();
        if (preferences) {
          set({
            preferences: {
              ...preferences,
              app: {
                ...preferences.app,
                ...settings,
              },
              lastUpdated: new Date(),
            },
          });
        }
      },

      resetPreferencesToDefault: () => {
        set({
          preferences: {
            accessibility: defaultAccessibilitySettings,
            app: defaultAppSettings,
            lastUpdated: new Date(),
          },
        });
      },

      applyElderlyFriendlyDefaults: () => {
        const elderlyOptimizedSettings: Partial<AccessibilitySettings> = {
          fontSize: 'extra-large',
          largerTouchTargets: true,
          slowTapTiming: true,
          extraConfirmations: true,
          extendedTimeouts: true,
          simplifiedInterface: true,
          reduceGestures: true,
        };

        get().updateAccessibilitySettings(elderlyOptimizedSettings);

        const elderlyAppSettings: Partial<AppSettings> = {
          playbackSpeed: 0.8, // Slower playback
          limitBackgroundProcessing: true,
          reducedAnimations: true,
          reminderNotifications: true,
        };

        get().updateAppSettings(elderlyAppSettings);
      },

      // Onboarding management
      initializeOnboarding: () => {
        set({
          onboardingProgress: {
            currentStep: 0,
            totalSteps: defaultOnboardingSteps.length,
            steps: defaultOnboardingSteps,
          },
        });
      },

      updateOnboardingStep: (stepId, completed) => {
        const { onboardingProgress } = get();
        if (onboardingProgress) {
          const updatedSteps = onboardingProgress.steps.map(step =>
            step.id === stepId ? { ...step, completed } : step
          );

          const completedSteps = updatedSteps.filter(step => step.completed).length;
          const currentStep = Math.min(completedSteps, updatedSteps.length - 1);

          set({
            onboardingProgress: {
              ...onboardingProgress,
              steps: updatedSteps,
              currentStep,
            },
          });

          // Complete onboarding if all steps are done
          if (completedSteps === updatedSteps.length) {
            get().completeOnboarding();
          }
        }
      },

      completeOnboarding: () => {
        const { user, onboardingProgress } = get();
        if (user && onboardingProgress) {
          set({
            onboardingProgress: {
              ...onboardingProgress,
              completedAt: new Date(),
            },
          });

          get().updateUser({
            onboardingCompleted: true,
            isFirstTimeUser: false,
          });
        }
      },

      skipOnboarding: () => {
        const { user } = get();
        if (user) {
          get().updateUser({
            onboardingCompleted: true,
            isFirstTimeUser: false,
          });
        }
      },

      // Statistics management
      updateStats: (updates) => {
        const { stats } = get();
        if (stats) {
          set({
            stats: {
              ...stats,
              ...updates,
            },
          });
        }
      },

      incrementMemoryCount: () => {
        const { stats } = get();
        if (stats) {
          get().updateStats({
            totalMemories: stats.totalMemories + 1,
            lastRecordingDate: new Date(),
          });
          get().updateStreak();
        }
      },

      addRecordingTime: (duration) => {
        const { stats } = get();
        if (stats) {
          const newTotalTime = stats.totalRecordingTime + duration;
          const newAverage = stats.totalMemories > 0
            ? newTotalTime / stats.totalMemories
            : duration;

          get().updateStats({
            totalRecordingTime: newTotalTime,
            averageRecordingLength: newAverage,
          });
        }
      },

      updateStreak: () => {
        const { stats } = get();
        if (stats) {
          const today = new Date();
          const lastRecording = stats.lastRecordingDate ? new Date(stats.lastRecordingDate) : null;

          if (lastRecording) {
            const diffDays = Math.floor(
              (today.getTime() - lastRecording.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (diffDays === 0) {
              // Same day, no change to streak
              return;
            } else if (diffDays === 1) {
              // Next day, increment streak
              get().updateStats({ streakDays: stats.streakDays + 1 });
            } else {
              // Gap in days, reset streak
              get().updateStats({ streakDays: 1 });
            }
          } else {
            // First recording
            get().updateStats({ streakDays: 1 });
          }
        }
      },

      // Helper functions for accessing settings
      getFontSize: () => {
        const { preferences } = get();
        if (!preferences) return 16; // Default font size

        const sizeMap = {
          small: 14,
          medium: 16,
          large: 20,
          'extra-large': 24,
        };

        return sizeMap[preferences.accessibility.fontSize];
      },

      getMinimumTouchTarget: () => {
        const { preferences } = get();
        return preferences?.accessibility.largerTouchTargets ? 60 : 44; // iOS minimum
      },

      shouldReduceMotion: () => {
        const { preferences } = get();
        return preferences?.accessibility.reducedMotion ?? false;
      },

      shouldUseHighContrast: () => {
        const { preferences } = get();
        return preferences?.accessibility.highContrast ?? false;
      },

      getPreferredLanguage: () => {
        const { preferences } = get();
        return preferences?.app.language ?? 'en';
      },

      // Loading state
      setLoading: (isLoading, error) => {
        set({ loadingState: { isLoading, error } });
      },
    })),
    {
      name: 'memoria-user-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          // Would use MMKV or AsyncStorage
          return null;
        },
        setItem: async (name: string, value: string) => {
          // Would use MMKV or AsyncStorage
        },
        removeItem: async (name: string) => {
          // Would use MMKV or AsyncStorage
        },
      })),
      partialize: (state) => ({
        user: state.user,
        preferences: state.preferences,
        onboardingProgress: state.onboardingProgress,
        stats: state.stats,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);