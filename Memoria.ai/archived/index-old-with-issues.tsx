import React, { useState, useRef, useCallback, useReducer, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State, HandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRecording } from '@/contexts/RecordingContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const DAILY_TOPICS = [
  {
    id: 1,
    title: "Talk about your first job",
    description: "Share memories about your early career experiences, colleagues, and what you learned."
  },
  {
    id: 2,
    title: "Describe your childhood home",
    description: "Paint a picture of where you grew up, the rooms, the neighborhood, and special memories."
  },
  {
    id: 3,
    title: "Share a family tradition",
    description: "Tell us about a special tradition your family had and why it was meaningful."
  },
  {
    id: 4,
    title: "Your most memorable vacation",
    description: "Recall a trip that left a lasting impression and the adventures you had."
  },
  {
    id: 5,
    title: "A person who influenced you",
    description: "Describe someone who made a significant impact on your life and how they changed you."
  },
  {
    id: 6,
    title: "Your wedding day",
    description: "Share the joy, excitement, and special moments from one of life's biggest celebrations."
  },
  {
    id: 7,
    title: "A challenge you overcame",
    description: "Tell the story of a difficult time and how you found the strength to get through it."
  },
  {
    id: 8,
    title: "Your proudest achievement",
    description: "Reflect on an accomplishment that filled you with pride and satisfaction."
  }
];

const { width: screenWidth } = Dimensions.get('window');

// Transform constants for Tamagui compatibility - no object literals
const CARD_ROTATION_LEFT = '-8deg';
const CARD_ROTATION_RIGHT = '8deg';
const CARD_SCALE_LEFT = 0.95;
const CARD_SCALE_RIGHT = 0.98;
const SWIPE_ROTATION_MULTIPLIER = 30;
const SWIPE_SCALE_MIN = 0.8;
const SWIPE_THRESHOLD_RATIO = 0.25;
const VELOCITY_THRESHOLD = 1000;
const ANIMATION_DURATION = 300;
const SWIPE_EXIT_MULTIPLIER = 1.5;

// Animation interpolation constants
const ROTATION_INPUT_RANGE = [-100, 0, 100];
const ROTATION_OUTPUT_LEFT = '-15deg';
const ROTATION_OUTPUT_CENTER = '0deg';
const ROTATION_OUTPUT_RIGHT = '15deg';

// Navigation state type
interface NavigationState {
  currentIndex: number;
  cardStack: number[];
  stackPosition: number;
  isAnimating: boolean;
}

// Navigation actions
type NavigationAction =
  | { type: 'NAVIGATE_FORWARD' }
  | { type: 'NAVIGATE_BACKWARD' }
  | { type: 'SET_ANIMATING'; payload: boolean }
  | { type: 'RESET_TO_INITIAL' };

// Navigation reducer for atomic state updates
function navigationReducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'NAVIGATE_FORWARD': {
      if (state.isAnimating) return state;

      if (state.stackPosition < state.cardStack.length - 1) {
        // Go forward in history
        const nextPosition = state.stackPosition + 1;
        const nextIndex = state.cardStack[nextPosition];
        return {
          ...state,
          stackPosition: nextPosition,
          currentIndex: nextIndex,
          isAnimating: true
        };
      } else {
        // Add new card to history
        const nextIndex = (state.currentIndex + 1) % DAILY_TOPICS.length;
        const newStack = [...state.cardStack, nextIndex];
        return {
          ...state,
          cardStack: newStack,
          stackPosition: state.stackPosition + 1,
          currentIndex: nextIndex,
          isAnimating: true
        };
      }
    }

    case 'NAVIGATE_BACKWARD': {
      if (state.isAnimating) return state;

      if (state.stackPosition > 0) {
        // Go back in history
        const prevPosition = state.stackPosition - 1;
        const prevIndex = state.cardStack[prevPosition];
        return {
          ...state,
          stackPosition: prevPosition,
          currentIndex: prevIndex,
          isAnimating: true
        };
      } else {
        // Add previous card to beginning of history
        const prevIndex = (state.currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
        const newStack = [prevIndex, ...state.cardStack];
        return {
          ...state,
          cardStack: newStack,
          currentIndex: prevIndex,
          isAnimating: true
        };
      }
    }

    case 'SET_ANIMATING':
      return {
        ...state,
        isAnimating: action.payload
      };

    case 'RESET_TO_INITIAL':
      return {
        currentIndex: 0,
        cardStack: [0],
        stackPosition: 0,
        isAnimating: false
      };

    default:
      return state;
  }
}

