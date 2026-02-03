/**
 * Restore Memories Modal for Memoria.ai
 * Elderly-friendly restore process with clear step-by-step guidance
 * Includes preview, selection, and progress tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../stores/settingsStore';
import { cloudBackupService } from '../../services/cloudBackupService';
import {
  BackupListItem,
  RestoreProgress,
  CloudBackupResponse,
} from '../../types/cloudBackup';
import { Memory } from '../../types/memory';

const { width, height } = Dimensions.get('window');

interface RestoreMemoriesModalProps {
  visible: boolean;
  onClose: () => void;
  onRestoreComplete?: (restoredCount: number) => void;
}

interface RestoreStep {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
}

export const RestoreMemoriesModal: React.FC<RestoreMemoriesModalProps> = ({
  visible,
  onClose,
  onRestoreComplete,
}) => {
  const { theme, getCurrentFontSize, getCurrentTouchTargetSize } = useSettingsStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [availableBackups, setAvailableBackups] = useState<BackupListItem[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupListItem | null>(null);
  const [previewMemories, setPreviewMemories] = useState<Memory[]>([]);
  const [selectedMemories, setSelectedMemories] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();

  const steps: RestoreStep[] = [
    {
      id: 1,
      title: 'Choose Backup',
      description: 'Select which backup to restore from',
      isActive: currentStep === 1,
      isCompleted: currentStep > 1,
    },
    {
      id: 2,
      title: 'Preview Memories',
      description: 'See what memories will be restored',
      isActive: currentStep === 2,
      isCompleted: currentStep > 2,
    },
    {
      id: 3,
      title: 'Confirm & Restore',
      description: 'Start the restore process',
      isActive: currentStep === 3,
      isCompleted: currentStep > 3,
    },
    {
      id: 4,
      title: 'Complete',
      description: 'Restore finished successfully',
      isActive: currentStep === 4,
      isCompleted: false,
    },
  ];

  useEffect(() => {
    if (visible) {
      loadAvailableBackups();
      setCurrentStep(1);
      setSelectedBackup(null);
      setPreviewMemories([]);
      setSelectedMemories(new Set());
      setRestoreProgress(null);
      setIsRestoring(false);
    }
  }, [visible]);

  const loadAvailableBackups = async () => {
    try {
      setIsLoading(true);
      const response = await cloudBackupService.getBackupList();

      if (response.success && response.data) {
        setAvailableBackups(response.data.filter(backup => backup.canRestore));
      } else {
        Alert.alert(
          'Error',
          'Could not load your backups. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong while loading your backups. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBackup = (backup: BackupListItem) => {
    setSelectedBackup(backup);
    loadBackupPreview(backup);
  };

  const loadBackupPreview = async (backup: BackupListItem) => {
    try {
      setIsLoading(true);

      // In a real implementation, this would preview the backup contents
      // For now, we'll simulate with mock data
      const mockMemories: Memory[] = [
        {
          id: 'memory1',
          title: 'Wedding Anniversary Story',
          description: 'Our 50th wedding anniversary celebration...',
          audioFilePath: '/path/to/audio1.m4a',
          transcription: 'It was a beautiful day when we celebrated...',
          language: 'en',
          duration: 180000,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          tags: ['family', 'anniversary'],
          isArchived: false,
        },
        {
          id: 'memory2',
          title: 'Grandson\'s First Steps',
          description: 'The day little Tommy took his first steps...',
          audioFilePath: '/path/to/audio2.m4a',
          transcription: 'I remember it like it was yesterday...',
          language: 'en',
          duration: 120000,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10'),
          tags: ['family', 'grandchildren'],
          isArchived: false,
        },
      ];

      setPreviewMemories(mockMemories);
      // Select all memories by default for elderly users (simpler)
      setSelectedMemories(new Set(mockMemories.map(m => m.id)));
      setCurrentStep(2);
    } catch (error) {
      Alert.alert(
        'Error',
        'Could not preview this backup. Please try another backup.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmRestore = () => {
    if (!selectedBackup || selectedMemories.size === 0) return;

    Alert.alert(
      'Restore Memories?',
      `This will restore ${selectedMemories.size} ${selectedMemories.size === 1 ? 'memory' : 'memories'} from your backup.\n\nAny existing memories with the same names may be updated.\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => startRestore(),
        },
      ]
    );
  };

  const startRestore = async () => {
    if (!selectedBackup) return;

    try {
      setIsRestoring(true);
      setCurrentStep(3);

      const response = await cloudBackupService.restoreFromBackup(
        selectedBackup.backupId,
        (progress) => {
          setRestoreProgress(progress);
        }
      );

      if (response.success) {
        setCurrentStep(4);
        setRestoreProgress({
          restoreId: 'completed',
          status: 'completed',
          progress: 100,
          currentStep: 'Restore completed successfully!',
          memoriesRestored: selectedMemories.size,
          totalMemories: selectedMemories.size,
        });

        // Notify parent component
        onRestoreComplete?.(selectedMemories.size);

        // Auto-close after a delay
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        Alert.alert(
          'Restore Failed',
          response.error || 'The restore process failed. Please try again.',
          [{ text: 'OK' }]
        );
        setCurrentStep(2); // Go back to preview step
      }
    } catch (error) {
      Alert.alert(
        'Restore Failed',
        'Something went wrong during the restore process. Please try again.',
        [{ text: 'OK' }]
      );
      setCurrentStep(2);
    } finally {
      setIsRestoring(false);
    }
  };

  const toggleMemorySelection = (memoryId: string) => {
    const newSelection = new Set(selectedMemories);
    if (newSelection.has(memoryId)) {
      newSelection.delete(memoryId);
    } else {
      newSelection.add(memoryId);
    }
    setSelectedMemories(newSelection);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor: step.isCompleted
                  ? theme.colors.success
                  : step.isActive
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                {
                  color: step.isActive || step.isCompleted ? 'white' : theme.colors.textSecondary,
                  fontSize: fontSize,
                },
              ]}
            >
              {step.isCompleted ? '✓' : step.id}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepLine,
                {
                  backgroundColor: step.isCompleted ? theme.colors.success : theme.colors.border,
                },
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderBackupSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
        Choose a Backup to Restore
      </Text>
      <Text style={[styles.stepDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
        Select which backup contains the memories you want to restore:
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text, fontSize: fontSize }]}>
            Loading your backups...
          </Text>
        </View>
      ) : availableBackups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary, fontSize: fontSize + 2 }]}>
            No backups available to restore from.
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
            Create a backup first to use the restore feature.
          </Text>
        </View>
      ) : (
        <FlatList
          data={availableBackups}
          keyExtractor={(item) => item.backupId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.backupItem,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  minHeight: touchTargetSize * 1.5,
                },
              ]}
              onPress={() => handleSelectBackup(item)}
            >
              <View style={styles.backupInfo}>
                <Text style={[styles.backupName, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                  {item.displayName}
                </Text>
                <Text style={[styles.backupDate, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Created: {formatDate(item.createdAt)}
                </Text>
                <View style={styles.backupStats}>
                  <Text style={[styles.backupStat, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    {item.memoryCount} memories • {formatSize(item.size)}
                  </Text>
                  {item.isAutomatic && (
                    <View style={[styles.automaticBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Text style={[styles.automaticText, { color: theme.colors.primary, fontSize: fontSize - 2 }]}>
                        AUTO
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.backupArrow, { color: theme.colors.primary, fontSize: fontSize + 4 }]}>
                →
              </Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderMemoryPreview = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
        Preview Memories
      </Text>
      <Text style={[styles.stepDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
        These memories will be restored from your backup:
      </Text>

      <View style={[styles.selectionSummary, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.selectionText, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
          Selected: {selectedMemories.size} of {previewMemories.length} memories
        </Text>
        <TouchableOpacity
          style={[styles.selectAllButton, { minHeight: touchTargetSize }]}
          onPress={() => {
            if (selectedMemories.size === previewMemories.length) {
              setSelectedMemories(new Set());
            } else {
              setSelectedMemories(new Set(previewMemories.map(m => m.id)));
            }
          }}
        >
          <Text style={[styles.selectAllText, { color: theme.colors.primary, fontSize: fontSize }]}>
            {selectedMemories.size === previewMemories.length ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={previewMemories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.memoryItem,
              {
                backgroundColor: selectedMemories.has(item.id)
                  ? theme.colors.primary + '10'
                  : theme.colors.surface,
                borderColor: selectedMemories.has(item.id)
                  ? theme.colors.primary
                  : theme.colors.border,
                minHeight: touchTargetSize * 1.2,
              },
            ]}
            onPress={() => toggleMemorySelection(item.id)}
          >
            <View style={styles.memoryInfo}>
              <Text style={[styles.memoryTitle, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
                {item.title}
              </Text>
              <Text
                style={[styles.memoryDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <View style={styles.memoryMeta}>
                <Text style={[styles.memoryDate, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
                  {formatDate(item.createdAt)}
                </Text>
                <Text style={[styles.memoryDuration, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
                  {formatDuration(item.duration)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.memoryCheckbox,
                {
                  backgroundColor: selectedMemories.has(item.id)
                    ? theme.colors.primary
                    : 'transparent',
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              {selectedMemories.has(item.id) && (
                <Text style={[styles.checkboxCheck, { color: 'white', fontSize: fontSize }]}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.previewActions}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              minHeight: touchTargetSize,
            },
          ]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.text, fontSize: fontSize }]}>
            ← Back
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.continueButton,
            {
              backgroundColor: selectedMemories.size > 0 ? theme.colors.primary : theme.colors.border,
              minHeight: touchTargetSize,
            },
          ]}
          onPress={handleConfirmRestore}
          disabled={selectedMemories.size === 0}
        >
          <Text style={[styles.continueButtonText, { color: 'white', fontSize: fontSize }]}>
            Restore {selectedMemories.size} Memories
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRestoreProgress = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
        {restoreProgress?.status === 'completed' ? 'Restore Complete!' : 'Restoring Memories'}
      </Text>

      {restoreProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.colors.primary,
                  width: `${restoreProgress.progress}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.progressText, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
            {restoreProgress.progress}%
          </Text>

          <Text style={[styles.progressStep, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
            {restoreProgress.currentStep}
          </Text>

          {restoreProgress.memoriesRestored > 0 && (
            <Text style={[styles.progressDetails, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              Restored: {restoreProgress.memoriesRestored} of {restoreProgress.totalMemories} memories
            </Text>
          )}

          {restoreProgress.status === 'completed' && (
            <View style={styles.completionMessage}>
              <Text style={[styles.completionText, { color: theme.colors.success, fontSize: fontSize + 2 }]}>
                ✓ Successfully restored {restoreProgress.memoriesRestored} memories!
              </Text>
              <Text style={[styles.completionSubtext, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                Your memories are now available in the app.
              </Text>
            </View>
          )}
        </View>
      )}

      {restoreProgress?.status !== 'completed' && (
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={styles.progressSpinner}
        />
      )}
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBackupSelection();
      case 2:
        return renderMemoryPreview();
      case 3:
      case 4:
        return renderRestoreProgress();
      default:
        return renderBackupSelection();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={onClose}
            disabled={isRestoring}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
              {currentStep === 4 ? 'Done' : '✕'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: fontSize + 6 }]}>
            Restore Memories
          </Text>
          <View style={{ width: touchTargetSize }} />
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentStep()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontWeight: 'bold',
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  backupInfo: {
    flex: 1,
  },
  backupName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  backupDate: {
    marginBottom: 8,
  },
  backupStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backupStat: {},
  automaticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 12,
  },
  automaticText: {
    fontWeight: 'bold',
  },
  backupArrow: {
    fontWeight: 'bold',
    marginLeft: 16,
  },
  selectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectionText: {
    fontWeight: '600',
  },
  selectAllButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  selectAllText: {
    fontWeight: '600',
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memoryDescription: {
    marginBottom: 8,
    lineHeight: 20,
  },
  memoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  memoryDate: {},
  memoryDuration: {},
  memoryCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  checkboxCheck: {
    fontWeight: 'bold',
  },
  previewActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  backButtonText: {
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },
  continueButtonText: {
    fontWeight: 'bold',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  progressStep: {
    textAlign: 'center',
    marginBottom: 8,
  },
  progressDetails: {
    textAlign: 'center',
    marginBottom: 16,
  },
  progressSpinner: {
    marginTop: 24,
  },
  completionMessage: {
    alignItems: 'center',
    marginTop: 16,
  },
  completionText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  completionSubtext: {
    textAlign: 'center',
  },
});

export default RestoreMemoriesModal;