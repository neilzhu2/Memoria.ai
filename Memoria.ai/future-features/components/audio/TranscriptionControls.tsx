/**
 * Transcription Controls for Memoria.ai
 * Accessible control panel for real-time transcription with elderly-friendly design
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import {
  RealtimeTranscriptionConfig,
  ElderlyTranscriptionSettings,
  ChineseLanguageSupport,
  LanguageDetectionConfig
} from '../../types';

interface TranscriptionControlsProps {
  isActive: boolean;
  config: RealtimeTranscriptionConfig;
  elderlySettings: ElderlyTranscriptionSettings;
  chineseSupport: ChineseLanguageSupport;
  languageDetection: LanguageDetectionConfig;
  onToggleTranscription: () => void;
  onLanguageChange: (language: 'en' | 'zh' | 'auto') => void;
  onConfigChange: (config: Partial<RealtimeTranscriptionConfig>) => void;
  onElderlySettingsChange: (settings: Partial<ElderlyTranscriptionSettings>) => void;
  onChineseSupportChange: (support: Partial<ChineseLanguageSupport>) => void;
  fontSize: number;
  highContrast: boolean;
  hapticEnabled: boolean;
  disabled?: boolean;
}

const TranscriptionControls: React.FC<TranscriptionControlsProps> = ({
  isActive,
  config,
  elderlySettings,
  chineseSupport,
  languageDetection,
  onToggleTranscription,
  onLanguageChange,
  onConfigChange,
  onElderlySettingsChange,
  onChineseSupportChange,
  fontSize,
  highContrast,
  hapticEnabled,
  disabled = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Handle voice guidance
  const announceChange = useCallback((message: string) => {
    if (elderlySettings.enableVoiceGuidance) {
      AccessibilityInfo.announceForAccessibility(message);

      if (elderlySettings.enableVoiceGuidance) {
        Speech.speak(message, {
          language: elderlySettings.voiceGuidanceLanguage === 'zh' ? 'zh-CN' : 'en-US',
          rate: elderlySettings.speechRate,
        });
      }
    }
  }, [elderlySettings]);

  // Toggle transcription with confirmation for elderly users
  const handleToggleTranscription = useCallback(() => {
    triggerHaptic();

    if (elderlySettings.simplifiedControls && isActive) {
      Alert.alert(
        'Stop Transcription',
        'Are you sure you want to stop the real-time transcription?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Stop',
            style: 'destructive',
            onPress: () => {
              onToggleTranscription();
              announceChange('Transcription stopped');
            }
          }
        ]
      );
    } else {
      onToggleTranscription();
      announceChange(isActive ? 'Transcription stopped' : 'Transcription started');
    }
  }, [isActive, elderlySettings.simplifiedControls, onToggleTranscription, triggerHaptic, announceChange]);

  // Handle language selection
  const handleLanguageChange = useCallback((language: 'en' | 'zh' | 'auto') => {
    triggerHaptic();
    onLanguageChange(language);

    const languageNames = {
      'auto': 'Automatic detection',
      'en': 'English',
      'zh': elderlySettings.voiceGuidanceLanguage === 'zh' ? '中文' : 'Chinese'
    };

    announceChange(`Language changed to ${languageNames[language]}`);
  }, [onLanguageChange, triggerHaptic, announceChange, elderlySettings.voiceGuidanceLanguage]);

  // Handle voice confirmation toggle
  const handleVoiceConfirmationToggle = useCallback((enabled: boolean) => {
    triggerHaptic();
    onConfigChange({ enableVoiceConfirmation: enabled });
    announceChange(enabled ? 'Voice confirmation enabled' : 'Voice confirmation disabled');
  }, [onConfigChange, triggerHaptic, announceChange]);

  // Handle large text toggle
  const handleLargeTextToggle = useCallback((enabled: boolean) => {
    triggerHaptic();
    onElderlySettingsChange({ largeTextMode: enabled });
    onConfigChange({ fontSize: enabled ? 20 : 16 });
    announceChange(enabled ? 'Large text enabled' : 'Large text disabled');
  }, [onElderlySettingsChange, onConfigChange, triggerHaptic, announceChange]);

  // Handle high contrast toggle
  const handleHighContrastToggle = useCallback((enabled: boolean) => {
    triggerHaptic();
    onElderlySettingsChange({ highContrastMode: enabled });
    onConfigChange({ highContrast: enabled });
    announceChange(enabled ? 'High contrast enabled' : 'High contrast disabled');
  }, [onElderlySettingsChange, onConfigChange, triggerHaptic, announceChange]);

  // Handle Chinese character set change
  const handleCharacterSetChange = useCallback(() => {
    const currentSet = chineseSupport.characterSet;
    const nextSet = currentSet === 'simplified' ? 'traditional' :
                   currentSet === 'traditional' ? 'both' : 'simplified';

    triggerHaptic();
    onChineseSupportChange({ characterSet: nextSet });

    const setNames = {
      'simplified': '简体中文',
      'traditional': '繁體中文',
      'both': '简体/繁体'
    };
    announceChange(`Character set changed to ${setNames[nextSet]}`);
  }, [chineseSupport.characterSet, onChineseSupportChange, triggerHaptic, announceChange]);

  // Toggle advanced settings
  const toggleAdvanced = useCallback(() => {
    triggerHaptic();
    setShowAdvanced(!showAdvanced);
    announceChange(showAdvanced ? 'Advanced settings hidden' : 'Advanced settings shown');
  }, [showAdvanced, triggerHaptic, announceChange]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: highContrast ? '#000000' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: highContrast ? '#333333' : '#e5e7eb',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    mainToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isActive ? '#10b981' : (highContrast ? '#333333' : '#f3f4f6'),
      borderRadius: 50,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginBottom: 16,
      minHeight: 56, // Large touch target
    },
    toggleText: {
      fontSize: fontSize,
      fontWeight: '600',
      color: isActive ? '#ffffff' : (highContrast ? '#ffffff' : '#374151'),
    },
    toggleButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: isActive ? '#ffffff' : '#10b981',
      justifyContent: 'center',
      alignItems: 'center',
    },
    toggleIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: isActive ? '#10b981' : '#ffffff',
    },
    languageSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: fontSize - 2,
      fontWeight: '500',
      color: highContrast ? '#cccccc' : '#6b7280',
      marginBottom: 8,
    },
    languageButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    languageButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      minHeight: 48, // Large touch target
    },
    languageButtonActive: {
      backgroundColor: '#2563eb',
      borderColor: '#2563eb',
    },
    languageButtonInactive: {
      backgroundColor: 'transparent',
      borderColor: highContrast ? '#666666' : '#d1d5db',
    },
    languageButtonText: {
      fontSize: fontSize - 2,
      fontWeight: '500',
    },
    languageButtonTextActive: {
      color: '#ffffff',
    },
    languageButtonTextInactive: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      minHeight: 56, // Large touch target for switches
    },
    settingLabel: {
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#374151',
      flex: 1,
      marginRight: 12,
    },
    settingDescription: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 2,
    },
    advancedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginTop: 8,
    },
    advancedToggleText: {
      fontSize: fontSize - 2,
      color: '#2563eb',
      fontWeight: '500',
    },
    characterSetButton: {
      backgroundColor: highContrast ? '#333333' : '#f3f4f6',
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    characterSetText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    disabledText: {
      fontSize: fontSize,
      color: '#ffffff',
      fontWeight: '600',
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Real-time Transcription</Text>
      </View>

      {/* Main transcription toggle */}
      <Pressable
        style={styles.mainToggle}
        onPress={handleToggleTranscription}
        disabled={disabled}
        accessibilityLabel={isActive ? 'Stop transcription' : 'Start transcription'}
        accessibilityRole="switch"
        accessibilityState={{ checked: isActive }}
      >
        <Text style={styles.toggleText}>
          {isActive ? 'Transcribing...' : 'Start Transcription'}
        </Text>
        <View style={styles.toggleButton}>
          <View style={styles.toggleIndicator} />
        </View>
      </Pressable>

      {/* Language selection */}
      <View style={styles.languageSection}>
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.languageButtons}>
          {(['auto', 'en', 'zh'] as const).map((lang) => {
            const isSelected = config.language === lang;
            const labels = {
              'auto': 'Auto',
              'en': 'English',
              'zh': '中文'
            };

            return (
              <Pressable
                key={lang}
                style={[
                  styles.languageButton,
                  isSelected ? styles.languageButtonActive : styles.languageButtonInactive
                ]}
                onPress={() => handleLanguageChange(lang)}
                disabled={disabled}
                accessibilityLabel={`Select ${labels[lang]} language`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    isSelected ? styles.languageButtonTextActive : styles.languageButtonTextInactive
                  ]}
                >
                  {labels[lang]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Elderly-friendly settings */}
      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Voice Confirmation</Text>
          <Text style={styles.settingDescription}>
            Hear audio feedback for transcription events
          </Text>
        </View>
        <Switch
          value={config.enableVoiceConfirmation}
          onValueChange={handleVoiceConfirmationToggle}
          disabled={disabled}
          trackColor={{ false: '#d1d5db', true: '#2563eb' }}
          thumbColor={config.enableVoiceConfirmation ? '#ffffff' : '#f3f4f6'}
          accessibilityLabel="Toggle voice confirmation"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>Large Text</Text>
          <Text style={styles.settingDescription}>
            Larger font size for better readability
          </Text>
        </View>
        <Switch
          value={elderlySettings.largeTextMode}
          onValueChange={handleLargeTextToggle}
          disabled={disabled}
          trackColor={{ false: '#d1d5db', true: '#2563eb' }}
          thumbColor={elderlySettings.largeTextMode ? '#ffffff' : '#f3f4f6'}
          accessibilityLabel="Toggle large text mode"
        />
      </View>

      <View style={styles.settingRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>High Contrast</Text>
          <Text style={styles.settingDescription}>
            Better visibility for low vision users
          </Text>
        </View>
        <Switch
          value={elderlySettings.highContrastMode}
          onValueChange={handleHighContrastToggle}
          disabled={disabled}
          trackColor={{ false: '#d1d5db', true: '#2563eb' }}
          thumbColor={elderlySettings.highContrastMode ? '#ffffff' : '#f3f4f6'}
          accessibilityLabel="Toggle high contrast mode"
        />
      </View>

      {/* Chinese character set selection */}
      {(config.language === 'zh' || config.language === 'auto') && (
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Chinese Characters</Text>
            <Text style={styles.settingDescription}>
              Choose character set preference
            </Text>
          </View>
          <Pressable
            style={styles.characterSetButton}
            onPress={handleCharacterSetChange}
            disabled={disabled}
            accessibilityLabel={`Chinese character set: ${chineseSupport.characterSet}`}
            accessibilityRole="button"
          >
            <Text style={styles.characterSetText}>
              {chineseSupport.characterSet === 'simplified' ? '简体' :
               chineseSupport.characterSet === 'traditional' ? '繁體' : '简/繁'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Advanced settings toggle */}
      {!elderlySettings.simplifiedControls && (
        <Pressable
          style={styles.advancedToggle}
          onPress={toggleAdvanced}
          disabled={disabled}
          accessibilityLabel={showAdvanced ? 'Hide advanced settings' : 'Show advanced settings'}
          accessibilityRole="button"
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? '▲ Hide Advanced' : '▼ Show Advanced'}
          </Text>
        </Pressable>
      )}

      {/* Advanced settings */}
      {showAdvanced && (
        <>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Language Detection</Text>
              <Text style={styles.settingDescription}>
                Automatically detect language changes
              </Text>
            </View>
            <Switch
              value={config.enableLanguageDetection}
              onValueChange={(enabled) => {
                triggerHaptic();
                onConfigChange({ enableLanguageDetection: enabled });
              }}
              disabled={disabled}
              trackColor={{ false: '#d1d5db', true: '#2563eb' }}
              thumbColor={config.enableLanguageDetection ? '#ffffff' : '#f3f4f6'}
              accessibilityLabel="Toggle automatic language detection"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Code Switching</Text>
              <Text style={styles.settingDescription}>
                Support mixing English and Chinese in one sentence
              </Text>
            </View>
            <Switch
              value={config.enableCodeSwitching}
              onValueChange={(enabled) => {
                triggerHaptic();
                onConfigChange({ enableCodeSwitching: enabled });
              }}
              disabled={disabled}
              trackColor={{ false: '#d1d5db', true: '#2563eb' }}
              thumbColor={config.enableCodeSwitching ? '#ffffff' : '#f3f4f6'}
              accessibilityLabel="Toggle code switching support"
            />
          </View>
        </>
      )}

      {/* Disabled overlay */}
      {disabled && (
        <View style={styles.disabledOverlay}>
          <Text style={styles.disabledText}>
            Start recording to enable{'\n'}transcription controls
          </Text>
        </View>
      )}
    </View>
  );
};

export default TranscriptionControls;