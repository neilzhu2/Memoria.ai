/**
 * Family Backup Permissions Component for Memoria.ai
 * Manages family member access to cloud backups with granular permissions
 * Designed for elderly users with clear, simple controls and family-friendly interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  FamilyMember,
  FamilyPermissions,
  EmergencyAccess,
  CloudBackupResponse,
} from '../../types/cloudBackup';

interface FamilyBackupPermissionsProps {
  visible: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
}

interface InviteMemberData {
  name: string;
  email: string;
  relationshipType: FamilyMember['relationshipType'];
  permissions: FamilyPermissions;
}

export const FamilyBackupPermissions: React.FC<FamilyBackupPermissionsProps> = ({
  visible,
  onClose,
  onPermissionsUpdated,
}) => {
  const { theme, getCurrentFontSize, getCurrentTouchTargetSize } = useSettingsStore();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [emergencyAccess, setEmergencyAccess] = useState<EmergencyAccess>({
    enabled: false,
    waitPeriod: 48,
    notificationContacts: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [inviteData, setInviteData] = useState<InviteMemberData>({
    name: '',
    email: '',
    relationshipType: 'child',
    permissions: {
      canViewBackups: true,
      canRestoreMemories: false,
      canModifySettings: false,
      canInviteMembers: false,
      emergencyAccess: false,
      accessLevel: 'read-only',
      memoryCategories: [],
    },
  });

  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();

  const relationshipTypes: { value: FamilyMember['relationshipType']; label: string }[] = [
    { value: 'spouse', label: 'Spouse/Partner' },
    { value: 'child', label: 'Son/Daughter' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Brother/Sister' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'other', label: 'Other Family' },
  ];

  const accessLevels: { value: FamilyPermissions['accessLevel']; label: string; description: string }[] = [
    {
      value: 'read-only',
      label: 'View Only',
      description: 'Can only view memories, cannot make changes',
    },
    {
      value: 'standard',
      label: 'Standard Access',
      description: 'Can view and restore memories',
    },
    {
      value: 'admin',
      label: 'Full Access',
      description: 'Can manage all backup settings and invite others',
    },
  ];

  useEffect(() => {
    if (visible) {
      loadFamilySettings();
    }
  }, [visible]);

  const loadFamilySettings = async () => {
    try {
      setIsLoading(true);

      // Mock data for demonstration
      const mockFamilyMembers: FamilyMember[] = [
        {
          id: 'member1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          relationshipType: 'child',
          permissions: {
            canViewBackups: true,
            canRestoreMemories: true,
            canModifySettings: false,
            canInviteMembers: false,
            emergencyAccess: true,
            accessLevel: 'standard',
            memoryCategories: ['family', 'celebrations'],
          },
          inviteStatus: 'accepted',
          invitedAt: new Date('2024-01-15'),
          acceptedAt: new Date('2024-01-16'),
          lastAccessAt: new Date('2024-01-20'),
        },
        {
          id: 'member2',
          name: 'Michael Johnson',
          email: 'mike@example.com',
          relationshipType: 'child',
          permissions: {
            canViewBackups: true,
            canRestoreMemories: false,
            canModifySettings: false,
            canInviteMembers: false,
            emergencyAccess: false,
            accessLevel: 'read-only',
            memoryCategories: ['family'],
          },
          inviteStatus: 'pending',
          invitedAt: new Date('2024-01-18'),
        },
      ];

      const mockEmergencyAccess: EmergencyAccess = {
        enabled: true,
        waitPeriod: 48,
        notificationContacts: ['sarah@example.com'],
      };

      setFamilyMembers(mockFamilyMembers);
      setEmergencyAccess(mockEmergencyAccess);
    } catch (error) {
      Alert.alert('Error', 'Failed to load family settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteData.name.trim() || !inviteData.email.trim()) {
      Alert.alert('Missing Information', 'Please enter both name and email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    try {
      // In real implementation, send invitation
      const newMember: FamilyMember = {
        id: `member_${Date.now()}`,
        name: inviteData.name,
        email: inviteData.email,
        relationshipType: inviteData.relationshipType,
        permissions: inviteData.permissions,
        inviteStatus: 'pending',
        invitedAt: new Date(),
      };

      setFamilyMembers(prev => [...prev, newMember]);
      setShowInviteModal(false);
      resetInviteData();

      Alert.alert(
        'Invitation Sent',
        `We've sent an invitation to ${inviteData.name} at ${inviteData.email}. They'll receive instructions on how to access your memories.`,
        [{ text: 'OK' }]
      );

      onPermissionsUpdated?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    }
  };

  const resetInviteData = () => {
    setInviteData({
      name: '',
      email: '',
      relationshipType: 'child',
      permissions: {
        canViewBackups: true,
        canRestoreMemories: false,
        canModifySettings: false,
        canInviteMembers: false,
        emergencyAccess: false,
        accessLevel: 'read-only',
        memoryCategories: [],
      },
    });
  };

  const handleUpdateMemberPermissions = (memberId: string, newPermissions: Partial<FamilyPermissions>) => {
    setFamilyMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? { ...member, permissions: { ...member.permissions, ...newPermissions } }
          : member
      )
    );
    onPermissionsUpdated?.();
  };

  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member.name} from your family backup sharing?\n\nThey will no longer be able to access your memories.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFamilyMembers(prev => prev.filter(m => m.id !== member.id));
            onPermissionsUpdated?.();
          },
        },
      ]
    );
  };

  const handleUpdateEmergencyAccess = (updates: Partial<EmergencyAccess>) => {
    setEmergencyAccess(prev => ({ ...prev, ...updates }));
    onPermissionsUpdated?.();
  };

  const getStatusColor = (status: FamilyMember['inviteStatus']) => {
    switch (status) {
      case 'accepted':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'declined':
      case 'expired':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: FamilyMember['inviteStatus']) => {
    switch (status) {
      case 'accepted':
        return 'Active';
      case 'pending':
        return 'Invitation Pending';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Invitation Expired';
      default:
        return status;
    }
  };

  const formatLastAccess = (date?: Date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderFamilyMember = ({ item: member }: { item: FamilyMember }) => (
    <View style={[styles.memberCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.memberHeader}>
        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
            {member.name}
          </Text>
          <Text style={[styles.memberEmail, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
            {member.email}
          </Text>
          <View style={styles.memberMeta}>
            <Text style={[styles.memberRelation, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
              {relationshipTypes.find(r => r.value === member.relationshipType)?.label}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(member.inviteStatus) + '20' },
              ]}
            >
              <Text style={[styles.statusText, { color: getStatusColor(member.inviteStatus), fontSize: fontSize - 2 }]}>
                {getStatusText(member.inviteStatus)}
              </Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.removeButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
          onPress={() => handleRemoveMember(member)}
        >
          <Text style={[styles.removeButtonText, { color: theme.colors.error, fontSize: fontSize }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {member.inviteStatus === 'accepted' && (
        <>
          <Text style={[styles.permissionsTitle, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
            Access Level
          </Text>
          <View style={styles.accessLevelContainer}>
            {accessLevels.map(level => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.accessLevelOption,
                  {
                    backgroundColor: member.permissions.accessLevel === level.value
                      ? theme.colors.primary + '20'
                      : 'transparent',
                    borderColor: member.permissions.accessLevel === level.value
                      ? theme.colors.primary
                      : theme.colors.border,
                    minHeight: touchTargetSize,
                  },
                ]}
                onPress={() => handleUpdateMemberPermissions(member.id, { accessLevel: level.value })}
              >
                <Text
                  style={[
                    styles.accessLevelTitle,
                    {
                      color: member.permissions.accessLevel === level.value
                        ? theme.colors.primary
                        : theme.colors.text,
                      fontSize: fontSize,
                    },
                  ]}
                >
                  {level.label}
                  {member.permissions.accessLevel === level.value && ' ✓'}
                </Text>
                <Text
                  style={[
                    styles.accessLevelDescription,
                    { color: theme.colors.textSecondary, fontSize: fontSize - 1 },
                  ]}
                >
                  {level.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.permissionsSection}>
            <Text style={[styles.permissionsTitle, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              Special Permissions
            </Text>
            <View style={styles.permissionRow}>
              <View style={styles.permissionInfo}>
                <Text style={[styles.permissionLabel, { color: theme.colors.text, fontSize: fontSize }]}>
                  Emergency Access
                </Text>
                <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
                  Can request emergency access to your memories
                </Text>
              </View>
              <Switch
                value={member.permissions.emergencyAccess}
                onValueChange={(value) => handleUpdateMemberPermissions(member.id, { emergencyAccess: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={member.permissions.emergencyAccess ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>

          <Text style={[styles.lastAccessText, { color: theme.colors.textSecondary, fontSize: fontSize - 1 }]}>
            Last access: {formatLastAccess(member.lastAccessAt)}
          </Text>
        </>
      )}
    </View>
  );

  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.modalCloseButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={() => setShowInviteModal(false)}
          >
            <Text style={[styles.modalCloseText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
            Invite Family Member
          </Text>
          <TouchableOpacity
            style={[styles.modalSaveButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={handleInviteMember}
          >
            <Text style={[styles.modalSaveText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              Name *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  fontSize: fontSize + 2,
                  minHeight: touchTargetSize,
                },
              ]}
              value={inviteData.name}
              onChangeText={(text) => setInviteData(prev => ({ ...prev, name: text }))}
              placeholder="Enter family member's name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              Email Address *
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  fontSize: fontSize + 2,
                  minHeight: touchTargetSize,
                },
              ]}
              value={inviteData.email}
              onChangeText={(text) => setInviteData(prev => ({ ...prev, email: text }))}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              Relationship
            </Text>
            <View style={styles.relationshipOptions}>
              {relationshipTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.relationshipOption,
                    {
                      backgroundColor: inviteData.relationshipType === type.value
                        ? theme.colors.primary + '20'
                        : theme.colors.surface,
                      borderColor: inviteData.relationshipType === type.value
                        ? theme.colors.primary
                        : theme.colors.border,
                      minHeight: touchTargetSize,
                    },
                  ]}
                  onPress={() => setInviteData(prev => ({ ...prev, relationshipType: type.value }))}
                >
                  <Text
                    style={[
                      styles.relationshipOptionText,
                      {
                        color: inviteData.relationshipType === type.value
                          ? theme.colors.primary
                          : theme.colors.text,
                        fontSize: fontSize,
                      },
                    ]}
                  >
                    {type.label}
                    {inviteData.relationshipType === type.value && ' ✓'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
              Initial Access Level
            </Text>
            <View style={styles.accessLevelContainer}>
              {accessLevels.map(level => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.accessLevelOption,
                    {
                      backgroundColor: inviteData.permissions.accessLevel === level.value
                        ? theme.colors.primary + '20'
                        : 'transparent',
                      borderColor: inviteData.permissions.accessLevel === level.value
                        ? theme.colors.primary
                        : theme.colors.border,
                      minHeight: touchTargetSize,
                    },
                  ]}
                  onPress={() => setInviteData(prev => ({
                    ...prev,
                    permissions: { ...prev.permissions, accessLevel: level.value },
                  }))}
                >
                  <Text
                    style={[
                      styles.accessLevelTitle,
                      {
                        color: inviteData.permissions.accessLevel === level.value
                          ? theme.colors.primary
                          : theme.colors.text,
                        fontSize: fontSize,
                      },
                    ]}
                  >
                    {level.label}
                    {inviteData.permissions.accessLevel === level.value && ' ✓'}
                  </Text>
                  <Text
                    style={[
                      styles.accessLevelDescription,
                      { color: theme.colors.textSecondary, fontSize: fontSize - 1 },
                    ]}
                  >
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.inviteNote, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.inviteNoteText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              💌 They'll receive an email invitation with instructions on how to access your memories.
              You can change their permissions anytime after they accept.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (isLoading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
              Loading family settings...
            </Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.closeButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: theme.colors.primary, fontSize: fontSize + 2 }]}>
              Done
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: fontSize + 6 }]}>
            Family Sharing
          </Text>
          <TouchableOpacity
            style={[styles.addButton, { minHeight: touchTargetSize, minWidth: touchTargetSize }]}
            onPress={() => setShowInviteModal(true)}
          >
            <Text style={[styles.addButtonText, { color: theme.colors.primary, fontSize: fontSize + 4 }]}>
              +
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Family Members */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              Family Members ({familyMembers.length})
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              Share your precious memories with family members safely and securely.
            </Text>

            {familyMembers.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary, fontSize: fontSize + 1 }]}>
                  No family members invited yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                  Tap the + button to invite your first family member
                </Text>
              </View>
            ) : (
              <FlatList
                data={familyMembers}
                keyExtractor={(item) => item.id}
                renderItem={renderFamilyMember}
                scrollEnabled={false}
              />
            )}
          </View>

          {/* Emergency Access */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: fontSize + 4 }]}>
              Emergency Access
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              Allow family members to request access to your memories in case of emergency.
            </Text>

            <View style={[styles.emergencyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.emergencyHeader}>
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyTitle, { color: theme.colors.text, fontSize: fontSize + 2 }]}>
                    Enable Emergency Access
                  </Text>
                  <Text style={[styles.emergencyDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    Family members can request emergency access with a waiting period
                  </Text>
                </View>
                <Switch
                  value={emergencyAccess.enabled}
                  onValueChange={(value) => handleUpdateEmergencyAccess({ enabled: value })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                  thumbColor={emergencyAccess.enabled ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>

              {emergencyAccess.enabled && (
                <View style={styles.emergencySettings}>
                  <Text style={[styles.emergencySettingLabel, { color: theme.colors.text, fontSize: fontSize + 1 }]}>
                    Waiting Period: {emergencyAccess.waitPeriod} hours
                  </Text>
                  <Text style={[styles.emergencySettingDescription, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
                    How long before emergency access is granted automatically
                  </Text>

                  <View style={styles.waitPeriodOptions}>
                    {[24, 48, 72].map(hours => (
                      <TouchableOpacity
                        key={hours}
                        style={[
                          styles.waitPeriodOption,
                          {
                            backgroundColor: emergencyAccess.waitPeriod === hours
                              ? theme.colors.primary + '20'
                              : 'transparent',
                            borderColor: emergencyAccess.waitPeriod === hours
                              ? theme.colors.primary
                              : theme.colors.border,
                            minHeight: touchTargetSize,
                          },
                        ]}
                        onPress={() => handleUpdateEmergencyAccess({ waitPeriod: hours })}
                      >
                        <Text
                          style={[
                            styles.waitPeriodText,
                            {
                              color: emergencyAccess.waitPeriod === hours
                                ? theme.colors.primary
                                : theme.colors.text,
                              fontSize: fontSize,
                            },
                          ]}
                        >
                          {hours} hours
                          {emergencyAccess.waitPeriod === hours && ' ✓'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={[styles.privacyNotice, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.privacyTitle, { color: theme.colors.success, fontSize: fontSize + 1 }]}>
              🔒 Your Privacy is Protected
            </Text>
            <Text style={[styles.privacyText, { color: theme.colors.textSecondary, fontSize: fontSize }]}>
              • Family members can only access what you explicitly allow{'\n'}
              • All data remains encrypted and secure{'\n'}
              • You can revoke access anytime{'\n'}
              • Emergency access has built-in safeguards and notifications
            </Text>
          </View>
        </ScrollView>

        {renderInviteModal()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  addButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    marginBottom: 16,
    lineHeight: 22,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyStateSubtext: {},
  memberCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  memberEmail: {
    marginBottom: 8,
  },
  memberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberRelation: {
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontWeight: 'bold',
  },
  removeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  removeButtonText: {
    fontWeight: 'bold',
  },
  permissionsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  accessLevelContainer: {
    marginBottom: 16,
  },
  accessLevelOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  accessLevelTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  accessLevelDescription: {
    lineHeight: 18,
  },
  permissionsSection: {
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  permissionInfo: {
    flex: 1,
    marginRight: 16,
  },
  permissionLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionDescription: {
    lineHeight: 18,
  },
  lastAccessText: {
    textAlign: 'right',
  },
  emergencyCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  emergencyInfo: {
    flex: 1,
    marginRight: 16,
  },
  emergencyTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emergencyDescription: {
    lineHeight: 20,
  },
  emergencySettings: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  emergencySettingLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  emergencySettingDescription: {
    marginBottom: 12,
    lineHeight: 20,
  },
  waitPeriodOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  waitPeriodOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  waitPeriodText: {
    fontWeight: '500',
  },
  privacyNotice: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  privacyText: {
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontWeight: 'bold',
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  modalSaveButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  relationshipOptions: {},
  relationshipOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    alignItems: 'center',
  },
  relationshipOptionText: {
    fontWeight: '500',
  },
  inviteNote: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  inviteNoteText: {
    lineHeight: 22,
  },
});

export default FamilyBackupPermissions;