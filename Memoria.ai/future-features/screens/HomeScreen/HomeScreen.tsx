/**
 * Home Screen for Memoria.ai
 * Main dashboard optimized for elderly users with large, accessible UI elements
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { HomeScreenProps } from '../../types';
import { useMemoryStore, useUserStore, useSettingsStore } from '../../stores';

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { memories, getRecentMemories, getFavoriteMemories } = useMemoryStore();
  const { user, updateLastActivity } = useUserStore();
  const { getCurrentFontSize, getCurrentTouchTargetSize, shouldUseHighContrast } = useSettingsStore();

  const recentMemories = getRecentMemories(3);
  const favoriteMemories = getFavoriteMemories().slice(0, 3);
  const fontSize = getCurrentFontSize();
  const touchTargetSize = getCurrentTouchTargetSize();
  const highContrast = shouldUseHighContrast();

  // Update user activity when screen is focused
  useFocusEffect(
    useCallback(() => {
      updateLastActivity();
    }, [updateLastActivity])
  );

  // Announce screen to screen readers
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Home screen loaded');
  }, []);

  const handleNewRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate('Recording');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleViewAllMemories = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('Memories', { filter: 'all' });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleViewFavorites = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('Memories', { filter: 'favorites' });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleMemoryPress = async (memoryId: string) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate('MemoryDetails', { memoryId });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const showWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = 'Good day';

    if (hour < 12) {
      greeting = 'Good morning';
    } else if (hour < 17) {
      greeting = 'Good afternoon';
    } else {
      greeting = 'Good evening';
    }

    return `${greeting}, ${user?.name || 'Friend'}!`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: highContrast ? '#000000' : '#f8fafc',
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
    },
    welcomeSection: {
      marginBottom: 24,
      padding: 20,
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    welcomeText: {
      fontSize: fontSize + 4,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 8,
    },
    dateText: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
    },
    quickActionsSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: fontSize + 2,
      fontWeight: '600',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 16,
    },
    primaryButton: {
      backgroundColor: '#2563eb',
      borderRadius: 12,
      paddingVertical: 20,
      paddingHorizontal: 24,
      minHeight: touchTargetSize,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: fontSize + 2,
      fontWeight: '600',
      textAlign: 'center',
    },
    secondaryButton: {
      backgroundColor: highContrast ? '#666666' : '#e5e7eb',
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 20,
      minHeight: touchTargetSize,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    secondaryButtonText: {
      color: highContrast ? '#ffffff' : '#374151',
      fontSize: fontSize,
      fontWeight: '500',
      textAlign: 'center',
    },
    memoriesSection: {
      marginBottom: 24,
    },
    memoryCard: {
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      minHeight: touchTargetSize,
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    memoryTitle: {
      fontSize: fontSize,
      fontWeight: '500',
      color: highContrast ? '#ffffff' : '#1f2937',
      marginBottom: 4,
    },
    memoryDate: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
    },
    emptyStateText: {
      fontSize: fontSize,
      color: highContrast ? '#cccccc' : '#6b7280',
      textAlign: 'center',
      lineHeight: fontSize * 1.5,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      fontSize: fontSize + 6,
      fontWeight: '700',
      color: highContrast ? '#ffffff' : '#2563eb',
    },
    statLabel: {
      fontSize: fontSize - 2,
      color: highContrast ? '#cccccc' : '#6b7280',
      marginTop: 4,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        accessible={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text
            style={styles.welcomeText}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel={`Welcome message: ${showWelcomeMessage()}`}
          >
            {showWelcomeMessage()}
          </Text>
          <Text
            style={styles.dateText}
            accessible={true}
            accessibilityLabel={`Today's date: ${formatDate(new Date())}`}
          >
            {formatDate(new Date())}
          </Text>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text
                style={styles.statNumber}
                accessible={true}
                accessibilityLabel={`Total memories: ${memories.length}`}
              >
                {memories.length}
              </Text>
              <Text style={styles.statLabel}>Memories</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={styles.statNumber}
                accessible={true}
                accessibilityLabel={`Favorite memories: ${favoriteMemories.length}`}
              >
                {favoriteMemories.length}
              </Text>
              <Text style={styles.statLabel}>Favorites</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={styles.statNumber}
                accessible={true}
                accessibilityLabel={`Recent memories: ${recentMemories.length}`}
              >
                {recentMemories.length}
              </Text>
              <Text style={styles.statLabel}>Recent</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Quick Actions
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleNewRecording}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Record new memory"
            accessibilityHint="Tap to start recording a new memory"
          >
            <Text style={styles.primaryButtonText}>Record New Memory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewAllMemories}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View all memories"
            accessibilityHint="Tap to see all your recorded memories"
          >
            <Text style={styles.secondaryButtonText}>View All Memories</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewFavorites}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="View favorite memories"
            accessibilityHint="Tap to see your favorite memories"
          >
            <Text style={styles.secondaryButtonText}>View Favorites</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Memories */}
        <View style={styles.memoriesSection}>
          <Text
            style={styles.sectionTitle}
            accessible={true}
            accessibilityRole="header"
          >
            Recent Memories
          </Text>

          {recentMemories.length > 0 ? (
            recentMemories.map((memory) => (
              <TouchableOpacity
                key={memory.id}
                style={styles.memoryCard}
                onPress={() => handleMemoryPress(memory.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Memory: ${memory.title}`}
                accessibilityHint={`Recorded on ${memory.createdAt.toLocaleDateString()}. Tap to view details`}
              >
                <Text style={styles.memoryTitle} numberOfLines={2}>
                  {memory.title}
                </Text>
                <Text style={styles.memoryDate}>
                  {memory.createdAt.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text
                style={styles.emptyStateText}
                accessible={true}
                accessibilityLabel="No recent memories. Tap the Record New Memory button to get started."
              >
                No recent memories yet.{'\n'}
                Tap "Record New Memory" to get started!
              </Text>
            </View>
          )}
        </View>

        {/* Favorite Memories */}
        {favoriteMemories.length > 0 && (
          <View style={styles.memoriesSection}>
            <Text
              style={styles.sectionTitle}
              accessible={true}
              accessibilityRole="header"
            >
              Favorite Memories
            </Text>

            {favoriteMemories.map((memory) => (
              <TouchableOpacity
                key={memory.id}
                style={styles.memoryCard}
                onPress={() => handleMemoryPress(memory.id)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Favorite memory: ${memory.title}`}
                accessibilityHint={`Recorded on ${memory.createdAt.toLocaleDateString()}. Tap to view details`}
              >
                <Text style={styles.memoryTitle} numberOfLines={2}>
                  ⭐ {memory.title}
                </Text>
                <Text style={styles.memoryDate}>
                  {memory.createdAt.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;