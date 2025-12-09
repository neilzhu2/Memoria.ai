import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
  SafeAreaView,
} from 'react-native';
import { PanGestureHandler, State, HandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRecording } from '@/contexts/RecordingContext';
import { RecordingFlowContainer } from '@/components/RecordingFlowContainer';
import { Colors } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/hooks/useColorScheme';
import topicsService, { RecordingTopic, TopicCategory } from '@/services/topics';

// Helper function to format date for elderly-friendly badge display
const formatBadgeDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

// Fallback topics if service fails to load
const FALLBACK_TOPICS = [
  {
    id: 'fallback-1',
    category_id: null,
    prompt: "Talk about your first job",
    difficulty_level: 'easy' as const,
    tags: ['career', 'work'],
  },
  {
    id: 'fallback-2',
    category_id: null,
    prompt: "Describe your childhood home",
    difficulty_level: 'easy' as const,
    tags: ['childhood', 'home'],
  },
  {
    id: 'fallback-3',
    category_id: null,
    prompt: "Share a family tradition",
    difficulty_level: 'medium' as const,
    tags: ['family', 'traditions'],
  },
];

const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = screenWidth * 0.25;
const VELOCITY_THRESHOLD = 1000;

interface NavigationState {
  currentIndex: number;
  history: number[];
  historyPosition: number;
}

// Helper function to generate topic descriptions based on difficulty
const getTopicDescription = (difficulty: 'easy' | 'medium' | 'deep'): string => {
  switch (difficulty) {
    case 'easy':
      return 'A simple question to get you started';
    case 'medium':
      return 'Share more details about this memory';
    case 'deep':
      return 'Reflect deeply on this experience';
    default:
      return 'Share your thoughts';
  }
};

