/**
 * EditMemoryModal Component for Memoria.ai
 * Modal for editing memory title, description, and tags
 * Optimized for elderly users with large inputs and clear interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Memory } from '../../types';
import { useSettingsStore } from '../../stores';
import AccessibleButton from '../accessibility/AccessibleButton';
import AccessibleTextInput from '../accessibility/AccessibleTextInput';

interface EditMemoryModalProps {
  visible: boolean;
  memory: Memory;
  onSave: (updates: Partial<Memory>) => void;
  onClose: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

const EditMemoryModal: React.FC<EditMemoryModalProps> = ({
  visible,
  memory,
  onSave,
  onClose,
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

  const [title, setTitle] = useState(memory.title);
  const [description, setDescription] = useState(memory.description || '');
  const [tags, setTags] = useState(memory.tags.join(', '));
  const [hasChanges, setHasChanges] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const tagsInputRef = useRef<TextInput>(null);

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  useEffect(() => {
    // Reset form when memory changes
    setTitle(memory.title);
    setDescription(memory.description || '');
    setTags(memory.tags.join(', '));
    setHasChanges(false);
  }, [memory]);

  useEffect(() => {
    // Track changes
    const originalTags = memory.tags.join(', ');
    const hasChanged =
      title !== memory.title ||
      description !== (memory.description || '') ||
      tags !== originalTags;

    setHasChanges(hasChanged);
  }, [title, description, tags, memory]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(
        language === 'zh' ? '错误' : 'Error',
        language === 'zh' ? '标题不能为空' : 'Title cannot be empty'
      );
      return;
    }

    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Parse tags from comma-separated string
    const parsedTags = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updates: Partial<Memory> = {
      title: title.trim(),
      description: description.trim() || undefined,
      tags: parsedTags,
    };

    onSave(updates);
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        language === 'zh' ? '放弃更改？' : 'Discard changes?',
        language === 'zh'
          ? '您有未保存的更改。确定要关闭吗？'
          : 'You have unsaved changes. Are you sure you want to close?',
        [
          {
            text: language === 'zh' ? '取消' : 'Cancel',
            style: 'cancel',
          },
          {
            text: language === 'zh' ? '放弃' : 'Discard',
            style: 'destructive',
            onPress: onClose,
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const addSuggestedTag = async (tag: string) => {
    if (hapticFeedbackEnabled) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setTags(newTags);
    }
  };

  const suggestedTags = [
    language === 'zh' ? '家庭' : 'Family',
    language === 'zh' ? '旅行' : 'Travel',
    language === 'zh' ? '工作' : 'Work',
    language === 'zh' ? '节日' : 'Holiday',
    language === 'zh' ? '童年' : 'Childhood',
    language === 'zh' ? '朋友' : 'Friends',
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: highContrast ? '#222222' : '#ffffff',
      borderRadius: 20,
      marginHorizontal: 20,
      maxHeight: '90%',
      minWidth: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: highContrast ? '#444444' : '#e5e7eb',
    },
    title: {
      fontSize: fontSize + 4,
      fontWeight: 'bold',
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    closeButton: {
      width: touchTargetSize,
      height: touchTargetSize,
      borderRadius: touchTargetSize / 2,
      backgroundColor: highContrast ? '#444444' : '#f3f4f6',
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      maxHeight: 500,
    },
    scrollContent: {
      padding: 24,
    },
    formSection: {
      marginBottom: 24,
    },
    label: {
      fontSize: fontSize + 1,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#374151',
      marginBottom: 8,
      lineHeight: (fontSize + 1) * 1.3,
    },
    requiredIndicator: {
      color: '#dc2626',
      marginLeft: 4,
    },
    textInput: {
      borderWidth: 2,
      borderColor: highContrast ? '#555555' : '#d1d5db',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: fontSize,
      color: highContrast ? '#ffffff' : '#1f2937',
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      minHeight: touchTargetSize,
      textAlignVertical: 'top',
    },
    textInputFocused: {
      borderColor: '#2563eb',
      shadowColor: '#2563eb',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    multilineInput: {
      minHeight: touchTargetSize * 2,
      maxHeight: touchTargetSize * 3,
    },
    characterCount: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 4,
      textAlign: 'right',
    },
    suggestedTagsContainer: {
      marginTop: 12,
    },
    suggestedTagsLabel: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginBottom: 8,
      fontWeight: '500',
    },
    suggestedTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    suggestedTag: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: highContrast ? '#444444' : '#f3f4f6',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: highContrast ? '#555555' : '#d1d5db',
    },
    suggestedTagText: {
      fontSize: fontSize - 1,
      color: highContrast ? '#ffffff' : '#374151',
      fontWeight: '500',
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: highContrast ? '#444444' : '#e5e7eb',
      gap: 12,
    },
    helpText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 4,
      fontStyle: 'italic',
      lineHeight: (fontSize - 2) * 1.4,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity
            style={[styles.container, style]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {language === 'zh' ? '编辑记忆' : 'Edit Memory'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={language === 'zh' ? '关闭' : 'Close'}
              >
                <Ionicons
                  name="close"
                  size={fontSize + 2}
                  color={highContrast ? '#ffffff' : '#6b7280'}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.scrollContent}>
                {/* Title Input */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>
                    {language === 'zh' ? '标题' : 'Title'}
                    <Text style={styles.requiredIndicator}>*</Text>
                  </Text>
                  <TextInput
                    ref={titleInputRef}
                    style={styles.textInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={language === 'zh' ? '输入记忆标题...' : 'Enter memory title...'}
                    placeholderTextColor={highContrast ? '#999999' : '#9ca3af'}
                    maxLength={100}
                    accessible={true}
                    accessibilityLabel={language === 'zh' ? '记忆标题' : 'Memory title'}
                    accessibilityHint={language === 'zh' ? '输入这个记忆的标题' : 'Enter a title for this memory'}
                    returnKeyType="next"
                    onSubmitEditing={() => descriptionInputRef.current?.focus()}
                  />
                  <Text style={styles.characterCount}>
                    {title.length}/100
                  </Text>
                </View>

                {/* Description Input */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>
                    {language === 'zh' ? '描述' : 'Description'}
                  </Text>
                  <TextInput
                    ref={descriptionInputRef}
                    style={[styles.textInput, styles.multilineInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={language === 'zh' ? '添加描述...' : 'Add a description...'}
                    placeholderTextColor={highContrast ? '#999999' : '#9ca3af'}
                    maxLength={500}
                    multiline={true}
                    textAlignVertical="top"
                    accessible={true}
                    accessibilityLabel={language === 'zh' ? '记忆描述' : 'Memory description'}
                    accessibilityHint={language === 'zh' ? '为这个记忆添加详细描述' : 'Add a detailed description for this memory'}
                    returnKeyType="next"
                    onSubmitEditing={() => tagsInputRef.current?.focus()}
                  />
                  <Text style={styles.characterCount}>
                    {description.length}/500
                  </Text>
                  <Text style={styles.helpText}>
                    {language === 'zh'
                      ? '描述可以帮助您更容易地找到和理解这个记忆'
                      : 'A description helps you find and understand this memory more easily'}
                  </Text>
                </View>

                {/* Tags Input */}
                <View style={styles.formSection}>
                  <Text style={styles.label}>
                    {language === 'zh' ? '标签' : 'Tags'}
                  </Text>
                  <TextInput
                    ref={tagsInputRef}
                    style={styles.textInput}
                    value={tags}
                    onChangeText={setTags}
                    placeholder={language === 'zh' ? '用逗号分隔标签...' : 'Separate tags with commas...'}
                    placeholderTextColor={highContrast ? '#999999' : '#9ca3af'}
                    accessible={true}
                    accessibilityLabel={language === 'zh' ? '记忆标签' : 'Memory tags'}
                    accessibilityHint={language === 'zh' ? '添加标签来组织您的记忆' : 'Add tags to organize your memories'}
                    returnKeyType="done"
                  />
                  <Text style={styles.helpText}>
                    {language === 'zh'
                      ? '标签帮助您组织和搜索记忆，用逗号分隔多个标签'
                      : 'Tags help organize and search memories. Separate multiple tags with commas.'}
                  </Text>

                  {/* Suggested Tags */}
                  <View style={styles.suggestedTagsContainer}>
                    <Text style={styles.suggestedTagsLabel}>
                      {language === 'zh' ? '建议标签：' : 'Suggested tags:'}
                    </Text>
                    <View style={styles.suggestedTags}>
                      {suggestedTags.map((tag, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestedTag}
                          onPress={() => addSuggestedTag(tag)}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={`Add ${tag} tag`}
                        >
                          <Text style={styles.suggestedTagText}>{tag}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <AccessibleButton
                title={language === 'zh' ? '取消' : 'Cancel'}
                onPress={handleCancel}
                variant="secondary"
                style={{ flex: 1 }}
                disabled={loading}
                accessibilityLabel={language === 'zh' ? '取消编辑' : 'Cancel editing'}
              />
              <AccessibleButton
                title={language === 'zh' ? '保存' : 'Save'}
                onPress={handleSave}
                variant="primary"
                style={{ flex: 1 }}
                disabled={loading || !hasChanges || !title.trim()}
                loading={loading}
                accessibilityLabel={language === 'zh' ? '保存更改' : 'Save changes'}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditMemoryModal;