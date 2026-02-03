/**
 * DeleteConfirmationModal Component for Memoria.ai
 * Modal for confirming memory deletion with clear warnings
 * Optimized for elderly users with large text and clear buttons
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Memory } from '../../types';
import { useSettingsStore } from '../../stores';
import AccessibleButton from '../accessibility/AccessibleButton';

interface DeleteConfirmationModalProps {
  visible: boolean;
  memory: Memory;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  memory,
  onConfirm,
  onCancel,
  loading = false,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(0)).current;

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  useEffect(() => {
    if (visible) {
      // Animate modal entrance
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Trigger haptic feedback for serious action
      if (hapticFeedbackEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } else {
      scaleAnimation.setValue(0);
    }
  }, [visible, hapticFeedbackEnabled]);

  const handleConfirm = async () => {
    // Add shake animation to emphasize the serious nature
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();

    if (hapticFeedbackEnabled) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Double confirmation for important memories
    if (memory.isFavorite || memory.duration > 300) { // 5+ minutes
      Alert.alert(
        language === 'zh' ? '最终确认' : 'Final Confirmation',
        language === 'zh'
          ? '这是一个重要的记忆。删除后无法恢复。您确定要继续吗？'
          : 'This is an important memory. Once deleted, it cannot be recovered. Are you sure you want to continue?',
        [
          {
            text: language === 'zh' ? '取消' : 'Cancel',
            style: 'cancel',
          },
          {
            text: language === 'zh' ? '永久删除' : 'Delete Permanently',
            style: 'destructive',
            onPress: onConfirm,
          },
        ]
      );
    } else {
      onConfirm();
    }
  };

  const handleCancel = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onCancel();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const isImportantMemory = memory.isFavorite || memory.duration > 300;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    container: {
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      borderRadius: 20,
      paddingVertical: 32,
      paddingHorizontal: 24,
      maxWidth: 400,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 16,
      borderWidth: isImportantMemory ? 3 : 0,
      borderColor: '#dc2626',
    },
    warningIcon: {
      alignSelf: 'center',
      width: touchTargetSize + 10,
      height: touchTargetSize + 10,
      borderRadius: (touchTargetSize + 10) / 2,
      backgroundColor: '#dc2626',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: fontSize + 6,
      fontWeight: 'bold',
      color: '#dc2626',
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: (fontSize + 6) * 1.2,
    },
    message: {
      fontSize: fontSize + 1,
      color: highContrast ? '#ffffff' : '#374151',
      textAlign: 'center',
      lineHeight: (fontSize + 1) * 1.5,
      marginBottom: 24,
      fontWeight: '500',
    },
    memoryInfo: {
      backgroundColor: highContrast ? '#333333' : '#f8fafc',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: highContrast ? '#444444' : '#e5e7eb',
    },
    memoryTitle: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 8,
      textAlign: 'center',
    },
    memoryMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metaText: {
      fontSize: fontSize - 1,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '500',
    },
    favoriteIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 8,
    },
    favoriteText: {
      fontSize: fontSize,
      color: '#fbbf24',
      fontWeight: '600',
    },
    warningText: {
      fontSize: fontSize,
      color: '#dc2626',
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 24,
      lineHeight: fontSize * 1.4,
    },
    consequencesContainer: {
      backgroundColor: '#fef2f2',
      borderRadius: 8,
      padding: 16,
      marginBottom: 24,
      borderLeftWidth: 4,
      borderLeftColor: '#dc2626',
    },
    consequencesTitle: {
      fontSize: fontSize + 1,
      fontWeight: '600',
      color: '#dc2626',
      marginBottom: 8,
    },
    consequenceItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
      gap: 8,
    },
    bulletPoint: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#dc2626',
      marginTop: (fontSize - 2) / 2,
    },
    consequenceText: {
      flex: 1,
      fontSize: fontSize - 2,
      color: '#991b1b',
      lineHeight: (fontSize - 2) * 1.4,
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    deleteButton: {
      flex: 1,
      backgroundColor: '#dc2626',
    },
    safetyNotice: {
      backgroundColor: '#fff7ed',
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#fed7aa',
    },
    safetyText: {
      fontSize: fontSize - 2,
      color: '#c2410c',
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: (fontSize - 2) * 1.4,
    },
  });

  const consequences = [
    language === 'zh' ? '音频文件将被永久删除' : 'Audio file will be permanently deleted',
    language === 'zh' ? '转录文本将丢失' : 'Transcription text will be lost',
    language === 'zh' ? '无法撤销此操作' : 'This action cannot be undone',
    language === 'zh' ? '记忆将从所有设备中移除' : 'Memory will be removed from all devices',
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleCancel}
      >
        <Animated.View
          style={[
            { transform: [{ scale: scaleAnimation }, { translateX: shakeAnimation }] }
          ]}
        >
          <TouchableOpacity
            style={[styles.container, style]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Warning Icon */}
            <View style={styles.warningIcon}>
              <Ionicons
                name="warning"
                size={fontSize + 8}
                color="#ffffff"
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {language === 'zh' ? '删除记忆' : 'Delete Memory'}
            </Text>

            {/* Message */}
            <Text style={styles.message}>
              {language === 'zh'
                ? '您确定要删除这个记忆吗？'
                : 'Are you sure you want to delete this memory?'}
            </Text>

            {/* Memory Info */}
            <View style={styles.memoryInfo}>
              <Text style={styles.memoryTitle} numberOfLines={2}>
                {memory.title}
              </Text>

              <View style={styles.memoryMeta}>
                <Text style={styles.metaText}>
                  {formatDate(memory.createdAt)}
                </Text>
                <Text style={styles.metaText}>
                  {formatDuration(memory.duration)}
                </Text>
              </View>

              {memory.isFavorite && (
                <View style={styles.favoriteIndicator}>
                  <Ionicons name="star" size={fontSize} color="#fbbf24" />
                  <Text style={styles.favoriteText}>
                    {language === 'zh' ? '收藏的记忆' : 'Favorite Memory'}
                  </Text>
                </View>
              )}
            </View>

            {/* Important memory warning */}
            {isImportantMemory && (
              <Text style={styles.warningText}>
                {language === 'zh'
                  ? '⚠️ 这是一个重要记忆（收藏或超过5分钟）'
                  : '⚠️ This is an important memory (favorited or over 5 minutes)'}
              </Text>
            )}

            {/* Consequences */}
            <View style={styles.consequencesContainer}>
              <Text style={styles.consequencesTitle}>
                {language === 'zh' ? '删除后果：' : 'Consequences of deletion:'}
              </Text>
              {consequences.map((consequence, index) => (
                <View key={index} style={styles.consequenceItem}>
                  <View style={styles.bulletPoint} />
                  <Text style={styles.consequenceText}>{consequence}</Text>
                </View>
              ))}
            </View>

            {/* Safety Notice */}
            <View style={styles.safetyNotice}>
              <Text style={styles.safetyText}>
                {language === 'zh'
                  ? '建议：导出重要记忆作为备份'
                  : 'Recommendation: Export important memories as backup'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <AccessibleButton
                title={language === 'zh' ? '取消' : 'Cancel'}
                onPress={handleCancel}
                variant="secondary"
                style={styles.cancelButton}
                disabled={loading}
                accessibilityLabel={language === 'zh' ? '取消删除' : 'Cancel deletion'}
              />
              <AccessibleButton
                title={language === 'zh' ? '删除' : 'Delete'}
                onPress={handleConfirm}
                variant="destructive"
                style={styles.deleteButton}
                disabled={loading}
                loading={loading}
                accessibilityLabel={language === 'zh' ? '确认删除记忆' : 'Confirm delete memory'}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export default DeleteConfirmationModal;