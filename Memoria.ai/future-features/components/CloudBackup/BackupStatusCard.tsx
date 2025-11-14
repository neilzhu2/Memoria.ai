/**
 * Backup Status Card Component for Memoria.ai
 * Displays current backup status in an elderly-friendly format with clear visual indicators
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { useSettingsStore } from '../../stores/settingsStore';
import { cloudBackupService } from '../../services/cloudBackupService';
import { CloudBackupStatus, BackupProgress } from '../../types/cloudBackup';

const { width } = Dimensions.get('window');

interface BackupStatusCardProps {
  onPress?: () => void;
  onBackupPress?: () => void;
  showControls?: boolean;
}

export const BackupStatusCard: React.FC<BackupStatusCardProps> = ({
  onPress,
  onBackupPress,
  showControls = true,
}) => {
  const { theme, getCurrentFontSize, getCurrentTouchTargetSize } = useSettingsStore();
  const [status, setStatus] = useState<CloudBackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState<BackupProgress | null>(null);
  const [healthScore, setHealthScore] = useState(100);
  const [pulseAnim] = useState(new Animated.Value(1));

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();

  useEffect(() => {
    loadBackupStatus();
    const interval = setInterval(loadBackupStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isBackingUp) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [isBackingUp]);

  const loadBackupStatus = async () => {
    try {
      const statusResponse = await cloudBackupService.getBackupStatus();
      if (statusResponse.success && statusResponse.data) {
        setStatus(statusResponse.data);
        setIsBackingUp(statusResponse.data.isBackingUp);
      }

      const healthResponse = await cloudBackupService.getBackupHealth();
      if (healthResponse.success && healthResponse.data) {
        setHealthScore(healthResponse.data.score);
      }
    } catch (error) {
      console.error('Failed to load backup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleCreateBackup = async () => {
    try {
      setIsBackingUp(true);
      setBackupProgress({
        backupId: 'manual_backup',
        status: 'preparing',
        progress: 0,
        currentStep: 'Preparing backup...',
        totalSteps: 5,
        bytesProcessed: 0,
        totalBytes: 0,
        timeElapsed: 0,
      });

      const result = await cloudBackupService.createBackup(true, (progress) => {
        setBackupProgress(progress);
      });

      if (result.success) {
        Alert.alert(
          'Backup Completed',
          'Your memories have been safely backed up to the cloud.',
          [{ text: 'OK' }]
        );
        loadBackupStatus();
      } else {
        Alert.alert(
          'Backup Failed',
          result.error || 'Unable to create backup. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Backup Failed',
        'Unable to create backup. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsBackingUp(false);
      setBackupProgress(null);
    }
  };

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getStatusIcon = (): string => {
    if (isBackingUp) return '🔄';
    if (!status?.isEnabled) return '⏸️';
    if (healthScore >= 90) return '✅';
    if (healthScore >= 70) return '⚠️';
    return '❌';
  };

  const getStatusText = (): string => {
    if (isBackingUp) return 'Creating backup...';
    if (!status?.isEnabled) return 'Backup disabled';
    if (status?.lastBackupTime) {
      const daysSince = Math.floor((Date.now() - status.lastBackupTime.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSince === 0) return 'Backed up today';
      if (daysSince === 1) return 'Backed up yesterday';
      return `Backed up ${daysSince} days ago`;
    }
    return 'No backups yet';
  };

  const getStatusColor = (): string => {
    if (isBackingUp) return theme.colors.primary;
    if (!status?.isEnabled) return theme.colors.textSecondary;
    if (healthScore >= 90) return theme.colors.success;
    if (healthScore >= 70) return theme.colors.warning;
    return theme.colors.error;
  };

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
            Loading backup status...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: getStatusColor(),
          borderWidth: 2,
          minHeight: touchTargetSize * 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Animated.View style={[styles.content, { transform: [{ scale: pulseAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.statusIndicator}>
            <Text style={[styles.statusIcon, { fontSize: fontSize + 8 }]}>
              {getStatusIcon()}
            </Text>
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
                Cloud Backup
              </Text>
              <Text style={[styles.statusSubtitle, { color: getStatusColor(), fontSize: fontSize + 1 }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {status?.isEnabled && healthScore < 100 && (
            <View style={[styles.healthBadge, { backgroundColor: getStatusColor() + '20' }]}>
              <Text style={[styles.healthScore, { color: getStatusColor(), fontSize: fontSize - 2 }]}>
                {healthScore}%
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar (when backing up) */}
        {isBackingUp && backupProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${backupProgress.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
              {backupProgress.currentStep} ({backupProgress.progress}%)
            </Text>
          </View>
        )}

        {/* Status Details */}
        {status && status.isEnabled && !isBackingUp && (
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Storage Used:
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: fontSize }]}>
                {formatStorageSize(status.storageUsed)} of {formatStorageSize(status.storageLimit)}
              </Text>
            </View>

            {status.totalBackups > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Total Backups:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: fontSize }]}>
                  {status.totalBackups}
                </Text>
              </View>
            )}

            {status.nextScheduledBackup && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Next Backup:
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: fontSize }]}>
                  {status.nextScheduledBackup.toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Storage Usage Bar */}
        {status && status.isEnabled && (
          <View style={styles.storageContainer}>
            <View style={[styles.storageBar, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.storageFill,
                  {
                    backgroundColor: theme.colors.primary,
                    width: `${Math.min((status.storageUsed / status.storageLimit) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {showControls && status && (
          <View style={styles.actions}>
            {!status.isEnabled ? (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.enableButton,
                  {
                    backgroundColor: theme.colors.primary,
                    minHeight: touchTargetSize,
                  },
                ]}
                onPress={onPress}
              >
                <Text style={[styles.enableButtonText, { fontSize: fontSize + 1 }]}>
                  Enable Backup
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.enabledActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.backupButton,
                    {
                      backgroundColor: theme.colors.primary,
                      minHeight: touchTargetSize,
                      opacity: isBackingUp ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleCreateBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={[styles.backupButtonText, { fontSize: fontSize }]}>
                      Backup Now
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.settingsButton,
                    {
                      borderColor: theme.colors.primary,
                      minHeight: touchTargetSize,
                    },
                  ]}
                  onPress={onPress}
                >
                  <Text style={[styles.settingsButtonText, { color: theme.colors.primary, fontSize: fontSize }]}>
                    Settings
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Disabled State Message */}
        {!status?.isEnabled && (
          <View style={[styles.disabledMessage, { backgroundColor: theme.colors.warning + '20' }]}>
            <Text style={[styles.disabledText, { color: theme.colors.warning, fontSize: fontSize }]}>
              💡 Enable cloud backup to protect your precious memories
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statusSubtitle: {
    fontWeight: '500',
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  healthScore: {
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
  },
  details: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    flex: 1,
  },
  detailValue: {
    fontWeight: '500',
    textAlign: 'right',
  },
  storageContainer: {
    marginBottom: 16,
  },
  storageBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  storageFill: {
    height: '100%',
    borderRadius: 3,
  },
  actions: {
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButton: {
    width: '100%',
  },
  enableButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  enabledActions: {
    flexDirection: 'row',
    gap: 12,
  },
  backupButton: {
    flex: 1,
  },
  backupButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  settingsButton: {
    flex: 1,
    borderWidth: 2,
  },
  settingsButtonText: {
    fontWeight: '600',
  },
  disabledMessage: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  disabledText: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default BackupStatusCard;