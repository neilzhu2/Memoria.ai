import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import { toastService } from '@/services/toastService';

interface AccessibilitySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Performance optimization: Move arrays outside component to prevent re-creation on every render
const PRESET_OPTIONS = [
  { key: 'default' as const, label: 'Default', icon: 'textformat.size' },
  { key: 'enhanced' as const, label: 'Enhanced', icon: 'textformat.size.larger' },
  { key: 'maximum' as const, label: 'Maximum', icon: 'accessibility' },
] as const;

const THEME_OPTIONS = [
  { key: 'light' as const, label: 'Light', icon: 'sun.max.fill' },
  { key: 'dark' as const, label: 'Dark', icon: 'moon.fill' },
  { key: 'system' as const, label: 'Auto', icon: 'circle.lefthalf.filled' },
] as const;

function AccessibilitySettingsModalComponent({ visible, onClose }: AccessibilitySettingsModalProps) {
  const colorScheme = useColorScheme();
  const {
    settings,
    updateFontSize,
    updateTouchTargetSize,
    toggleHighContrast,
    toggleReducedMotion,
    toggleHapticFeedback,
    applyAccessibilityPreset,
    updateThemeMode,
  } = useSettings();

  const [localFontSize, setLocalFontSize] = useState(settings.fontSize);
  const [localTouchTarget, setLocalTouchTarget] = useState(settings.touchTargetSize);

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;

  // Performance optimization: Use useCallback to prevent re-creating functions on every render
  const handleClose = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }, [onClose]);

  const handleFontSizeChange = useCallback((value: number) => {
    setLocalFontSize(Math.round(value));
  }, []);

  const handleFontSizeComplete = useCallback(async (value: number) => {
    const roundedValue = Math.round(value);
    await updateFontSize(roundedValue);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateFontSize]);

  const handleTouchTargetChange = useCallback((value: number) => {
    setLocalTouchTarget(Math.round(value));
  }, []);

  const handleTouchTargetComplete = useCallback(async (value: number) => {
    const roundedValue = Math.round(value);
    await updateTouchTargetSize(roundedValue);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [updateTouchTargetSize]);

  const handleToggleHighContrast = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleHighContrast();
    toastService.show(
      settings.highContrast ? 'High Contrast Off' : 'High Contrast On',
      settings.highContrast ? 'Standard colors restored' : 'Enhanced contrast enabled'
    );
  }, [toggleHighContrast, settings.highContrast]);

  const handleToggleReducedMotion = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleReducedMotion();
    toastService.show(
      settings.reducedMotion ? 'Animations On' : 'Animations Off',
      settings.reducedMotion ? 'Animations enabled' : 'Reduced motion enabled'
    );
  }, [toggleReducedMotion, settings.reducedMotion]);

  const handleToggleHaptics = useCallback(async () => {
    await toggleHapticFeedback();
    if (settings.hapticFeedbackEnabled) {
      // If turning it on, give immediate feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toastService.show(
      settings.hapticFeedbackEnabled ? 'Haptics Off' : 'Haptics On',
      settings.hapticFeedbackEnabled ? 'Touch feedback disabled' : 'Touch feedback enabled'
    );
  }, [toggleHapticFeedback, settings.hapticFeedbackEnabled]);

  const handleApplyPreset = useCallback(async (preset: 'default' | 'enhanced' | 'maximum') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await applyAccessibilityPreset(preset);

    // Update local state to match
    setLocalFontSize(settings.fontSize);
    setLocalTouchTarget(settings.touchTargetSize);

    const presetNames = {
      default: 'Default',
      enhanced: 'Enhanced',
      maximum: 'Maximum',
    };

    toastService.show(
      `${presetNames[preset]} Preset Applied`,
      'Accessibility settings updated'
    );
  }, [applyAccessibilityPreset, settings.fontSize, settings.touchTargetSize]);

  const handleThemeChange = useCallback(async (mode: 'light' | 'dark' | 'system') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateThemeMode(mode);

    const modeNames = {
      light: 'Light Mode',
      dark: 'Dark Mode',
      system: 'System Default',
    };

    toastService.show('Theme Updated', modeNames[mode]);
  }, [updateThemeMode]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close accessibility settings"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: textColor }]}>
            Accessibility
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Quick Presets */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Quick Presets</Text>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Apply pre-configured accessibility settings
            </Text>

            <View style={styles.presetsContainer}>
              {PRESET_OPTIONS.map((preset) => (
                <TouchableOpacity
                  key={preset.key}
                  style={[
                    styles.presetButton,
                    { backgroundColor: tintColor + '20', borderColor: tintColor },
                  ]}
                  onPress={() => handleApplyPreset(preset.key)}
                  accessibilityLabel={`Apply ${preset.label} preset`}
                  accessibilityRole="button"
                >
                  <IconSymbol name={preset.icon} size={24} color={tintColor} />
                  <Text style={[styles.presetButtonText, { color: tintColor }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Theme */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Theme</Text>

            <View style={styles.themeButtons}>
              {THEME_OPTIONS.map((theme) => (
                <TouchableOpacity
                  key={theme.key}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor: settings.themeMode === theme.key ? tintColor : borderColor + '20',
                      borderColor: settings.themeMode === theme.key ? tintColor : borderColor,
                    },
                  ]}
                  onPress={() => handleThemeChange(theme.key)}
                  accessibilityLabel={`${theme.label} theme`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: settings.themeMode === theme.key }}
                >
                  <IconSymbol
                    name={theme.icon}
                    size={20}
                    color={settings.themeMode === theme.key ? 'white' : textColor}
                  />
                  <Text
                    style={[
                      styles.themeButtonText,
                      { color: settings.themeMode === theme.key ? 'white' : textColor },
                    ]}
                  >
                    {theme.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Font Size */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Text Size</Text>
              <Text style={[styles.sliderValue, { color: tintColor }]}>{localFontSize}px</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Adjust the size of text throughout the app
            </Text>

            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderLabel, { color: borderColor, fontSize: 14 }]}>A</Text>
              <Slider
                style={styles.slider}
                minimumValue={16}
                maximumValue={28}
                step={1}
                value={localFontSize}
                onValueChange={handleFontSizeChange}
                onSlidingComplete={handleFontSizeComplete}
                minimumTrackTintColor={tintColor}
                maximumTrackTintColor={borderColor + '40'}
                thumbTintColor={tintColor}
                accessibilityLabel="Font size slider"
                accessibilityValue={{ min: 16, max: 28, now: localFontSize }}
              />
              <Text style={[styles.sliderLabel, { color: borderColor, fontSize: 22 }]}>A</Text>
            </View>

            {/* Preview Text */}
            <View style={[styles.previewBox, { backgroundColor: borderColor + '10' }]}>
              <Text style={[styles.previewText, { color: textColor, fontSize: localFontSize }]}>
                Preview: This is how text will appear
              </Text>
            </View>
          </View>

          {/* Touch Target Size */}
          <View style={styles.section}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Button Size</Text>
              <Text style={[styles.sliderValue, { color: tintColor }]}>{localTouchTarget}px</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Adjust the size of buttons and touch targets
            </Text>

            <View style={styles.sliderContainer}>
              <IconSymbol name="hand.point.up.left" size={16} color={borderColor} />
              <Slider
                style={styles.slider}
                minimumValue={44}
                maximumValue={72}
                step={4}
                value={localTouchTarget}
                onValueChange={handleTouchTargetChange}
                onSlidingComplete={handleTouchTargetComplete}
                minimumTrackTintColor={tintColor}
                maximumTrackTintColor={borderColor + '40'}
                thumbTintColor={tintColor}
                accessibilityLabel="Touch target size slider"
                accessibilityValue={{ min: 44, max: 72, now: localTouchTarget }}
              />
              <IconSymbol name="hand.point.up.left.fill" size={24} color={borderColor} />
            </View>
          </View>

          {/* Toggle Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Options</Text>

            {/* High Contrast */}
            <View style={[styles.toggleRow, { backgroundColor: borderColor + '10' }]}>
              <View style={styles.toggleLeft}>
                <IconSymbol name="circle.lefthalf.filled" size={24} color={textColor} />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: textColor }]}>High Contrast</Text>
                  <Text style={[styles.toggleDescription, { color: borderColor }]}>
                    Enhance color contrast for better visibility
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.highContrast}
                onValueChange={handleToggleHighContrast}
                trackColor={{ false: borderColor + '40', true: tintColor }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={borderColor + '40'}
                accessibilityLabel="High contrast mode"
                accessibilityRole="switch"
              />
            </View>

            {/* Reduced Motion */}
            <View style={[styles.toggleRow, { backgroundColor: borderColor + '10' }]}>
              <View style={styles.toggleLeft}>
                <IconSymbol name="sparkles" size={24} color={textColor} />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: textColor }]}>Reduce Motion</Text>
                  <Text style={[styles.toggleDescription, { color: borderColor }]}>
                    Minimize animations and transitions
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.reducedMotion}
                onValueChange={handleToggleReducedMotion}
                trackColor={{ false: borderColor + '40', true: tintColor }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={borderColor + '40'}
                accessibilityLabel="Reduced motion"
                accessibilityRole="switch"
              />
            </View>

            {/* Haptic Feedback */}
            <View style={[styles.toggleRow, { backgroundColor: borderColor + '10' }]}>
              <View style={styles.toggleLeft}>
                <IconSymbol name="hand.tap" size={24} color={textColor} />
                <View style={styles.toggleText}>
                  <Text style={[styles.toggleTitle, { color: textColor }]}>Haptic Feedback</Text>
                  <Text style={[styles.toggleDescription, { color: borderColor }]}>
                    Feel vibrations when interacting with the app
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.hapticFeedbackEnabled}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: borderColor + '40', true: tintColor }}
                thumbColor={Platform.OS === 'ios' ? undefined : 'white'}
                ios_backgroundColor={borderColor + '40'}
                accessibilityLabel="Haptic feedback"
                accessibilityRole="switch"
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    opacity: 0.8,
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
    minHeight: 88,
  },
  presetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    gap: 6,
    minHeight: 80,
  },
  themeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  slider: {
    flex: 1,
    height: 44,
  },
  sliderLabel: {
    fontWeight: '600',
  },
  previewBox: {
    padding: 16,
    borderRadius: 12,
    minHeight: 60,
    justifyContent: 'center',
  },
  previewText: {
    fontWeight: '500',
    lineHeight: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 80,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

// Performance optimization: Wrap with React.memo to prevent unnecessary re-renders
export const AccessibilitySettingsModal = React.memo(AccessibilitySettingsModalComponent);
