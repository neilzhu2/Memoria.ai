/**
 * Settings Store using Zustand for Memoria.ai
 * Manages app-wide settings and configuration for elderly users
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';
import { LoadingState, AccessibilityConfig, PerformanceMetrics } from '../types';

interface AppTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    error: string;
    warning: string;
    success: string;
    border: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

interface SettingsState {
  // Theme and appearance
  theme: AppTheme;
  isDarkMode: boolean;
  highContrastMode: boolean;

  // Accessibility configuration
  accessibilityConfig: AccessibilityConfig;

  // Performance monitoring
  performanceMetrics: PerformanceMetrics | null;
  performanceMode: 'normal' | 'power-saving' | 'high-performance';

  // App behavior
  hapticFeedbackEnabled: boolean;
  soundEffectsEnabled: boolean;
  autoSaveEnabled: boolean;
  backgroundSyncEnabled: boolean;

  // Debug and development
  debugMode: boolean;
  showPerformanceOverlay: boolean;

  // Loading state
  loadingState: LoadingState;

  // Actions - Theme
  toggleDarkMode: () => void;
  toggleHighContrast: () => void;
  updateTheme: (theme: Partial<AppTheme>) => void;
  applyElderlyFriendlyTheme: () => void;

  // Actions - Accessibility
  updateAccessibilityConfig: (config: Partial<AccessibilityConfig>) => void;
  resetAccessibilityToDefaults: () => void;
  applyAccessibilityPreset: (preset: 'minimal' | 'enhanced' | 'maximum') => void;

  // Actions - Performance
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  setPerformanceMode: (mode: 'normal' | 'power-saving' | 'high-performance') => void;
  optimizeForDevice: () => void;

  // Actions - App behavior
  toggleHapticFeedback: () => void;
  toggleSoundEffects: () => void;
  toggleAutoSave: () => void;
  toggleBackgroundSync: () => void;

  // Actions - Utilities
  exportSettings: () => string;
  importSettings: (settingsJson: string) => void;
  resetAllSettings: () => void;
  setLoading: (isLoading: boolean, error?: string) => void;

  // Getters
  getCurrentFontSize: () => number;
  getCurrentTouchTargetSize: () => number;
  shouldUseSimplifiedInterface: () => boolean;
  getAnimationDuration: () => number;
}

// Default theme optimized for elderly users
const defaultTheme: AppTheme = {
  colors: {
    primary: '#2563eb', // Clear blue, good contrast
    secondary: '#10b981', // Green for positive actions
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937', // High contrast text
    textSecondary: '#6b7280',
    error: '#dc2626',
    warning: '#f59e0b',
    success: '#10b981',
    border: '#d1d5db',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    fontFamily: 'System', // Use system font for better readability
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 20, // Larger default for elderly users
      xl: 24,
      xxl: 28,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5, // Better readability
      relaxed: 1.8,
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

const defaultAccessibilityConfig: AccessibilityConfig = {
  minimumTouchTarget: 60, // Large touch targets for elderly users
  fontSize: 20, // Larger default font size
  highContrast: false,
  reducedMotion: false,
};

const defaultPerformanceMetrics: PerformanceMetrics = {
  appStartTime: 0,
  memoryUsage: 0,
  renderTime: 0,
  audioProcessingTime: 0,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      theme: defaultTheme,
      isDarkMode: false,
      highContrastMode: false,
      accessibilityConfig: defaultAccessibilityConfig,
      performanceMetrics: defaultPerformanceMetrics,
      performanceMode: 'normal',
      hapticFeedbackEnabled: true,
      soundEffectsEnabled: true,
      autoSaveEnabled: true,
      backgroundSyncEnabled: true,
      debugMode: false,
      showPerformanceOverlay: false,
      loadingState: { isLoading: false },

      // Theme actions
      toggleDarkMode: () => {
        const { isDarkMode } = get();
        const darkTheme = {
          ...get().theme,
          colors: {
            ...get().theme.colors,
            background: isDarkMode ? '#ffffff' : '#1f2937',
            surface: isDarkMode ? '#f8fafc' : '#374151',
            text: isDarkMode ? '#1f2937' : '#f9fafb',
            textSecondary: isDarkMode ? '#6b7280' : '#d1d5db',
          },
        };

        set({
          isDarkMode: !isDarkMode,
          theme: darkTheme,
        });
      },

      toggleHighContrast: () => {
        const { highContrastMode } = get();
        const highContrastTheme = {
          ...get().theme,
          colors: {
            ...get().theme.colors,
            text: highContrastMode ? '#1f2937' : '#000000',
            background: highContrastMode ? '#ffffff' : '#ffffff',
            border: highContrastMode ? '#d1d5db' : '#000000',
          },
        };

        set({
          highContrastMode: !highContrastMode,
          theme: highContrastTheme,
          accessibilityConfig: {
            ...get().accessibilityConfig,
            highContrast: !highContrastMode,
          },
        });
      },

      updateTheme: (themeUpdates) => {
        set({
          theme: {
            ...get().theme,
            ...themeUpdates,
          },
        });
      },

      applyElderlyFriendlyTheme: () => {
        const elderlyTheme: AppTheme = {
          ...defaultTheme,
          typography: {
            ...defaultTheme.typography,
            fontSize: {
              xs: 14,
              sm: 16,
              md: 20,
              lg: 24,
              xl: 28,
              xxl: 32,
            },
            lineHeight: {
              tight: 1.3,
              normal: 1.6,
              relaxed: 2.0,
            },
          },
          spacing: {
            xs: 6,
            sm: 12,
            md: 20,
            lg: 28,
            xl: 36,
          },
        };

        set({ theme: elderlyTheme });
      },

      // Accessibility actions
      updateAccessibilityConfig: (config) => {
        set({
          accessibilityConfig: {
            ...get().accessibilityConfig,
            ...config,
          },
        });

        // Update theme based on accessibility changes
        if (config.fontSize) {
          const themeUpdate = {
            typography: {
              ...get().theme.typography,
              fontSize: {
                ...get().theme.typography.fontSize,
                md: config.fontSize,
                lg: config.fontSize + 4,
                xl: config.fontSize + 8,
              },
            },
          };
          get().updateTheme(themeUpdate);
        }
      },

      resetAccessibilityToDefaults: () => {
        set({ accessibilityConfig: defaultAccessibilityConfig });
      },

      applyAccessibilityPreset: (preset) => {
        const presets = {
          minimal: {
            minimumTouchTarget: 44,
            fontSize: 16,
            highContrast: false,
            reducedMotion: false,
          },
          enhanced: {
            minimumTouchTarget: 60,
            fontSize: 20,
            highContrast: false,
            reducedMotion: true,
          },
          maximum: {
            minimumTouchTarget: 72,
            fontSize: 24,
            highContrast: true,
            reducedMotion: true,
          },
        };

        get().updateAccessibilityConfig(presets[preset]);
      },

      // Performance actions
      updatePerformanceMetrics: (metrics) => {
        set({
          performanceMetrics: {
            ...get().performanceMetrics,
            ...metrics,
          } as PerformanceMetrics,
        });
      },

      setPerformanceMode: (mode) => {
        set({ performanceMode: mode });

        // Adjust settings based on performance mode
        switch (mode) {
          case 'power-saving':
            set({
              backgroundSyncEnabled: false,
              hapticFeedbackEnabled: false,
              soundEffectsEnabled: false,
            });
            break;
          case 'high-performance':
            set({
              backgroundSyncEnabled: true,
              hapticFeedbackEnabled: true,
              soundEffectsEnabled: true,
            });
            break;
          default: // normal
            // Keep current settings
            break;
        }
      },

      optimizeForDevice: () => {
        // Check device capabilities and optimize settings
        // This would typically check device RAM, CPU, etc.
        const { performanceMetrics } = get();

        if (performanceMetrics && performanceMetrics.memoryUsage > 80) {
          get().setPerformanceMode('power-saving');
        }
      },

      // App behavior actions
      toggleHapticFeedback: () => {
        set({ hapticFeedbackEnabled: !get().hapticFeedbackEnabled });
      },

      toggleSoundEffects: () => {
        set({ soundEffectsEnabled: !get().soundEffectsEnabled });
      },

      toggleAutoSave: () => {
        set({ autoSaveEnabled: !get().autoSaveEnabled });
      },

      toggleBackgroundSync: () => {
        set({ backgroundSyncEnabled: !get().backgroundSyncEnabled });
      },

      // Utility actions
      exportSettings: () => {
        const state = get();
        const exportData = {
          theme: state.theme,
          isDarkMode: state.isDarkMode,
          highContrastMode: state.highContrastMode,
          accessibilityConfig: state.accessibilityConfig,
          performanceMode: state.performanceMode,
          hapticFeedbackEnabled: state.hapticFeedbackEnabled,
          soundEffectsEnabled: state.soundEffectsEnabled,
          autoSaveEnabled: state.autoSaveEnabled,
          backgroundSyncEnabled: state.backgroundSyncEnabled,
        };

        return JSON.stringify(exportData, null, 2);
      },

      importSettings: (settingsJson) => {
        try {
          const importedSettings = JSON.parse(settingsJson);
          set({
            ...importedSettings,
            loadingState: { isLoading: false },
          });
        } catch (error) {
          set({
            loadingState: {
              isLoading: false,
              error: 'Failed to import settings: Invalid format',
            },
          });
        }
      },

      resetAllSettings: () => {
        set({
          theme: defaultTheme,
          isDarkMode: false,
          highContrastMode: false,
          accessibilityConfig: defaultAccessibilityConfig,
          performanceMode: 'normal',
          hapticFeedbackEnabled: true,
          soundEffectsEnabled: true,
          autoSaveEnabled: true,
          backgroundSyncEnabled: true,
          debugMode: false,
          showPerformanceOverlay: false,
        });
      },

      setLoading: (isLoading, error) => {
        set({ loadingState: { isLoading, error } });
      },

      // Getters
      getCurrentFontSize: () => {
        return get().accessibilityConfig.fontSize;
      },

      getCurrentTouchTargetSize: () => {
        return get().accessibilityConfig.minimumTouchTarget;
      },

      shouldUseSimplifiedInterface: () => {
        return get().performanceMode === 'power-saving';
      },

      getAnimationDuration: () => {
        const { accessibilityConfig, performanceMode } = get();

        if (accessibilityConfig.reducedMotion || performanceMode === 'power-saving') {
          return 0; // No animations
        }

        return performanceMode === 'high-performance' ? 300 : 200;
      },
    })),
    {
      name: 'memoria-settings-storage',
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          // Would use MMKV for better performance
          return null;
        },
        setItem: async (name: string, value: string) => {
          // Would use MMKV for better performance
        },
        removeItem: async (name: string) => {
          // Would use MMKV for better performance
        },
      })),
      partialize: (state) => ({
        theme: state.theme,
        isDarkMode: state.isDarkMode,
        highContrastMode: state.highContrastMode,
        accessibilityConfig: state.accessibilityConfig,
        performanceMode: state.performanceMode,
        hapticFeedbackEnabled: state.hapticFeedbackEnabled,
        soundEffectsEnabled: state.soundEffectsEnabled,
        autoSaveEnabled: state.autoSaveEnabled,
        backgroundSyncEnabled: state.backgroundSyncEnabled,
      }),
    }
  )
);