const HomeScreen = React.memo(function HomeScreen() {
  const colorScheme = useColorScheme();
  const { recordingTrigger, selectedThemeFromTrigger, memories } = useRecording();

  // Topics state
  const [topics, setTopics] = useState<RecordingTopic[]>(FALLBACK_TOPICS);
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [showUnrecordedOnly, setShowUnrecordedOnly] = useState(true);
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Simple, reliable navigation state
  const [navState, setNavState] = useState<NavigationState>({
    currentIndex: 0,
    history: [0],
    historyPosition: 0
  });

  // Recording flow state
  const [showRecordingFlow, setShowRecordingFlow] = useState(false);
  const [skipThemeSelection, setSkipThemeSelection] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{id: string; title: string} | undefined>();

  // Store all topics separately from filtered topics
  const [allTopics, setAllTopics] = useState<RecordingTopic[]>(FALLBACK_TOPICS);

  // Extract recorded topic IDs from memories
  const recordedTopicIds = React.useMemo(() => {
    return new Set(
      memories
        .filter(memory => memory.topicId) // Only include memories with a topic ID
        .map(memory => memory.topicId!)
    );
  }, [memories]);

  // Map of topic IDs to their most recent recording date
  const recordedTopicDates = React.useMemo(() => {
    const dateMap = new Map<string, Date>();
    memories
      .filter(memory => memory.topicId)
      .forEach(memory => {
        const existing = dateMap.get(memory.topicId!);
        if (!existing || memory.createdAt > existing) {
          dateMap.set(memory.topicId!, memory.createdAt);
        }
      });
    return dateMap;
  }, [memories]);

  // Load topics and categories on mount
  useEffect(() => {
    const loadTopicsAndCategories = async () => {
      try {
        setIsLoadingTopics(true);
        const [loadedTopics, loadedCategories] = await Promise.all([
          topicsService.getAllTopics(),
          topicsService.getCategories(),
        ]);

        if (loadedTopics.length > 0) {
          setAllTopics(loadedTopics);
          setTopics(loadedTopics);
        } else {
          // Use fallback if no topics loaded
          setAllTopics(FALLBACK_TOPICS);
          setTopics(FALLBACK_TOPICS);
        }

        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error loading topics:', error);
        // Use fallback on error
        setAllTopics(FALLBACK_TOPICS);
        setTopics(FALLBACK_TOPICS);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    loadTopicsAndCategories();
  }, []);

  // Filter topics when category selection or recording status filter changes
  useEffect(() => {
    let filtered = allTopics;

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(topic => topic.category_id === selectedCategory);
    }

    // Filter by recording status if checkbox is checked
    if (showUnrecordedOnly) {
      filtered = filtered.filter(topic => !recordedTopicIds.has(topic.id));
    }

    setTopics(filtered);

    // Reset navigation when filters change
    setNavState({
      currentIndex: 0,
      history: [0],
      historyPosition: 0
    });
  }, [selectedCategory, showUnrecordedOnly, allTopics, recordedTopicIds]);

  // Listen for recording trigger from tab bar
  React.useEffect(() => {
    if (recordingTrigger > 0) {
      console.log('Index - Recording triggered with theme:', selectedThemeFromTrigger?.title);
      // If theme was selected from tab bar, use it and skip theme selection
      if (selectedThemeFromTrigger) {
        setSelectedTopic(selectedThemeFromTrigger);
        setSkipThemeSelection(true); // Skip theme selection since we already have one
      } else {
        setSelectedTopic(undefined);
        setSkipThemeSelection(false);
      }
      setShowRecordingFlow(true);
    }
  }, [recordingTrigger, selectedThemeFromTrigger]);

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Track if we need to reset animation values after state updates
  const pendingAnimationReset = useRef(false);

  // Reset animation values AFTER state has updated (fixes flash issue)
  useEffect(() => {
    if (pendingAnimationReset.current) {
      translateX.setValue(0);
      translateY.setValue(0);
      scale.setValue(1);
      pendingAnimationReset.current = false;
    }
  }, [navState, translateX, translateY, scale]);

  // Calculate background cards based on navigation logic
  const getBackgroundCards = useCallback(() => {
    const { currentIndex, history, historyPosition } = navState;

    // Left card: where right swipe (backward) will go
    let leftIndex: number;
    if (historyPosition > 0) {
      // Can go back in history
      leftIndex = history[historyPosition - 1];
    } else {
      // Would create new previous card
      leftIndex = (currentIndex - 1 + topics.length) % topics.length;
    }

    // Right card: where left swipe (forward) will go
    let rightIndex: number;
    if (historyPosition < history.length - 1) {
      // Can go forward in history
      rightIndex = history[historyPosition + 1];
    } else {
      // Would create new next card
      rightIndex = (currentIndex + 1) % topics.length;
    }

    return {
      left: topics[leftIndex],
      right: topics[rightIndex],
      current: topics[currentIndex]
    };
  }, [navState, topics]);

  const backgroundCards = getBackgroundCards();

  // Simple navigation function
  const navigate = useCallback((direction: 'forward' | 'backward') => {
    setNavState(prevState => {
      const { currentIndex, history, historyPosition } = prevState;

      if (direction === 'forward') {
        // Left swipe - go forward
        if (historyPosition < history.length - 1) {
          // Go forward in existing history
          const newPosition = historyPosition + 1;
          return {
            ...prevState,
            currentIndex: history[newPosition],
            historyPosition: newPosition
          };
        } else {
          // Create new forward entry
          const nextIndex = (currentIndex + 1) % topics.length;
          return {
            ...prevState,
            currentIndex: nextIndex,
            history: [...history, nextIndex],
            historyPosition: historyPosition + 1
          };
        }
      } else {
        // Right swipe - go backward
        if (historyPosition > 0) {
          // Go back in existing history
          const newPosition = historyPosition - 1;
          return {
            ...prevState,
            currentIndex: history[newPosition],
            historyPosition: newPosition
          };
        } else {
          // Create new backward entry
          const prevIndex = (currentIndex - 1 + topics.length) % topics.length;
          return {
            currentIndex: prevIndex,
            history: [prevIndex, ...history],
            historyPosition: 0
          };
        }
      }
    });
  }, [topics.length]);

  // Check if we're at the edge (first or last card)
  const isAtEdge = useCallback((direction: 'forward' | 'backward'): boolean => {
    const { currentIndex, history, historyPosition } = navState;

    if (direction === 'backward') {
      // At first card and no history to go back to
      return currentIndex === 0 && historyPosition === 0;
    } else {
      // At last card and no forward history
      return currentIndex === topics.length - 1 && historyPosition === history.length - 1;
    }
  }, [navState, topics.length]);

  // Gesture handler
  const onPanHandlerStateChange = useCallback((event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;

      // Determine if swipe is strong enough
      const shouldSwipe = Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;

      if (shouldSwipe) {
        // Determine direction
        const direction = translationX > 0 ? 'backward' : 'forward';

        // Check if at edge - bounce back instead of wrapping
        if (isAtEdge(direction)) {
          // Bounce animation with haptic feedback to indicate edge
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 100,
              friction: 8,
            }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          ]).start();
          return;
        }

        // Animate card out
        const toValue = translationX > 0 ? screenWidth : -screenWidth;
        Animated.parallel([
          Animated.timing(translateX, { toValue, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          // Mark that we need to reset animation values after state updates
          pendingAnimationReset.current = true;

          // Navigate to new card (triggers state update)
          navigate(direction);

          // Animation values will be reset in useEffect after state has updated
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [navigate, isAtEdge]);

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleSkipPress = useCallback(async () => {
    if (isAtEdge('forward')) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigate('forward');
  }, [navigate, isAtEdge]);

  const handlePreviousPress = useCallback(async () => {
    if (isAtEdge('backward')) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigate('backward');
  }, [navigate, isAtEdge]);

  const handleNextPress = useCallback(async () => {
    if (isAtEdge('forward')) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigate('forward');
  }, [navigate, isAtEdge]);

  const handleRecordPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Green button on card should skip theme selection and go straight to recording
    // Pass the current topic as the selected theme
    const currentTopic = topics[navState.currentIndex];
    setSelectedTopic({
      id: currentTopic.id,
      title: currentTopic.prompt
    });
    setSkipThemeSelection(true);
    setShowRecordingFlow(true);
  }, [navState.currentIndex, topics]);

  return (
    <View
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
    >
      <StatusBar style="auto" />

      {/* Unified Filter Bar - Category Dropdown + Toggle */}
      <View style={[styles.unifiedFilterBar, { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper }]}>
        {/* Left: Category Dropdown Button */}
        <TouchableOpacity
          style={[styles.categoryDropdownButton, { borderColor: Colors[colorScheme ?? 'light'].tabIconDefault + '30' }]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCategoryModal(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Select category"
          accessibilityHint="Opens category selection menu"
        >
          <Text style={styles.categoryIcon}>
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.icon : '📂'}
          </Text>
          <Text style={[styles.categoryName, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
            {selectedCategory ? categories.find(c => c.id === selectedCategory)?.display_name : 'All'}
          </Text>
          <IconSymbol name="chevron.down" size={18} color={Colors[colorScheme ?? 'light'].elderlyTabActive} />
        </TouchableOpacity>

        {/* Right: Toggle Switch */}
        <TouchableOpacity
          style={styles.toggleSection}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowUnrecordedOnly(!showUnrecordedOnly);
          }}
          accessibilityRole="switch"
          accessibilityState={{ checked: showUnrecordedOnly }}
          accessibilityLabel="Hide recorded topics"
        >
          <View style={[
            styles.checkbox,
            {
              borderColor: showUnrecordedOnly
                ? Colors[colorScheme ?? 'light'].elderlyTabActive
                : Colors[colorScheme ?? 'light'].tabIconDefault + '60',
              backgroundColor: showUnrecordedOnly
                ? Colors[colorScheme ?? 'light'].elderlyTabActive
                : Colors[colorScheme ?? 'light'].backgroundPaper,
            }
          ]}>
            <View style={[
              styles.checkboxKnob,
              showUnrecordedOnly ? styles.checkboxKnobChecked : styles.checkboxKnobUnchecked,
            ]} />
          </View>
          <Text style={[styles.toggleLabel, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
            Hide Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Topic Cards - Single Card with Swipe Support */}
      <View style={styles.topicCardsContainer}>
        <View style={styles.cardStack}>
          {/* Background Card for BACKWARD navigation (previous card) - shown when dragging right */}
          {!isAtEdge('backward') && (
            <Animated.View
              style={[
                styles.topicCard,
                styles.backgroundCard,
                { backgroundColor: Colors[colorScheme ?? 'light'].background },
                {
                  opacity: translateX.interpolate({
                    inputRange: [0, 50],
                    outputRange: [0, 1],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.topicCardInner, {
                backgroundColor: colorScheme === 'dark'
                  ? DesignTokens.colors.neutral[700]
                  : DesignTokens.colors.neutral[100],
              }]}>
                <View style={styles.topicContent}>
                  {/* Category Badge at Top */}
                  {backgroundCards.left.category && (
                    <View style={[styles.categoryBadge, {
                      backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '20',
                      borderColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '40',
                    }]}>
                      <Text style={styles.categoryBadgeIcon}>
                        {backgroundCards.left.category.icon}
                      </Text>
                      <Text style={[styles.categoryBadgeText, { color: Colors[colorScheme ?? 'light'].elderlyTabActive }]}>
                        {backgroundCards.left.category.display_name}
                      </Text>
                    </View>
                  )}

                  {/* Main Question - Large and Prominent */}
                  <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {backgroundCards.left.prompt}
                  </Text>
                </View>
                <View style={styles.topicActions}>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.skipButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    disabled
                  >
                    <IconSymbol name="xmark" size={28} color={Colors[colorScheme ?? 'light'].elderlyError} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.recordButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    disabled
                  >
                    <IconSymbol name="mic.fill" size={28} color={Colors[colorScheme ?? 'light'].primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Background Card for FORWARD navigation (next card) - shown when dragging left */}
          {!isAtEdge('forward') && (
            <Animated.View
              style={[
                styles.topicCard,
                styles.backgroundCard,
                { backgroundColor: Colors[colorScheme ?? 'light'].background },
                {
                  opacity: translateX.interpolate({
                    inputRange: [-50, 0],
                    outputRange: [1, 0],
                    extrapolate: 'clamp',
                  }),
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.topicCardInner, {
                backgroundColor: colorScheme === 'dark'
                  ? DesignTokens.colors.neutral[700]
                  : DesignTokens.colors.neutral[100],
              }]}>
                <View style={styles.topicContent}>
                  {/* Category Badge at Top */}
                  {backgroundCards.right.category && (
                    <View style={[styles.categoryBadge, {
                      backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '20',
                      borderColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '40',
                    }]}>
                      <Text style={styles.categoryBadgeIcon}>
                        {backgroundCards.right.category.icon}
                      </Text>
                      <Text style={[styles.categoryBadgeText, { color: Colors[colorScheme ?? 'light'].elderlyTabActive }]}>
                        {backgroundCards.right.category.display_name}
                      </Text>
                    </View>
                  )}

                  {/* Main Question - Large and Prominent */}
                  <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {backgroundCards.right.prompt}
                  </Text>
                </View>
                <View style={styles.topicActions}>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.skipButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    disabled
                  >
                    <IconSymbol name="xmark" size={28} color={Colors[colorScheme ?? 'light'].elderlyError} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.recordButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    disabled
                  >
                    <IconSymbol name="mic.fill" size={28} color={Colors[colorScheme ?? 'light'].primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Main Active Card - Swipeable */}
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
            activeOffsetX={[-15, 15]}
            activeOffsetY={[-15, 15]}
          >
            <Animated.View
              style={[
                styles.topicCard,
                styles.activeCard,
                { backgroundColor: Colors[colorScheme ?? 'light'].background },
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale }
                  ]
                },
                // Honey gold shadow for active card (no border - modern depth)
                {
                  shadowColor: Colors[colorScheme ?? 'light'].highlight,  // Honey gold
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.25,
                  shadowRadius: 16,
                  elevation: 12,
                },
              ]}
            >
              <View style={[styles.topicCardInner, {
                backgroundColor: colorScheme === 'dark'
                  ? DesignTokens.colors.neutral[700]
                  : DesignTokens.colors.neutral[100],  // Using updated lighter neutral
              }]}>
                <View style={styles.topicContent}>
                  {/* Category Badge at Top */}
                  {backgroundCards.current.category && (
                    <View style={[styles.categoryBadge, {
                      backgroundColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '20',
                      borderColor: Colors[colorScheme ?? 'light'].elderlyTabActive + '40',
                    }]}>
                      <Text style={styles.categoryBadgeIcon}>
                        {backgroundCards.current.category.icon}
                      </Text>
                      <Text style={[styles.categoryBadgeText, { color: Colors[colorScheme ?? 'light'].elderlyTabActive }]}>
                        {backgroundCards.current.category.display_name}
                      </Text>
                    </View>
                  )}

                  {/* Recorded Badge - Only show when toggle is OFF and topic is recorded */}
                  {!showUnrecordedOnly && recordedTopicIds.has(backgroundCards.current.id) && (
                    <View style={[styles.recordedBadge, {
                      backgroundColor: Colors[colorScheme ?? 'light'].success + '15',
                      borderColor: Colors[colorScheme ?? 'light'].success + '40',
                    }]}>
                      <Text style={styles.recordedBadgeIcon}>✓</Text>
                      <Text style={[styles.recordedBadgeText, { color: Colors[colorScheme ?? 'light'].success }]}>
                        Recorded {recordedTopicDates.get(backgroundCards.current.id)
                          ? formatBadgeDate(recordedTopicDates.get(backgroundCards.current.id)!)
                          : ''}
                      </Text>
                    </View>
                  )}

                  {/* Main Question - Large and Prominent */}
                  <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {backgroundCards.current.prompt}
                  </Text>
                </View>
                <View style={styles.topicActions}>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.skipButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    onPress={handleSkipPress}
                    accessibilityLabel="Skip this topic"
                  >
                    <IconSymbol name="xmark" size={28} color={Colors[colorScheme ?? 'light'].elderlyError} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.recordButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    onPress={handleRecordPress}
                    accessibilityLabel="Record about this topic"
                  >
                    <IconSymbol name="mic.fill" size={28} color={Colors[colorScheme ?? 'light'].primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>

        {/* Navigation Buttons - Elderly-Optimized */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonLeft,
              { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper },
              isAtEdge('backward') && { opacity: 0.4 }
            ]}
            onPress={handlePreviousPress}
            accessibilityLabel="Previous topic"
            accessibilityHint={isAtEdge('backward') ? "This is the first topic" : "Go to the previous memory topic"}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={Colors[colorScheme ?? 'light'].text}
            />
            <Text style={[styles.navButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.navButtonRight,
              { backgroundColor: Colors[colorScheme ?? 'light'].backgroundPaper },
              isAtEdge('forward') && { opacity: 0.4 }
            ]}
            onPress={handleNextPress}
            accessibilityLabel="Next topic"
            accessibilityHint={isAtEdge('forward') ? "This is the last topic" : "Skip to the next memory topic"}
          >
            <Text style={[styles.navButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Next
            </Text>
            <IconSymbol
              name="chevron.right"
              size={24}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>
        </View>
      </View>


      {/* Recording Flow */}
      <RecordingFlowContainer
        visible={showRecordingFlow}
        onClose={() => {
          setShowRecordingFlow(false);
          setSkipThemeSelection(false); // Reset for next time
          setSelectedTopic(undefined); // Clear selected topic
        }}
        skipThemeSelection={skipThemeSelection}
        initialTheme={selectedTopic}
      />

      {/* Category Selection Bottom Sheet Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCategoryModal(false);
            }}
          />
          <SafeAreaView style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  Select Category
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowCategoryModal(false);
                  }}
                  style={styles.modalCloseButton}
                  accessibilityRole="button"
                  accessibilityLabel="Close category selection"
                >
                  <IconSymbol name="xmark.circle.fill" size={32} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                </TouchableOpacity>
              </View>

              {/* Category Options */}
              <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                {/* All Topics Option */}
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    !selectedCategory && styles.categoryOptionActive,
                    {
                      backgroundColor: !selectedCategory
                        ? Colors[colorScheme ?? 'light'].tint
                        : Colors[colorScheme ?? 'light'].backgroundPaper,
                      borderColor: !selectedCategory
                        ? Colors[colorScheme ?? 'light'].elderlyTabActive
                        : Colors[colorScheme ?? 'light'].tabIconDefault + '30',
                    }
                  ]}
                  onPress={async () => {
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedCategory(undefined);
                    setShowCategoryModal(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="All topics"
                >
                  <Text style={styles.categoryOptionEmoji}>📂</Text>
                  <Text style={[
                    styles.categoryOptionText,
                    { color: !selectedCategory ? '#FFFFFF' : Colors[colorScheme ?? 'light'].text }
                  ]}>
                    All
                  </Text>
                  {!selectedCategory && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Individual Categories */}
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.categoryOptionActive,
                      {
                        backgroundColor: selectedCategory === category.id
                          ? Colors[colorScheme ?? 'light'].tint
                          : Colors[colorScheme ?? 'light'].backgroundPaper,
                        borderColor: selectedCategory === category.id
                          ? Colors[colorScheme ?? 'light'].elderlyTabActive
                          : Colors[colorScheme ?? 'light'].tabIconDefault + '30',
                      }
                    ]}
                    onPress={async () => {
                      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelectedCategory(category.id);
                      setShowCategoryModal(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={category.display_name}
                  >
                    <Text style={styles.categoryOptionEmoji}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryOptionText,
                      { color: selectedCategory === category.id ? '#FFFFFF' : Colors[colorScheme ?? 'light'].text }
                    ]}>
                      {category.display_name}
                    </Text>
                    {selectedCategory === category.id && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 72,  // Increased from 60 for better balance without header
    paddingBottom: 80,  // Reduced from 100 to give more room for nav buttons
  },
  topicCardsContainer: {
    marginBottom: 20,  // Reduced from 32 to save space
  },
  cardStack: {
    height: 460,  // Reduced from 490 to create more room at bottom
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCard: {
    width: '90%',
    height: 420,  // Reduced from 450 to save vertical space
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: 'absolute',
  },
  backgroundCard: {
    zIndex: 1,
  },
  activeCard: {
    zIndex: 2,
  },
  topicCardInner: {
    flex: 1,
    padding: 40,  // Increased from 32 for generous breathing room
    borderRadius: 18,
    justifyContent: 'space-between',
  },
  topicContent: {
    flex: 1,
    justifyContent: 'flex-start',  // Changed from 'center' for top-to-bottom flow
    paddingTop: 8,  // Add some top padding
  },
  // Category Badge Styles
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',  // Center the badge horizontally
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,  // Space before question
    gap: 8,
  },
  categoryBadgeIcon: {
    fontSize: 18,
  },
  categoryBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Recorded Badge Styles
  recordedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    gap: 6,
  },
  recordedBadgeIcon: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordedBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  // Question Text - Larger and More Prominent
  topicTitle: {
    fontSize: 28,  // Increased from 24 for elderly users
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,  // Increased spacing
    lineHeight: 36,  // Better line height for readability
    paddingHorizontal: 8,  // Slight padding for better text flow
  },
  topicActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 24,  // Increased spacing from content
    paddingTop: 16,  // Extra padding for separation
  },
  topicActionButton: {
    width: 64,  // Increased from 56 for better touch targets
    height: 64,  // Increased from 56 for better touch targets
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
  },
  recordButton: {
  },
  recentSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  recentCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentText: {
    fontSize: 16,
    marginLeft: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 32,  // Increased from 24 for more spacing
    gap: 20,        // Increased from 16 for more gap between buttons
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,  // Increased from 12 for modern, softer feel
    minHeight: 64,     // Increased from 56 for WCAG AAA optimal
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },  // Increased from 2 for depth
    shadowOpacity: 0.08,  // Reduced from 0.1 for softer, modern shadow
    shadowRadius: 12,     // Increased from 4 for softer spread
    elevation: 2,
  },
  navButtonLeft: {
    gap: 8,
  },
  navButtonRight: {
    gap: 8,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryScrollView: {
    minHeight: 64,          // Changed from maxHeight: 52 to prevent clipping
    marginBottom: 24,       // Increased from 20 for more separation
    marginTop: 8,           // Add top margin for balance
  },
  categoryScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,  // Increased from 18 for better spacing
    paddingVertical: 14,    // Increased from 12 for better touch targets
    minHeight: 56,          // Increased from 48 (WCAG AAA touch target)
    borderRadius: 28,       // Increased from 24 to match larger padding
    gap: 10,                // Increased from 8 for better spacing
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryTabActive: {
    borderWidth: 2,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ scale: 1.02 }],
  },
  categoryTabEmoji: {
    fontSize: 20,           // Increased from 18 for better visibility
  },
  categoryTabText: {
    fontSize: 17,           // Increased from 16 for elderly users
    fontWeight: '600',
    letterSpacing: 0.3,     // Add letter spacing for readability
  },
  // Recording Filter Checkbox Styles (Toggle Design)
  recordingFilterCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,       // Increased from 12 for more separation
    gap: 16,                // Increased from 12
    minHeight: 56,          // Ensure touch target
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  checkbox: {
    width: 56,              // Toggle width (2:1 ratio)
    height: 32,             // Toggle height
    borderRadius: 16,       // Fully rounded ends
    borderWidth: 2.5,       // Thicker border for visibility
    justifyContent: 'center',
    position: 'relative',
  },
  checkboxKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  checkboxKnobUnchecked: {
    left: 4,
  },
  checkboxKnobChecked: {
    left: 28,               // 56 - 24 - 4
  },
  checkboxChecked: {
    // backgroundColor applied inline based on theme
  },
  checkboxLabel: {
    fontSize: 18,           // Readable size for elderly
    fontWeight: '500',
    flex: 1,                // Allow text to wrap if needed
    lineHeight: 24,         // Better readability
  },
  // Unified Filter Bar Styles
  unifiedFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderRadius: 16,
    gap: 12,
    minHeight: 68,          // Compact 68px height (saves 90px vs old layout)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
    minHeight: 48,
    flex: 1,                // Take available space on left
    maxWidth: '60%',        // Leave room for toggle
  },
  categoryIcon: {
    fontSize: 22,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,                // Allow text to take available space
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Category Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    maxHeight: '75%',       // Bottom sheet takes up 75% of screen
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalCloseButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    gap: 16,
    minHeight: 72,          // Large touch target for elderly (WCAG AAA+)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryOptionActive: {
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryOptionEmoji: {
    fontSize: 28,           // Large emoji for visibility
  },
  categoryOptionText: {
    fontSize: 19,           // Large text for elderly readability
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.3,
  },
});