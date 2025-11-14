/**
 * Family Sharing TypeScript interfaces for Memoria.ai
 * Designed with Chinese cultural values and multi-generational households in mind
 * Supports traditional family hierarchy while enabling modern technology sharing
 */

export type ChineseFamilyRole =
  | 'elder'        // 长辈 - Grandparents, elderly aunts/uncles
  | 'parent'       // 父母 - Parents, middle generation
  | 'child'        // 子女 - Children, younger generation
  | 'spouse'       // 配偶 - Spouse of family member
  | 'caregiver'    // 照顾者 - Professional or family caregiver
  | 'family_friend'; // 家庭朋友 - Close family friends

export type FamilyPermissionLevel =
  | 'full_access'    // Can view, share, and manage all family memories
  | 'family_view'    // Can view shared family memories, limited sharing
  | 'limited_view'   // Can view only specific shared memories
  | 'emergency_only' // Access only in emergency situations
  | 'no_access';     // No access to memories

export type ChineseRelationship =
  | 'grandmother'   // 奶奶/外婆
  | 'grandfather'   // 爷爷/外公
  | 'mother'        // 妈妈/母亲
  | 'father'        // 爸爸/父亲
  | 'daughter'      // 女儿
  | 'son'           // 儿子
  | 'wife'          // 妻子
  | 'husband'       // 丈夫
  | 'sister'        // 姐姐/妹妹
  | 'brother'       // 哥哥/弟弟
  | 'aunt'          // 姑姑/阿姨
  | 'uncle'         // 叔叔/舅舅
  | 'cousin'        // 表兄弟姐妹/堂兄弟姐妹
  | 'daughter_in_law' // 儿媳
  | 'son_in_law'    // 女婿
  | 'caregiver'     // 照顾者
  | 'family_friend'; // 家庭朋友

export interface ChineseRelationshipLabels {
  en: string;
  zh: string;
  pinyin?: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  familyId: string;
  name: string;
  displayName: string; // How they want to be addressed
  email?: string;
  phoneNumber?: string;

  // Cultural and hierarchical information
  role: ChineseFamilyRole;
  relationship: ChineseRelationship;
  relationshipLabels: ChineseRelationshipLabels;
  generationLevel: number; // 1=eldest generation, 2=parents, 3=children, etc.
  isElder: boolean; // Requires special respect in Chinese culture

  // Permissions and access
  permissionLevel: FamilyPermissionLevel;
  canInviteMembers: boolean;
  canManageFamily: boolean;
  canAccessEmergency: boolean;

  // Personal settings
  preferredLanguage: 'en' | 'zh';
  timeZone: string;
  avatar?: string;

  // Status and activity
  isActive: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
  invitedBy?: string; // userId of who invited them
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface FamilyCircle {
  id: string;
  name: string;
  displayName: ChineseRelationshipLabels;
  description?: string;

  // Family structure
  primaryElder: string; // userId of the main elderly person
  familyHead?: string; // Traditional family head (usually eldest male)
  members: FamilyMember[];
  invitations: FamilyInvitation[];

  // Cultural settings
  culturalTradition: 'traditional' | 'modern' | 'mixed';
  primaryLanguage: 'en' | 'zh' | 'bilingual';
  respectProtocol: 'strict' | 'moderate' | 'relaxed';

  // Family preferences
  allowsMemorySharing: boolean;
  requiresElderApproval: boolean; // For major decisions
  enablesCulturalPrompts: boolean;
  usesChineseCalendar: boolean;

  // Privacy and security
  familyPrivacyLevel: 'open' | 'restricted' | 'private';
  emergencyAccessEnabled: boolean;
  emergencyContacts: string[]; // userIds

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // userId
}

export interface FamilyInvitation {
  id: string;
  familyId: string;
  invitedBy: string; // userId
  invitedEmail: string;
  invitedPhone?: string;

  // Invitation details
  proposedRole: ChineseFamilyRole;
  proposedRelationship: ChineseRelationship;
  proposedPermissionLevel: FamilyPermissionLevel;
  personalMessage?: string;

  // Cultural context
  invitationLanguage: 'en' | 'zh';
  culturalGreeting?: string;
  respectfulTitle?: string;

  // Status and timing
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  sentAt: Date;
  expiresAt: Date;
  respondedAt?: Date;
  reminderSentAt?: Date[];
}

export interface MemorySharing {
  id: string;
  memoryId: string;
  familyId: string;
  sharedBy: string; // userId

  // Sharing configuration
  sharedWith: string[]; // userIds, empty array = shared with all family
  shareLevel: 'family_wide' | 'specific_members' | 'elder_only' | 'generation_specific';
  allowsComments: boolean;
  allowsCollaboration: boolean;

