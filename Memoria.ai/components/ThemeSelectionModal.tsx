import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRecording } from '@/contexts/RecordingContext';
import topicsService, { RecordingTopic } from '@/services/topics';

// Theme type that matches what the recording flow expects
export interface MemoryTheme {
  id: string;
  title: string;
  category?: {
    id: string;
    name: string;
    display_name: string;
    icon: string | null;
  };
}

// Free-style recording indicator (null theme)
const FREE_STYLE_OPTION = {
  id: 'free-style',
  title: 'Free Recording',
  isFreeStyle: true,
} as const;

interface ThemeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onThemeSelect: (theme: MemoryTheme | null) => void;
  selectedCategoryId?: string; // Optional category filter from HomeScreen
}

export function ThemeSelectionModal({
  visible,
  onClose,
  onThemeSelect,
  selectedCategoryId
}: ThemeSelectionModalProps) {
  const colorScheme = useColorScheme();
  const { memories } = useRecording();

  const [topics, setTopics] = useState<RecordingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load topics from database when modal opens
  useEffect(() => {
    if (visible) {
      loadTopics();
    }
  }, [visible]);

  const loadTopics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allTopics = await topicsService.getAllTopics();
      setTopics(allTopics);
    } catch (err) {
      console.error('Failed to load topics:', err);
      setError('Failed to load topics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get recorded topic IDs from memories
  const recordedTopicIds = new Set(
    memories
      .filter(m => m.topicId)
      .map(m => m.topicId)
  );

  // Filter topics: apply category filter and remove already recorded
  const availableTopics = topics.filter(topic => {
    // Exclude already recorded topics
    if (recordedTopicIds.has(topic.id)) {
      return false;
    }
    // Apply category filter if specified
    if (selectedCategoryId && topic.category_id !== selectedCategoryId) {
      return false;
    }
    return true;
  });

  // Check if all topics are recorded
  const allTopicsRecorded = topics.length > 0 && availableTopics.length === 0;

  const handleThemeSelect = async (topic: RecordingTopic | null) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (topic === null) {
      // Free-style recording - pass null
      onThemeSelect(null);
    } else {
      // Convert RecordingTopic to MemoryTheme format
      const theme: MemoryTheme = {
        id: topic.id,
        title: topic.prompt,
        category: topic.category ? {
          id: topic.category.id,
          name: topic.category.name,
          display_name: topic.category.display_name,
          icon: topic.category.icon,
        } : undefined,
      };
      onThemeSelect(theme);
    }
    // Don't call onClose() here - let the parent handle the transition
  };

  const handleFreeStyleSelect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onThemeSelect(null);
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const goldColor = Colors[colorScheme ?? 'light'].highlight;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityLabel="Close theme selection"
          >
            <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
              Memory Suggestions
            </Text>
            <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {allTopicsRecorded
                ? 'All topics recorded! Try free recording.'
                : 'Tap any topic to start recording about it'}
            </Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Free-Style Recording Option - Always at top */}
          <TouchableOpacity
            style={[styles.freeStyleCard, {
              backgroundColor: goldColor + '15',
              borderColor: goldColor + '40',
            }]}
            onPress={handleFreeStyleSelect}
            accessibilityLabel="Start free recording without a topic"
            accessibilityHint="Record anything you want without a specific prompt"
            activeOpacity={0.92}
          >
            <View style={styles.freeStyleContent}>
              <Text style={styles.freeStyleIcon}>✨</Text>
              <View style={styles.freeStyleTextContainer}>
                <Text style={[styles.freeStyleTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Free Recording
                </Text>
                <Text style={[styles.freeStyleSubtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  Record anything on your mind
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={goldColor} />
              <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                Loading topics...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: Colors[colorScheme ?? 'light'].elderlyError }]}>
                {error}
              </Text>
              <TouchableOpacity onPress={loadTopics} style={styles.retryButton}>
                <Text style={[styles.retryText, { color: goldColor }]}>Tap to retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* All Topics Recorded Message */}
          {allTopicsRecorded && !isLoading && !error && (
            <View style={styles.allRecordedContainer}>
              <Text style={styles.allRecordedIcon}>🎉</Text>
              <Text style={[styles.allRecordedTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Amazing work!
              </Text>
              <Text style={[styles.allRecordedText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                You've recorded all available topics. Use Free Recording above to capture new memories,
                or re-record a previous topic from your Home screen.
              </Text>
            </View>
          )}

          {/* Topic List */}
          {!isLoading && !error && availableTopics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[styles.themeCard, {
                backgroundColor: colorScheme === 'dark'
                  ? DesignTokens.colors.neutral[700]
                  : DesignTokens.colors.neutral[100],
              }]}
              onPress={() => handleThemeSelect(topic)}
              accessibilityLabel={`Record about: ${topic.prompt}`}
              accessibilityHint="Tap to start recording about this topic"
              activeOpacity={0.92}
            >
              {/* Category Badge */}
              {topic.category && (
                <View style={[styles.categoryBadge, {
                  backgroundColor: goldColor + '20',
                  borderColor: goldColor + '40',
                }]}>
                  {topic.category.icon && (
                    <Text style={styles.categoryIcon}>{topic.category.icon}</Text>
                  )}
                  <Text style={[styles.categoryName, { color: goldColor }]}>
                    {topic.category.display_name}
                  </Text>
                </View>
              )}
              <Text style={[styles.themeText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {topic.prompt}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Bottom spacing for safe area */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    width: DesignTokens.touchTarget.minimum,
    height: DesignTokens.touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: DesignTokens.touchTarget.minimum / 2,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
  },
  placeholder: {
    width: DesignTokens.touchTarget.minimum,
  },
  title: {
    ...DesignTokens.typography.h2,
    marginBottom: DesignTokens.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignTokens.spacing.md,
  },
  // Free-style card
  freeStyleCard: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.radius.lg,
    borderWidth: 2,
    ...DesignTokens.elevation[3],
  },
  freeStyleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  freeStyleIcon: {
    fontSize: 28,
    marginRight: DesignTokens.spacing.md,
  },
  freeStyleTextContainer: {
    flex: 1,
  },
  freeStyleTitle: {
    ...DesignTokens.typography.h3,
    marginBottom: 2,
  },
  freeStyleSubtitle: {
    ...DesignTokens.typography.caption,
  },
  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  loadingText: {
    ...DesignTokens.typography.body,
    marginTop: DesignTokens.spacing.md,
  },
  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
  },
  errorText: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
    marginBottom: DesignTokens.spacing.md,
  },
  retryButton: {
    padding: DesignTokens.spacing.sm,
  },
  retryText: {
    ...DesignTokens.typography.button,
  },
  // All recorded
  allRecordedContainer: {
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.xl,
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  allRecordedIcon: {
    fontSize: 48,
    marginBottom: DesignTokens.spacing.md,
  },
  allRecordedTitle: {
    ...DesignTokens.typography.h3,
    marginBottom: DesignTokens.spacing.sm,
  },
  allRecordedText: {
    ...DesignTokens.typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Theme cards
  themeCard: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.md,
    borderRadius: DesignTokens.radius.lg,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    ...DesignTokens.elevation[3],
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: DesignTokens.spacing.sm,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  themeText: {
    ...DesignTokens.typography.button,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: DesignTokens.spacing.xl,
  },
});
