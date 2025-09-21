/**
 * Family Memory Sharing Component for Memoria.ai
 * Culturally-sensitive memory sharing with respect for Chinese family hierarchy
 * Allows sharing memories with appropriate family members based on cultural norms
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { useFamilyStore } from '../../stores/familyStore';
import { useMemoryStore } from '../../stores/memoryStore';
import { useUserStore } from '../../stores/userStore';
import {
  Memory,
  FamilyMember,
  ChineseFamilyRole,
  ChineseRelationship,
  ShareMemoryWithFamilyRequest,
  ChineseRelationshipLabels
} from '../../types';
import { CulturalCalendarUtils } from '../../utils/culturalCalendar';

interface FamilyMemorySharingProps {
  memory: Memory;
  onComplete: () => void;
  onCancel: () => void;
  initialShareLevel?: 'family_wide' | 'specific_members' | 'elder_only' | 'generation_specific';
}

type SharingStep = 'select_scope' | 'choose_members' | 'cultural_context' | 'permissions' | 'confirmation';

const SHARING_SCOPES = [
  {
    value: 'family_wide',
    labels: { en: 'Entire Family', zh: '整个家庭' },
    description: { en: 'Share with all family members', zh: '与所有家庭成员分享' },
    icon: '👨‍👩‍👧‍👦'
  },
  {
    value: 'elder_only',
    labels: { en: 'Elders Only', zh: '仅限长辈' },
    description: { en: 'Share only with elder family members', zh: '仅与长辈家庭成员分享' },
    icon: '👴👵'
  },
  {
    value: 'generation_specific',
    labels: { en: 'Same Generation', zh: '同代人' },
    description: { en: 'Share with family members of the same generation', zh: '与同代家庭成员分享' },
    icon: '👫'
  },
  {
    value: 'specific_members',
    labels: { en: 'Specific Members', zh: '特定成员' },
    description: { en: 'Choose specific family members to share with', zh: '选择特定的家庭成员分享' },
    icon: '👤'
  }
];

const RESPECT_LEVELS = [
  {
    value: 'public',
    labels: { en: 'Family Public', zh: '家庭公开' },
    description: { en: 'Appropriate for general family sharing', zh: '适合一般家庭分享' }
  },
  {
    value: 'family_only',
    labels: { en: 'Family Private', zh: '家庭私密' },
    description: { en: 'Keep within immediate family only', zh: '仅限直系家庭成员' }
  },
  {
    value: 'elder_private',
    labels: { en: 'Elder Approval Required', zh: '需要长辈批准' },
    description: { en: 'Requires elder approval before sharing', zh: '分享前需要长辈批准' }
  }
];

const CULTURAL_OCCASIONS = [
  { value: 'spring_festival', label: { en: 'Spring Festival', zh: '春节' } },
  { value: 'mid_autumn', label: { en: 'Mid-Autumn Festival', zh: '中秋节' } },
  { value: 'birthday', label: { en: 'Birthday', zh: '生日' } },
  { value: 'family_gathering', label: { en: 'Family Gathering', zh: '家庭聚会' } },
  { value: 'daily_life', label: { en: 'Daily Life', zh: '日常生活' } },
  { value: 'wisdom_sharing', label: { en: 'Wisdom Sharing', zh: '智慧分享' } },
  { value: 'traditional_story', label: { en: 'Traditional Story', zh: '传统故事' } }
];

export const FamilyMemorySharing: React.FC<FamilyMemorySharingProps> = ({
  memory,
  onComplete,
  onCancel,
  initialShareLevel = 'family_wide'
}) => {
  const [currentStep, setCurrentStep] = useState<SharingStep>('select_scope');
  const [sharingData, setSharingData] = useState({
    shareLevel: initialShareLevel,
    selectedMembers: [] as string[],
    allowsComments: true,
    allowsCollaboration: false,
    culturalContext: '',
    respectLevel: 'family_only' as 'public' | 'family_only' | 'elder_private',
    culturalOccasion: '',
    traditionalSignificance: '',
    requiresElderApproval: false,
  });

  const {
    currentFamily,
    familyMembers,
    shareMemoryWithFamily,
    loadingState,
    checkPermission,
    requiresElderApproval,
    getFamilyElders
  } = useFamilyStore();

  const { user } = useUserStore();

  // Get current user's family member info
  const currentFamilyMember = familyMembers.find(member => member.userId === user?.id);

  // Filter family members based on sharing scope
  const availableMembers = useMemo(() => {
    if (!currentFamily || !currentFamilyMember) return [];

    let filtered = familyMembers.filter(member => member.isActive && member.userId !== user?.id);

    switch (sharingData.shareLevel) {
      case 'elder_only':
        filtered = filtered.filter(member => member.isElder);
        break;
      case 'generation_specific':
        filtered = filtered.filter(member =>
          member.generationLevel === currentFamilyMember.generationLevel
        );
        break;
      case 'family_wide':
      case 'specific_members':
      default:
        // Include all active members
        break;
    }

    return filtered;
  }, [familyMembers, sharingData.shareLevel, currentFamily, currentFamilyMember, user?.id]);

  // Check if sharing requires elder approval
  useEffect(() => {
    if (currentFamily && sharingData.respectLevel === 'elder_private') {
      setSharingData(prev => ({ ...prev, requiresElderApproval: true }));
    } else {
      const needsApproval = requiresElderApproval('share_memory', currentFamily?.id || '');
      setSharingData(prev => ({ ...prev, requiresElderApproval: needsApproval }));
    }
  }, [sharingData.respectLevel, currentFamily, requiresElderApproval]);

  const nextStep = () => {
    const steps: SharingStep[] = ['select_scope', 'choose_members', 'cultural_context', 'permissions', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: SharingStep[] = ['select_scope', 'choose_members', 'cultural_context', 'permissions', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleShareMemory = async () => {
    if (!currentFamily) {
      Alert.alert('Error', 'No family selected');
      return;
    }

    try {
      const request: ShareMemoryWithFamilyRequest = {
        memoryId: memory.id,
        familyId: currentFamily.id,
        shareLevel: sharingData.shareLevel,
        sharedWith: sharingData.shareLevel === 'specific_members' ? sharingData.selectedMembers : undefined,
        allowsComments: sharingData.allowsComments,
        allowsCollaboration: sharingData.allowsCollaboration,
        culturalContext: sharingData.culturalContext || sharingData.culturalOccasion,
        respectLevel: sharingData.respectLevel,
      };

      await shareMemoryWithFamily(request);

      Alert.alert(
        'Memory Shared Successfully',
        `Your memory "${memory.title}" has been shared with your family members.`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert(
        'Sharing Failed',
        'We encountered an error while sharing your memory. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSharingData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(memberId)
        ? prev.selectedMembers.filter(id => id !== memberId)
        : [...prev.selectedMembers, memberId]
    }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'choose_members':
        return sharingData.shareLevel !== 'specific_members' || sharingData.selectedMembers.length > 0;
      default:
        return true;
    }
  };

  const renderSelectScopeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who should see this memory?</Text>
      <Text style={styles.stepTitleZh}>谁应该看到这个回忆？</Text>

      <Text style={styles.description}>
        Choose how widely you'd like to share this memory within your family.
      </Text>
      <Text style={styles.descriptionZh}>
        选择您希望在家庭内分享这个回忆的范围。
      </Text>

      <View style={styles.scopeOptions}>
        {SHARING_SCOPES.map((scope) => (
          <TouchableOpacity
            key={scope.value}
            style={[
              styles.scopeOption,
              sharingData.shareLevel === scope.value && styles.selectedScope
            ]}
            onPress={() => setSharingData({ ...sharingData, shareLevel: scope.value as any })}
          >
            <Text style={styles.scopeIcon}>{scope.icon}</Text>
            <View style={styles.scopeContent}>
              <Text style={styles.scopeTitle}>{scope.labels.en}</Text>
              <Text style={styles.scopeTitleZh}>{scope.labels.zh}</Text>
              <Text style={styles.scopeDescription}>{scope.description.en}</Text>
              <Text style={styles.scopeDescriptionZh}>{scope.description.zh}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {sharingData.shareLevel !== 'family_wide' && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            Sharing scope: {availableMembers.length} family member(s) will have access
          </Text>
          <Text style={styles.noteTextZh}>
            分享范围：{availableMembers.length} 位家庭成员将可以访问
          </Text>
        </View>
      )}
    </View>
  );

  const renderChooseMembersStep = () => {
    if (sharingData.shareLevel !== 'specific_members') {
      // Auto-advance if not selecting specific members
      nextStep();
      return null;
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Choose Family Members</Text>
        <Text style={styles.stepTitleZh}>选择家庭成员</Text>

        <Text style={styles.description}>
          Select which family members you'd like to share this memory with.
        </Text>
        <Text style={styles.descriptionZh}>
          选择您想要与之分享这个回忆的家庭成员。
        </Text>

        <ScrollView style={styles.membersList}>
          {availableMembers.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.memberItem,
                sharingData.selectedMembers.includes(member.id) && styles.selectedMember
              ]}
              onPress={() => toggleMemberSelection(member.id)}
            >
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.displayName || member.name}</Text>
                <Text style={styles.memberRelation}>
                  {member.relationshipLabels.en} • {member.relationshipLabels.zh}
                </Text>
                <View style={styles.memberMeta}>
                  {member.isElder && (
                    <View style={styles.elderBadge}>
                      <Text style={styles.elderBadgeText}>Elder</Text>
                    </View>
                  )}
                  <Text style={styles.generationText}>Generation {member.generationLevel}</Text>
                </View>
              </View>
              <View style={styles.selectionIndicator}>
                {sharingData.selectedMembers.includes(member.id) && (
                  <Text style={styles.selectedIcon}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.selectionSummary}>
          <Text style={styles.summaryText}>
            Selected: {sharingData.selectedMembers.length} member(s)
          </Text>
          <Text style={styles.summaryTextZh}>
            已选择：{sharingData.selectedMembers.length} 位成员
          </Text>
        </View>
      </View>
    );
  };

  const renderCulturalContextStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cultural Context</Text>
      <Text style={styles.stepTitleZh}>文化背景</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cultural Occasion (Optional)</Text>
          <Text style={styles.labelZh}>文化场合（可选）</Text>
          <View style={styles.occasionGrid}>
            {CULTURAL_OCCASIONS.map((occasion) => (
              <TouchableOpacity
                key={occasion.value}
                style={[
                  styles.occasionChip,
                  sharingData.culturalOccasion === occasion.value && styles.selectedOccasion
                ]}
                onPress={() => setSharingData({
                  ...sharingData,
                  culturalOccasion: sharingData.culturalOccasion === occasion.value ? '' : occasion.value
                })}
              >
                <Text style={styles.occasionText}>{occasion.label.en}</Text>
                <Text style={styles.occasionTextZh}>{occasion.label.zh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Context (Optional)</Text>
          <Text style={styles.labelZh}>其他背景信息（可选）</Text>
          <input
            style={[styles.textInput, styles.multilineInput]}
            value={sharingData.culturalContext}
            onChange={(e) => setSharingData({ ...sharingData, culturalContext: e.target.value })}
            placeholder="Describe the cultural significance or context of this memory"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Traditional Significance (Optional)</Text>
          <Text style={styles.labelZh}>传统意义（可选）</Text>
          <input
            style={[styles.textInput, styles.multilineInput]}
            value={sharingData.traditionalSignificance}
            onChange={(e) => setSharingData({ ...sharingData, traditionalSignificance: e.target.value })}
            placeholder="Explain any traditional or family significance"
          />
        </View>
      </View>
    </View>
  );

  const renderPermissionsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Sharing Permissions</Text>
      <Text style={styles.stepTitleZh}>分享权限</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Respect Level</Text>
          <Text style={styles.labelZh}>尊重级别</Text>
          <View style={styles.respectOptions}>
            {RESPECT_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.respectOption,
                  sharingData.respectLevel === level.value && styles.selectedRespect
                ]}
                onPress={() => setSharingData({ ...sharingData, respectLevel: level.value as any })}
              >
                <Text style={styles.respectTitle}>{level.labels.en}</Text>
                <Text style={styles.respectTitleZh}>{level.labels.zh}</Text>
                <Text style={styles.respectDescription}>{level.description.en}</Text>
                <Text style={styles.respectDescriptionZh}>{level.description.zh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.permissionToggles}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleText}>Allow Comments</Text>
              <Text style={styles.toggleTextZh}>允许评论</Text>
            </View>
            <Switch
              value={sharingData.allowsComments}
              onValueChange={(allowsComments) => setSharingData({ ...sharingData, allowsComments })}
              trackColor={{ false: '#e9ecef', true: '#dc3545' }}
              thumbColor={sharingData.allowsComments ? '#ffffff' : '#6c757d'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabel}>
              <Text style={styles.toggleText}>Allow Collaboration</Text>
              <Text style={styles.toggleTextZh}>允许协作</Text>
              <Text style={styles.toggleDescription}>
                Family members can add context or translations
              </Text>
              <Text style={styles.toggleDescriptionZh}>
                家庭成员可以添加背景信息或翻译
              </Text>
            </View>
            <Switch
              value={sharingData.allowsCollaboration}
              onValueChange={(allowsCollaboration) => setSharingData({ ...sharingData, allowsCollaboration })}
              trackColor={{ false: '#e9ecef', true: '#dc3545' }}
              thumbColor={sharingData.allowsCollaboration ? '#ffffff' : '#6c757d'}
            />
          </View>
        </View>

        {sharingData.requiresElderApproval && (
          <View style={styles.approvalNotice}>
            <Text style={styles.approvalText}>
              ⚠️ This sharing will require elder approval before becoming visible to family members.
            </Text>
            <Text style={styles.approvalTextZh}>
              ⚠️ 此分享在向家庭成员显示之前需要长辈批准。
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderConfirmationStep = () => {
    const scopeInfo = SHARING_SCOPES.find(s => s.value === sharingData.shareLevel);
    const respectInfo = RESPECT_LEVELS.find(r => r.value === sharingData.respectLevel);
    const occasionInfo = CULTURAL_OCCASIONS.find(o => o.value === sharingData.culturalOccasion);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Confirm Sharing</Text>
        <Text style={styles.stepTitleZh}>确认分享</Text>

        <View style={styles.confirmationContainer}>
          <View style={styles.memoryPreview}>
            <Text style={styles.memoryTitle}>{memory.title}</Text>
            <Text style={styles.memoryDuration}>
              Duration: {Math.floor(memory.duration / 60)}:{String(memory.duration % 60).padStart(2, '0')}
            </Text>
            <Text style={styles.memoryLanguage}>
              Language: {memory.language === 'zh' ? 'Chinese' : memory.language === 'en' ? 'English' : 'Auto-detected'}
            </Text>
          </View>

          <View style={styles.sharingDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sharing Scope:</Text>
              <Text style={styles.detailValue}>{scopeInfo?.labels.en}</Text>
              <Text style={styles.detailValueZh}>{scopeInfo?.labels.zh}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Recipients:</Text>
              <Text style={styles.detailValue}>
                {sharingData.shareLevel === 'specific_members'
                  ? `${sharingData.selectedMembers.length} selected members`
                  : `${availableMembers.length} family members`
                }
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Respect Level:</Text>
              <Text style={styles.detailValue}>{respectInfo?.labels.en}</Text>
              <Text style={styles.detailValueZh}>{respectInfo?.labels.zh}</Text>
            </View>

            {occasionInfo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cultural Occasion:</Text>
                <Text style={styles.detailValue}>{occasionInfo.label.en}</Text>
                <Text style={styles.detailValueZh}>{occasionInfo.label.zh}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Permissions:</Text>
              <Text style={styles.detailValue}>
                {sharingData.allowsComments && '• Comments allowed\n'}
                {sharingData.allowsCollaboration && '• Collaboration enabled\n'}
                {sharingData.requiresElderApproval && '• Elder approval required'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loadingState.isLoading && styles.disabledButton]}
          onPress={handleShareMemory}
          disabled={loadingState.isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {loadingState.isLoading ? 'Sharing Memory...' : 'Share Memory'}
          </Text>
          <Text style={styles.primaryButtonTextZh}>
            {loadingState.isLoading ? '正在分享回忆...' : '分享回忆'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select_scope':
        return renderSelectScopeStep();
      case 'choose_members':
        return renderChooseMembersStep();
      case 'cultural_context':
        return renderCulturalContextStep();
      case 'permissions':
        return renderPermissionsStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return renderSelectScopeStep();
    }
  };

  if (!currentFamily) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No family selected</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((getStepIndex(currentStep) + 1) / 5) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {getStepIndex(currentStep) + 1} of 5
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>

      {currentStep !== 'confirmation' && (
        <View style={styles.navigationButtons}>
          {currentStep !== 'select_scope' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !validateCurrentStep() && styles.disabledButton]}
            onPress={nextStep}
            disabled={!validateCurrentStep()}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getStepIndex = (step: SharingStep): number => {
  const steps: SharingStep[] = ['select_scope', 'choose_members', 'cultural_context', 'permissions', 'confirmation'];
  return steps.indexOf(step);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#dc3545',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
  },
  cancelButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
    textAlign: 'center',
  },
  stepTitleZh: {
    fontSize: 24,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionZh: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  scopeOptions: {
    marginBottom: 20,
  },
  scopeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  selectedScope: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  scopeIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  scopeContent: {
    flex: 1,
  },
  scopeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  scopeTitleZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  scopeDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  scopeDescriptionZh: {
    fontSize: 12,
    color: '#6c757d',
  },
  noteContainer: {
    backgroundColor: '#e7f3ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  noteText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  noteTextZh: {
    fontSize: 12,
    color: '#6c757d',
  },
  membersList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  selectedMember: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  memberRelation: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  elderBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  elderBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#212529',
  },
  generationText: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectionIndicator: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    fontSize: 18,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  selectionSummary: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  summaryText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryTextZh: {
    fontSize: 14,
    color: '#6c757d',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  labelZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  occasionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  occasionChip: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOccasion: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  occasionText: {
    fontSize: 12,
    color: '#212529',
    marginBottom: 1,
  },
  occasionTextZh: {
    fontSize: 10,
    color: '#6c757d',
  },
  respectOptions: {
    marginBottom: 20,
  },
  respectOption: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  selectedRespect: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  respectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  respectTitleZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  respectDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  respectDescriptionZh: {
    fontSize: 12,
    color: '#6c757d',
  },
  permissionToggles: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  toggleLabel: {
    flex: 1,
    marginRight: 15,
  },
  toggleText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleTextZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 1,
  },
  toggleDescriptionZh: {
    fontSize: 12,
    color: '#6c757d',
  },
  approvalNotice: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  approvalText: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 2,
  },
  approvalTextZh: {
    fontSize: 12,
    color: '#856404',
  },
  confirmationContainer: {
    marginBottom: 30,
  },
  memoryPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  memoryDuration: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  memoryLanguage: {
    fontSize: 14,
    color: '#6c757d',
  },
  sharingDetails: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailRow: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    paddingBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  detailValueZh: {
    fontSize: 14,
    color: '#6c757d',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  primaryButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    minWidth: 120,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextZh: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 2,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    minWidth: 120,
  },
  secondaryButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
  },
});

export default FamilyMemorySharing;