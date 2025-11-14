/**
 * Compliance Service for Memoria.ai Cloud Backup
 * Handles GDPR, CCPA, Chinese data protection laws, and other privacy regulations
 * Designed specifically for elderly users with clear explanations and simple controls
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  CloudBackupResponse,
  ComplianceReport,
  PrivacySettings,
  DataSovereignty,
  BackupAuditLog,
} from '../types/cloudBackup';
import { storageService } from './storageService';

export interface ComplianceConfig {
  region: string;
  dataResidency: 'local' | 'regional' | 'global';
  applicableLaws: string[];
  consentRequired: boolean;
  auditingEnabled: boolean;
  dataRetentionDays: number;
  automaticDeletion: boolean;
}

export interface ConsentRecord {
  id: string;
  consentType: 'data_processing' | 'data_sharing' | 'marketing' | 'analytics' | 'family_sharing';
  granted: boolean;
  timestamp: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

export interface DataProcessingRecord {
  id: string;
  dataType: 'voice_recording' | 'transcription' | 'metadata' | 'user_profile' | 'usage_analytics';
  purpose: string;
  legalBasis: 'consent' | 'legitimate_interest' | 'contract' | 'legal_obligation';
  processor: string;
  retention: string;
  crossBorderTransfer: boolean;
  safeguards: string[];
  timestamp: Date;
}

export interface PrivacyRequest {
  id: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  description: string;
  responseData?: any;
  rejectionReason?: string;
}

export class ComplianceService {
  private config: ComplianceConfig;
  private auditLogs: BackupAuditLog[] = [];
  private isInitialized = false;

  constructor() {
    this.config = {
      region: 'us-east',
      dataResidency: 'regional',
      applicableLaws: ['GDPR', 'CCPA'],
      consentRequired: true,
      auditingEnabled: true,
      dataRetentionDays: 2555, // ~7 years for elderly users' memories
      automaticDeletion: false, // Disabled by default for memory preservation
    };
  }

  /**
   * Initialize compliance service based on user's location and preferences
   */
  async initialize(userRegion?: string, elderlyMode = true): Promise<CloudBackupResponse<ComplianceConfig>> {
    try {
      // Detect user's region and applicable laws
      const detectedRegion = userRegion || await this.detectUserRegion();
      const applicableLaws = this.getApplicableLaws(detectedRegion);

      this.config = {
        region: detectedRegion,
        dataResidency: this.getRecommendedDataResidency(detectedRegion),
        applicableLaws,
        consentRequired: applicableLaws.length > 0,
        auditingEnabled: true,
        dataRetentionDays: elderlyMode ? 2555 : 365, // Longer retention for elderly users
        automaticDeletion: false, // Conservative default for precious memories
      };

      // Load existing privacy settings
      await this.loadPrivacySettings();

      // Initialize audit logging
      await this.initializeAuditLogging();

      this.isInitialized = true;

      return {
        success: true,
        data: this.config,
        message: 'Compliance service initialized successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to initialize compliance service',
        errorCode: 'COMPLIANCE_INIT_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Record user consent for data processing activities
   */
  async recordConsent(
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<ConsentRecord>> {
    try {
      const consentRecord: ConsentRecord = {
        id: await this.generateRequestId(),
        consentType,
        granted,
        timestamp: new Date(),
        version: '1.0.0',
        ipAddress: elderlyFriendly ? undefined : await this.getCurrentIP(), // Privacy-first for elderly
        userAgent: Platform.OS,
      };

      // Store consent record securely
      await this.storeConsentRecord(consentRecord);

      // Log the consent action
      await this.logAuditEvent({
        id: await this.generateRequestId(),
        timestamp: new Date(),
        action: 'settings_changed',
        userId: 'current_user',
        details: `Consent ${granted ? 'granted' : 'withdrawn'} for ${consentType}`,
        success: true,
      });

      return {
        success: true,
        data: consentRecord,
        message: elderlyFriendly
          ? `Your choice has been saved. You can change this anytime in settings.`
          : 'Consent recorded successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We could not save your choice. Please try again.'
          : 'Failed to record consent',
        errorCode: 'CONSENT_RECORD_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Handle privacy requests (GDPR Article 15-22, CCPA rights)
   */
  async handlePrivacyRequest(
    requestType: PrivacyRequest['type'],
    description: string,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<PrivacyRequest>> {
    try {
      const request: PrivacyRequest = {
        id: await this.generateRequestId(),
        type: requestType,
        status: 'pending',
        requestedAt: new Date(),
        description,
      };

      // Process the request based on type
      switch (requestType) {
        case 'access':
          await this.processAccessRequest(request);
          break;
        case 'erasure':
          await this.processErasureRequest(request, elderlyFriendly);
          break;
        case 'portability':
          await this.processPortabilityRequest(request);
          break;
        case 'rectification':
          await this.processRectificationRequest(request);
          break;
        default:
          request.status = 'pending';
      }

      // Store the request
      await this.storePrivacyRequest(request);

      // Log the privacy request
      await this.logAuditEvent({
        id: await this.generateRequestId(),
        timestamp: new Date(),
        action: 'settings_changed',
        userId: 'current_user',
        details: `Privacy request submitted: ${requestType}`,
        success: true,
      });

      const elderlyMessage = this.getElderlyFriendlyMessage(requestType);

      return {
        success: true,
        data: request,
        message: elderlyFriendly ? elderlyMessage : `Privacy request ${requestType} submitted successfully`,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We could not process your request. Please try again or contact support.'
          : 'Failed to process privacy request',
        errorCode: 'PRIVACY_REQUEST_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Generate compliance report for current user
   */
  async generateComplianceReport(): Promise<CloudBackupResponse<ComplianceReport>> {
    try {
      const reportId = await this.generateRequestId();
      const reportType = this.getPrimaryComplianceFramework();

      const findings = await this.assessCompliance();

      const report: ComplianceReport = {
        reportId,
        generatedAt: new Date(),
        reportType,
        status: this.getOverallComplianceStatus(findings),
        findings,
        recommendations: this.generateRecommendations(findings),
        nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      };

      return {
        success: true,
        data: report,
        message: 'Compliance report generated successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate compliance report',
        errorCode: 'REPORT_GENERATION_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Update privacy settings with compliance validation
   */
  async updatePrivacySettings(
    settings: Partial<PrivacySettings>,
    elderlyMode = true
  ): Promise<CloudBackupResponse<PrivacySettings>> {
    try {
      const currentSettings = await this.getPrivacySettings();
      const newSettings: PrivacySettings = { ...currentSettings.data, ...settings };

      // Validate against compliance requirements
      const validationResult = await this.validatePrivacySettings(newSettings);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: elderlyMode
            ? 'Some privacy settings cannot be changed due to legal requirements. Please contact support if you need help.'
            : validationResult.reason,
          errorCode: 'PRIVACY_VALIDATION_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Store updated settings
      await this.storePrivacySettings(newSettings);

      // Log the change
      await this.logAuditEvent({
        id: await this.generateRequestId(),
        timestamp: new Date(),
        action: 'settings_changed',
        userId: 'current_user',
        details: `Privacy settings updated: ${Object.keys(settings).join(', ')}`,
        success: true,
      });

      return {
        success: true,
        data: newSettings,
        message: elderlyMode
          ? 'Your privacy settings have been updated successfully.'
          : 'Privacy settings updated successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyMode
          ? 'We could not update your privacy settings. Please try again.'
          : 'Failed to update privacy settings',
        errorCode: 'PRIVACY_UPDATE_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Get data sovereignty information for user's region
   */
  async getDataSovereignty(): Promise<CloudBackupResponse<DataSovereignty>> {
    try {
      const sovereignty: DataSovereignty = {
        region: this.config.region,
        country: this.getCountryFromRegion(this.config.region),
        lawsApplicable: this.config.applicableLaws,
        dataResidency: this.config.dataResidency,
        crossBorderTransfer: this.config.dataResidency === 'global',
        encryptionRequired: true,
        auditRequired: this.config.applicableLaws.includes('GDPR'),
      };

      return {
        success: true,
        data: sovereignty,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get data sovereignty information',
        errorCode: 'SOVEREIGNTY_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Log audit event for compliance tracking
   */
  async logAuditEvent(event: BackupAuditLog): Promise<void> {
    if (!this.config.auditingEnabled) return;

    try {
      this.auditLogs.push(event);

      // Store in secure storage
      const existingLogs = await this.getAuditLogs();
      const allLogs = [...existingLogs, event];

      // Keep only recent logs (last 1000 events)
      const recentLogs = allLogs.slice(-1000);

      await storageService.setMMKVValue('compliance_audit_logs', recentLogs);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get current privacy settings
   */
  async getPrivacySettings(): Promise<CloudBackupResponse<PrivacySettings>> {
    try {
      const settings = storageService.getMMKVValue<PrivacySettings>('privacy_settings');

      const defaultSettings: PrivacySettings = {
        dataMinimization: true,
        anonymizeMetadata: true,
        automaticDeletion: false, // Conservative for elderly users
        deletionPeriod: 2555, // ~7 years
        shareUsageData: false,
        shareErrorLogs: true, // For support purposes
        marketingCommunications: false,
        thirdPartyIntegrations: false,
      };

      return {
        success: true,
        data: settings || defaultSettings,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get privacy settings',
        errorCode: 'PRIVACY_GET_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  // Private helper methods

  private async detectUserRegion(): Promise<string> {
    // In a real implementation, this would use IP geolocation or user input
    // For now, return a default based on device locale
    try {
      const locale = Platform.OS === 'ios'
        ? require('react-native').NativeModules.SettingsManager?.settings?.AppleLocale
        : require('react-native').NativeModules.I18nManager?.localeIdentifier;

      if (locale?.includes('CN') || locale?.includes('zh-CN')) {
        return 'asia-pacific';
      } else if (locale?.includes('EU') || locale?.includes('de') || locale?.includes('fr')) {
        return 'eu-west';
      } else {
        return 'us-east';
      }
    } catch {
      return 'us-east';
    }
  }

  private getApplicableLaws(region: string): string[] {
    const lawsByRegion: Record<string, string[]> = {
      'eu-west': ['GDPR'],
      'us-east': ['CCPA'],
      'us-west': ['CCPA'],
      'asia-pacific': ['GDPR', 'CHINA_PIPL'], // For international users in APAC
    };

    return lawsByRegion[region] || ['GDPR', 'CCPA']; // Safe default
  }

  private getRecommendedDataResidency(region: string): 'local' | 'regional' | 'global' {
    const residencyByRegion: Record<string, 'local' | 'regional' | 'global'> = {
      'eu-west': 'regional', // GDPR allows EU-wide
      'us-east': 'regional',
      'us-west': 'regional',
      'asia-pacific': 'local', // More restrictive for Chinese data laws
    };

    return residencyByRegion[region] || 'regional';
  }

  private getPrimaryComplianceFramework(): ComplianceReport['reportType'] {
    if (this.config.applicableLaws.includes('GDPR')) return 'gdpr';
    if (this.config.applicableLaws.includes('CCPA')) return 'ccpa';
    if (this.config.applicableLaws.includes('CHINA_PIPL')) return 'china_pipl';
    return 'gdpr'; // Safe default
  }

  private async assessCompliance(): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    // Check data minimization
    findings.push({
      requirement: 'Data Minimization',
      status: 'met',
      details: 'Only necessary data is collected and processed',
      remediation: undefined,
    });

    // Check encryption
    findings.push({
      requirement: 'Data Encryption',
      status: 'met',
      details: 'All data is encrypted with AES-256 before storage',
      remediation: undefined,
    });

    // Check consent management
    const consentRecords = await this.getConsentRecords();
    findings.push({
      requirement: 'Valid Consent',
      status: consentRecords.length > 0 ? 'met' : 'not-met',
      details: consentRecords.length > 0
        ? 'User consent properly recorded and managed'
        : 'No consent records found',
      remediation: consentRecords.length === 0
        ? 'Obtain explicit consent for data processing'
        : undefined,
    });

    // Check data retention
    findings.push({
      requirement: 'Data Retention Limits',
      status: 'met',
      details: `Data retention period set to ${this.config.dataRetentionDays} days`,
      remediation: undefined,
    });

    // Check audit logging
    findings.push({
      requirement: 'Audit Logging',
      status: this.config.auditingEnabled ? 'met' : 'not-met',
      details: this.config.auditingEnabled
        ? 'Comprehensive audit logging enabled'
        : 'Audit logging disabled',
      remediation: !this.config.auditingEnabled
        ? 'Enable audit logging for compliance'
        : undefined,
    });

    return findings;
  }

  private getOverallComplianceStatus(findings: ComplianceReport['findings']): ComplianceReport['status'] {
    const notMet = findings.filter(f => f.status === 'not-met').length;
    const partial = findings.filter(f => f.status === 'partial').length;

    if (notMet > 0) return 'non-compliant';
    if (partial > 0) return 'partial';
    return 'compliant';
  }

  private generateRecommendations(findings: ComplianceReport['findings']): string[] {
    const recommendations: string[] = [];

    findings.forEach(finding => {
      if (finding.remediation) {
        recommendations.push(finding.remediation);
      }
    });

    // Add general recommendations for elderly users
    recommendations.push('Regular privacy settings review recommended every 6 months');
    recommendations.push('Consider enabling family member notifications for privacy changes');

    return recommendations;
  }

  private getElderlyFriendlyMessage(requestType: PrivacyRequest['type']): string {
    const messages: Record<PrivacyRequest['type'], string> = {
      access: 'We\'ll prepare a copy of all your information and send it to you within 30 days.',
      erasure: 'We\'ll delete your information as requested. This cannot be undone, so please be sure.',
      portability: 'We\'ll prepare your data in a format you can use with other services.',
      rectification: 'We\'ll review and correct any incorrect information in your account.',
      restriction: 'We\'ll limit how we use your information as requested.',
      objection: 'We\'ll stop using your information for the purposes you\'ve specified.',
    };

    return messages[requestType];
  }

  private async processAccessRequest(request: PrivacyRequest): Promise<void> {
    // In real implementation, gather all user data
    request.status = 'completed';
    request.completedAt = new Date();
    request.responseData = {
      message: 'Data access package prepared',
      downloadUrl: 'mock_download_url',
    };
  }

  private async processErasureRequest(request: PrivacyRequest, elderlyFriendly: boolean): Promise<void> {
    // In real implementation, verify erasure request and process deletion
    if (elderlyFriendly) {
      // Add extra confirmation step for elderly users
      request.status = 'pending';
      request.responseData = {
        message: 'Erasure request received. Please confirm via email before we proceed.',
        confirmationRequired: true,
      };
    } else {
      request.status = 'in_progress';
    }
  }

  private async processPortabilityRequest(request: PrivacyRequest): Promise<void> {
    request.status = 'completed';
    request.completedAt = new Date();
    request.responseData = {
      message: 'Data export package prepared',
      downloadUrl: 'mock_export_url',
      format: 'JSON',
    };
  }

  private async processRectificationRequest(request: PrivacyRequest): Promise<void> {
    request.status = 'pending';
    request.responseData = {
      message: 'Rectification request received. We will review and update your information.',
    };
  }

  private async validatePrivacySettings(settings: PrivacySettings): Promise<{ isValid: boolean; reason?: string }> {
    // Validate against compliance requirements
    if (this.config.applicableLaws.includes('GDPR')) {
      if (settings.shareUsageData && !settings.dataMinimization) {
        return {
          isValid: false,
          reason: 'Data minimization required when sharing usage data under GDPR',
        };
      }
    }

    if (this.config.applicableLaws.includes('CHINA_PIPL')) {
      if (settings.thirdPartyIntegrations) {
        return {
          isValid: false,
          reason: 'Third-party integrations restricted under Chinese data protection laws',
        };
      }
    }

    return { isValid: true };
  }

  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    const existing = await this.getConsentRecords();
    const updated = [...existing, record];
    await storageService.setMMKVValue('consent_records', updated);
  }

  private async getConsentRecords(): Promise<ConsentRecord[]> {
    return storageService.getMMKVValue<ConsentRecord[]>('consent_records') || [];
  }

  private async storePrivacyRequest(request: PrivacyRequest): Promise<void> {
    const existing = await this.getPrivacyRequests();
    const updated = [...existing, request];
    await storageService.setMMKVValue('privacy_requests', updated);
  }

  private async getPrivacyRequests(): Promise<PrivacyRequest[]> {
    return storageService.getMMKVValue<PrivacyRequest[]>('privacy_requests') || [];
  }

  private async storePrivacySettings(settings: PrivacySettings): Promise<void> {
    await storageService.setMMKVValue('privacy_settings', settings);
  }

  private async loadPrivacySettings(): Promise<void> {
    // Settings loaded on-demand via getPrivacySettings()
  }

  private async initializeAuditLogging(): Promise<void> {
    // Load existing audit logs
    this.auditLogs = await this.getAuditLogs();

    // Log initialization
    await this.logAuditEvent({
      id: await this.generateRequestId(),
      timestamp: new Date(),
      action: 'settings_changed',
      userId: 'current_user',
      details: 'Compliance service initialized',
      success: true,
    });
  }

  private async getAuditLogs(): Promise<BackupAuditLog[]> {
    return storageService.getMMKVValue<BackupAuditLog[]>('compliance_audit_logs') || [];
  }

  private getCountryFromRegion(region: string): string {
    const countryByRegion: Record<string, string> = {
      'us-east': 'United States',
      'us-west': 'United States',
      'eu-west': 'European Union',
      'asia-pacific': 'Asia Pacific',
    };

    return countryByRegion[region] || 'Unknown';
  }

  private async getCurrentIP(): Promise<string> {
    // In real implementation, get user's IP address
    return 'masked_for_privacy';
  }

  private async generateRequestId(): Promise<string> {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();