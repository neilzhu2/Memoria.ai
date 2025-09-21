/**
 * Settings Screen for Memoria.ai
 * Comprehensive settings with accessibility options for elderly users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SettingsScreenProps } from '../../types';
import { useUserStore, useSettingsStore, useAudioStore } from '../../stores';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { user, updateAccessibilitySettings, updateAppSettings, preferences } = useUserStore();
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    toggleHighContrast,
    applyAccessibilityPreset
  } = useSettingsStore();

  const { settings: audioSettings, updateAudioSettings } = useAudioStore();

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const SettingRow = ({
    title,
    description,
    value,
    onToggle,
    type = 'switch'
  }: {
    title: string;
    description?: string;
    value?: boolean | string;
    onToggle?: () => void;
    type?: 'switch' | 'button' | 'text';
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value as boolean}
          onValueChange={onToggle}
          trackColor={{ false: '#767577', true: '#2563eb' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
          accessible={true}
          accessibilityLabel={`${title} ${value ? 'enabled' : 'disabled'}`}
        />
      )}
      {type === 'button' && (
        <TouchableOpacity
          style={styles.settingButton}
          onPress={onToggle}
          accessible={true}
          accessibilityRole="button"
        >
          <Text style={styles.settingButtonText}>{value as string}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 16,
    },
    section: {
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
    },
    sectionTitle: {
      fontSize: fontSize + 4,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      minHeight: touchTargetSize,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#666666' : '#e5e7eb',
    },
    settingContent: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: fontSize,
      fontWeight: '500',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      lineHeight: (fontSize - 2) * 1.4,
    },
    settingButton: {
      backgroundColor: highContrast ? '#666666' : '#e5e7eb',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      minHeight: 44,
      justifyContent: 'center',
    },
    settingButtonText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
    },
    presetButton: {
      backgroundColor: '#2563eb',
      padding: 16,
      borderRadius: 12,
      marginHorizontal: 4,
      flex: 1,
      minHeight: touchTargetSize,
      justifyContent: 'center',
      alignItems: 'center',
    },
    presetButtonText: {
      color: '#ffffff',
      fontSize: fontSize,
      fontWeight: '600',
      textAlign: 'center',
    },
    presetContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>

        {/* Accessibility Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>

          <SettingRow
            title="High Contrast"
            description="Increase text and background contrast for better visibility"
            value={highContrast}
            onToggle={toggleHighContrast}
          />

          <SettingRow
            title="Large Touch Targets"
            description="Make buttons and controls larger for easier interaction"
            value={preferences?.accessibility.largerTouchTargets || false}
            onToggle={() => updateAccessibilitySettings({ largerTouchTargets: !preferences?.accessibility.largerTouchTargets })}
          />

          <SettingRow
            title="Voice Guidance"
            description="Enable spoken instructions and feedback"
            value={preferences?.accessibility.voiceGuidance || false}
            onToggle={() => updateAccessibilitySettings({ voiceGuidance: !preferences?.accessibility.voiceGuidance })}
          />

          <SettingRow
            title="Extra Confirmations"
            description="Ask for confirmation before important actions"
            value={preferences?.accessibility.extraConfirmations || false}
            onToggle={() => updateAccessibilitySettings({ extraConfirmations: !preferences?.accessibility.extraConfirmations })}
          />

          <Text style={styles.settingDescription}>Quick Setup:</Text>
          <View style={styles.presetContainer}>
            <TouchableOpacity style={styles.presetButton} onPress={() => applyAccessibilityPreset('minimal')}>
              <Text style={styles.presetButtonText}>Minimal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => applyAccessibilityPreset('enhanced')}>
              <Text style={styles.presetButtonText}>Enhanced</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetButton} onPress={() => applyAccessibilityPreset('maximum')}>
              <Text style={styles.presetButtonText}>Maximum</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio & Recording</Text>

          <SettingRow
            title="Audio Amplification"
            description="Boost audio levels for better hearing"
            value={audioSettings.amplificationEnabled}
            onToggle={() => updateAudioSettings({ amplificationEnabled: !audioSettings.amplificationEnabled })}
          />

          <SettingRow
            title="Noise Cancellation"
            description="Reduce background noise during recording"
            value={audioSettings.noiseCancellationEnabled}
            onToggle={() => updateAudioSettings({ noiseCancellationEnabled: !audioSettings.noiseCancellationEnabled })}
          />

          <SettingRow
            title="Haptic Feedback"
            description="Vibration feedback for button presses"
            value={audioSettings.hapticFeedbackEnabled}
            onToggle={() => updateAudioSettings({ hapticFeedbackEnabled: !audioSettings.hapticFeedbackEnabled })}
          />
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <SettingRow
            title="Auto Backup"
            description="Automatically backup your memories"
            value={preferences?.app.autoBackup || false}
            onToggle={() => updateAppSettings({ autoBackup: !preferences?.app.autoBackup })}
          />

          <SettingRow
            title="Reminder Notifications"
            description="Get gentle reminders to record memories"
            value={preferences?.app.reminderNotifications || false}
            onToggle={() => updateAppSettings({ reminderNotifications: !preferences?.app.reminderNotifications })}
          />
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <SettingRow
            title="User Name"
            description={user?.name || 'Not set'}
            type="text"
          />

          <SettingRow
            title="Preferred Language"
            description="Choose your default language for recordings"
            value={preferences?.app.language?.toUpperCase() || 'EN'}
            type="button"
            onToggle={() => {
              const newLang = preferences?.app.language === 'en' ? 'zh' : 'en';
              updateAppSettings({ language: newLang });
            }}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;