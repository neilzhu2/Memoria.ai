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
              style={[styles.themeCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  placeholder: {
    width: 44,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  themeCard: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  themeText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 32,
  },
});