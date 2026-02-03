/**
 * Transcription Editor for Memoria.ai
 * Allows elderly users to edit and export transcriptions with accessibility features
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  AccessibilityInfo,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';

import {
  TranscriptionResult,
  TranscriptionExportOptions,
  ElderlyTranscriptionSettings,
  ChineseLanguageSupport
} from '../../types';

interface TranscriptionEditorProps {
  transcription: TranscriptionResult;
  elderlySettings: ElderlyTranscriptionSettings;
  chineseSupport: ChineseLanguageSupport;
  onSave: (editedText: string) => void;
  onCancel: () => void;
  onExport: (text: string, options: TranscriptionExportOptions) => void;
  fontSize: number;
  highContrast: boolean;
  hapticEnabled: boolean;
  readonly?: boolean;
}

const TranscriptionEditor: React.FC<TranscriptionEditorProps> = ({
  transcription,
  elderlySettings,
  chineseSupport,
  onSave,
  onCancel,
  onExport,
  fontSize,
  highContrast,
  hapticEnabled,
  readonly = false,
}) => {
  const [editedText, setEditedText] = useState(transcription.text);
  const [hasChanges, setHasChanges] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const textInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate word count
  useEffect(() => {
    const words = editedText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [editedText]);

  // Handle haptic feedback
  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Handle text changes
  const handleTextChange = useCallback((text: string) => {
    setEditedText(text);
    setHasChanges(text !== transcription.text);
  }, [transcription.text]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!hasChanges) {
      onCancel();
      return;
    }

    triggerHaptic();

    if (elderlySettings.simplifiedControls) {
      Alert.alert(
        'Save Changes',
        'Do you want to save your edits to the transcription?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Save',
            style: 'default',
            onPress: () => {
              onSave(editedText);
              AccessibilityInfo.announceForAccessibility('Transcription saved');
            }
          }
        ]
      );
    } else {
      onSave(editedText);
      AccessibilityInfo.announceForAccessibility('Transcription saved');
    }
  }, [editedText, hasChanges, onSave, onCancel, triggerHaptic, elderlySettings.simplifiedControls]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (hasChanges && elderlySettings.simplifiedControls) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: onCancel
          }
        ]
      );
    } else {
      onCancel();
    }
  }, [hasChanges, onCancel, elderlySettings.simplifiedControls]);

  // Handle export
  const handleExport = useCallback(async (format: 'txt' | 'pdf' | 'json') => {
    try {
      setIsExporting(true);
      triggerHaptic();

      const exportOptions: TranscriptionExportOptions = {
        format,
        includeTimestamps: transcription.segments && transcription.segments.length > 0,
        includeConfidence: transcription.confidence > 0,
        includeLanguageMarkers: transcription.language === 'zh' || transcription.hasCodeSwitching,
        fontSize: elderlySettings.largeTextMode ? 16 : 14,
        includeMetadata: true,
      };

      // Call the export handler
      onExport(editedText, exportOptions);

      // For demonstration, also handle sharing
      if (format === 'txt') {
        await Share.share({
          message: editedText,
          title: 'Memory Transcription',
        });
      }

      AccessibilityInfo.announceForAccessibility(`Transcription exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed',
        'Could not export transcription. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsExporting(false);
      setShowExportOptions(false);
    }
  }, [editedText, transcription, elderlySettings, onExport, triggerHaptic]);

  // Toggle export options
  const toggleExportOptions = useCallback(() => {
    triggerHaptic();
    setShowExportOptions(!showExportOptions);
  }, [showExportOptions, triggerHaptic]);

  // Clear text (for elderly users who might want to start over)
  const handleClearText = useCallback(() => {
    if (elderlySettings.simplifiedControls) {
      Alert.alert(
        'Clear Text',
        'This will remove all text. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: () => {
              setEditedText('');
              setHasChanges(true);
              AccessibilityInfo.announceForAccessibility('Text cleared');
            }
          }
        ]
      );
    } else {
      setEditedText('');
      setHasChanges(true);
      AccessibilityInfo.announceForAccessibility('Text cleared');
    }
  }, [elderlySettings.simplifiedControls]);

  // Auto-resize text input for Chinese text
  const getTextAlignStyle = useCallback(() => {
    return transcription.language === 'zh' ? 'left' : 'left';
  }, [transcription.language]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#ffffff',
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#333333' : '#e5e7eb',
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: '700',
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    confidenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    confidenceText: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginRight: 8,
    },
    confidenceBadge: {
      backgroundColor: transcription.confidence >= 0.8 ? '#10b981' :
                      transcription.confidence >= 0.6 ? '#f59e0b' : '#ef4444',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    confidenceBadgeText: {
      fontSize: fontSize - 6,
      color: '#ffffff',
      fontWeight: '600',
    },
    editorContainer: {
      flex: 1,
      marginBottom: 16,
    },
    textInput: {
      flex: 1,
      fontSize: fontSize,
      lineHeight: fontSize * 1.5,
      color: highContrast ? '#ffffff' : '#1f2937',
      backgroundColor: highContrast ? '#1a1a1a' : '#f9fafb',
      borderWidth: 2,
      borderColor: highContrast ? '#333333' : '#d1d5db',
      borderRadius: 12,
      padding: 16,
      textAlignVertical: 'top',
      fontFamily: transcription.language === 'zh' ? 'PingFang SC' : 'System',
      textAlign: getTextAlignStyle(),
      minHeight: 200,
    },
    textInputFocused: {
      borderColor: '#2563eb',
    },
    textInputReadonly: {
      backgroundColor: highContrast ? '#0a0a0a' : '#f3f4f6',
      borderColor: highContrast ? '#262626' : '#9ca3af',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      paddingHorizontal: 4,
    },
    statText: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#6b7280',
    },
    languageIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageFlag: {
      fontSize: fontSize - 2,
      marginRight: 4,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: '#2563eb',
    },
    secondaryButton: {
      backgroundColor: highContrast ? '#333333' : '#f3f4f6',
      borderWidth: 1,
      borderColor: highContrast ? '#555555' : '#d1d5db',
    },
    dangerButton: {
      backgroundColor: '#ef4444',
    },
    disabledButton: {
      backgroundColor: '#9ca3af',
      opacity: 0.6,
    },
    buttonText: {
      fontSize: fontSize - 2,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: '#ffffff',
    },
    secondaryButtonText: {
      color: highContrast ? '#ffffff' : '#374151',
    },
    exportContainer: {
      backgroundColor: highContrast ? '#1a1a1a' : '#f9fafb',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    exportTitle: {
      fontSize: fontSize,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 12,
    },
    exportButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    exportButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderWidth: 1,
      borderColor: highContrast ? '#555555' : '#d1d5db',
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    exportButtonText: {
      fontSize: fontSize - 4,
      fontWeight: '500',
      color: highContrast ? '#ffffff' : '#374151',
    },
    helpText: {
      fontSize: fontSize - 4,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
  });

  return (
    <View style={styles.container}>
      {/* Header with confidence indicator */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {readonly ? 'View Transcription' : 'Edit Transcription'}
        </Text>
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>Accuracy:</Text>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceBadgeText}>
              {Math.round(transcription.confidence * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Text editor */}
      <View style={styles.editorContainer}>
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={elderlySettings.highContrastMode}
        >
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              readonly && styles.textInputReadonly,
            ]}
            value={editedText}
            onChangeText={handleTextChange}
            multiline
            placeholder={transcription.language === 'zh' ? '编辑您的转录文本...' : 'Edit your transcription...'}
            placeholderTextColor={highContrast ? '#666666' : '#9ca3af'}
            editable={!readonly}
            selectTextOnFocus={!readonly}
            scrollEnabled={false}
            accessibilityLabel="Transcription text editor"
            accessibilityHint={readonly ? 'Read-only transcription text' : 'Edit the transcribed text'}
          />
        </ScrollView>

        {/* Statistics */}
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            {wordCount} words • {editedText.length} characters
          </Text>
          <View style={styles.languageIndicator}>
            <Text style={styles.languageFlag}>
              {transcription.language === 'zh' ? '🇨🇳' : '🇺🇸'}
            </Text>
            <Text style={styles.statText}>
              {transcription.language === 'zh' ? '中文' : 'English'}
            </Text>
          </View>
        </View>
      </View>

      {/* Export options */}
      {showExportOptions && (
        <View style={styles.exportContainer}>
          <Text style={styles.exportTitle}>Export Format</Text>
          <View style={styles.exportButtons}>
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('txt')}
              disabled={isExporting}
              accessibilityLabel="Export as text file"
              accessibilityRole="button"
            >
              <Text style={styles.exportButtonText}>📄 Text</Text>
            </Pressable>
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('pdf')}
              disabled={isExporting}
              accessibilityLabel="Export as PDF"
              accessibilityRole="button"
            >
              <Text style={styles.exportButtonText}>📋 PDF</Text>
            </Pressable>
            <Pressable
              style={styles.exportButton}
              onPress={() => handleExport('json')}
              disabled={isExporting}
              accessibilityLabel="Export with metadata"
              accessibilityRole="button"
            >
              <Text style={styles.exportButtonText}>⚙️ Data</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonContainer}>
        {!readonly && (
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={handleClearText}
            accessibilityLabel="Clear all text"
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Clear
            </Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={toggleExportOptions}
          disabled={isExporting}
          accessibilityLabel={showExportOptions ? 'Hide export options' : 'Show export options'}
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            {isExporting ? 'Exporting...' : (showExportOptions ? 'Hide Export' : 'Export')}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.secondaryButton]}
          onPress={handleCancel}
          accessibilityLabel="Cancel editing"
          accessibilityRole="button"
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Cancel
          </Text>
        </Pressable>

        {!readonly && (
          <Pressable
            style={[
              styles.button,
              hasChanges ? styles.primaryButton : styles.disabledButton
            ]}
            onPress={handleSave}
            disabled={!hasChanges}
            accessibilityLabel={hasChanges ? 'Save changes' : 'No changes to save'}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Save
            </Text>
          </Pressable>
        )}
      </View>

      {/* Help text for elderly users */}
      {elderlySettings.simplifiedControls && (
        <Text style={styles.helpText}>
          {readonly
            ? 'This is your saved transcription. You can export it using the Export button.'
            : 'Tap on the text above to make changes. Use Save when you\'re finished.'
          }
        </Text>
      )}
    </View>
  );
};

export default TranscriptionEditor;