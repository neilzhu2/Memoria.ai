/**
 * Family Setup Wizard Component for Memoria.ai
 * Culturally-sensitive family circle creation for Chinese families
 * Guides users through setting up multi-generational family sharing
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFamilyStore } from '../../stores/familyStore';
import { useUserStore } from '../../stores/userStore';
import {
  ChineseFamilyRole,
  ChineseRelationship,
  FamilyPermissionLevel,
  CreateFamilyRequest,
  ChineseRelationshipLabels
} from '../../types';

interface FamilySetupWizardProps {
  onComplete: (familyId: string) => void;
  onCancel: () => void;
}

type SetupStep = 'welcome' | 'family_info' | 'elder_info' | 'cultural_preferences' | 'privacy_settings' | 'confirmation';

const CULTURAL_TRADITIONS = [
  { value: 'traditional', label: { en: 'Traditional Chinese Family', zh: '传统中国家庭' } },
  { value: 'modern', label: { en: 'Modern Chinese Family', zh: '现代中国家庭' } },
  { value: 'mixed', label: { en: 'Mixed Traditional and Modern', zh: '传统与现代结合' } }
];

const RESPECT_PROTOCOLS = [
  { value: 'strict', label: { en: 'Strict Traditional Hierarchy', zh: '严格传统等级制度' } },
  { value: 'moderate', label: { en: 'Moderate Respect Protocols', zh: '适度尊重礼仪' } },
  { value: 'relaxed', label: { en: 'Relaxed Family Structure', zh: '宽松家庭结构' } }
];

const FAMILY_ROLES = [
  { value: 'elder', label: { en: 'Elder (Grandparent)', zh: '长辈（祖父母）' } },
  { value: 'parent', label: { en: 'Parent', zh: '父母' } },
  { value: 'child', label: { en: 'Adult Child', zh: '成年子女' } },
  { value: 'caregiver', label: { en: 'Caregiver', zh: '照顾者' } }
];

export const FamilySetupWizard: React.FC<FamilySetupWizardProps> = ({
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [setupData, setSetupData] = useState({
    familyName: '',
    familyNameZh: '',
    primaryLanguage: 'bilingual' as 'en' | 'zh' | 'bilingual',
    culturalTradition: 'mixed' as 'traditional' | 'modern' | 'mixed',
    respectProtocol: 'moderate' as 'strict' | 'moderate' | 'relaxed',
    userRole: 'child' as ChineseFamilyRole,
    relationshipToElder: 'son' as ChineseRelationship,
    elderName: '',
    elderAge: '',
    enableCulturalCalendar: true,
    enableMemoryPrompts: true,
    requireElderApproval: false,
    familyPrivacy: 'restricted' as 'open' | 'restricted' | 'private',
    emergencyAccess: true,
  });

  const { createFamily, loadingState } = useFamilyStore();
  const { user } = useUserStore();

  const nextStep = () => {
    const steps: SetupStep[] = ['welcome', 'family_info', 'elder_info', 'cultural_preferences', 'privacy_settings', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: SetupStep[] = ['welcome', 'family_info', 'elder_info', 'cultural_preferences', 'privacy_settings', 'confirmation'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    try {
      const request: CreateFamilyRequest = {
        name: setupData.familyName,
        displayName: {
          en: setupData.familyName,
          zh: setupData.familyNameZh || setupData.familyName,
        },
        primaryLanguage: setupData.primaryLanguage,
        culturalTradition: setupData.culturalTradition,
      };

      await createFamily(request);
      onComplete('new-family-id'); // In real implementation, get the actual family ID
    } catch (error) {
      Alert.alert(
        'Error Creating Family',
        'We encountered an error while setting up your family circle. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'family_info':
        return setupData.familyName.trim().length > 0;
      case 'elder_info':
        return setupData.elderName.trim().length > 0;
      default:
        return true;
    }
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Welcome to Family Sharing</Text>
      <Text style={styles.stepTitleZh}>欢迎使用家庭分享</Text>

      <View style={styles.contentContainer}>
        <Text style={styles.description}>
          Family sharing allows you to connect with your loved ones and preserve memories together.
          We'll help you set up a family circle that respects Chinese cultural values and traditions.
        </Text>
        <Text style={styles.descriptionZh}>
          家庭分享功能让您与亲人相互连接，共同保存珍贵的回忆。我们将帮助您建立一个尊重中华文化价值和传统的家庭圈子。
        </Text>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🏮 Cultural calendar with Chinese holidays</Text>
            <Text style={styles.featureTextZh}>🏮 包含中国节日的文化日历</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>👨‍👩‍👧‍👦 Multi-generational family support</Text>
            <Text style={styles.featureTextZh}>👨‍👩‍👧‍👦 多代家庭支持</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🔒 Respectful privacy controls</Text>
            <Text style={styles.featureTextZh}>🔒 尊重的隐私控制</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>🌟 Memory prompts for storytelling</Text>
            <Text style={styles.featureTextZh}>🌟 讲故事的记忆提示</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={nextStep}>
        <Text style={styles.primaryButtonText}>Get Started / 开始设置</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFamilyInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Family Information</Text>
      <Text style={styles.stepTitleZh}>家庭信息</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family Name (English)</Text>
          <Text style={styles.labelZh}>家庭名称（英文）</Text>
          <input
            style={styles.textInput}
            value={setupData.familyName}
            onChange={(e) => setSetupData({ ...setupData, familyName: e.target.value })}
            placeholder="e.g., The Wang Family"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family Name (Chinese - Optional)</Text>
          <Text style={styles.labelZh}>家庭名称（中文 - 可选）</Text>
          <input
            style={styles.textInput}
            value={setupData.familyNameZh}
            onChange={(e) => setSetupData({ ...setupData, familyNameZh: e.target.value })}
            placeholder="e.g., 王家"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Primary Language</Text>
          <Text style={styles.labelZh}>主要语言</Text>
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
                  setupData.primaryLanguage === option.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, primaryLanguage: option.value as any })}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                <Text style={styles.optionTextZh}>{option.labelZh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Role in the Family</Text>
          <Text style={styles.labelZh}>您在家庭中的角色</Text>
          <View style={styles.optionGroup}>
            {FAMILY_ROLES.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.optionButton,
                  setupData.userRole === role.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, userRole: role.value as ChineseFamilyRole })}
              >
                <Text style={styles.optionText}>{role.label.en}</Text>
                <Text style={styles.optionTextZh}>{role.label.zh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderElderInfoStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Primary Elder Information</Text>
      <Text style={styles.stepTitleZh}>主要长辈信息</Text>

      <Text style={styles.description}>
        Please tell us about the primary elderly person in your family who will be using Memoria.ai.
      </Text>
      <Text style={styles.descriptionZh}>
        请告诉我们将使用Memoria.ai的家庭主要长辈的信息。
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Elder's Name</Text>
          <Text style={styles.labelZh}>长辈姓名</Text>
          <input
            style={styles.textInput}
            value={setupData.elderName}
            onChange={(e) => setSetupData({ ...setupData, elderName: e.target.value })}
            placeholder="e.g., Grandma Wang"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Your Relationship to Them</Text>
          <Text style={styles.labelZh}>您与他们的关系</Text>
          <View style={styles.optionGroup}>
            {[
              { value: 'grandson', label: 'Grandson', labelZh: '孙子' },
              { value: 'granddaughter', label: 'Granddaughter', labelZh: '孙女' },
              { value: 'son', label: 'Son', labelZh: '儿子' },
              { value: 'daughter', label: 'Daughter', labelZh: '女儿' },
              { value: 'caregiver', label: 'Caregiver', labelZh: '照顾者' }
            ].map((relation) => (
              <TouchableOpacity
                key={relation.value}
                style={[
                  styles.optionButton,
                  setupData.relationshipToElder === relation.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, relationshipToElder: relation.value as ChineseRelationship })}
              >
                <Text style={styles.optionText}>{relation.label}</Text>
                <Text style={styles.optionTextZh}>{relation.labelZh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  const renderCulturalPreferencesStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Cultural Preferences</Text>
      <Text style={styles.stepTitleZh}>文化偏好</Text>

      <Text style={styles.description}>
        Help us customize the family experience to match your cultural traditions and preferences.
      </Text>
      <Text style={styles.descriptionZh}>
        帮助我们定制家庭体验，以匹配您的文化传统和偏好。
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family Tradition Style</Text>
          <Text style={styles.labelZh}>家庭传统风格</Text>
          <View style={styles.optionGroup}>
            {CULTURAL_TRADITIONS.map((tradition) => (
              <TouchableOpacity
                key={tradition.value}
                style={[
                  styles.optionButton,
                  setupData.culturalTradition === tradition.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, culturalTradition: tradition.value as any })}
              >
                <Text style={styles.optionText}>{tradition.label.en}</Text>
                <Text style={styles.optionTextZh}>{tradition.label.zh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Respect and Hierarchy Level</Text>
          <Text style={styles.labelZh}>尊重和等级制度水平</Text>
          <View style={styles.optionGroup}>
            {RESPECT_PROTOCOLS.map((protocol) => (
              <TouchableOpacity
                key={protocol.value}
                style={[
                  styles.optionButton,
                  setupData.respectProtocol === protocol.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, respectProtocol: protocol.value as any })}
              >
                <Text style={styles.optionText}>{protocol.label.en}</Text>
                <Text style={styles.optionTextZh}>{protocol.label.zh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setSetupData({ ...setupData, enableCulturalCalendar: !setupData.enableCulturalCalendar })}
          >
            <Text style={styles.checkboxIcon}>
              {setupData.enableCulturalCalendar ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Enable Chinese Cultural Calendar</Text>
              <Text style={styles.checkboxTextZh}>启用中国文化日历</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setSetupData({ ...setupData, enableMemoryPrompts: !setupData.enableMemoryPrompts })}
          >
            <Text style={styles.checkboxIcon}>
              {setupData.enableMemoryPrompts ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Enable Cultural Memory Prompts</Text>
              <Text style={styles.checkboxTextZh}>启用文化记忆提示</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPrivacySettingsStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Privacy & Safety Settings</Text>
      <Text style={styles.stepTitleZh}>隐私和安全设置</Text>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Family Privacy Level</Text>
          <Text style={styles.labelZh}>家庭隐私级别</Text>
          <View style={styles.optionGroup}>
            {[
              { value: 'open', label: 'Open Sharing', labelZh: '开放分享' },
              { value: 'restricted', label: 'Family Only', labelZh: '仅限家庭' },
              { value: 'private', label: 'Very Private', labelZh: '非常私密' }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  setupData.familyPrivacy === option.value && styles.selectedOption
                ]}
                onPress={() => setSetupData({ ...setupData, familyPrivacy: option.value as any })}
              >
                <Text style={styles.optionText}>{option.label}</Text>
                <Text style={styles.optionTextZh}>{option.labelZh}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.checkboxGroup}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setSetupData({ ...setupData, requireElderApproval: !setupData.requireElderApproval })}
          >
            <Text style={styles.checkboxIcon}>
              {setupData.requireElderApproval ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Require Elder Approval for Major Decisions</Text>
              <Text style={styles.checkboxTextZh}>重大决定需要长辈批准</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setSetupData({ ...setupData, emergencyAccess: !setupData.emergencyAccess })}
          >
            <Text style={styles.checkboxIcon}>
              {setupData.emergencyAccess ? '✓' : '○'}
            </Text>
            <View style={styles.checkboxLabel}>
              <Text style={styles.checkboxText}>Enable Emergency Family Access</Text>
              <Text style={styles.checkboxTextZh}>启用紧急家庭访问</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderConfirmationStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Review & Confirm</Text>
      <Text style={styles.stepTitleZh}>查看和确认</Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Family Name:</Text>
          <Text style={styles.summaryValue}>{setupData.familyName}</Text>
          {setupData.familyNameZh && (
            <Text style={styles.summaryValueZh}>{setupData.familyNameZh}</Text>
          )}
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Language:</Text>
          <Text style={styles.summaryValue}>
            {setupData.primaryLanguage === 'bilingual' ? 'Bilingual (English & Chinese)' :
             setupData.primaryLanguage === 'zh' ? 'Chinese' : 'English'}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Cultural Style:</Text>
          <Text style={styles.summaryValue}>
            {CULTURAL_TRADITIONS.find(t => t.value === setupData.culturalTradition)?.label.en}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Primary Elder:</Text>
          <Text style={styles.summaryValue}>{setupData.elderName}</Text>
        </View>

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Features Enabled:</Text>
          <Text style={styles.summaryValue}>
            {setupData.enableCulturalCalendar && '• Cultural Calendar\n'}
            {setupData.enableMemoryPrompts && '• Memory Prompts\n'}
            {setupData.emergencyAccess && '• Emergency Access\n'}
            {setupData.requireElderApproval && '• Elder Approval Required'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loadingState.isLoading && styles.disabledButton]}
        onPress={handleComplete}
        disabled={loadingState.isLoading}
      >
        <Text style={styles.primaryButtonText}>
          {loadingState.isLoading ? 'Creating Family...' : 'Create Family Circle'}
        </Text>
        <Text style={styles.primaryButtonTextZh}>
          {loadingState.isLoading ? '正在创建家庭...' : '创建家庭圈子'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'family_info':
        return renderFamilyInfoStep();
      case 'elder_info':
        return renderElderInfoStep();
      case 'cultural_preferences':
        return renderCulturalPreferencesStep();
      case 'privacy_settings':
        return renderPrivacySettingsStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <ScrollView style={styles.container}>
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

        {currentStep !== 'welcome' && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderStepContent()}

      {currentStep !== 'welcome' && currentStep !== 'confirmation' && (
        <View style={styles.navigationButtons}>
          <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, !isStepValid() && styles.disabledButton]}
            onPress={nextStep}
            disabled={!isStepValid()}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const getStepIndex = (step: SetupStep): number => {
  const steps: SetupStep[] = ['welcome', 'family_info', 'elder_info', 'cultural_preferences', 'privacy_settings', 'confirmation'];
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
  contentContainer: {
    marginBottom: 30,
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
  featureList: {
    marginTop: 20,
  },
  featureItem: {
    marginBottom: 15,
    paddingLeft: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 4,
  },
  featureTextZh: {
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
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 30,
  },
  summaryItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 15,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#212529',
    marginBottom: 2,
  },
  summaryValueZh: {
    fontSize: 14,
    color: '#6c757d',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
});

export default FamilySetupWizard;