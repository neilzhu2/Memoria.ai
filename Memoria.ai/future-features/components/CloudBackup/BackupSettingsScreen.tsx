/**
 * Cloud Backup Settings Screen for Memoria.ai
 * Designed specifically for elderly users with large text, clear controls, and comprehensive explanations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../stores/settingsStore';
import { cloudBackupService } from '../../services/cloudBackupService';
import { CloudBackupConfig, CloudBackupStatus } from '../../types/cloudBackup';

const { width, height } = Dimensions.get('window');

interface BackupSettingsScreenProps {
  onClose: () => void;
}

export const BackupSettingsScreen: React.FC<BackupSettingsScreenProps> = ({ onClose }) => {
  const { theme, getCurrentFontSize, getCurrentTouchTargetSize } = useSettingsStore();
  const [config, setConfig] = useState<CloudBackupConfig | null>(null);
  const [status, setStatus] = useState<CloudBackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showDataRegionInfo, setShowDataRegionInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();

  useEffect(() => {
    loadBackupSettings();
  }, []);

  const loadBackupSettings = async () => {
    try {
      setIsLoading(true);

      // Load current configuration
      const configResponse = await cloudBackupService.getBackupStatus();
      if (configResponse.success && configResponse.data) {
        setStatus(configResponse.data);
      }

      // For demo purposes, create a default config
      const defaultConfig: CloudBackupConfig = {
        enabled: false,
        autoBackupEnabled: true,
        wifiOnlyBackup: true,
        lowPowerMode: true,
        backupFrequency: 'weekly',
        backupTime: '02:00',
        maxBackupRetention: 30,
        maxBackupSize: 100,
        compressionLevel: 'medium',
        includeTags: [],
        excludeArchived: true,
        encryptionStrength: '256',
        keyRotationDays: 90,
        requireBiometricAuth: true,
        dataRegion: 'us-east',
        complianceMode: 'standard',
        enableFamilySharing: false,
        familyMemberLimit: 5,
        emergencyAccessEnabled: false,
      };

      setConfig(defaultConfig);
    } catch (error) {
      Alert.alert('Error', 'Failed to load backup settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!config) return;

    try {
      setIsSaving(true);

      const updateResult = await cloudBackupService.updateBackupConfig(config);
      if (updateResult.success) {
        Alert.alert(
          'Settings Saved',
          'Your backup settings have been saved successfully.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert('Error', 'Failed to save settings. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleBackup = (enabled: boolean) => {
    if (!config) return;

    if (enabled) {
      // Show explanation before enabling
      Alert.alert(
        'Enable Cloud Backup?',
        'Cloud backup will securely store your precious memories in the cloud with strong encryption. Your data will be protected and only you can access it.\n\nWould you like to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Backup',
            onPress: () => setConfig({ ...config, enabled: true }),
          },
        ]
      );
    } else {
      Alert.alert(
        'Disable Cloud Backup?',
        'This will stop backing up your memories to the cloud. Your existing backups will remain safe, but no new backups will be created.\n\nAre you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => setConfig({ ...config, enabled: false }),
          },
        ]
      );
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getDataRegionDisplay = (region: string): string => {
    switch (region) {
      case 'us-east': return 'United States (East)';
      case 'us-west': return 'United States (West)';
      case 'eu-west': return 'Europe (West)';
      case 'asia-pacific': return 'Asia Pacific';
      default: return region;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
            Loading backup settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!config) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error, fontSize: fontSize + 2 }]}>
            Failed to load backup settings
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary, minHeight: touchTargetSize }]}
            onPress={loadBackupSettings}
          >
            <Text style={[styles.retryButtonText, { fontSize: fontSize }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[styles.closeButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
          onPress={onClose}
        >
          <Text style={[styles.closeButtonText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
            ✕
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: fontSize + 6 }]}>
          Cloud Backup Settings
        </Text>
        <View style={{ width: touchTargetSize }} />
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Main Backup Toggle */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              Cloud Backup
            </Text>
            <TouchableOpacity
              style={[styles.helpButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
              onPress={() => setShowExplanation(true)}
            >
              <Text style={[styles.helpButtonText, { color: theme.colors.primary, fontSize: fontSize }]}>
                ?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, { minHeight: touchTargetSize }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                Enable Cloud Backup
              </Text>
              <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Securely store your memories in the cloud with strong encryption
              </Text>
            </View>
            <Switch
              value={config.enabled}
              onValueChange={handleToggleBackup}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={config.enabled ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.switch}
            />
          </View>

          {config.enabled && status && (
            <View style={[styles.statusCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.statusTitle, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                Backup Status
              </Text>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Last Backup:
                </Text>
                <Text style={[styles.statusValue, { color: theme.colors.text, fontSize: fontSize }]}>
                  {status.lastBackupTime ? status.lastBackupTime.toLocaleDateString() : 'Never'}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Storage Used:
                </Text>
                <Text style={[styles.statusValue, { color: theme.colors.text, fontSize: fontSize }]}>
                  {formatStorageSize(status.storageUsed)} of {formatStorageSize(status.storageLimit)}
                </Text>
              </View>
              <View style={styles.statusRow}>
                <Text style={[styles.statusLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Total Backups:
                </Text>
                <Text style={[styles.statusValue, { color: theme.colors.text, fontSize: fontSize }]}>
                  {status.totalBackups}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Backup Settings */}
        {config.enabled && (
          <>
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
                Automatic Backup
              </Text>

              <View style={[styles.settingRow, { minHeight: touchTargetSize }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                    Automatic Backup
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    Create backups automatically without asking
                  </Text>
                </View>
                <Switch
                  value={config.autoBackupEnabled}
                  onValueChange={(value) => setConfig({ ...config, autoBackupEnabled: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                  thumbColor={config.autoBackupEnabled ? theme.colors.primary : theme.colors.textSecondary}
                  style={styles.switch}
                />
              </View>

              <View style={[styles.settingRow, { minHeight: touchTargetSize }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                    WiFi Only
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    Only backup when connected to WiFi (saves mobile data)
                  </Text>
                </View>
                <Switch
                  value={config.wifiOnlyBackup}
                  onValueChange={(value) => setConfig({ ...config, wifiOnlyBackup: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                  thumbColor={config.wifiOnlyBackup ? theme.colors.primary : theme.colors.textSecondary}
                  style={styles.switch}
                />
              </View>

              <TouchableOpacity
                style={[styles.pickerRow, { minHeight: touchTargetSize, borderColor: theme.colors.border }]}
                onPress={() => {
                  Alert.alert(
                    'Backup Frequency',
                    'How often would you like to create automatic backups?',
                    [
                      { text: 'Daily', onPress: () => setConfig({ ...config, backupFrequency: 'daily' }) },
                      { text: 'Weekly', onPress: () => setConfig({ ...config, backupFrequency: 'weekly' }) },
                      { text: 'Monthly', onPress: () => setConfig({ ...config, backupFrequency: 'monthly' }) },
                      { text: 'Cancel', style: 'cancel' },
                    ]
                  );
                }}
              >
                <Text style={[styles.pickerLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                  Backup Frequency
                </Text>
                <Text style={[styles.pickerValue, { color: theme.colors.primary, fontSize: fontSize }]}>
                  {config.backupFrequency.charAt(0).toUpperCase() + config.backupFrequency.slice(1)} ▼
                </Text>
              </TouchableOpacity>
            </View>

            {/* Privacy & Security */}
            <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
                Privacy & Security
              </Text>

              <TouchableOpacity
                style={[styles.pickerRow, { minHeight: touchTargetSize, borderColor: theme.colors.border }]}
                onPress={() => setShowDataRegionInfo(true)}
              >
                <Text style={[styles.pickerLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                  Data Storage Location
                </Text>
                <Text style={[styles.pickerValue, { color: theme.colors.primary, fontSize: fontSize }]}>
                  {getDataRegionDisplay(config.dataRegion)} ▼
                </Text>
              </TouchableOpacity>

              <View style={[styles.settingRow, { minHeight: touchTargetSize }]}>
                <View style={styles.settingContent}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                    Require Biometric Authentication
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    Use fingerprint or face recognition to access backups
                  </Text>
                </View>
                <Switch
                  value={config.requireBiometricAuth}
                  onValueChange={(value) => setConfig({ ...config, requireBiometricAuth: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                  thumbColor={config.requireBiometricAuth ? theme.colors.primary : theme.colors.textSecondary}
                  style={styles.switch}
                />
              </View>

              <View style={[styles.infoCard, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.infoTitle, { color: theme.colors.success, fontSize: fontSize + 1 }]}>
                  🔒 Your Privacy is Protected
                </Text>
                <Text style={[styles.infoText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  • All data is encrypted before leaving your device{'\n'}
                  • Only you can decrypt and access your memories{'\n'}
                  • We cannot see or access your personal content{'\n'}
                  • Compliant with privacy laws and regulations
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            {
              backgroundColor: theme.colors.primary,
              minHeight: touchTargetSize,
              opacity: isSaving ? 0.6 : 1,
            },
          ]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={[styles.saveButtonText, { fontSize: fontSize + 2 }]}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Explanation Modal */}
      <Modal
        visible={showExplanation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExplanation(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              About Cloud Backup
            </Text>
            <TouchableOpacity
              style={[styles.modalCloseButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
              onPress={() => setShowExplanation(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={[styles.explanationText, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
              Cloud backup safely stores your precious memories online so they're protected even if something happens to your device.
            </Text>
            <Text style={[styles.explanationSubtitle, { color: theme.colors.text, fontSize: fontSize + 3 }]}>
              How it works:
            </Text>
            <Text style={[styles.explanationText, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              1. Your memories are encrypted (scrambled) on your device{'\n'}
              2. The encrypted data is uploaded to secure cloud storage{'\n'}
              3. Only you have the key to decrypt and access your memories{'\n'}
              4. You can restore your memories to any device
            </Text>
            <Text style={[styles.explanationSubtitle, { color: theme.colors.text, fontSize: fontSize + 3 }]}>
              Benefits:
            </Text>
            <Text style={[styles.explanationText, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              • Protection against device loss or damage{'\n'}
              • Access memories from multiple devices{'\n'}
              • Share with family members safely{'\n'}
              • Peace of mind knowing memories are safe
            </Text>
            <Text style={[styles.explanationSubtitle, { color: theme.colors.text, fontSize: fontSize + 3 }]}>
              Your privacy:
            </Text>
            <Text style={[styles.explanationText, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              We use "zero-knowledge" encryption, which means even we cannot see your memories. Only you have the key to unlock them.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Data Region Info Modal */}
      <Modal
        visible={showDataRegionInfo}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDataRegionInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.regionModal, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: fontSize + 3 }]}>
              Choose Data Storage Location
            </Text>
            <Text style={[styles.regionDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              Select where your encrypted data will be stored:
            </Text>

            {['us-east', 'us-west', 'eu-west', 'asia-pacific'].map((region) => (
              <TouchableOpacity
                key={region}
                style={[
                  styles.regionOption,
                  {
                    backgroundColor: config.dataRegion === region ? theme.colors.primary + '20' : 'transparent',
                    borderColor: theme.colors.border,
                    minHeight: touchTargetSize,
                  },
                ]}
                onPress={() => {
                  setConfig({ ...config, dataRegion: region as any });
                  setShowDataRegionInfo(false);
                }}
              >
                <Text style={[
                  styles.regionOptionText,
                  {
                    color: config.dataRegion === region ? theme.colors.primary : theme.colors.text,
                    fontSize: fontSize + 1,
                  },
                ]}>
                  {getDataRegionDisplay(region)}
                  {config.dataRegion === region && ' ✓'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.regionCancelButton, { minHeight: touchTargetSize }]}
              onPress={() => setShowDataRegionInfo(false)}
            >
              <Text style={[styles.regionCancelText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  helpButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  helpButtonText: {
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    lineHeight: 20,
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
  },
  pickerLabel: {
    fontWeight: '600',
  },
  pickerValue: {
    fontWeight: '500',
  },
  statusCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {},
  statusValue: {
    fontWeight: '500',
  },
  infoCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    lineHeight: 22,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: 'bold',
    flex: 1,
  },
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  explanationText: {
    lineHeight: 24,
    marginBottom: 16,
  },
  explanationSubtitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  regionModal: {
    borderRadius: 12,
    padding: 20,
    maxHeight: height * 0.8,
  },
  regionDescription: {
    marginBottom: 20,
    lineHeight: 20,
  },
  regionOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  regionOptionText: {
    fontWeight: '500',
  },
  regionCancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  regionCancelText: {
    fontWeight: '500',
  },
});

export default BackupSettingsScreen;