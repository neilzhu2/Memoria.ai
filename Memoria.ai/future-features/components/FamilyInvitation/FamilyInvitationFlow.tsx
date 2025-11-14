/**
 * Family Invitation Flow Component for Memoria.ai
 * Culturally-sensitive family member invitation with respect protocols
 * Handles Chinese family hierarchy and appropriate invitation language
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFamilyStore } from '../../stores/familyStore';
import { useUserStore } from '../../stores/userStore';
import {
  ChineseFamilyRole,
  ChineseRelationship,
  FamilyPermissionLevel,
  InviteFamilyMemberRequest,
  ChineseRelationshipLabels
} from '../../types';
import { CulturalCalendarUtils } from '../../utils/culturalCalendar';

interface FamilyInvitationFlowProps {
  familyId: string;
  onComplete: () => void;
  onCancel: () => void;
  prefilledEmail?: string;
  prefilledRelationship?: ChineseRelationship;
}

type InvitationStep = 'contact_info' | 'relationship' | 'permissions' | 'cultural_context' | 'preview' | 'sending';

const CHINESE_RELATIONSHIPS: { value: ChineseRelationship; labels: ChineseRelationshipLabels; generation: number; isElder: boolean }[] = [
  { value: 'grandmother', labels: { en: 'Grandmother', zh: '奶奶/外婆', pinyin: 'Nǎi nai / Wài pó' }, generation: 1, isElder: true },
  { value: 'grandfather', labels: { en: 'Grandfather', zh: '爷爷/外公', pinyin: 'Yé ye / Wài gōng' }, generation: 1, isElder: true },
  { value: 'mother', labels: { en: 'Mother', zh: '妈妈/母亲', pinyin: 'Mā ma / Mǔ qīn' }, generation: 2, isElder: false },
  { value: 'father', labels: { en: 'Father', zh: '爸爸/父亲', pinyin: 'Bà ba / Fù qīn' }, generation: 2, isElder: false },
  { value: 'aunt', labels: { en: 'Aunt', zh: '姑姑/阿姨', pinyin: 'Gū gu / Ā yí' }, generation: 2, isElder: false },
  { value: 'uncle', labels: { en: 'Uncle', zh: '叔叔/舅舅', pinyin: 'Shū shu / Jiù jiu' }, generation: 2, isElder: false },
  { value: 'wife', labels: { en: 'Wife', zh: '妻子', pinyin: 'Qī zi' }, generation: 0, isElder: false },
  { value: 'husband', labels: { en: 'Husband', zh: '丈夫', pinyin: 'Zhàng fu' }, generation: 0, isElder: false },
  { value: 'daughter', labels: { en: 'Daughter', zh: '女儿', pinyin: 'Nǚ ér' }, generation: 3, isElder: false },
  { value: 'son', labels: { en: 'Son', zh: '儿子', pinyin: 'Ér zi' }, generation: 3, isElder: false },
  { value: 'sister', labels: { en: 'Sister', zh: '姐姐/妹妹', pinyin: 'Jiě jie / Mèi mei' }, generation: 0, isElder: false },
  { value: 'brother', labels: { en: 'Brother', zh: '哥哥/弟弟', pinyin: 'Gē ge / Dì di' }, generation: 0, isElder: false },
  { value: 'daughter_in_law', labels: { en: 'Daughter-in-law', zh: '儿媳', pinyin: 'Ér xí' }, generation: 3, isElder: false },
  { value: 'son_in_law', labels: { en: 'Son-in-law', zh: '女婿', pinyin: 'Nǚ xu' }, generation: 3, isElder: false },
  { value: 'cousin', labels: { en: 'Cousin', zh: '表兄弟姐妹', pinyin: 'Biǎo xiōng dì jiě mèi' }, generation: 0, isElder: false },
  { value: 'caregiver', labels: { en: 'Caregiver', zh: '照顾者', pinyin: 'Zhào gù zhě' }, generation: 0, isElder: false },
  { value: 'family_friend', labels: { en: 'Family Friend', zh: '家庭朋友', pinyin: 'Jiā tíng péng yǒu' }, generation: 0, isElder: false },
];

const PERMISSION_LEVELS: { value: FamilyPermissionLevel; labels: ChineseRelationshipLabels; description: ChineseRelationshipLabels }[] = [
  {
    value: 'full_access',
    labels: { en: 'Full Family Access', zh: '完全家庭访问权限' },
    description: { en: 'Can view, share, and manage all family memories', zh: '可以查看、分享和管理所有家庭回忆' }
  },
  {
    value: 'family_view',
    labels: { en: 'Family Viewing', zh: '家庭查看权限' },
    description: { en: 'Can view shared family memories and share their own', zh: '可以查看分享的家庭回忆并分享自己的回忆' }
  },
  {
    value: 'limited_view',
    labels: { en: 'Limited Viewing', zh: '有限查看权限' },
    description: { en: 'Can view only specifically shared memories', zh: '只能查看特别分享的回忆' }
  },
  {
    value: 'emergency_only',
    labels: { en: 'Emergency Access Only', zh: '仅限紧急情况访问' },
    description: { en: 'Access only in emergency situations', zh: '仅在紧急情况下访问' }
  }
];

const CULTURAL_GREETINGS = {
  formal_elder: {
    en: "We respectfully invite you to join our family circle on Memoria.ai",
    zh: "我们恭敬地邀请您加入我们在Memoria.ai上的家庭圈子"
  },
  casual_peer: {
    en: "We'd love to have you join our family memories on Memoria.ai",
    zh: "我们很高兴邀请您加入我们在Memoria.ai上的家庭回忆"
  },
  caring_younger: {
    en: "We're creating a family memory circle and would love for you to be part of it",
    zh: "我们正在创建一个家庭回忆圈，希望您能加入我们"
  }
};

export const FamilyInvitationFlow: React.FC<FamilyInvitationFlowProps> = ({
  familyId,
  onComplete,
  onCancel,
  prefilledEmail,
  prefilledRelationship
}) => {
  const [currentStep, setCurrentStep] = useState<InvitationStep>('contact_info');
  const [invitationData, setInvitationData] = useState({
    email: prefilledEmail || '',
    phone: '',
    name: '',
    relationship: prefilledRelationship || 'family_friend' as ChineseRelationship,
    permissionLevel: 'family_view' as FamilyPermissionLevel,
    invitationLanguage: 'bilingual' as 'en' | 'zh',
    personalMessage: '',
    culturalGreeting: '',
    useRespectfulTone: true,
    includeInstructions: true,
  });

  const { inviteFamilyMember, currentFamily, familyMembers, loadingState } = useFamilyStore();
  const { user } = useUserStore();

  useEffect(() => {
    if (prefilledEmail) {
      setInvitationData(prev => ({ ...prev, email: prefilledEmail }));
    }
    if (prefilledRelationship) {
      setInvitationData(prev => ({ ...prev, relationship: prefilledRelationship }));
      updateCulturalContext(prefilledRelationship);
    }
  }, [prefilledEmail, prefilledRelationship]);

  const updateCulturalContext = (relationship: ChineseRelationship) => {
    const relationshipInfo = CHINESE_RELATIONSHIPS.find(r => r.value === relationship);
    if (!relationshipInfo) return;

    // Determine appropriate cultural greeting based on hierarchy
    let greetingType: keyof typeof CULTURAL_GREETINGS;
    if (relationshipInfo.isElder) {
      greetingType = 'formal_elder';
    } else if (relationshipInfo.generation > 2) {
      greetingType = 'caring_younger';
    } else {
      greetingType = 'casual_peer';
    }

    // Set appropriate permission level based on relationship
    let defaultPermission: FamilyPermissionLevel;
    if (relationshipInfo.isElder) {
      defaultPermission = 'full_access';
    } else if (relationship === 'caregiver') {
      defaultPermission = 'family_view';
    } else if (relationship === 'family_friend') {
      defaultPermission = 'limited_view';
    } else {
      defaultPermission = 'family_view';
    }

    setInvitationData(prev => ({
      ...prev,
      culturalGreeting: CULTURAL_GREETINGS[greetingType][prev.invitationLanguage === 'zh' ? 'zh' : 'en'],
      permissionLevel: defaultPermission,
      useRespectfulTone: relationshipInfo.isElder || relationshipInfo.generation < 2,
    }));
  };

  const nextStep = () => {
    const steps: InvitationStep[] = ['contact_info', 'relationship', 'permissions', 'cultural_context', 'preview', 'sending'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: InvitationStep[] = ['contact_info', 'relationship', 'permissions', 'cultural_context', 'preview', 'sending'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSendInvitation = async () => {
    setCurrentStep('sending');

    try {
      const relationshipInfo = CHINESE_RELATIONSHIPS.find(r => r.value === invitationData.relationship);

      const request: InviteFamilyMemberRequest = {
        familyId,
        email: invitationData.email,
        phone: invitationData.phone || undefined,
        proposedRole: determineRoleFromRelationship(invitationData.relationship),
        proposedRelationship: invitationData.relationship,
        proposedPermissionLevel: invitationData.permissionLevel,
        personalMessage: invitationData.personalMessage,
        invitationLanguage: invitationData.invitationLanguage === 'bilingual' ? 'en' : invitationData.invitationLanguage,
        culturalGreeting: invitationData.culturalGreeting,
      };

      await inviteFamilyMember(request);

      Alert.alert(
        'Invitation Sent Successfully',
        `Your invitation has been sent to ${invitationData.name || invitationData.email}. They will receive instructions on how to join your family circle.`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert(
        'Invitation Failed',
        'We encountered an error while sending the invitation. Please try again.',
        [{ text: 'OK', onPress: () => setCurrentStep('preview') }]
      );
    }
  };

  const determineRoleFromRelationship = (relationship: ChineseRelationship): ChineseFamilyRole => {
    const relationshipInfo = CHINESE_RELATIONSHIPS.find(r => r.value === relationship);
    if (!relationshipInfo) return 'family_friend';

    if (relationshipInfo.isElder) return 'elder';
    if (relationship === 'caregiver') return 'caregiver';
    if (relationshipInfo.generation === 2) return 'parent';
    if (relationshipInfo.generation === 3) return 'child';
    return 'family_friend';
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'contact_info':
        return invitationData.email.includes('@') && invitationData.email.includes('.');
      case 'relationship':
        return invitationData.relationship !== undefined;
      case 'permissions':
        return invitationData.permissionLevel !== undefined;
      default:
        return true;
    }
  };

  const renderContactInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepTitleZh}>联系信息</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <Text style={styles.labelZh}>电子邮件地址 *</Text>
          <TextInput
            style={styles.textInput}
            value={invitationData.email}
            onChangeText={(email) => setInvitationData({ ...invitationData, email })}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <Text style={styles.labelZh}>电话号码（可选）</Text>
          <TextInput
            style={styles.textInput}
            value={invitationData.phone}
            onChangeText={(phone) => setInvitationData({ ...invitationData, phone })}
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Their Name (Optional)</Text>
          <Text style={styles.labelZh}>他们的姓名（可选）</Text>
          <TextInput
            style={styles.textInput}
            value={invitationData.name}
            onChangeText={(name) => setInvitationData({ ...invitationData, name })}
            placeholder="How you'd like to address them"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Invitation Language</Text>
          <Text style={styles.labelZh}>邀请语言</Text>
          <View style={styles.optionGroup}>
            {[
              { value: 'en', label: 'English', labelZh: '英语' },
              { value: 'zh', label: 'Chinese', labelZh: '中文' },
              { value: 'bilingual', label: 'Bilingual', labelZh: '双语' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  invitationData.invitationLanguage === option.value && styles.selectedOption
                ]}
                onPress={() => setInvitationData({ ...invitationData, invitationLanguage: option.value as any })}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                <Text style={styles.optionTextZh}>{option.labelZh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderRelationshipStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Family Relationship</Text>
      <Text style={styles.stepTitleZh}>家庭关系</Text>

      <Text style={styles.description}>
        Select how this person is related to your family. This helps us set appropriate permissions and communication style.
      </Text>
      <Text style={styles.descriptionZh}>
        选择此人与您家庭的关系。这有助于我们设置适当的权限和交流方式。
      </Text>

      <ScrollView style={styles.relationshipList}>
        {CHINESE_RELATIONSHIPS.map((relationship) => (
          <TouchableOpacity
            key={relationship.value}
            style={[
              styles.relationshipItem,
              invitationData.relationship === relationship.value && styles.selectedRelationship
            ]}
            onPress={() => {
              setInvitationData({ ...invitationData, relationship: relationship.value });
              updateCulturalContext(relationship.value);
            }}
          >
            <View style={styles.relationshipContent}>
              <Text style={styles.relationshipTitle}>{relationship.labels.en}</Text>
              <Text style={styles.relationshipTitleZh}>{relationship.labels.zh}</Text>
              {relationship.labels.pinyin && (
                <Text style={styles.relationshipPinyin}>{relationship.labels.pinyin}</Text>
              )}
            </View>
            <View style={styles.relationshipMeta}>
              {relationship.isElder && (
                <View style={styles.elderBadge}>
                  <Text style={styles.elderBadgeText}>Elder</Text>
                </View>
              )}
              <Text style={styles.generationText}>Gen {relationship.generation || '0'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPermissionsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Access Permissions</Text>
      <Text style={styles.stepTitleZh}>访问权限</Text>

      <Text style={styles.description}>
        Choose what level of access this family member should have to shared memories.
      </Text>
      <Text style={styles.descriptionZh}>
        选择这位家庭成员对共享回忆应该拥有的访问级别。
      </Text>

      <View style={styles.permissionsList}>
        {PERMISSION_LEVELS.map((permission) => (
          <TouchableOpacity
            key={permission.value}
            style={[
              styles.permissionItem,
              invitationData.permissionLevel === permission.value && styles.selectedPermission
            ]}
            onPress={() => setInvitationData({ ...invitationData, permissionLevel: permission.value })}
          >
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>{permission.labels.en}</Text>
              <Text style={styles.permissionTitleZh}>{permission.labels.zh}</Text>
              <Text style={styles.permissionDescription}>{permission.description.en}</Text>
              <Text style={styles.permissionDescriptionZh}>{permission.description.zh}</Text>
            </View>
            <View style={styles.permissionSelector}>
              {invitationData.permissionLevel === permission.value && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.permissionNote}>
        <Text style={styles.noteText}>
          Note: Permissions can be adjusted later by family administrators.
        </Text>
        <Text style={styles.noteTextZh}>
          注意：权限可以稍后由家庭管理员调整。
        </Text>
      </View>
    </View>
  );

  const renderCulturalContextStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cultural Context</Text>
      <Text style={styles.stepTitleZh}>文化背景</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cultural Greeting</Text>
          <Text style={styles.labelZh}>文化问候</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={invitationData.culturalGreeting}
            onChangeText={(culturalGreeting) => setInvitationData({ ...invitationData, culturalGreeting })}
            placeholder="Customize the greeting for this family member"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Personal Message (Optional)</Text>
          <Text style={styles.labelZh}>个人留言（可选）</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={invitationData.personalMessage}
            onChangeText={(personalMessage) => setInvitationData({ ...invitationData, personalMessage })}
            placeholder="Add a personal note to make the invitation more meaningful"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setInvitationData({ ...invitationData, useRespectfulTone: !invitationData.useRespectfulTone })}
          >
            <Text style={styles.checkboxIcon}>
              {invitationData.useRespectfulTone ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Use Respectful Traditional Tone</Text>
              <Text style={styles.checkboxTextZh}>使用尊重的传统语调</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setInvitationData({ ...invitationData, includeInstructions: !invitationData.includeInstructions })}
          >
            <Text style={styles.checkboxIcon}>
              {invitationData.includeInstructions ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Include Setup Instructions</Text>
              <Text style={styles.checkboxTextZh}>包含设置说明</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPreviewStep = () => {
    const relationshipInfo = CHINESE_RELATIONSHIPS.find(r => r.value === invitationData.relationship);
    const permissionInfo = PERMISSION_LEVELS.find(p => p.value === invitationData.permissionLevel);

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Review Invitation</Text>
        <Text style={styles.stepTitleZh}>查看邀请</Text>

        <View style={styles.previewContainer}>
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Inviting:</Text>
            <Text style={styles.previewValue}>
              {invitationData.name || invitationData.email}
            </Text>
            <Text style={styles.previewSubValue}>{invitationData.email}</Text>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Relationship:</Text>
            <Text style={styles.previewValue}>{relationshipInfo?.labels.en}</Text>
            <Text style={styles.previewSubValue}>{relationshipInfo?.labels.zh}</Text>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Access Level:</Text>
            <Text style={styles.previewValue}>{permissionInfo?.labels.en}</Text>
            <Text style={styles.previewSubValue}>{permissionInfo?.labels.zh}</Text>
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Language:</Text>
            <Text style={styles.previewValue}>
              {invitationData.invitationLanguage === 'bilingual' ? 'Bilingual' :
               invitationData.invitationLanguage === 'zh' ? 'Chinese' : 'English'}
            </Text>
          </View>

          {invitationData.culturalGreeting && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Cultural Greeting:</Text>
              <Text style={styles.previewMessage}>"{invitationData.culturalGreeting}"</Text>
            </View>
          )}

          {invitationData.personalMessage && (
            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Personal Message:</Text>
              <Text style={styles.previewMessage}>"{invitationData.personalMessage}"</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loadingState.isLoading && styles.disabledButton]}
          onPress={handleSendInvitation}
          disabled={loadingState.isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {loadingState.isLoading ? 'Sending Invitation...' : 'Send Invitation'}
          </Text>
          <Text style={styles.primaryButtonTextZh}>
            {loadingState.isLoading ? '正在发送邀请...' : '发送邀请'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSendingStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Sending Invitation...</Text>
        <Text style={styles.loadingTextZh}>正在发送邀请...</Text>
        <View style={styles.loadingSpinner} />
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'contact_info':
        return renderContactInfoStep();
      case 'relationship':
        return renderRelationshipStep();
      case 'permissions':
        return renderPermissionsStep();
      case 'cultural_context':
        return renderCulturalContextStep();
      case 'preview':
        return renderPreviewStep();
      case 'sending':
        return renderSendingStep();
      default:
        return renderContactInfoStep();
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
                  width: `${((getStepIndex(currentStep) + 1) / 6) * 100}%`
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Step {getStepIndex(currentStep) + 1} of 6
          </Text>
        </View>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>

      {currentStep !== 'preview' && currentStep !== 'sending' && (
        <View style={styles.navigationButtons}>
          {currentStep !== 'contact_info' && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, !isStepValid() && styles.disabledButton]}
            onPress={nextStep}
            disabled={!isStepValid()}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const getStepIndex = (step: InvitationStep): number => {
  const steps: InvitationStep[] = ['contact_info', 'relationship', 'permissions', 'cultural_context', 'preview', 'sending'];
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
  optionGroup: {
    flexDirection: 'column',
    gap: 8,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  selectedOption: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  optionText: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  optionTextZh: {
    fontSize: 14,
    color: '#6c757d',
  },
  relationshipList: {
    maxHeight: 400,
  },
  relationshipItem: {
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
  selectedRelationship: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  relationshipContent: {
    flex: 1,
  },
  relationshipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  relationshipTitleZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
  },
  relationshipPinyin: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  relationshipMeta: {
    alignItems: 'flex-end',
  },
  elderBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
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
  permissionsList: {
    marginBottom: 20,
  },
  permissionItem: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  selectedPermission: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  permissionTitleZh: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  permissionDescriptionZh: {
    fontSize: 12,
    color: '#6c757d',
  },
  permissionSelector: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIcon: {
    fontSize: 18,
    color: '#dc3545',
    fontWeight: 'bold',
  },
  permissionNote: {
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
  checkboxGroup: {
    marginTop: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  checkboxIcon: {
    fontSize: 20,
    color: '#dc3545',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxLabel: {
    flex: 1,
  },
  checkboxText: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  checkboxTextZh: {
    fontSize: 14,
    color: '#6c757d',
  },
  previewContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
    paddingBottom: 15,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  previewValue: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  previewSubValue: {
    fontSize: 14,
    color: '#6c757d',
  },
  previewMessage: {
    fontSize: 15,
    color: '#495057',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 20,
    color: '#212529',
    marginBottom: 4,
  },
  loadingTextZh: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 20,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: '#e9ecef',
    borderTopColor: '#dc3545',
    borderRadius: 20,
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

export default FamilyInvitationFlow;