const HomeScreen = React.memo(function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { memoryStats, generateSmartExport, isExporting } = useRecording();

  // Unified navigation state with reducer for atomic updates
  const [navigationState, dispatchNavigation] = useReducer(navigationReducer, {
    currentIndex: 0,
    cardStack: [0],
    stackPosition: 0,
    isAnimating: false
  });

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Transform styles - defined inline to avoid object literal issues
  const leftCardTransform = [
    { rotate: CARD_ROTATION_LEFT },
    { scale: CARD_SCALE_LEFT }
  ];

  const rightCardTransform = [
    { rotate: CARD_ROTATION_RIGHT },
    { scale: CARD_SCALE_RIGHT }
  ];

  const activeCardTransform = [
    { translateX },
    { translateY },
    {
      rotate: rotate.interpolate({
        inputRange: ROTATION_INPUT_RANGE,
        outputRange: [ROTATION_OUTPUT_LEFT, ROTATION_OUTPUT_CENTER, ROTATION_OUTPUT_RIGHT],
        extrapolate: 'clamp',
      })
    },
    { scale },
  ];

  // Memoized background card calculations - show where swipes will take you
  const { leftCard, rightCard, currentTopic } = useMemo(() => {
    const { currentIndex, cardStack, stackPosition } = navigationState;

    // Left card preview: shows where RIGHT swipe (backward navigation) will take you
    let leftCardIndex: number;
    if (stackPosition > 0) {
      // There's history to go back to
      leftCardIndex = cardStack[stackPosition - 1];
    } else {
      // No history, show previous topic in sequence
      leftCardIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
    }

    // Right card preview: shows where LEFT swipe (forward navigation) will take you
    let rightCardIndex: number;
    if (stackPosition < cardStack.length - 1) {
      // There's forward history
      rightCardIndex = cardStack[stackPosition + 1];
    } else {
      // No forward history, show next topic in sequence
      rightCardIndex = (currentIndex + 1) % DAILY_TOPICS.length;
    }

    return {
      leftCard: DAILY_TOPICS[leftCardIndex],
      rightCard: DAILY_TOPICS[rightCardIndex],
      currentTopic: DAILY_TOPICS[currentIndex]
    };
  }, [navigationState]);

  // Memory stats come from the recording context

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSmartExportPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (memoryStats.totalMemories === 0) {
      Alert.alert(
        'No Memories Yet',
        'Start recording your first memory to create your memoir!'
      );
      return;
    }

    if (isExporting) {
      Alert.alert('Export in Progress', 'Please wait for the current export to complete.');
      return;
    }

    Alert.alert(
      'Smart Export',
      `Create a beautiful memoir from your ${memoryStats.totalMemories} memories.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            const result = await generateSmartExport({
              type: 'full',
              includeAudio: true,
              includeTranscriptions: true,
              format: 'pdf',
              familySharing: true,
            });

            if (result.success) {
              Alert.alert('Export Complete', 'Your memoir has been generated successfully!');
            } else {
              Alert.alert('Export Failed', result.error || 'Unable to generate memoir.');
            }
          },
        },
      ]
    );
  }, [memoryStats.totalMemories, isExporting, generateSmartExport]);

  const handleViewMemoriesPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/mylife?section=memories');
  }, [router]);

  const handleProfilePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/mylife?section=profile');
  }, [router]);

  const handleRecordPromptPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Start Recording',
      'Tap the recording button in the center to start sharing your memories.',
      [{ text: 'Got it!', style: 'default' }]
    );
  }, []);

  // Navigation function with atomic state updates
  const navigateToTopic = useCallback((direction: 'forward' | 'backward') => {
    if (navigationState.isAnimating) return;

    // Dispatch atomic navigation action
    if (direction === 'forward') {
      dispatchNavigation({ type: 'NAVIGATE_FORWARD' });
    } else {
      dispatchNavigation({ type: 'NAVIGATE_BACKWARD' });
    }

    // Clear animation flag after animation completes
    setTimeout(() => {
      dispatchNavigation({ type: 'SET_ANIMATING', payload: false });
    }, ANIMATION_DURATION);
  }, [navigationState.isAnimating]);

  const handleTopicSkip = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigateToTopic('forward');
  }, [navigateToTopic]);

  const handleTopicLike = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to start recording with this topic
    router.push('/'); // This will trigger the FAB recording flow
    Alert.alert(
      'Great Choice!',
      `Ready to record about: ${currentTopic.title}\n\nTap the record button to start sharing your memory.`,
      [{ text: 'Let\'s go!', style: 'default' }]
    );
  }, [router, currentTopic.title]);

  // Card swipe gesture handlers
  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = useCallback((event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      if (navigationState.isAnimating) {
        // Reset to center if animation in progress
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        return;
      }

      const { translationX, velocityX } = event.nativeEvent;
      const swipeThreshold = screenWidth * SWIPE_THRESHOLD_RATIO;

      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > VELOCITY_THRESHOLD) {
        const direction = translationX > 0 ? 1 : -1;
        const navigationDirection = translationX > 0 ? 'backward' : 'forward';
        const toValue = direction * screenWidth * SWIPE_EXIT_MULTIPLIER;

        // Animate card out
        Animated.parallel([
          Animated.timing(translateX, { toValue, duration: ANIMATION_DURATION, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: direction * SWIPE_ROTATION_MULTIPLIER, duration: ANIMATION_DURATION, useNativeDriver: true }),
          Animated.timing(scale, { toValue: SWIPE_SCALE_MIN, duration: ANIMATION_DURATION, useNativeDriver: true }),
        ]).start(() => {
          // Reset position first
          translateX.setValue(0);
          translateY.setValue(0);
          rotate.setValue(0);
          scale.setValue(1);

          // Then navigate - this ensures animation reset happens before state change
          navigateToTopic(navigationDirection);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        });
      } else {
        // Snap back to center
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          Animated.spring(rotate, { toValue: 0, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
      }
    }
  }, [navigationState.isAnimating, translateX, translateY, rotate, scale, navigateToTopic]);


  return (
    <View
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
    >
      <StatusBar style="auto" />

      {/* Quick Actions - Top */}
      <View style={styles.topActionsContainer}>
        <TouchableOpacity
          style={[styles.topActionButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={handleViewMemoriesPress}
          accessibilityLabel="View all memories"
        >
          <IconSymbol name="list.bullet" size={18} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.topActionText, { color: Colors[colorScheme ?? 'light'].text }]}>
            View Memories
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topActionButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
          onPress={handleSmartExportPress}
          accessibilityLabel="Create memoir export"
        >
          <IconSymbol name="square.and.arrow.up" size={18} color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={[styles.topActionText, { color: Colors[colorScheme ?? 'light'].text }]}>
            Export Memoir
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: Colors[colorScheme ?? 'light'].tint }]}>
          Memoria.ai
        </Text>
        <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
          Your personal memory keeper
        </Text>
      </View>

      {/* Topic Cards - Swipeable Stack */}
      <View style={styles.topicCardsContainer}>
        <View style={styles.cardStack}>
          {/* Background Cards - Visual Preview of Adjacent Topics */}
          {/* Left Card - Previous card in history or previous topic */}
          <View style={[
            styles.topicCard,
            styles.backgroundCard,
            styles.leftCard,
            { backgroundColor: 'white', transform: leftCardTransform }
          ]}>
            <View style={[styles.topicCardInner, { borderColor: Colors[colorScheme ?? 'light'].tabIconDefault, opacity: 0.4 }]}>
              <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text, opacity: 0.4 }]}>
                {leftCard.title}
              </Text>
            </View>
          </View>

          {/* Right Card - Next topic in sequence */}
          <View style={[
            styles.topicCard,
            styles.backgroundCard,
            styles.rightCard,
            { backgroundColor: 'white', transform: rightCardTransform }
          ]}>
            <View style={[styles.topicCardInner, { borderColor: Colors[colorScheme ?? 'light'].tabIconDefault, opacity: 0.6 }]}>
              <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text, opacity: 0.6 }]}>
                {rightCard.title}
              </Text>
            </View>
          </View>

          {/* Main Active Card */}
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
                { backgroundColor: 'white' },
                { transform: activeCardTransform },
              ]}
            >
              <View style={[styles.topicCardInner, { borderColor: Colors[colorScheme ?? 'light'].tint }]}>
                <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {currentTopic.title}
                </Text>
                <Text style={[styles.topicDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  {currentTopic.description}
                </Text>
                <View style={styles.topicActions}>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.skipButton]}
                    onPress={handleTopicSkip}
                    accessibilityLabel="Skip this topic"
                  >
                    <IconSymbol name="xmark" size={24} color="#e74c3c" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.recordButton]}
                    onPress={handleTopicLike}
                    accessibilityLabel="Record about this topic"
                  >
                    <IconSymbol name="mic.fill" size={24} color="#27ae60" />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </View>
      </View>



      {/* Recent Activity */}
      {memoryStats.totalMemories > 0 && (
        <View style={styles.recentSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            This Week
          </Text>
          <View style={[styles.recentCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.recentRow}>
              <IconSymbol name="calendar" size={20} color={Colors[colorScheme ?? 'light'].tint} />
              <Text style={[styles.recentText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {memoryStats.memoriesThisWeek} new memories
              </Text>
            </View>
            <View style={styles.recentRow}>
              <IconSymbol name="heart.fill" size={20} color="#e91e63" />
              <Text style={[styles.recentText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Average: {formatDuration(memoryStats.averageRecordingLength)}
              </Text>
            </View>
          </View>
        </View>
      )}

    </View>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60, // Account for status bar
    paddingBottom: 100, // Account for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.8,
  },
  topicCardsContainer: {
    marginBottom: 32,
  },
  cardStack: {
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicCard: {
    width: '90%',
    height: 360,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardBackground: {
    padding: 2,
  },
  topicCardInner: {
    flex: 1,
    padding: 24,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'space-between',
  },
  topicTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  topicDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.8,
    flex: 1,
  },
  topicActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
  },
  topicActionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  skipButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  recordButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
  bottomSpacing: {
    height: 100, // Space for tab bar and FAB
  },
  topActionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  topActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 48,
  },
  topActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  backgroundCard: {
    position: 'absolute',
  },
  leftCard: {
    left: -20,
    zIndex: 1,
  },
  rightCard: {
    right: -20,
    zIndex: 2,
  },
  activeCard: {
    zIndex: 3,
  },
});