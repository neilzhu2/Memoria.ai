import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MemoryTheme {
  id: string;
  title: string;
  icon?: string;
}

const MEMORY_THEMES: MemoryTheme[] = [
  { id: 'childhood-home', title: 'Talk about your childhood home' },
  { id: 'parents-memory', title: 'Share a memory of your parents' },
  { id: 'wedding-day', title: 'Describe your wedding day' },
  { id: 'first-job', title: 'Tell about your first job' },
  { id: 'favorite-holiday', title: 'Recall a favorite holiday' },
  { id: 'good-friend', title: 'Remember a good friend' },
  { id: 'school-days', title: 'Talk about your school days' },
  { id: 'favorite-meal', title: 'Describe your favorite family meal' },
  { id: 'first-home', title: 'Tell about your first home' },
  { id: 'special-achievement', title: 'Share a special achievement' },
  { id: 'family-tradition', title: 'Describe a family tradition' },
  { id: 'memorable-trip', title: 'Remember a memorable trip' },
];

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onThemeSelect: (theme: MemoryTheme) => void;
}

export function ThemeSelectionModal({ visible, onClose, onThemeSelect }: ThemeSelectionModalProps) {
  const colorScheme = useColorScheme();

  const handleThemeSelect = async (theme: MemoryTheme) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onThemeSelect(theme);
    // Don't call onClose() here - let the parent handle the transition
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close theme selection"
          >
            <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
              Memory Suggestions
            </Text>
            <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Tap any topic to start recording about it
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Theme List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {MEMORY_THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              style={[styles.themeCard, {
                backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper,
                borderColor: Colors[colorScheme ?? 'light'].primary + '40',
              }]}
              onPress={() => handleThemeSelect(theme)}
              accessibilityLabel={`Record about: ${theme.title}`}
              accessibilityHint="Tap to start recording about this topic"
            >
              <Text style={[styles.themeText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {theme.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Bottom spacing for safe area */}
          <View style={styles.bottomSpacing} />
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
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: DesignTokens.touchTarget.minimum,
    height: DesignTokens.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.touchTarget.minimum / 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
  },
  placeholder: {
    width: DesignTokens.touchTarget.minimum,
  },
  title: {
    ...DesignTokens.typography.h2,
    marginBottom: DesignTokens.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.md,
  },
  themeCard: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 2,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignTokens.elevation[2],
  },
  themeText: {
    ...DesignTokens.typography.button,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
});