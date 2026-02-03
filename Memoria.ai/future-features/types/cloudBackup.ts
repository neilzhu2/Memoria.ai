/**
 * Cloud Backup Type Definitions for Memoria.ai
 * Zero-knowledge architecture with end-to-end encryption
 * Designed specifically for elderly users with privacy-first approach
 */

export interface CloudBackupConfig {
  // Core Settings
  enabled: boolean;
  autoBackupEnabled: boolean;
  wifiOnlyBackup: boolean;
  lowPowerMode: boolean;

  // Backup Scheduling
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupTime: string; // HH:MM format
  maxBackupRetention: number; // days

  // Storage Settings
  maxBackupSize: number; // MB
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  includeTags: string[];
  excludeArchived: boolean;

  // Security Settings
  encryptionStrength: '256' | '512';
  keyRotationDays: number;
  requireBiometricAuth: boolean;

  // Regional Settings
  dataRegion: 'us-east' | 'us-west' | 'eu-west' | 'asia-pacific';
  complianceMode: 'gdpr' | 'ccpa' | 'china' | 'standard';

  // Family Settings
  enableFamilySharing: boolean;
  familyMemberLimit: number;
  emergencyAccessEnabled: boolean;
}

export interface EncryptionKeys {
  masterKey: string; // User's master encryption key
  backupKey: string; // Backup-specific key derived from master
  keyId: string; // Unique identifier for key version
  derivedAt: Date;
  rotationDue?: Date;
  keyStrength: 256 | 512;
}

export interface CloudBackupMetadata {
  backupId: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  memoryCount: number;
  totalSize: number;
  encryptedSize: number;
  checksum: string;
  keyId: string;
  compressionRatio: number;
  region: string;
  compliance: string[];
}

export interface BackupProgress {
  backupId: string;
  status: 'preparing' | 'encrypting' | 'uploading' | 'verifying' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  bytesProcessed: number;
  totalBytes: number;
  timeElapsed: number; // seconds
  estimatedTimeRemaining?: number; // seconds
  error?: string;
}

export interface RestoreProgress {
  restoreId: string;
  status: 'downloading' | 'decrypting' | 'extracting' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  memoriesRestored: number;
  totalMemories: number;
  error?: string;
}

export interface BackupValidation {
  isValid: boolean;
  checksumMatch: boolean;
  decryptionSuccessful: boolean;
  metadataValid: boolean;
  memoryCountMatch: boolean;
  errors: string[];
  warnings: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  relationshipType: 'spouse' | 'child' | 'parent' | 'sibling' | 'caregiver' | 'other';
  permissions: FamilyPermissions;
  inviteStatus: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedAt: Date;
  acceptedAt?: Date;
  lastAccessAt?: Date;
}

export interface FamilyPermissions {
  canViewBackups: boolean;
  canRestoreMemories: boolean;
  canModifySettings: boolean;
  canInviteMembers: boolean;
  emergencyAccess: boolean;
  accessLevel: 'read-only' | 'standard' | 'admin';
  memoryCategories: string[]; // Which memory tags they can access
}

export interface EmergencyAccess {
  enabled: boolean;
  waitPeriod: number; // hours before access is granted
  notificationContacts: string[]; // emails to notify
  accessCode?: string; // temporary access code
  triggeredAt?: Date;
  grantedAt?: Date;
  triggeredBy?: string; // family member who triggered
}

export interface CloudProvider {
  id: string;
  name: string;
  regions: string[];
  features: {
    encryption: boolean;
    zeroKnowledge: boolean;
    compliance: string[];
    maxFileSize: number;
    storageLimit?: number;
  };
  pricing: {
    freeStorageGB: number;
    paidTiers: {
      storageGB: number;
      monthlyPrice: number;
      currency: string;
    }[];
  };
}

export interface BackupCost {
  storageUsed: number; // GB
  currentTier: string;
  monthlyCharge: number;
  currency: string;
  nextBillingDate: Date;
  storageBreakdown: {
    memories: number;
    audioFiles: number;
    metadata: number;
    overhead: number;
  };
}

export interface CloudBackupStatus {
  isEnabled: boolean;
  lastBackupTime?: Date;
  nextScheduledBackup?: Date;
  isBackingUp: boolean;
  storageUsed: number; // bytes
  storageLimit: number; // bytes
  totalBackups: number;
  oldestBackup?: Date;
  newestBackup?: Date;
  lastError?: string;
  healthScore: number; // 0-100
}

export interface BackupAuditLog {
  id: string;
  timestamp: Date;
  action: 'backup_created' | 'backup_restored' | 'backup_deleted' | 'settings_changed' | 'key_rotated' | 'family_access' | 'emergency_triggered';
  userId: string;
  details: string;
  ipAddress?: string;
  deviceInfo?: string;
  success: boolean;
  error?: string;
}

export interface DataSovereignty {
  region: string;
  country: string;
  lawsApplicable: string[];
  dataResidency: 'local' | 'regional' | 'global';
  crossBorderTransfer: boolean;
  encryptionRequired: boolean;
  auditRequired: boolean;
}

export interface PrivacySettings {
  dataMinimization: boolean;
  anonymizeMetadata: boolean;
  automaticDeletion: boolean;
  deletionPeriod: number; // days
  shareUsageData: boolean;
  shareErrorLogs: boolean;
  marketingCommunications: boolean;
  thirdPartyIntegrations: boolean;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: Date;
  reportType: 'gdpr' | 'ccpa' | 'china_pipl' | 'hipaa';
  status: 'compliant' | 'non-compliant' | 'partial';
  findings: {
    requirement: string;
    status: 'met' | 'not-met' | 'partial';
    details: string;
    remediation?: string;
  }[];
  recommendations: string[];
  nextReviewDate: Date;
}

// API Response Types
export interface CloudBackupResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  message?: string;
  timestamp: Date;
  requestId: string;
}

export interface BackupListItem {
  backupId: string;
  displayName: string;
  createdAt: Date;
  size: number;
  memoryCount: number;
  isAutomatic: boolean;
  status: 'available' | 'corrupted' | 'incomplete';
  canRestore: boolean;
  region: string;
}

// Configuration for elderly users
export interface ElderlyFriendlySettings {
  showSimpleInterface: boolean;
  useVoiceGuidance: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
  extraConfirmations: boolean;
  slowAnimations: boolean;
  offlineFirstMode: boolean;
  batteryOptimized: boolean;
  dataConservative: boolean;
}

// Error Types
export interface CloudBackupError {
  code: string;
  message: string;
  technicalDetails?: string;
  userFriendlyMessage: string;
  resolution?: string;
  shouldRetry: boolean;
  category: 'network' | 'authentication' | 'encryption' | 'storage' | 'permission' | 'quota' | 'unknown';
}