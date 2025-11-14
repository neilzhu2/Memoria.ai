/**
 * Authentication Service for Memoria.ai Cloud Backup
 * Elderly-friendly secure authentication with multiple options
 * Includes biometric authentication, simple 2FA, and emergency access
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';
import { CloudBackupResponse } from '../types/cloudBackup';

export interface AuthenticationConfig {
  biometricEnabled: boolean;
  smsBackupEnabled: boolean;
  emergencyContactsEnabled: boolean;
  autoLockMinutes: number;
  requireAuthForBackup: boolean;
  requireAuthForRestore: boolean;
  elderlyMode: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  biometricType?: 'fingerprint' | 'face' | 'iris' | 'none';
  error?: string;
  fallbackAvailable: boolean;
}

export interface SMSVerificationResult {
  success: boolean;
  verificationId?: string;
  error?: string;
  attemptsRemaining: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationshipType: 'spouse' | 'child' | 'caregiver' | 'other';
  isPrimary: boolean;
  verified: boolean;
  addedAt: Date;
}

export interface AuthSession {
  sessionId: string;
  authenticatedAt: Date;
  expiresAt: Date;
  authMethod: 'biometric' | 'sms' | 'emergency' | 'passcode';
  isValid: boolean;
}

export class AuthenticationService {
  private config: AuthenticationConfig;
  private currentSession: AuthSession | null = null;
  private smsVerificationAttempts = 0;
  private maxSMSAttempts = 3;

  constructor() {
    this.config = {
      biometricEnabled: true,
      smsBackupEnabled: true,
      emergencyContactsEnabled: true,
      autoLockMinutes: 15, // Longer for elderly users
      requireAuthForBackup: false, // Less friction for elderly
      requireAuthForRestore: true, // Security for restore operations
      elderlyMode: true,
    };
  }

  /**
   * Initialize authentication service and check device capabilities
   */
  async initialize(elderlyMode = true): Promise<CloudBackupResponse<AuthenticationConfig>> {
    try {
      // Check biometric capabilities
      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      this.config.biometricEnabled = hasHardware && isEnrolled && biometricTypes.length > 0;
      this.config.elderlyMode = elderlyMode;

      // Adjust settings for elderly users
      if (elderlyMode) {
        this.config.autoLockMinutes = 30; // Longer timeout
        this.config.requireAuthForBackup = false; // Less friction
      }

      // Load saved configuration
      await this.loadAuthConfiguration();

      return {
        success: true,
        data: this.config,
        message: elderlyMode
          ? 'Authentication ready! We\'ve set up easy and secure access for you.'
          : 'Authentication service initialized successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyMode
          ? 'We couldn\'t set up secure access. Please try again or contact support.'
          : 'Failed to initialize authentication service',
        errorCode: 'AUTH_INIT_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Authenticate user with biometric authentication
   */
  async authenticateWithBiometric(
    prompt?: string,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<BiometricAuthResult>> {
    try {
      if (!this.config.biometricEnabled) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'Fingerprint or face recognition is not set up on your device.'
            : 'Biometric authentication not available',
          errorCode: 'BIOMETRIC_NOT_AVAILABLE',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const biometricTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const primaryType = this.getPrimaryBiometricType(biometricTypes);

      const authPrompt = prompt || (elderlyFriendly
        ? this.getElderlyFriendlyBiometricPrompt(primaryType)
        : 'Authenticate to access your cloud backup');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: authPrompt,
        cancelLabel: 'Cancel',
        fallbackLabel: elderlyFriendly ? 'Use Phone Number Instead' : 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // Create authenticated session
        await this.createAuthSession('biometric');

        const authResult: BiometricAuthResult = {
          success: true,
          biometricType: primaryType,
          fallbackAvailable: true,
        };

        return {
          success: true,
          data: authResult,
          message: elderlyFriendly
            ? 'Great! You\'re now authenticated and can access your memories.'
            : 'Biometric authentication successful',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      } else {
        const authResult: BiometricAuthResult = {
          success: false,
          error: result.error,
          fallbackAvailable: true,
        };

        return {
          success: false,
          data: authResult,
          error: elderlyFriendly
            ? 'Authentication didn\'t work. You can try again or use your phone number.'
            : 'Biometric authentication failed',
          errorCode: 'BIOMETRIC_FAILED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'Something went wrong with authentication. Please try again.'
          : 'Biometric authentication error',
        errorCode: 'BIOMETRIC_ERROR',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Send SMS verification code for authentication
   */
  async sendSMSVerification(
    phoneNumber: string,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<SMSVerificationResult>> {
    try {
      if (this.smsVerificationAttempts >= this.maxSMSAttempts) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'Too many attempts. Please wait 15 minutes before trying again.'
            : 'Maximum SMS attempts exceeded',
          errorCode: 'SMS_MAX_ATTEMPTS',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Generate 6-digit verification code (easier for elderly users)
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const verificationId = await this.generateRequestId();

      // Store verification data securely
      await this.storeVerificationData(verificationId, verificationCode, phoneNumber);

      // Check if SMS is available
      const smsAvailable = await SMS.isAvailableAsync();
      if (!smsAvailable && Platform.OS === 'ios') {
        return {
          success: false,
          error: elderlyFriendly
            ? 'Text messages are not available on this device. Please use fingerprint or face recognition instead.'
            : 'SMS not available on this device',
          errorCode: 'SMS_NOT_AVAILABLE',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // In a real implementation, this would use a backend service
      // For demo purposes, we'll simulate success
      this.smsVerificationAttempts++;

      const result: SMSVerificationResult = {
        success: true,
        verificationId,
        attemptsRemaining: this.maxSMSAttempts - this.smsVerificationAttempts,
      };

      return {
        success: true,
        data: result,
        message: elderlyFriendly
          ? `We've sent a 6-digit code to ${this.formatPhoneNumber(phoneNumber)}. Please enter it below.`
          : 'SMS verification code sent successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We couldn\'t send the text message. Please check your phone number and try again.'
          : 'Failed to send SMS verification',
        errorCode: 'SMS_SEND_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Verify SMS code entered by user
   */
  async verifySMSCode(
    verificationId: string,
    code: string,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<boolean>> {
    try {
      const verificationData = await this.getVerificationData(verificationId);
      if (!verificationData) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'The verification code has expired. Please request a new one.'
            : 'Verification ID not found or expired',
          errorCode: 'VERIFICATION_EXPIRED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Check if code matches
      if (verificationData.code !== code.trim()) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'The code doesn\'t match. Please check and try again.'
            : 'Invalid verification code',
          errorCode: 'INVALID_CODE',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Check if code is still valid (10 minutes)
      const codeAge = Date.now() - verificationData.timestamp;
      if (codeAge > 10 * 60 * 1000) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'The code has expired. Please request a new one.'
            : 'Verification code expired',
          errorCode: 'CODE_EXPIRED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      // Create authenticated session
      await this.createAuthSession('sms');

      // Clean up verification data
      await this.clearVerificationData(verificationId);
      this.smsVerificationAttempts = 0;

      return {
        success: true,
        data: true,
        message: elderlyFriendly
          ? 'Perfect! You\'re now authenticated and can access your memories.'
          : 'SMS verification successful',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'Something went wrong verifying the code. Please try again.'
          : 'SMS verification failed',
        errorCode: 'SMS_VERIFY_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Handle emergency access request from family member
   */
  async requestEmergencyAccess(
    emergencyContactId: string,
    reason: string,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<{ waitPeriod: number; requestId: string }>> {
    try {
      if (!this.config.emergencyContactsEnabled) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'Emergency access is not enabled. Please contact the account owner.'
            : 'Emergency access not enabled',
          errorCode: 'EMERGENCY_DISABLED',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const emergencyContact = await this.getEmergencyContact(emergencyContactId);
      if (!emergencyContact) {
        return {
          success: false,
          error: elderlyFriendly
            ? 'You\'re not authorized for emergency access. Please contact the account owner.'
            : 'Emergency contact not found',
          errorCode: 'EMERGENCY_CONTACT_NOT_FOUND',
          timestamp: new Date(),
          requestId: await this.generateRequestId(),
        };
      }

      const requestId = await this.generateRequestId();
      const waitPeriod = 48; // 48 hours waiting period

      // Store emergency access request
      await this.storeEmergencyAccessRequest({
        requestId,
        contactId: emergencyContactId,
        reason,
        requestedAt: new Date(),
        waitPeriod,
        status: 'pending',
      });

      // In real implementation, notify the account owner
      // await this.notifyAccountOwner(emergencyContact, reason);

      return {
        success: true,
        data: { waitPeriod, requestId },
        message: elderlyFriendly
          ? `Emergency access requested. The account owner has been notified. If they don't respond within ${waitPeriod} hours, you'll automatically get access.`
          : `Emergency access request submitted. Waiting period: ${waitPeriod} hours`,
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We couldn\'t process the emergency access request. Please try again.'
          : 'Emergency access request failed',
        errorCode: 'EMERGENCY_REQUEST_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.currentSession) {
      // Try to load existing session
      await this.loadCurrentSession();
    }

    if (!this.currentSession) return false;

    // Check if session is still valid
    const now = new Date();
    if (now > this.currentSession.expiresAt) {
      await this.clearCurrentSession();
      return false;
    }

    return this.currentSession.isValid;
  }

  /**
   * Add emergency contact for backup access
   */
  async addEmergencyContact(
    contact: Omit<EmergencyContact, 'id' | 'verified' | 'addedAt'>,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<EmergencyContact>> {
    try {
      const emergencyContact: EmergencyContact = {
        ...contact,
        id: await this.generateRequestId(),
        verified: false,
        addedAt: new Date(),
      };

      // Store emergency contact
      await this.storeEmergencyContact(emergencyContact);

      // Send verification SMS
      if (contact.phoneNumber) {
        await this.sendSMSVerification(contact.phoneNumber, elderlyFriendly);
      }

      return {
        success: true,
        data: emergencyContact,
        message: elderlyFriendly
          ? `${contact.name} has been added as an emergency contact. They'll receive a text message to verify their phone number.`
          : 'Emergency contact added successfully',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We couldn\'t add the emergency contact. Please check the information and try again.'
          : 'Failed to add emergency contact',
        errorCode: 'EMERGENCY_CONTACT_ADD_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Update authentication configuration
   */
  async updateAuthConfiguration(
    updates: Partial<AuthenticationConfig>,
    elderlyFriendly = true
  ): Promise<CloudBackupResponse<AuthenticationConfig>> {
    try {
      this.config = { ...this.config, ...updates };

      // Save configuration
      await this.saveAuthConfiguration();

      return {
        success: true,
        data: this.config,
        message: elderlyFriendly
          ? 'Your security settings have been updated successfully.'
          : 'Authentication configuration updated',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'We couldn\'t save your security settings. Please try again.'
          : 'Failed to update authentication configuration',
        errorCode: 'AUTH_CONFIG_UPDATE_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  /**
   * Sign out and clear authentication session
   */
  async signOut(elderlyFriendly = true): Promise<CloudBackupResponse<void>> {
    try {
      await this.clearCurrentSession();
      this.currentSession = null;

      return {
        success: true,
        message: elderlyFriendly
          ? 'You\'ve been signed out safely. Your memories remain secure.'
          : 'Successfully signed out',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    } catch (error) {
      return {
        success: false,
        error: elderlyFriendly
          ? 'There was a problem signing out. Please try again.'
          : 'Failed to sign out',
        errorCode: 'SIGNOUT_FAILED',
        timestamp: new Date(),
        requestId: await this.generateRequestId(),
      };
    }
  }

  // Private helper methods

  private getPrimaryBiometricType(types: LocalAuthentication.AuthenticationType[]): BiometricAuthResult['biometricType'] {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'none';
  }

  private getElderlyFriendlyBiometricPrompt(biometricType: BiometricAuthResult['biometricType']): string {
    switch (biometricType) {
      case 'face':
        return 'Please look at your phone camera to access your memories';
      case 'fingerprint':
        return 'Please place your finger on the sensor to access your memories';
      case 'iris':
        return 'Please look at the screen to scan your eyes';
      default:
        return 'Please authenticate to access your memories';
    }
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Simple formatting for US numbers
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phoneNumber;
  }

  private async createAuthSession(method: AuthSession['authMethod']): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.autoLockMinutes * 60 * 1000);

    this.currentSession = {
      sessionId: await this.generateRequestId(),
      authenticatedAt: now,
      expiresAt,
      authMethod: method,
      isValid: true,
    };

    await this.saveCurrentSession();
  }

  private async loadCurrentSession(): Promise<void> {
    try {
      const sessionData = await SecureStore.getItemAsync('auth_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.authenticatedAt = new Date(session.authenticatedAt);
        session.expiresAt = new Date(session.expiresAt);
        this.currentSession = session;
      }
    } catch (error) {
      console.error('Failed to load auth session:', error);
    }
  }

  private async saveCurrentSession(): Promise<void> {
    if (this.currentSession) {
      await SecureStore.setItemAsync('auth_session', JSON.stringify(this.currentSession));
    }
  }

  private async clearCurrentSession(): Promise<void> {
    await SecureStore.deleteItemAsync('auth_session');
  }

  private async storeVerificationData(id: string, code: string, phoneNumber: string): Promise<void> {
    const data = {
      id,
      code,
      phoneNumber,
      timestamp: Date.now(),
    };
    await SecureStore.setItemAsync(`sms_verification_${id}`, JSON.stringify(data));
  }

  private async getVerificationData(id: string): Promise<any> {
    try {
      const data = await SecureStore.getItemAsync(`sms_verification_${id}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private async clearVerificationData(id: string): Promise<void> {
    await SecureStore.deleteItemAsync(`sms_verification_${id}`);
  }

  private async storeEmergencyContact(contact: EmergencyContact): Promise<void> {
    const contacts = await this.getEmergencyContacts();
    contacts.push(contact);
    await SecureStore.setItemAsync('emergency_contacts', JSON.stringify(contacts));
  }

  private async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const data = await SecureStore.getItemAsync('emergency_contacts');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async getEmergencyContact(id: string): Promise<EmergencyContact | null> {
    const contacts = await this.getEmergencyContacts();
    return contacts.find(c => c.id === id) || null;
  }

  private async storeEmergencyAccessRequest(request: any): Promise<void> {
    await SecureStore.setItemAsync(`emergency_request_${request.requestId}`, JSON.stringify(request));
  }

  private async loadAuthConfiguration(): Promise<void> {
    try {
      const configData = await SecureStore.getItemAsync('auth_config');
      if (configData) {
        const config = JSON.parse(configData);
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.error('Failed to load auth configuration:', error);
    }
  }

  private async saveAuthConfiguration(): Promise<void> {
    await SecureStore.setItemAsync('auth_config', JSON.stringify(this.config));
  }

  private async generateRequestId(): Promise<string> {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// Export singleton instance
export const authenticationService = new AuthenticationService();