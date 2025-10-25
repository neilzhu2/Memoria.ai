import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

// Scalable settings interface - easy to extend for future features
export interface AppSettings {
  // Appearance
  themeMode: 'light' | 'dark' | 'system';

  // Accessibility
  fontSize: number; // 16-28px range for elderly users
  touchTargetSize: number; // 44-72px range
  highContrast: boolean;
  reducedMotion: boolean;

  // Audio & Voice
  hapticFeedbackEnabled: boolean;
  soundEffectsEnabled: boolean;
  transcriptionLanguage: 'en' | 'zh-CN' | 'zh-TW' | 'auto'; // Prepared for multilingual
  autoTranscribe: boolean;

  // Backup & Sync
  autoBackupEnabled: boolean;
  lastBackupDate: Date | null;

  // Future expansion placeholders
  familySharingEnabled: boolean; // For family prompts feature
  exportFormat: 'pdf' | 'epub' | 'txt'; // For bibliography export
}

interface SettingsContextType {
  settings: AppSettings;

  // Theme
  updateThemeMode: (mode: 'light' | 'dark' | 'system') => Promise<void>;
  getEffectiveTheme: () => 'light' | 'dark';

  // Accessibility
  updateFontSize: (size: number) => Promise<void>;
  updateTouchTargetSize: (size: number) => Promise<void>;
  toggleHighContrast: () => Promise<void>;
  toggleReducedMotion: () => Promise<void>;
  applyAccessibilityPreset: (preset: 'default' | 'enhanced' | 'maximum') => Promise<void>;

  // Audio & Voice
  toggleHapticFeedback: () => Promise<void>;
  toggleSoundEffects: () => Promise<void>;
  updateTranscriptionLanguage: (lang: 'en' | 'zh-CN' | 'zh-TW' | 'auto') => Promise<void>;
  toggleAutoTranscribe: () => Promise<void>;

  // Backup & Sync
  toggleAutoBackup: () => Promise<void>;
  updateLastBackupDate: (date: Date) => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => Promise<boolean>;

  // Utilities
  resetToDefaults: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = '@memoria_app_settings';

// Default settings optimized for elderly users
const defaultSettings: AppSettings = {
  themeMode: 'system',
  fontSize: 20, // Larger default for elderly users
  touchTargetSize: 60, // Large touch targets (WCAG AAA)
  highContrast: false,
  reducedMotion: false,
  hapticFeedbackEnabled: true,
  soundEffectsEnabled: true,
  transcriptionLanguage: 'auto', // Smart language detection
  autoTranscribe: true,
  autoBackupEnabled: false,
  lastBackupDate: null,
  familySharingEnabled: false,
  exportFormat: 'pdf',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from storage on app start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        // Convert lastBackupDate string back to Date
        if (parsedSettings.lastBackupDate) {
          parsedSettings.lastBackupDate = new Date(parsedSettings.lastBackupDate);
        }
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setIsLoaded(true);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  // Theme
  const updateThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    await saveSettings({ ...settings, themeMode: mode });
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return settings.themeMode;
  };

  // Accessibility
  const updateFontSize = async (size: number) => {
    // Clamp between 16-28px for readability
    const clampedSize = Math.max(16, Math.min(28, size));
    await saveSettings({ ...settings, fontSize: clampedSize });
  };

  const updateTouchTargetSize = async (size: number) => {
    // Clamp between 44-72px (WCAG guidelines)
    const clampedSize = Math.max(44, Math.min(72, size));
    await saveSettings({ ...settings, touchTargetSize: clampedSize });
  };

  const toggleHighContrast = async () => {
    await saveSettings({ ...settings, highContrast: !settings.highContrast });
  };

  const toggleReducedMotion = async () => {
    await saveSettings({ ...settings, reducedMotion: !settings.reducedMotion });
  };

  const applyAccessibilityPreset = async (preset: 'default' | 'enhanced' | 'maximum') => {
    const presets = {
      default: {
        fontSize: 18,
        touchTargetSize: 52,
        highContrast: false,
        reducedMotion: false,
      },
      enhanced: {
        fontSize: 22,
        touchTargetSize: 64,
        highContrast: false,
        reducedMotion: true,
      },
      maximum: {
        fontSize: 26,
        touchTargetSize: 72,
        highContrast: true,
        reducedMotion: true,
      },
    };

    await saveSettings({ ...settings, ...presets[preset] });
  };

  // Audio & Voice
  const toggleHapticFeedback = async () => {
    await saveSettings({ ...settings, hapticFeedbackEnabled: !settings.hapticFeedbackEnabled });
  };

  const toggleSoundEffects = async () => {
    await saveSettings({ ...settings, soundEffectsEnabled: !settings.soundEffectsEnabled });
  };

  const updateTranscriptionLanguage = async (lang: 'en' | 'zh-CN' | 'zh-TW' | 'auto') => {
    await saveSettings({ ...settings, transcriptionLanguage: lang });
  };

  const toggleAutoTranscribe = async () => {
    await saveSettings({ ...settings, autoTranscribe: !settings.autoTranscribe });
  };

  // Backup & Sync
  const toggleAutoBackup = async () => {
    await saveSettings({ ...settings, autoBackupEnabled: !settings.autoBackupEnabled });
  };

  const updateLastBackupDate = async (date: Date) => {
    await saveSettings({ ...settings, lastBackupDate: date });
  };

  const exportSettings = (): string => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = async (settingsJson: string): Promise<boolean> => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      // Validate that it has the expected structure
      if (importedSettings && typeof importedSettings === 'object') {
        await saveSettings({ ...defaultSettings, ...importedSettings });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  };

  const resetToDefaults = async () => {
    await saveSettings(defaultSettings);
  };

  // Don't render children until settings are loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateThemeMode,
        getEffectiveTheme,
        updateFontSize,
        updateTouchTargetSize,
        toggleHighContrast,
        toggleReducedMotion,
        applyAccessibilityPreset,
        toggleHapticFeedback,
        toggleSoundEffects,
        updateTranscriptionLanguage,
        toggleAutoTranscribe,
        toggleAutoBackup,
        updateLastBackupDate,
        exportSettings,
        importSettings,
        resetToDefaults,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