  // Cultural considerations
  culturalContext?: string; // Holiday, celebration, tradition
  respectLevel: 'public' | 'family_only' | 'elder_private';
  traditionalSignificance?: string;

  // Permissions
  canDownload: boolean;
  canShare: boolean;
  canEdit: boolean; // For adding context, not modifying original

  // Activity tracking
  sharedAt: Date;
  viewedBy: { userId: string; viewedAt: Date }[];
  commentsCount: number;
  lastActivityAt: Date;
}

export interface FamilyMemoryCollection {
  id: string;
  familyId: string;
  createdBy: string; // userId

  // Collection details
  title: string;
  titleLabels: ChineseRelationshipLabels;
  description?: string;
  coverImage?: string;

  // Cultural context
  occasion?: 'spring_festival' | 'mid_autumn' | 'birthday' | 'wedding' | 'funeral' | 'anniversary' | 'custom';
  chineseHoliday?: string;
  culturalSignificance?: string;
  traditionDescription?: string;

  // Content
  memoryIds: string[];
  sharedMemories: MemorySharing[];
  collaborativeNotes?: string;
  familyContributions: FamilyContribution[];

  // Access and permissions
  visibility: 'family_wide' | 'elder_only' | 'generation_specific' | 'custom';
  allowedViewers: string[]; // userIds
  allowsContributions: boolean;
  requiresElderApproval: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastContributionAt?: Date;
}

export interface FamilyContribution {
  id: string;
  collectionId: string;
  contributedBy: string; // userId

  // Contribution content
  type: 'memory' | 'note' | 'context' | 'photo' | 'translation';
  content: string;
  attachments?: string[]; // file paths or URLs

  // Cultural context
  relationship?: ChineseRelationship; // How contributor relates to memory
  perspective?: string; // Their perspective on the memory
  culturalNote?: string;
  language: 'en' | 'zh';

  // Metadata
  contributedAt: Date;
  approved: boolean;
  approvedBy?: string; // userId
  approvedAt?: Date;
}

export interface FamilyNotification {
  id: string;
  familyId: string;
  recipientId: string; // userId
  senderId?: string; // userId, if null it's a system notification

  // Notification content
  type: 'memory_shared' | 'invitation' | 'memory_commented' | 'collection_created' | 'holiday_reminder' | 'elder_activity' | 'emergency';
  title: string;
  titleLabels: ChineseRelationshipLabels;
  message: string;
  messageLabels: ChineseRelationshipLabels;

  // Cultural considerations
  respectLevel: 'formal' | 'casual' | 'intimate';
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  culturalContext?: string;

  // Related data
  relatedMemoryId?: string;
  relatedCollectionId?: string;
  relatedUserId?: string;
  actionUrl?: string;

  // Status and timing
  isRead: boolean;
  sentAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  priority: number; // 1-10, higher = more important
}

export interface CulturalCalendarEvent {
  id: string;
  name: string;
  nameLabels: ChineseRelationshipLabels;
  description?: string;
  descriptionLabels?: ChineseRelationshipLabels;

  // Date and timing
  date: Date;
  isRecurring: boolean;
  recurrencePattern?: string; // cron-like pattern
  duration?: number; // in days

  // Cultural information
  type: 'traditional_holiday' | 'family_celebration' | 'memorial' | 'seasonal' | 'custom';
  culturalSignificance: string;
  traditionalActivities: string[];
  familyTraditions?: string[];

  // Family context
  familyId?: string; // null for universal holidays
  isPrivate: boolean;
  customForFamily: boolean;

  // Memory prompts
  memoryPrompts: CulturalMemoryPrompt[];
  encouragesSharing: boolean;
  suggestedActivities: string[];
}

export interface CulturalMemoryPrompt {
  id: string;
  eventId?: string; // related cultural event

  // Prompt content
  prompt: string;
  promptLabels: ChineseRelationshipLabels;
  context?: string;
  contextLabels?: ChineseRelationshipLabels;

  // Targeting
  targetRole?: ChineseFamilyRole;
  targetGeneration?: number;
  culturalRelevance: 'universal' | 'chinese_traditional' | 'modern_chinese' | 'bilingual_family';

  // Metadata
  category: 'childhood' | 'tradition' | 'family_history' | 'celebration' | 'wisdom' | 'daily_life';
  difficulty: 'simple' | 'moderate' | 'detailed';
  estimatedDuration: number; // in minutes
  tags: string[];
}

export interface FamilyEmergencyAccess {
  id: string;
  familyId: string;
  elderId: string; // The elderly person's userId

  // Emergency contacts
  emergencyContacts: {
    userId: string;
    relationship: ChineseRelationship;
    accessLevel: FamilyPermissionLevel;
    contactInfo: {
      phone: string;
      email: string;
      address?: string;
    };
  }[];

