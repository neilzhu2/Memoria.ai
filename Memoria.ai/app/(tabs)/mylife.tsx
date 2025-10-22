import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRecording } from '@/contexts/RecordingContext';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { EditMemoryModal } from '@/components/EditMemoryModal';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MyLifeScreenProps } from '@/types/navigation';
import { MemoryItem } from '@/types/memory';

type SectionType = 'memories' | 'profile';

export default function MyLifeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { memories, memoryStats, removeMemory, updateMemory } = useRecording();

  // Initialize active section from URL params or default to memories
  const [activeSection, setActiveSection] = useState<SectionType>(
    (params.section as SectionType) || 'memories'
  );

  // Audio playback hook
  const {
    playingId,
    playbackPosition,
    playbackDuration,
    isPlaying,
    togglePlayPause,
    skipBackward,
    skipForward,
  } = useAudioPlayback();

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  // Watch for URL param changes and update section
  useEffect(() => {
    if (params.section) {
      setActiveSection(params.section as SectionType);
    }
  }, [params.section]);

  // Use memories from context

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSectionChange = async (section: SectionType) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSection(section);
    // Update URL params without navigation
    router.setParams({ section });
  };

  const handleMemoryPress = async (memory: MemoryItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Open edit modal to view/edit memory details (includes audio playback)
    setSelectedMemory(memory);
    setEditModalVisible(true);
  };

  const handleEditProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Edit Profile', 'Profile editing functionality coming soon!');
  };

  const handleSettingsPress = async (setting: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(setting, `${setting} settings coming soon!`);
  };

  const handleEditMemory = async (memory: MemoryItem) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMemory(memory);
    setEditModalVisible(true);
  };

  const handleSaveMemory = async (updates: Partial<MemoryItem>) => {
    if (!selectedMemory) return;
    await updateMemory(selectedMemory.id, updates);
    setEditModalVisible(false);
    setSelectedMemory(null);
  };

  const renderMemoryItem = ({ item }: { item: MemoryItem }) => {
    const tintColor = Colors[colorScheme ?? 'light'].tint;

    return (
      <TouchableOpacity
        style={[
          styles.memoryCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background },
        ]}
        onPress={() => handleMemoryPress(item)}
        accessibilityLabel={`Memory: ${item.title}`}
        accessibilityHint="Tap to view and edit memory details"
        activeOpacity={0.7}
      >
        <View style={styles.memoryHeader}>
          <View style={styles.memoryTitleContainer}>
            <Text style={[styles.memoryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {item.title}
            </Text>
          </View>
          <Text style={[styles.memoryDate, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            {formatDate(item.date)}
          </Text>
        </View>
        <Text style={[styles.memoryDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          {item.description}
        </Text>

        {/* Compact Footer */}
        <View style={styles.memoryFooter}>
          <View style={styles.memoryDuration}>
            {item.audioPath && (
              <IconSymbol
                name="waveform"
                size={16}
                color={tintColor}
                style={{ marginRight: 4 }}
              />
            )}
            <IconSymbol name="clock" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <Text style={[styles.durationText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {formatDuration(item.duration)}
            </Text>
          </View>
          {item.isShared && (
            <View style={styles.sharedIndicator}>
              <IconSymbol name="person.2.fill" size={16} color={Colors[colorScheme ?? 'light'].elderlySuccess} />
              <Text style={[styles.sharedText, { color: Colors[colorScheme ?? 'light'].elderlySuccess }]}>Shared</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMemoriesSection = () => (
    <View style={styles.sectionContent}>
      {memories.length === 0 ? (
        <View style={styles.emptyState}>
          <IconSymbol
            name="book"
            size={64}
            color={Colors[colorScheme ?? 'light'].tabIconDefault}
          />
          <Text style={[styles.emptyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            No Memories Yet
          </Text>
          <Text style={[styles.emptyDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Start recording your first memory by tapping the record button
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.memoriesHeader}>
            <Text style={[styles.memoriesCount, { color: Colors[colorScheme ?? 'light'].text }]}>
              {memories.length} {memories.length === 1 ? 'Memory' : 'Memories'}
            </Text>
          </View>
          <View style={styles.memoriesList}>
            {memories.map((memory) => (
              <React.Fragment key={memory.id}>
                {renderMemoryItem({ item: memory })}
              </React.Fragment>
            ))}
          </View>
        </>
      )}
    </View>
  );

  const renderProfileSection = () => (
    <View style={styles.sectionContent}>
      {/* Profile Info */}
      <View style={[styles.profileCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive }]}>
            <IconSymbol name="person.fill" size={32} color="white" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: Colors[colorScheme ?? 'light'].text }]}>
              Memoria User
            </Text>
            <Text style={[styles.profileEmail, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              user@memoria.ai
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive }]}
            onPress={handleEditProfile}
            accessibilityLabel="Edit profile"
          >
            <IconSymbol name="pencil" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Options */}
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          Settings
        </Text>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={() => handleSettingsPress('Voice Settings')}
          accessibilityLabel="Voice settings"
        >
          <IconSymbol name="speaker.wave.3.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.settingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Voice Settings
          </Text>
          <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={() => handleSettingsPress('Family Sharing')}
          accessibilityLabel="Family sharing settings"
        >
          <IconSymbol name="person.2.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.settingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Family Sharing
          </Text>
          <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={() => handleSettingsPress('Accessibility')}
          accessibilityLabel="Accessibility settings"
        >
          <IconSymbol name="accessibility" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.settingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Accessibility
          </Text>
          <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingItem, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={() => handleSettingsPress('Backup & Sync')}
          accessibilityLabel="Backup and sync settings"
        >
          <IconSymbol name="cloud.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.settingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Backup & Sync
          </Text>
          <IconSymbol name="chevron.right" size={16} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style="auto" />

      {/* Section Selector */}
      <View style={[styles.sectionSelector, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'memories' ? {
              backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive,
            } : {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
            },
            activeSection === 'memories' && styles.activeSectionTab,
          ]}
          onPress={() => handleSectionChange('memories')}
          accessibilityLabel="Memories section"
          accessibilityState={{ selected: activeSection === 'memories' }}
        >
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'memories' ? 'white' : Colors[colorScheme ?? 'light'].text },
            ]}
          >
            Memories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sectionTab,
            activeSection === 'profile' ? {
              backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive,
            } : {
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
            },
            activeSection === 'profile' && styles.activeSectionTab,
          ]}
          onPress={() => handleSectionChange('profile')}
          accessibilityLabel="Profile section"
          accessibilityState={{ selected: activeSection === 'profile' }}
        >
          <Text
            style={[
              styles.sectionTabText,
              { color: activeSection === 'profile' ? 'white' : Colors[colorScheme ?? 'light'].text },
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section Content */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {activeSection === 'memories' ? renderMemoriesSection() : renderProfileSection()}

        {/* Bottom Spacing for Tab Bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Memory Modal */}
      <EditMemoryModal
        visible={editModalVisible}
        memory={selectedMemory}
        onSave={handleSaveMemory}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionSelector: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 60, // Account for status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeSectionTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sectionTabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContent: {
    flex: 1,
    padding: 16,
  },
  // Memories Section Styles
  memoriesHeader: {
    marginBottom: 16,
  },
  memoriesCount: {
    fontSize: 18,
    fontWeight: '600',
  },
  memoriesList: {
    paddingBottom: 16,
  },
  memoryCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memoryCardExpanded: {
    padding: 20,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  memoryTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  editButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  memoryDate: {
    fontSize: 14,
    opacity: 0.8,
  },
  memoryDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    opacity: 0.8,
  },
  memoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 14,
    marginLeft: 4,
    opacity: 0.8,
  },
  sharedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sharedText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    opacity: 0.8,
  },
  // Profile Section Styles
  profileCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    opacity: 0.8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  bottomSpacing: {
    height: 100, // Space for tab bar and FAB
  },
  // Playback Controls Styles
  playbackControlsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    // borderTopColor applied dynamically in component
  },
  progressSection: {
    marginBottom: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});