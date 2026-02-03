/**
 * ShareMemoryModal Component for Memoria.ai
 * Modal for sharing memories via different methods
 * Optimized for elderly users with clear options and accessibility
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Share,
  ViewStyle,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Memory } from '../../types';
import { useSettingsStore } from '../../stores';
import AccessibleButton from '../accessibility/AccessibleButton';

interface ShareMemoryModalProps {
  visible: boolean;
  memory: Memory;
  onClose: () => void;
  style?: ViewStyle;
}

interface ShareOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action: () => Promise<void>;
  color: string;
}

const ShareMemoryModal: React.FC<ShareMemoryModalProps> = ({
  visible,
  memory,
  onClose,
  style,
}) => {
  const {
    getCurrentFontSize,
    getCurrentTouchTargetSize,
    shouldUseHighContrast,
    hapticFeedbackEnabled,
    language
  } = useSettingsStore();

  const [loading, setLoading] = useState<string | null>(null);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  const handleShareText = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading('text');

    try {
      const shareContent = `${memory.title}\n\n${memory.description || ''}\n\n${memory.transcription}\n\n${
        language === 'zh'
          ? `录制于: ${memory.createdAt.toLocaleDateString('zh-CN')}`
          : `Recorded on: ${memory.createdAt.toLocaleDateString('en-US')}`
      }`;

      await Share.share({
        message: shareContent,
        title: memory.title,
      });

      setLoading(null);
      onClose();
    } catch (error) {
      setLoading(null);
      Alert.alert(
        language === 'zh' ? '分享失败' : 'Share Failed',
        language === 'zh' ? '无法分享文本内容' : 'Unable to share text content'
      );
    }
  };

  const handleShareAudio = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading('audio');

    try {
      const fileInfo = await FileSystem.getInfoAsync(memory.audioFilePath);

      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(memory.audioFilePath, {
          mimeType: 'audio/mp4',
          dialogTitle: memory.title,
        });
      } else {
        // Fallback for platforms without native sharing
        Alert.alert(
          language === 'zh' ? '分享不可用' : 'Sharing Unavailable',
          language === 'zh'
            ? '此设备不支持音频文件分享'
            : 'Audio file sharing is not supported on this device'
        );
      }

      setLoading(null);
      onClose();
    } catch (error) {
      setLoading(null);
      Alert.alert(
        language === 'zh' ? '分享失败' : 'Share Failed',
        language === 'zh' ? '无法分享音频文件' : 'Unable to share audio file'
      );
    }
  };

  const handleSaveToGallery = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading('gallery');

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          language === 'zh' ? '权限被拒绝' : 'Permission Denied',
          language === 'zh'
            ? '需要相册权限来保存音频文件'
            : 'Gallery permission is required to save audio files'
        );
        setLoading(null);
        return;
      }

      const fileInfo = await FileSystem.getInfoAsync(memory.audioFilePath);

      if (!fileInfo.exists) {
        throw new Error('Audio file not found');
      }

      // Create a descriptive filename
      const date = memory.createdAt.toISOString().split('T')[0];
      const sanitizedTitle = memory.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
      const filename = `Memoria_${sanitizedTitle}_${date}.m4a`;

      // Copy file to a temporary location with proper name
      const tempPath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({
        from: memory.audioFilePath,
        to: tempPath,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(tempPath);

      // Clean up temp file
      await FileSystem.deleteAsync(tempPath, { idempotent: true });

      Alert.alert(
        language === 'zh' ? '保存成功' : 'Saved Successfully',
        language === 'zh'
          ? '音频文件已保存到相册'
          : 'Audio file has been saved to your gallery'
      );

      setLoading(null);
      onClose();
    } catch (error) {
      setLoading(null);
      Alert.alert(
        language === 'zh' ? '保存失败' : 'Save Failed',
        language === 'zh' ? '无法保存音频文件到相册' : 'Unable to save audio file to gallery'
      );
    }
  };

  const handleExportData = async () => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setLoading('export');

    try {
      // Create a comprehensive export of the memory
      const exportData = {
        title: memory.title,
        description: memory.description,
        transcription: memory.transcription,
        language: memory.language,
        duration: memory.duration,
        createdAt: memory.createdAt.toISOString(),
        updatedAt: memory.updatedAt.toISOString(),
        tags: memory.tags,
        isFavorite: memory.isFavorite,
        confidence: memory.confidence,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Memoria.ai',
      };

      const exportJson = JSON.stringify(exportData, null, 2);
      const exportText = `${memory.title}\n\n${
        language === 'zh' ? '描述:' : 'Description:'
      } ${memory.description || language === 'zh' ? '无' : 'None'}\n\n${
        language === 'zh' ? '转录:' : 'Transcription:'
      }\n${memory.transcription}\n\n${
        language === 'zh' ? '详细信息:' : 'Details:'
      }\n${
        language === 'zh' ? '录制时间:' : 'Recorded:'
      } ${memory.createdAt.toLocaleString()}\n${
        language === 'zh' ? '时长:' : 'Duration:'
      } ${Math.floor(memory.duration / 60)}:${(memory.duration % 60).toString().padStart(2, '0')}\n${
        language === 'zh' ? '语言:' : 'Language:'
      } ${memory.language.toUpperCase()}\n${
        language === 'zh' ? '标签:' : 'Tags:'
      } ${memory.tags.join(', ') || language === 'zh' ? '无' : 'None'}`;

      // Create temporary files
      const textFileName = `Memoria_${memory.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20)}_export.txt`;
      const jsonFileName = `Memoria_${memory.title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20)}_data.json`;

      const textPath = `${FileSystem.documentDirectory}${textFileName}`;
      const jsonPath = `${FileSystem.documentDirectory}${jsonFileName}`;

      await FileSystem.writeAsStringAsync(textPath, exportText);
      await FileSystem.writeAsStringAsync(jsonPath, exportJson);

      // Share the text file (more compatible)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(textPath, {
          mimeType: 'text/plain',
          dialogTitle: `${language === 'zh' ? '导出记忆:' : 'Export Memory:'} ${memory.title}`,
        });
      }

      // Clean up temp files
      await FileSystem.deleteAsync(textPath, { idempotent: true });
      await FileSystem.deleteAsync(jsonPath, { idempotent: true });

      setLoading(null);
      onClose();
    } catch (error) {
      setLoading(null);
      Alert.alert(
        language === 'zh' ? '导出失败' : 'Export Failed',
        language === 'zh' ? '无法导出记忆数据' : 'Unable to export memory data'
      );
    }
  };

  const shareOptions: ShareOption[] = [
    {
      id: 'text',
      title: language === 'zh' ? '分享文本' : 'Share Text',
      subtitle: language === 'zh' ? '分享转录和描述' : 'Share transcription and description',
      icon: 'document-text',
      action: handleShareText,
      color: '#2563eb',
    },
    {
      id: 'audio',
      title: language === 'zh' ? '分享音频' : 'Share Audio',
      subtitle: language === 'zh' ? '分享原始录音文件' : 'Share original audio recording',
      icon: 'musical-notes',
      action: handleShareAudio,
      color: '#7c3aed',
    },
    {
      id: 'gallery',
      title: language === 'zh' ? '保存到相册' : 'Save to Gallery',
      subtitle: language === 'zh' ? '将音频保存到设备相册' : 'Save audio to device gallery',
      icon: 'albums',
      action: handleSaveToGallery,
      color: '#059669',
    },
    {
      id: 'export',
      title: language === 'zh' ? '导出数据' : 'Export Data',
      subtitle: language === 'zh' ? '导出完整的记忆信息' : 'Export complete memory information',
      icon: 'cloud-download',
      action: handleExportData,
      color: '#dc2626',
    },
  ];

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

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 20,
      maxHeight: '80%',
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: highContrast ? '#666666' : '#d1d5db',
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
    },
    header: {
      paddingHorizontal: 24,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#444444' : '#e5e7eb',
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
      textAlign: 'center',
      marginBottom: 8,
    },
    memoryInfo: {
      backgroundColor: highContrast ? '#333333' : '#f8fafc',
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
    },
    memoryTitle: {
      fontSize: fontSize + 1,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    memoryMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaText: {
      fontSize: fontSize - 1,
      color: highContrast ? '#cccccc' : '#6b7280',
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 24,
    },
    shareOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: highContrast ? '#444444' : '#e5e7eb',
      minHeight: touchTargetSize + 20,
    },
    shareOptionPressed: {
      backgroundColor: highContrast ? '#444444' : '#f3f4f6',
      transform: [{ scale: 0.98 }],
    },
    shareOptionDisabled: {
      opacity: 0.5,
    },
    iconContainer: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: touchTargetSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    shareOptionContent: {
      flex: 1,
    },
    shareOptionTitle: {
      fontSize: fontSize + 1,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    shareOptionSubtitle: {
      fontSize: fontSize - 1,
      color: highContrast ? '#cccccc' : '#6b7280',
      lineHeight: (fontSize - 1) * 1.4,
    },
    loadingIndicator: {
      marginLeft: 12,
    },
    actionsContainer: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: highContrast ? '#444444' : '#e5e7eb',
    },
    disclaimer: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      fontStyle: 'italic',
      marginBottom: 16,
      lineHeight: (fontSize - 2) * 1.4,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={[styles.container, style]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {language === 'zh' ? '分享记忆' : 'Share Memory'}
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
            </View>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.scrollContent}>
              {shareOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.shareOption,
                    loading === option.id && styles.shareOptionDisabled,
                  ]}
                  onPress={option.action}
                  disabled={loading !== null}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={option.title}
                  accessibilityHint={option.subtitle}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                    <Ionicons
                      name={option.icon as any}
                      size={fontSize + 4}
                      color="#ffffff"
                    />
                  </View>

                  <View style={styles.shareOptionContent}>
                    <Text style={styles.shareOptionTitle}>{option.title}</Text>
                    <Text style={styles.shareOptionSubtitle}>{option.subtitle}</Text>
                  </View>

                  {loading === option.id && (
                    <View style={styles.loadingIndicator}>
                      <Ionicons
                        name="refresh"
                        size={fontSize + 2}
                        color={highContrast ? '#cccccc' : '#6b7280'}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            <Text style={styles.disclaimer}>
              {language === 'zh'
                ? '分享时请注意保护个人隐私信息'
                : 'Please protect personal privacy when sharing'}
            </Text>
            <AccessibleButton
              title={language === 'zh' ? '取消' : 'Cancel'}
              onPress={onClose}
              variant="secondary"
              disabled={loading !== null}
              accessibilityLabel={language === 'zh' ? '关闭分享选项' : 'Close sharing options'}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default ShareMemoryModal;