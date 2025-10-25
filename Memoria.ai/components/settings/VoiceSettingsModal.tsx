import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import * as Haptics from 'expo-haptics';

interface VoiceSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function VoiceSettingsModal({ visible, onClose }: VoiceSettingsModalProps) {
  const colorScheme = useColorScheme();
  const { settings, toggleAutoTranscribe, updateTranscriptionLanguage, toggleSoundEffects } = useSettings();

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleToggleAutoTranscribe = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleAutoTranscribe();
  };

  const handleToggleSoundEffects = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleSoundEffects();
  };

  const handleLanguageSelect = async (lang: 'en' | 'zh-CN' | 'zh-TW' | 'auto') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateTranscriptionLanguage(lang);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor + '20' }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close voice settings"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Voice Settings</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transcription Language */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Transcription Language</Text>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Choose the language for voice-to-text transcription
            </Text>

            <View style={styles.languageOptions}>
              {[
                { value: 'auto' as const, label: 'Auto-detect', description: 'Automatically detect language' },
                { value: 'en' as const, label: 'English', description: 'English transcription' },
                { value: 'zh-CN' as const, label: '简体中文', description: 'Simplified Chinese' },
                { value: 'zh-TW' as const, label: '繁體中文', description: 'Traditional Chinese' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.languageOption,
                    {
                      backgroundColor: settings.transcriptionLanguage === option.value
                        ? tintColor + '20'
                        : backgroundColor,
                      borderColor: settings.transcriptionLanguage === option.value
                        ? tintColor
                        : borderColor + '40',
                    },
                  ]}
                  onPress={() => handleLanguageSelect(option.value)}
                  accessibilityLabel={`Select ${option.label}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.transcriptionLanguage === option.value }}
                >
                  <View style={styles.languageOptionContent}>
                    <Text style={[styles.languageOptionLabel, { color: textColor }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.languageOptionDescription, { color: borderColor }]}>
                      {option.description}
                    </Text>
                  </View>
                  {settings.transcriptionLanguage === option.value && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Auto-transcribe Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-transcribe</Text>
                <Text style={[styles.toggleDescription, { color: borderColor }]}>
                  Automatically transcribe recordings after saving
                </Text>
              </View>
              <Switch
                value={settings.autoTranscribe}
                onValueChange={handleToggleAutoTranscribe}
                trackColor={{ false: borderColor + '40', true: tintColor + '80' }}
                thumbColor={settings.autoTranscribe ? tintColor : '#f4f3f4'}
                accessibilityLabel="Toggle auto-transcribe"
              />
            </View>
          </View>

          {/* Sound Effects Toggle */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Sound Effects</Text>
                <Text style={[styles.toggleDescription, { color: borderColor }]}>
                  Play sound effects for recording actions
                </Text>
              </View>
              <Switch
                value={settings.soundEffectsEnabled}
                onValueChange={handleToggleSoundEffects}
                trackColor={{ false: borderColor + '40', true: tintColor + '80' }}
                thumbColor={settings.soundEffectsEnabled ? tintColor : '#f4f3f4'}
                accessibilityLabel="Toggle sound effects"
              />
            </View>
          </View>

          {/* Info Section */}
          <View style={[styles.infoBox, { backgroundColor: tintColor + '10' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
            <Text style={[styles.infoText, { color: textColor }]}>
              Future updates will include voice recognition training and custom voice profiles for better accuracy.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  languageOptionContent: {
    flex: 1,
  },
  languageOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageOptionDescription: {
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
