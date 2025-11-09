import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State, HandlerStateChangeEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { useRecording } from '@/contexts/RecordingContext';
import { RecordingFlowContainer } from '@/components/RecordingFlowContainer';
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
const SWIPE_THRESHOLD = screenWidth * 0.25;
const VELOCITY_THRESHOLD = 1000;

interface NavigationState {
  currentIndex: number;
  history: number[];
  historyPosition: number;
}

const HomeScreen = React.memo(function HomeScreen() {
  const colorScheme = useColorScheme();
  const { recordingTrigger, selectedThemeFromTrigger } = useRecording();

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
      leftIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
    }

    // Right card: where left swipe (forward) will go
    let rightIndex: number;
    if (historyPosition < history.length - 1) {
      // Can go forward in history
      rightIndex = history[historyPosition + 1];
    } else {
      // Would create new next card
      rightIndex = (currentIndex + 1) % DAILY_TOPICS.length;
    }

    return {
      left: DAILY_TOPICS[leftIndex],
      right: DAILY_TOPICS[rightIndex],
      current: DAILY_TOPICS[currentIndex]
    };
  }, [navState]);

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
          const nextIndex = (currentIndex + 1) % DAILY_TOPICS.length;
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
          const prevIndex = (currentIndex - 1 + DAILY_TOPICS.length) % DAILY_TOPICS.length;
          return {
            currentIndex: prevIndex,
            history: [prevIndex, ...history],
            historyPosition: 0
          };
        }
      }
    });
  }, []);

  // Gesture handler
  const onPanHandlerStateChange = useCallback((event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX, velocityX } = event.nativeEvent;

      // Determine if swipe is strong enough
      const shouldSwipe = Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(velocityX) > VELOCITY_THRESHOLD;

      if (shouldSwipe) {
        // Determine direction and navigate
        const direction = translationX > 0 ? 'backward' : 'forward';

        // Animate card out
        const toValue = translationX > 0 ? screenWidth : -screenWidth;
        Animated.parallel([
          Animated.timing(translateX, { toValue, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.8, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          // Reset animation values
          translateX.setValue(0);
          translateY.setValue(0);
          scale.setValue(1);

          // Navigate to new card
          navigate(direction);
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
  }, [navigate]);

  const onPanGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleSkipPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigate('forward');
  }, [navigate]);

  const handleRecordPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Green button on card should skip theme selection and go straight to recording
    // Pass the current topic as the selected theme
    const currentTopic = DAILY_TOPICS[navState.currentIndex];
    setSelectedTopic({
      id: currentTopic.id.toString(),
      title: currentTopic.title
    });
    setSkipThemeSelection(true);
    setShowRecordingFlow(true);
  }, [navState.currentIndex]);

  return (
    <View
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
    >
      <StatusBar style="auto" />

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
          {/* Background Cards - Visual Preview */}
          {/* Left Card - Shows where right swipe will go */}
          <View style={[
            styles.topicCard,
            styles.backgroundCard,
            styles.leftCard,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}>
            <View style={[styles.topicCardInner, {
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
              opacity: 0.4
            }]}>
              <Text style={[styles.topicTitle, {
                color: Colors[colorScheme ?? 'light'].text,
                opacity: 0.4
              }]}>
                {backgroundCards.left.title}
              </Text>
            </View>
          </View>

          {/* Right Card - Shows where left swipe will go */}
          <View style={[
            styles.topicCard,
            styles.backgroundCard,
            styles.rightCard,
            { backgroundColor: Colors[colorScheme ?? 'light'].background }
          ]}>
            <View style={[styles.topicCardInner, {
              borderColor: Colors[colorScheme ?? 'light'].tabIconDefault,
              opacity: 0.6
            }]}>
              <Text style={[styles.topicTitle, {
                color: Colors[colorScheme ?? 'light'].text,
                opacity: 0.6
              }]}>
                {backgroundCards.right.title}
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
                { backgroundColor: Colors[colorScheme ?? 'light'].background },
                {
                  transform: [
                    { translateX },
                    { translateY },
                    { scale }
                  ]
                },
              ]}
            >
              <View style={[styles.topicCardInner, { borderColor: Colors[colorScheme ?? 'light'].tint }]}>
                <Text style={[styles.topicTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {backgroundCards.current.title}
                </Text>
                <Text style={[styles.topicDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  {backgroundCards.current.description}
                </Text>
                <View style={styles.topicActions}>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.skipButton, { borderColor: Colors[colorScheme ?? 'light'].elderlyError, backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    onPress={handleSkipPress}
                    accessibilityLabel="Skip this topic"
                  >
                    <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].elderlyError} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.topicActionButton, styles.recordButton, { borderColor: Colors[colorScheme ?? 'light'].elderlySuccess, backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                    onPress={handleRecordPress}
                    accessibilityLabel="Record about this topic"
                  >
                    <IconSymbol name="mic.fill" size={24} color={Colors[colorScheme ?? 'light'].elderlySuccess} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </PanGestureHandler>
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
    </View>
  );
});

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
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
    borderWidth: 2,
  },
  recordButton: {
    borderWidth: 2,
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
  backgroundCard: {
    position: 'absolute',
  },
  leftCard: {
    left: -20,
    zIndex: 1,
    transform: [{ rotate: '-8deg' }, { scale: 0.95 }],
  },
  rightCard: {
    right: -20,
    zIndex: 2,
    transform: [{ rotate: '8deg' }, { scale: 0.98 }],
  },
  activeCard: {
    zIndex: 3,
  },
});