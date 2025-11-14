/**
 * Family Store using Zustand for Memoria.ai
 * Manages family sharing with cultural sensitivity for Chinese families
 * Designed for multi-generational households and traditional hierarchy
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  FamilyCircle,
  FamilyMember,
  FamilyInvitation,
  MemorySharing,
  FamilyMemoryCollection,
  FamilyNotification,
  CulturalCalendarEvent,
  FamilyEmergencyAccess,
  FamilySettings,
  FamilyHierarchy,
  FamilyStats,
  ChineseFamilyRole,
  ChineseRelationship,
  FamilyPermissionLevel,
  CreateFamilyRequest,
  InviteFamilyMemberRequest,
  ShareMemoryWithFamilyRequest,
  CreateMemoryCollectionRequest,
  LoadingState
} from '../types';

interface FamilyState {
  // Core family data
  families: FamilyCircle[];
  currentFamily: FamilyCircle | null;
  familyMembers: FamilyMember[];
  familyInvitations: FamilyInvitation[];

  // Memory sharing
  sharedMemories: MemorySharing[];
  familyCollections: FamilyMemoryCollection[];

  // Communication and notifications
  familyNotifications: FamilyNotification[];
  unreadNotificationCount: number;

  // Cultural features
  culturalEvents: CulturalCalendarEvent[];
  upcomingHolidays: CulturalCalendarEvent[];

  // Emergency and settings
  emergencyAccess: FamilyEmergencyAccess | null;
  familySettings: FamilySettings | null;

  // Analytics and hierarchy
  familyHierarchy: FamilyHierarchy | null;
  familyStats: FamilyStats | null;

  // UI state
  loadingState: LoadingState;
  selectedMemberId: string | null;
  selectedCollectionId: string | null;

  // Actions - Family Management
  setFamilies: (families: FamilyCircle[]) => void;
  setCurrentFamily: (family: FamilyCircle | null) => void;
  createFamily: (request: CreateFamilyRequest) => Promise<void>;
  updateFamily: (familyId: string, updates: Partial<FamilyCircle>) => void;
  deleteFamily: (familyId: string) => void;

  // Family Member Management
  setFamilyMembers: (members: FamilyMember[]) => void;
  inviteFamilyMember: (request: InviteFamilyMemberRequest) => Promise<void>;
  updateFamilyMember: (memberId: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (memberId: string) => void;
  approveFamilyMember: (memberId: string) => void;
  setMemberPermissions: (memberId: string, permission: FamilyPermissionLevel) => void;

  // Invitation Management
  setFamilyInvitations: (invitations: FamilyInvitation[]) => void;
  sendInvitation: (invitation: FamilyInvitation) => Promise<void>;
  respondToInvitation: (invitationId: string, response: 'accepted' | 'declined') => void;
  cancelInvitation: (invitationId: string) => void;
  resendInvitation: (invitationId: string) => void;

  // Memory Sharing
  setSharedMemories: (memories: MemorySharing[]) => void;
  shareMemoryWithFamily: (request: ShareMemoryWithFamilyRequest) => Promise<void>;
  updateMemorySharing: (sharingId: string, updates: Partial<MemorySharing>) => void;
  unshareMemory: (sharingId: string) => void;
  getSharedMemoriesForMember: (memberId: string) => MemorySharing[];
  getSharedMemoriesForFamily: (familyId: string) => MemorySharing[];

  // Family Collections
  setFamilyCollections: (collections: FamilyMemoryCollection[]) => void;
  createFamilyCollection: (request: CreateMemoryCollectionRequest) => Promise<void>;
  updateFamilyCollection: (collectionId: string, updates: Partial<FamilyMemoryCollection>) => void;
  deleteFamilyCollection: (collectionId: string) => void;
  addMemoryToCollection: (collectionId: string, memoryId: string) => void;
  removeMemoryFromCollection: (collectionId: string, memoryId: string) => void;

  // Cultural Features
  setCulturalEvents: (events: CulturalCalendarEvent[]) => void;
  getUpcomingHolidays: (daysAhead?: number) => CulturalCalendarEvent[];
  getFamilyHolidays: (familyId: string) => CulturalCalendarEvent[];
  createCustomEvent: (event: Omit<CulturalCalendarEvent, 'id'>) => void;

  // Notifications
  setFamilyNotifications: (notifications: FamilyNotification[]) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  sendFamilyNotification: (notification: Omit<FamilyNotification, 'id' | 'sentAt'>) => void;

  // Family Hierarchy and Permissions
  buildFamilyHierarchy: (familyId: string) => void;
  updateFamilyHierarchy: (hierarchy: FamilyHierarchy) => void;
  getFamilyElders: (familyId: string) => FamilyMember[];
  getFamilyByGeneration: (familyId: string, generation: number) => FamilyMember[];
  checkPermission: (memberId: string, action: string) => boolean;
  requiresElderApproval: (action: string, familyId: string) => boolean;

  // Emergency Access
  setEmergencyAccess: (access: FamilyEmergencyAccess) => void;
  triggerEmergencyAccess: (elderId: string, reason: string) => Promise<void>;
  testEmergencyAccess: (elderId: string) => Promise<boolean>;

  // Settings and Configuration
  setFamilySettings: (settings: FamilySettings) => void;
  updateFamilySettings: (familyId: string, updates: Partial<FamilySettings>) => void;

  // Analytics and Statistics
  calculateFamilyStats: (familyId: string) => void;
  getFamilyActivity: (familyId: string, days: number) => any[];
  getMemberActivity: (memberId: string, days: number) => any[];

  // Cultural Sensitivity Helpers
  getAppropriateGreeting: (fromMemberId: string, toMemberId: string) => string;
  validateCulturalRespect: (action: string, memberId: string) => boolean;
  suggestCulturalMemoryPrompts: (familyId: string, occasion?: string) => string[];

  // Loading and Error Management
  setLoading: (isLoading: boolean, error?: string) => void;
  clearError: () => void;

  // Selection Management
  setSelectedMember: (memberId: string | null) => void;
  setSelectedCollection: (collectionId: string | null) => void;
}

export const useFamilyStore = create<FamilyState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    families: [],
    currentFamily: null,
    familyMembers: [],
    familyInvitations: [],
    sharedMemories: [],
    familyCollections: [],
    familyNotifications: [],
    unreadNotificationCount: 0,
    culturalEvents: [],
    upcomingHolidays: [],
    emergencyAccess: null,
    familySettings: null,
    familyHierarchy: null,
    familyStats: null,
    loadingState: { isLoading: false },
    selectedMemberId: null,
    selectedCollectionId: null,

    // Family Management Actions
    setFamilies: (families) => {
      set({ families });
      if (families.length > 0 && !get().currentFamily) {
        get().setCurrentFamily(families[0]);
      }
    },

    setCurrentFamily: (family) => {
      set({ currentFamily: family });
      if (family) {
        get().buildFamilyHierarchy(family.id);
        get().calculateFamilyStats(family.id);
      }
    },

    createFamily: async (request) => {
      set({ loadingState: { isLoading: true } });
      try {
        // This would integrate with your backend API
        const newFamily: FamilyCircle = {
          id: `family_${Date.now()}`,
          name: request.name,
          displayName: request.displayName,
          primaryElder: '', // Set based on elderId or current user
          members: [],
          invitations: [],
          culturalTradition: request.culturalTradition,
          primaryLanguage: request.primaryLanguage,
          respectProtocol: 'moderate',
          allowsMemorySharing: true,
          requiresElderApproval: false,
          enablesCulturalPrompts: true,
          usesChineseCalendar: request.primaryLanguage === 'zh' || request.primaryLanguage === 'bilingual',
          familyPrivacyLevel: 'restricted',
          emergencyAccessEnabled: true,
          emergencyContacts: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: '', // Current user ID
        };

        const families = [...get().families, newFamily];
        set({ families });
        get().setCurrentFamily(newFamily);
        set({ loadingState: { isLoading: false } });
      } catch (error) {
        set({ loadingState: { isLoading: false, error: error.message } });
      }
    },

    updateFamily: (familyId, updates) => {
      const families = get().families.map(family =>
        family.id === familyId
          ? { ...family, ...updates, updatedAt: new Date() }
          : family
      );
      set({ families });

      const currentFamily = get().currentFamily;
      if (currentFamily?.id === familyId) {
        set({ currentFamily: { ...currentFamily, ...updates, updatedAt: new Date() } });
      }
    },

    deleteFamily: (familyId) => {
      const families = get().families.filter(family => family.id !== familyId);
      set({ families });

      if (get().currentFamily?.id === familyId) {
        set({ currentFamily: families.length > 0 ? families[0] : null });
      }
    },

    // Family Member Management
    setFamilyMembers: (members) => set({ familyMembers: members }),

    inviteFamilyMember: async (request) => {
      set({ loadingState: { isLoading: true } });
      try {
        const invitation: FamilyInvitation = {
          id: `invitation_${Date.now()}`,
          familyId: request.familyId,
          invitedBy: '', // Current user ID
          invitedEmail: request.email,
          invitedPhone: request.phone,
          proposedRole: request.proposedRole,
          proposedRelationship: request.proposedRelationship,
          proposedPermissionLevel: request.proposedPermissionLevel,
          personalMessage: request.personalMessage,
          invitationLanguage: request.invitationLanguage,
          culturalGreeting: request.culturalGreeting,
          status: 'pending',
          sentAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };

        const invitations = [...get().familyInvitations, invitation];
        set({ familyInvitations: invitations });
        set({ loadingState: { isLoading: false } });
      } catch (error) {
        set({ loadingState: { isLoading: false, error: error.message } });
      }
    },

    updateFamilyMember: (memberId, updates) => {
      const members = get().familyMembers.map(member =>
        member.id === memberId
          ? { ...member, ...updates }
          : member
      );
      set({ familyMembers: members });
    },

    removeFamilyMember: (memberId) => {
      const members = get().familyMembers.filter(member => member.id !== memberId);
      set({ familyMembers: members });
    },

    approveFamilyMember: (memberId) => {
      get().updateFamilyMember(memberId, {
        invitationStatus: 'accepted',
        isActive: true,
        lastActiveAt: new Date()
      });
    },

    setMemberPermissions: (memberId, permission) => {
      get().updateFamilyMember(memberId, { permissionLevel: permission });
    },

    // Invitation Management
    setFamilyInvitations: (invitations) => set({ familyInvitations: invitations }),

    sendInvitation: async (invitation) => {
      // Implementation would send email/SMS invitation
      const invitations = [...get().familyInvitations, invitation];
      set({ familyInvitations: invitations });
    },

    respondToInvitation: (invitationId, response) => {
      const invitations = get().familyInvitations.map(invitation =>
        invitation.id === invitationId
          ? { ...invitation, status: response, respondedAt: new Date() }
          : invitation
      );
      set({ familyInvitations: invitations });
    },

    cancelInvitation: (invitationId) => {
      const invitations = get().familyInvitations.map(invitation =>
        invitation.id === invitationId
          ? { ...invitation, status: 'cancelled' }
          : invitation
      );
      set({ familyInvitations: invitations });
    },

    resendInvitation: (invitationId) => {
      const invitations = get().familyInvitations.map(invitation =>
        invitation.id === invitationId
          ? {
              ...invitation,
              sentAt: new Date(),
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              reminderSentAt: [...(invitation.reminderSentAt || []), new Date()]
            }
          : invitation
      );
      set({ familyInvitations: invitations });
    },

    // Memory Sharing
    setSharedMemories: (memories) => set({ sharedMemories: memories }),

    shareMemoryWithFamily: async (request) => {
      set({ loadingState: { isLoading: true } });
      try {
        const sharing: MemorySharing = {
          id: `sharing_${Date.now()}`,
          memoryId: request.memoryId,
          familyId: request.familyId,
          sharedBy: '', // Current user ID
          sharedWith: request.sharedWith || [],
          shareLevel: request.shareLevel,
          allowsComments: request.allowsComments,
          allowsCollaboration: request.allowsCollaboration,
          culturalContext: request.culturalContext,
          respectLevel: request.respectLevel,
          canDownload: true,
          canShare: request.shareLevel === 'family_wide',
          canEdit: request.allowsCollaboration,
          sharedAt: new Date(),
          viewedBy: [],
          commentsCount: 0,
          lastActivityAt: new Date(),
        };

        const sharedMemories = [...get().sharedMemories, sharing];
        set({ sharedMemories });
        set({ loadingState: { isLoading: false } });
      } catch (error) {
        set({ loadingState: { isLoading: false, error: error.message } });
      }
    },

    updateMemorySharing: (sharingId, updates) => {
      const sharedMemories = get().sharedMemories.map(sharing =>
        sharing.id === sharingId
          ? { ...sharing, ...updates, lastActivityAt: new Date() }
          : sharing
      );
      set({ sharedMemories });
    },

    unshareMemory: (sharingId) => {
      const sharedMemories = get().sharedMemories.filter(sharing => sharing.id !== sharingId);
      set({ sharedMemories });
    },

    getSharedMemoriesForMember: (memberId) => {
      return get().sharedMemories.filter(sharing =>
        sharing.sharedWith.length === 0 || sharing.sharedWith.includes(memberId)
      );
    },

    getSharedMemoriesForFamily: (familyId) => {
      return get().sharedMemories.filter(sharing => sharing.familyId === familyId);
    },

    // Family Collections
    setFamilyCollections: (collections) => set({ familyCollections: collections }),

    createFamilyCollection: async (request) => {
      set({ loadingState: { isLoading: true } });
      try {
        const collection: FamilyMemoryCollection = {
          id: `collection_${Date.now()}`,
          familyId: request.familyId,
          createdBy: '', // Current user ID
          title: request.title,
          titleLabels: request.titleLabels,
          description: request.description,
          occasion: request.occasion,
          chineseHoliday: request.chineseHoliday,
          culturalSignificance: request.culturalSignificance,
          memoryIds: [],
          sharedMemories: [],
          familyContributions: [],
          visibility: request.visibility,
          allowedViewers: request.allowedViewers || [],
          allowsContributions: request.allowsContributions,
          requiresElderApproval: request.requiresElderApproval,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const collections = [...get().familyCollections, collection];
        set({ familyCollections: collections });
        set({ loadingState: { isLoading: false } });
      } catch (error) {
        set({ loadingState: { isLoading: false, error: error.message } });
      }
    },

    updateFamilyCollection: (collectionId, updates) => {
      const collections = get().familyCollections.map(collection =>
        collection.id === collectionId
          ? { ...collection, ...updates, updatedAt: new Date() }
          : collection
      );
      set({ familyCollections: collections });
    },

    deleteFamilyCollection: (collectionId) => {
      const collections = get().familyCollections.filter(collection => collection.id !== collectionId);
      set({ familyCollections: collections });
    },

    addMemoryToCollection: (collectionId, memoryId) => {
      const collections = get().familyCollections.map(collection =>
        collection.id === collectionId
          ? {
              ...collection,
              memoryIds: [...collection.memoryIds, memoryId],
              updatedAt: new Date(),
              lastContributionAt: new Date()
            }
          : collection
      );
      set({ familyCollections: collections });
    },

    removeMemoryFromCollection: (collectionId, memoryId) => {
      const collections = get().familyCollections.map(collection =>
        collection.id === collectionId
          ? {
              ...collection,
              memoryIds: collection.memoryIds.filter(id => id !== memoryId),
              updatedAt: new Date()
            }
          : collection
      );
      set({ familyCollections: collections });
    },

    // Cultural Features
    setCulturalEvents: (events) => {
      set({ culturalEvents: events });
      get().getUpcomingHolidays(30); // Update upcoming holidays
    },

    getUpcomingHolidays: (daysAhead = 30) => {
      const now = new Date();
      const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const upcoming = get().culturalEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= future;
      });

      set({ upcomingHolidays: upcoming });
      return upcoming;
    },

    getFamilyHolidays: (familyId) => {
      return get().culturalEvents.filter(event =>
        !event.familyId || event.familyId === familyId
      );
    },

    createCustomEvent: (event) => {
      const newEvent: CulturalCalendarEvent = {
        ...event,
        id: `event_${Date.now()}`,
      };
      const events = [...get().culturalEvents, newEvent];
      set({ culturalEvents: events });
    },

    // Notifications
    setFamilyNotifications: (notifications) => {
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ familyNotifications: notifications, unreadNotificationCount: unreadCount });
    },

    markNotificationAsRead: (notificationId) => {
      const notifications = get().familyNotifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true, readAt: new Date() }
          : notification
      );
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ familyNotifications: notifications, unreadNotificationCount: unreadCount });
    },

    markAllNotificationsAsRead: () => {
      const notifications = get().familyNotifications.map(notification => ({
        ...notification,
        isRead: true,
        readAt: notification.readAt || new Date()
      }));
      set({ familyNotifications: notifications, unreadNotificationCount: 0 });
    },

    deleteNotification: (notificationId) => {
      const notifications = get().familyNotifications.filter(n => n.id !== notificationId);
      const unreadCount = notifications.filter(n => !n.isRead).length;
      set({ familyNotifications: notifications, unreadNotificationCount: unreadCount });
    },

    sendFamilyNotification: (notification) => {
      const newNotification: FamilyNotification = {
        ...notification,
        id: `notification_${Date.now()}`,
        sentAt: new Date(),
        isRead: false,
        priority: notification.priority || 5,
      };

      const notifications = [newNotification, ...get().familyNotifications];
      set({ familyNotifications: notifications, unreadNotificationCount: get().unreadNotificationCount + 1 });
    },

    // Family Hierarchy
    buildFamilyHierarchy: (familyId) => {
      const family = get().families.find(f => f.id === familyId);
      if (!family) return;

      const members = get().familyMembers.filter(m => m.familyId === familyId);

      // Group members by generation level
      const generationGroups = members.reduce((acc, member) => {
        const level = member.generationLevel;
        if (!acc[level]) {
          acc[level] = [];
        }
        acc[level].push(member);
        return acc;
      }, {} as Record<number, FamilyMember[]>);

      // Build hierarchy structure
      const generations = Object.keys(generationGroups)
        .map(level => parseInt(level))
        .sort((a, b) => a - b)
        .map(level => {
          const generationMembers = generationGroups[level];
          const elderAuthority = generationMembers.find(m => m.isElder)?.userId;

          return {
            level,
            name: level === 1 ? 'Elders' : level === 2 ? 'Parents' : level === 3 ? 'Children' : `Generation ${level}`,
            nameLabels: {
              en: level === 1 ? 'Elders' : level === 2 ? 'Parents' : level === 3 ? 'Children' : `Generation ${level}`,
              zh: level === 1 ? '长辈' : level === 2 ? '父母' : level === 3 ? '子女' : `第${level}代`,
            },
            members: generationMembers,
            elderAuthority,
          };
        });

      const hierarchy: FamilyHierarchy = {
        familyId,
        generations,
        familyHead: family.familyHead,
        primaryElder: family.primaryElder,
        decisionMakers: members.filter(m => m.canManageFamily).map(m => m.userId),
      };

      set({ familyHierarchy: hierarchy });
    },

    updateFamilyHierarchy: (hierarchy) => set({ familyHierarchy: hierarchy }),

    getFamilyElders: (familyId) => {
      return get().familyMembers.filter(member =>
        member.familyId === familyId && member.isElder
      );
    },

    getFamilyByGeneration: (familyId, generation) => {
      return get().familyMembers.filter(member =>
        member.familyId === familyId && member.generationLevel === generation
      );
    },

    checkPermission: (memberId, action) => {
      const member = get().familyMembers.find(m => m.id === memberId);
      if (!member) return false;

      switch (action) {
        case 'invite_members':
          return member.canInviteMembers;
        case 'manage_family':
          return member.canManageFamily;
        case 'emergency_access':
          return member.canAccessEmergency;
        case 'view_memories':
          return member.permissionLevel !== 'no_access';
        case 'share_memories':
          return ['full_access', 'family_view'].includes(member.permissionLevel);
        default:
          return false;
      }
    },

    requiresElderApproval: (action, familyId) => {
      const family = get().families.find(f => f.id === familyId);
      if (!family) return false;

      if (!family.requiresElderApproval) return false;

      const majorActions = [
        'invite_family_member',
        'remove_family_member',
        'change_permissions',
        'delete_family',
        'emergency_access'
      ];

      return majorActions.includes(action);
    },

    // Emergency Access
    setEmergencyAccess: (access) => set({ emergencyAccess: access }),

    triggerEmergencyAccess: async (elderId, reason) => {
      // Implementation would trigger emergency protocols
      console.log(`Emergency access triggered for elder ${elderId}: ${reason}`);
    },

    testEmergencyAccess: async (elderId) => {
      // Implementation would test emergency access systems
      return true;
    },

    // Settings
    setFamilySettings: (settings) => set({ familySettings: settings }),

    updateFamilySettings: (familyId, updates) => {
      const settings = get().familySettings;
      if (settings?.familyId === familyId) {
        set({
          familySettings: {
            ...settings,
            ...updates,
            updatedAt: new Date(),
          }
        });
      }
    },

    // Analytics
    calculateFamilyStats: (familyId) => {
      const members = get().familyMembers.filter(m => m.familyId === familyId);
      const sharedMemories = get().sharedMemories.filter(s => s.familyId === familyId);
      const collections = get().familyCollections.filter(c => c.familyId === familyId);

      const stats: FamilyStats = {
        familyId,
        totalMembers: members.length,
        activeMembers: members.filter(m => m.isActive).length,
        generationCount: new Set(members.map(m => m.generationLevel)).size,
        sharedMemories: sharedMemories.length,
        familyCollections: collections.length,
        totalFamilyMemoryTime: 0, // Would calculate from actual memory durations
        lastFamilyActivity: new Date(Math.max(...sharedMemories.map(s => s.lastActivityAt.getTime()))),
        membersByRole: members.reduce((acc, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {} as Record<ChineseFamilyRole, number>),
        membersByGeneration: members.reduce((acc, member) => {
          acc[member.generationLevel] = (acc[member.generationLevel] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        languageBreakdown: {
          english: members.filter(m => m.preferredLanguage === 'en').length,
          chinese: members.filter(m => m.preferredLanguage === 'zh').length,
          bilingual: members.filter(m => m.preferredLanguage === 'zh').length, // Adjust logic as needed
        },
      };

      set({ familyStats: stats });
    },

    getFamilyActivity: (familyId, days) => {
      // Implementation would return activity data
      return [];
    },

    getMemberActivity: (memberId, days) => {
      // Implementation would return member activity data
      return [];
    },

    // Cultural Helpers
    getAppropriateGreeting: (fromMemberId, toMemberId) => {
      const fromMember = get().familyMembers.find(m => m.id === fromMemberId);
      const toMember = get().familyMembers.find(m => m.id === toMemberId);

      if (!fromMember || !toMember) return 'Hello';

      // Implement cultural greeting logic based on relationships and hierarchy
      if (toMember.isElder && !fromMember.isElder) {
        return toMember.preferredLanguage === 'zh' ? '您好' : 'Hello (respectfully)';
      }

      return toMember.preferredLanguage === 'zh' ? '你好' : 'Hello';
    },

    validateCulturalRespect: (action, memberId) => {
      // Implementation would validate if action respects cultural norms
      return true;
    },

    suggestCulturalMemoryPrompts: (familyId, occasion) => {
      // Implementation would suggest culturally appropriate memory prompts
      const prompts = [
        "Tell us about your childhood during Chinese New Year",
        "Share a story about your parents or grandparents",
        "What family traditions are most important to you?",
        "Describe a memorable family gathering"
      ];
      return prompts;
    },

    // Utility Actions
    setLoading: (isLoading, error) => {
      set({ loadingState: { isLoading, error } });
    },

    clearError: () => {
      set({ loadingState: { ...get().loadingState, error: undefined } });
    },

    setSelectedMember: (memberId) => set({ selectedMemberId: memberId }),

    setSelectedCollection: (collectionId) => set({ selectedCollectionId: collectionId }),
  }))
);