  // Emergency procedures
  triggerConditions: string[];
  accessProcedure: string;
  requiredVerification: 'phone' | 'email' | 'both' | 'in_person';
  maxAccessDuration: number; // in hours

  // Legal and medical
  medicalInformation?: string;
  legalDocuments?: string[];
  emergencyInstructions: string;
  culturalConsiderations: string;

  // Activity logging
  lastTestDate?: Date;
  accessHistory: {
    accessedBy: string;
    accessedAt: Date;
    reason: string;
    duration: number;
    verified: boolean;
  }[];

  // Settings
  isActive: boolean;
  requiresFamilyConsent: boolean;
  notifyAllMembers: boolean;
  updatedAt: Date;
  updatedBy: string;
}

export interface FamilySettings {
  familyId: string;

  // Cultural preferences
  culturalTradition: 'traditional' | 'modern' | 'mixed';
  respectProtocol: 'strict' | 'moderate' | 'relaxed';
  languagePreference: 'en' | 'zh' | 'bilingual';
  useTraditionalTitles: boolean;

  // Privacy and sharing
  defaultSharingLevel: 'family_wide' | 'elder_approval' | 'restricted';
  requireElderApproval: boolean;
  allowExternalSharing: boolean;
  memoryRetentionPolicy: string;

  // Communication
  notificationFrequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  preferredCommunicationTime: string; // HH:MM
  timeZoneHandling: 'sender' | 'receiver' | 'family_primary';
  culturalGreetingsEnabled: boolean;

  // Features
  enableCulturalCalendar: boolean;
  enableMemoryPrompts: boolean;
  enableCollaborativeMemories: boolean;
  enableEmergencyAccess: boolean;
  autoTranslationEnabled: boolean;

  // Technical
  dataRetentionDays: number;
  backupSettings: {
    frequency: 'daily' | 'weekly' | 'monthly';
    includeFamily: boolean;
    encryptionLevel: 'standard' | 'enhanced';
  };

  updatedAt: Date;
  updatedBy: string;
}

// Helper types for API requests
export interface CreateFamilyRequest {
  name: string;
  displayName: ChineseRelationshipLabels;
  primaryLanguage: 'en' | 'zh' | 'bilingual';
  culturalTradition: 'traditional' | 'modern' | 'mixed';
  elderId?: string; // If creating for an existing elderly user
}

export interface InviteFamilyMemberRequest {
  familyId: string;
  email: string;
  phone?: string;
  proposedRole: ChineseFamilyRole;
  proposedRelationship: ChineseRelationship;
  proposedPermissionLevel: FamilyPermissionLevel;
  personalMessage?: string;
  invitationLanguage: 'en' | 'zh';
  culturalGreeting?: string;
}

export interface UpdateFamilyMemberRequest {
  familyMemberId: string;
  role?: ChineseFamilyRole;
  relationship?: ChineseRelationship;
  permissionLevel?: FamilyPermissionLevel;
  displayName?: string;
  relationshipLabels?: ChineseRelationshipLabels;
}

export interface ShareMemoryWithFamilyRequest {
  memoryId: string;
  familyId: string;
  shareLevel: 'family_wide' | 'specific_members' | 'elder_only' | 'generation_specific';
  sharedWith?: string[]; // userIds, required if shareLevel is 'specific_members'
  allowsComments: boolean;
  allowsCollaboration: boolean;
  culturalContext?: string;
  respectLevel: 'public' | 'family_only' | 'elder_private';
}

export interface CreateMemoryCollectionRequest {
  familyId: string;
  title: string;
  titleLabels: ChineseRelationshipLabels;
  description?: string;
  occasion?: string;
  chineseHoliday?: string;
  culturalSignificance?: string;
  visibility: 'family_wide' | 'elder_only' | 'generation_specific' | 'custom';
  allowedViewers?: string[]; // userIds, required if visibility is 'custom'
  allowsContributions: boolean;
  requiresElderApproval: boolean;
}

// Utility types for family hierarchy management
export interface FamilyHierarchy {
  familyId: string;
  generations: {
    level: number;
    name: string;
    nameLabels: ChineseRelationshipLabels;
    members: FamilyMember[];
    elderAuthority?: string; // userId of the generation elder
  }[];
  familyHead?: string; // userId
  primaryElder: string; // userId
  decisionMakers: string[]; // userIds who can make family decisions
}

export interface FamilyStats {
  familyId: string;
  totalMembers: number;
  activeMembers: number;
  generationCount: number;
  sharedMemories: number;
  familyCollections: number;
  totalFamilyMemoryTime: number;
  lastFamilyActivity: Date;
  membersByRole: Record<ChineseFamilyRole, number>;
  membersByGeneration: Record<number, number>;
  languageBreakdown: {
    english: number;
    chinese: number;
    bilingual: number;
  };
}