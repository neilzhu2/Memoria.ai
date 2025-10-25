import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSettings } from '@/contexts/SettingsContext';
import * as Haptics from 'expo-haptics';

interface BackupSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BackupSettingsModal({ visible, onClose }: BackupSettingsModalProps) {
  const colorScheme = useColorScheme();
  const { settings, toggleAutoBackup, exportSettings, importSettings } = useSettings();

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const textColor = Colors[colorScheme ?? 'light'].text;
  const borderColor = Colors[colorScheme ?? 'light'].tabIconDefault;
  const tintColor = Colors[colorScheme ?? 'light'].elderlyTabActive;

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleToggleAutoBackup = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleAutoBackup();
  };

  const handleExportSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const settingsJson = exportSettings();
    Alert.alert('Export Settings', `Settings JSON:\n\n${settingsJson}`, [
      { text: 'OK' },
    ]);
  };

  const handleImportSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Import Settings', 'Import functionality coming soon! This will allow you to restore settings from a backup file.', [
      { text: 'OK' },
    ]);
  };

  const handleBackupNow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Backup', 'Cloud backup functionality coming soon! This will sync your memories and settings across devices.', [
      { text: 'OK' },
    ]);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
            accessibilityLabel="Close backup settings"
            accessibilityRole="button"
          >
            <IconSymbol name="xmark" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>Backup & Sync</Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cloud Backup Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Cloud Backup</Text>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Automatically backup your memories and settings to the cloud
            </Text>

            {/* Auto-backup Toggle */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-backup</Text>
                <Text style={[styles.toggleDescription, { color: borderColor }]}>
                  Daily automatic backups
                </Text>
              </View>
              <Switch
                value={settings.autoBackupEnabled}
                onValueChange={handleToggleAutoBackup}
                trackColor={{ false: borderColor + '40', true: tintColor + '80' }}
                thumbColor={settings.autoBackupEnabled ? tintColor : '#f4f3f4'}
                accessibilityLabel="Toggle auto-backup"
              />
            </View>

            {/* Last Backup Info */}
            <View style={[styles.infoCard, { backgroundColor: borderColor + '10' }]}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: borderColor }]}>Last backup:</Text>
                <Text style={[styles.infoValue, { color: textColor }]}>
                  {formatDate(settings.lastBackupDate)}
                </Text>
              </View>
            </View>

            {/* Backup Now Button */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: tintColor }]}
              onPress={handleBackupNow}
              accessibilityLabel="Backup now"
              accessibilityRole="button"
            >
              <IconSymbol name="icloud.and.arrow.up.fill" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Backup Now</Text>
            </TouchableOpacity>
          </View>

          {/* Local Settings Export/Import */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Settings Backup</Text>
            <Text style={[styles.sectionDescription, { color: borderColor }]}>
              Export or import your app settings
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: backgroundColor, borderColor: borderColor + '40' }]}
                onPress={handleExportSettings}
                accessibilityLabel="Export settings"
                accessibilityRole="button"
              >
                <IconSymbol name="square.and.arrow.up" size={20} color={tintColor} />
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>Export</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: backgroundColor, borderColor: borderColor + '40' }]}
                onPress={handleImportSettings}
                accessibilityLabel="Import settings"
                accessibilityRole="button"
              >
                <IconSymbol name="square.and.arrow.down" size={20} color={tintColor} />
                <Text style={[styles.secondaryButtonText, { color: textColor }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Section */}
          <View style={[styles.infoBox, { backgroundColor: tintColor + '10' }]}>
            <IconSymbol name="info.circle.fill" size={20} color={tintColor} />
            <Text style={[styles.infoText, { color: textColor }]}>
              Cloud backup and sync functionality will be available in a future update. This will enable seamless access to your memories across all your devices.
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
