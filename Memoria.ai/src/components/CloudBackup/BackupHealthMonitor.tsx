/**
 * Backup Health Monitor Component for Memoria.ai
 * Provides health status, cost transparency, and backup recommendations
 * Designed for elderly users with clear visual indicators and simple explanations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../stores/settingsStore';
import { cloudBackupService } from '../../services/cloudBackupService';
import {
  CloudBackupStatus,
  BackupCost,
  CloudProvider,
  CloudBackupResponse,
} from '../../types/cloudBackup';

const { width } = Dimensions.get('window');

interface BackupHealthMonitorProps {
  visible: boolean;
  onClose: () => void;
  onCreateBackup?: () => void;
  onUpgradeStorage?: () => void;
}

interface HealthMetric {
  id: string;
  title: string;
  value: string;
  status: 'good' | 'warning' | 'error';
  description: string;
  action?: {
    title: string;
    onPress: () => void;
  };
}

interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export const BackupHealthMonitor: React.FC<BackupHealthMonitorProps> = ({
  visible,
  onClose,
  onCreateBackup,
  onUpgradeStorage,
}) => {
  const { theme, getCurrentFontSize, getCurrentTouchTargetSize } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState<CloudBackupStatus | null>(null);
  const [backupCost, setBackupCost] = useState<BackupCost | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();

  useEffect(() => {
    if (visible) {
      loadBackupHealth();
    }
  }, [visible]);

  const loadBackupHealth = async () => {
    try {
      setIsLoading(true);

      // Load backup status
      const statusResponse = await cloudBackupService.getBackupStatus();
      if (statusResponse.success && statusResponse.data) {
        setBackupStatus(statusResponse.data);
      }

      // Load backup health
      const healthResponse = await cloudBackupService.getBackupHealth();
      if (healthResponse.success && healthResponse.data) {
        setOverallScore(healthResponse.data.score);
        setHealthMetrics(generateHealthMetrics(statusResponse.data, healthResponse.data));
      }

      // Mock cost data
      const mockCost: BackupCost = {
        storageUsed: 0.5, // GB
        currentTier: 'Free',
        monthlyCharge: 0,
        currency: 'USD',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        storageBreakdown: {
          memories: 0.3,
          audioFiles: 0.15,
          metadata: 0.03,
          overhead: 0.02,
        },
      };
      setBackupCost(mockCost);
    } catch (error) {
      Alert.alert('Error', 'Failed to load backup health information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateHealthMetrics = (
    status: CloudBackupStatus | null,
    healthData: { score: number; issues: string[]; recommendations: string[] }
  ): HealthMetric[] => {
    const metrics: HealthMetric[] = [];

    // Backup Status
    if (status) {
      metrics.push({
        id: 'backup_enabled',
        title: 'Backup Protection',
        value: status.isEnabled ? 'Active' : 'Disabled',
        status: status.isEnabled ? 'good' : 'error',
        description: status.isEnabled
          ? 'Your memories are being backed up safely'
          : 'Your memories are not protected by cloud backup',
        action: !status.isEnabled
          ? {
              title: 'Enable Backup',
              onPress: () => onCreateBackup?.(),
            }
          : undefined,
      });

      // Last Backup
      const daysSinceLastBackup = status.lastBackupTime
        ? Math.floor((Date.now() - status.lastBackupTime.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      metrics.push({
        id: 'last_backup',
        title: 'Last Backup',
        value: daysSinceLastBackup === null
          ? 'Never'
          : daysSinceLastBackup === 0
          ? 'Today'
          : daysSinceLastBackup === 1
          ? 'Yesterday'
          : `${daysSinceLastBackup} days ago`,
        status: daysSinceLastBackup === null
          ? 'error'
          : daysSinceLastBackup <= 7
          ? 'good'
          : 'warning',
        description: daysSinceLastBackup === null
          ? 'No backups have been created yet'
          : daysSinceLastBackup <= 7
          ? 'Your backup is recent and up to date'
          : 'Your backup might be outdated',
        action: daysSinceLastBackup === null || daysSinceLastBackup > 7
          ? {
              title: 'Create Backup Now',
              onPress: () => onCreateBackup?.(),
            }
          : undefined,
      });

      // Storage Usage
      const usagePercent = (status.storageUsed / status.storageLimit) * 100;
      metrics.push({
        id: 'storage_usage',
        title: 'Storage Usage',
        value: `${Math.round(usagePercent)}%`,
        status: usagePercent >= 90 ? 'error' : usagePercent >= 75 ? 'warning' : 'good',
        description: usagePercent >= 90
          ? 'Storage is almost full. Consider upgrading.'
          : usagePercent >= 75
          ? 'Storage is getting full but still has space.'
          : 'Plenty of storage space available.',
        action: usagePercent >= 75
          ? {
              title: 'Upgrade Storage',
              onPress: () => onUpgradeStorage?.(),
            }
          : undefined,
      });

      // Backup Count
      metrics.push({
        id: 'backup_count',
        title: 'Total Backups',
        value: status.totalBackups.toString(),
        status: status.totalBackups >= 1 ? 'good' : 'warning',
        description: status.totalBackups >= 1
          ? 'Multiple backup versions available for recovery'
          : 'Only one backup version available',
      });
    }

    return metrics;
  };

  const getHealthColor = (status: HealthMetric['status']): string => {
    switch (status) {
      case 'good':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getHealthIcon = (status: HealthMetric['status']): string => {
    switch (status) {
      case 'good':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return '?';
    }
  };

  const getOverallHealthMessage = (): { message: string; color: string } => {
    if (overallScore >= 90) {
      return {
        message: 'Excellent! Your backup system is working perfectly.',
        color: theme.colors.success,
      };
    } else if (overallScore >= 70) {
      return {
        message: 'Good backup health with minor recommendations.',
        color: theme.colors.warning,
      };
    } else {
      return {
        message: 'Your backup needs attention to protect your memories.',
        color: theme.colors.error,
      };
    }
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatBytes = (gb: number): string => {
    if (gb < 1) {
      return `${Math.round(gb * 1024)} MB`;
    }
    return `${gb.toFixed(1)} GB`;
  };

  const getCostBreakdown = (): CostBreakdown[] => {
    if (!backupCost) return [];

    const total = Object.values(backupCost.storageBreakdown).reduce((sum, value) => sum + value, 0);

    return [
      {
        category: 'Voice Memories',
        amount: backupCost.storageBreakdown.memories,
        percentage: (backupCost.storageBreakdown.memories / total) * 100,
        color: theme.colors.primary,
      },
      {
        category: 'Audio Files',
        amount: backupCost.storageBreakdown.audioFiles,
        percentage: (backupCost.storageBreakdown.audioFiles / total) * 100,
        color: theme.colors.secondary || theme.colors.primary + '80',
      },
      {
        category: 'Information',
        amount: backupCost.storageBreakdown.metadata,
        percentage: (backupCost.storageBreakdown.metadata / total) * 100,
        color: theme.colors.tertiary || theme.colors.primary + '60',
      },
      {
        category: 'System Data',
        amount: backupCost.storageBreakdown.overhead,
        percentage: (backupCost.storageBreakdown.overhead / total) * 100,
        color: theme.colors.textSecondary,
      },
    ];
  };

  const renderHealthScore = () => {
    const healthMessage = getOverallHealthMessage();

    return (
      <View style={[styles.healthScoreCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.scoreContainer}>
          <View
            style={[
              styles.scoreCircle,
              {
                borderColor: healthMessage.color,
                backgroundColor: healthMessage.color + '20',
              },
            ]}
          >
            <Text style={[styles.scoreText, { color: healthMessage.color, fontSize: fontSize + 8 }]}>
              {overallScore}
            </Text>
            <Text style={[styles.scoreLabel, { color: healthMessage.color, fontSize: fontSize }]}>
              HEALTH
            </Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              Backup Health Score
            </Text>
            <Text style={[styles.scoreMessage, { color: healthMessage.color, fontSize: fontSize + 1 }]}>
              {healthMessage.message}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHealthMetrics = () => (
    <View style={styles.metricsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
        Health Details
      </Text>
      {healthMetrics.map((metric) => (
        <View
          key={metric.id}
          style={[styles.metricCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <View style={styles.metricHeader}>
            <View style={styles.metricInfo}>
              <View style={styles.metricTitleRow}>
                <Text
                  style={[
                    styles.metricIcon,
                    { color: getHealthColor(metric.status), fontSize: fontSize + 2 },
                  ]}
                >
                  {getHealthIcon(metric.status)}
                </Text>
                <Text style={[styles.metricTitle, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                  {metric.title}
                </Text>
              </View>
              <Text style={[styles.metricValue, { color: getHealthColor(metric.status), fontSize: fontSize + 1 }]}>
                {metric.value}
              </Text>
              <Text style={[styles.metricDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                {metric.description}
              </Text>
            </View>
            {metric.action && (
              <TouchableOpacity
                style={[
                  styles.metricAction,
                  {
                    backgroundColor: theme.colors.primary,
                    minHeight: touchTargetSize * 0.7,
                  },
                ]}
                onPress={metric.action.onPress}
              >
                <Text style={[styles.metricActionText, { color: 'white', fontSize: fontSize }]}>
                  {metric.action.title}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
    </View>
  );

  const renderCostOverview = () => {
    if (!backupCost) return null;

    return (
      <View style={styles.costContainer}>
        <View style={styles.costHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
            Storage & Costs
          </Text>
          <TouchableOpacity
            style={[styles.detailsButton, { minHeight: touchTargetSize }]}
            onPress={() => setShowCostBreakdown(true)}
          >
            <Text style={[styles.detailsButtonText, { color: theme.colors.primary, fontSize: fontSize }]}>
              View Details →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.costCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.costSummary}>
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Current Plan
              </Text>
              <Text style={[styles.costValue, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                {backupCost.currentTier}
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Monthly Cost
              </Text>
              <Text style={[styles.costValue, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                {formatCurrency(backupCost.monthlyCharge, backupCost.currency)}
              </Text>
            </View>
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Storage Used
              </Text>
              <Text style={[styles.costValue, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                {formatBytes(backupCost.storageUsed)}
              </Text>
            </View>
          </View>

          {backupCost.monthlyCharge === 0 && (
            <View style={[styles.freeNotice, { backgroundColor: theme.colors.success + '20' }]}>
              <Text style={[styles.freeNoticeText, { color: theme.colors.success, fontSize: fontSize }]}>
                🎉 You're on the free plan! Your memories are safely backed up at no cost.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderCostBreakdownModal = () => {
    const breakdown = getCostBreakdown();

    return (
      <Modal
        visible={showCostBreakdown}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCostBreakdown(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity
              style={[styles.modalCloseButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
              onPress={() => setShowCostBreakdown(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
                Done
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              Storage Breakdown
            </Text>
            <View style={{ width: touchTargetSize }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {backupCost && (
              <>
                <View style={[styles.totalUsageCard, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.totalUsageTitle, { color: theme.colors.text, fontSize: fontSize + 3 }]}>
                    Total Storage Used
                  </Text>
                  <Text style={[styles.totalUsageValue, { color: theme.colors.primary, fontSize: fontSize + 6 }]}>
                    {formatBytes(backupCost.storageUsed)}
                  </Text>
                </View>

                <Text style={[styles.breakdownTitle, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                  What's Using Your Storage:
                </Text>

                {breakdown.map((item, index) => (
                  <View
                    key={index}
                    style={[styles.breakdownItem, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  >
                    <View style={styles.breakdownInfo}>
                      <View style={styles.breakdownHeader}>
                        <View style={[styles.breakdownColor, { backgroundColor: item.color }]} />
                        <Text style={[styles.breakdownCategory, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
                          {item.category}
                        </Text>
                      </View>
                      <Text style={[styles.breakdownAmount, { color: theme.colors.primary, fontSize: fontSize + 1 }]}>
                        {formatBytes(item.amount)}
                      </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            backgroundColor: item.color,
                            width: `${Math.max(item.percentage, 2)}%`, // Minimum 2% for visibility
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.breakdownPercentage, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                ))}

                <View style={[styles.costExplanation, { backgroundColor: theme.colors.surface }]}>
                  <Text style={[styles.explanationTitle, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
                    💡 Understanding Your Storage
                  </Text>
                  <Text style={[styles.explanationText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    • Voice Memories: Your recorded audio stories{'\n'}
                    • Audio Files: The actual sound files{'\n'}
                    • Information: Titles, dates, and descriptions{'\n'}
                    • System Data: Backup and security information
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
              Checking backup health...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
              Done
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: fontSize + 6 }]}>
            Backup Health
          </Text>
          <View style={{ width: touchTargetSize }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderHealthScore()}
          {renderHealthMetrics()}
          {renderCostOverview()}
        </ScrollView>

        {renderCostBreakdownModal()}
      </SafeAreaView>
    </Modal>
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
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  healthScoreCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  scoreText: {
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontWeight: '600',
    marginTop: 4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scoreMessage: {
    lineHeight: 22,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metricInfo: {
    flex: 1,
    marginRight: 16,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  metricTitle: {
    fontWeight: 'bold',
  },
  metricValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricDescription: {
    lineHeight: 20,
  },
  metricAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricActionText: {
    fontWeight: '600',
  },
  costContainer: {
    marginBottom: 24,
  },
  costHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  detailsButtonText: {
    fontWeight: '600',
  },
  costCard: {
    padding: 16,
    borderRadius: 12,
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costItem: {
    alignItems: 'center',
    flex: 1,
  },
  costLabel: {
    marginBottom: 4,
  },
  costValue: {
    fontWeight: 'bold',
  },
  freeNotice: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  freeNoticeText: {
    textAlign: 'center',
    fontWeight: '600',
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
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontWeight: 'bold',
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  totalUsageCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  totalUsageTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  totalUsageValue: {
    fontWeight: 'bold',
  },
  breakdownTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  breakdownItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  breakdownCategory: {
    fontWeight: '600',
  },
  breakdownAmount: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  breakdownPercentage: {
    textAlign: 'right',
  },
  costExplanation: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  explanationTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  explanationText: {
    lineHeight: 22,
  },
});

export default BackupHealthMonitor;