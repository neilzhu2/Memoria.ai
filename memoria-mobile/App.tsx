/**
 * Memoria.ai - Memory Preservation App
 * Main App component with accessibility-focused navigation
 * Optimized for elderly users (65+)
 */

import React, { useEffect } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  HomeScreen,
  RecordingScreen,
  MemoriesScreen,
  SettingsScreen,
} from './src/screens';
import { RootStackParamList } from './src/types';
import { useUserStore, useSettingsStore } from './src/stores';
import { audioService, storageService } from './src/services';

// Create navigation stack
const Stack = createStackNavigator<RootStackParamList>();

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  const { user, initializeOnboarding } = useUserStore();
  const { shouldUseHighContrast, getCurrentFontSize } = useSettingsStore();

  // Initialize app services and accessibility
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize audio service
        await audioService.initialize();

        // Announce app ready for screen readers
        AccessibilityInfo.announceForAccessibility('Memoria app is ready. Navigate to start recording memories.');

        // Initialize onboarding for first-time users
        if (!user || user.isFirstTimeUser) {
          initializeOnboarding();
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        Alert.alert(
          'Initialization Error',
          'There was a problem starting the app. Please restart and try again.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    };

    initializeApp();
  }, []);

  // Configure accessibility settings
  useEffect(() => {
    const configureAccessibility = async () => {
      try {
        // Reduce motion if user prefers
        const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
        if (isReduceMotionEnabled) {
          // Apply reduced motion settings
          console.log('Reduced motion enabled by system');
        }

        // Check if screen reader is enabled
        const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
        if (isScreenReaderEnabled) {
          console.log('Screen reader enabled - optimizing for accessibility');
        }
      } catch (error) {
        console.warn('Accessibility configuration failed:', error);
      }
    };

    configureAccessibility();
  }, []);

  const highContrast = shouldUseHighContrast();
  const fontSize = getCurrentFontSize();

  // Navigation theme based on accessibility settings
  const navigationTheme = {
    dark: highContrast,
    colors: {
      primary: '#2563eb',
      background: highContrast ? '#000000' : '#f8fafc',
      card: highContrast ? '#333333' : '#ffffff',
      text: highContrast ? '#ffffff' : '#1f2937',
      border: highContrast ? '#666666' : '#e5e7eb',
      notification: '#dc2626',
    },
  };

  // Screen options for accessibility
  const screenOptions = {
    headerStyle: {
      backgroundColor: highContrast ? '#333333' : '#ffffff',
      shadowOpacity: 0.1,
    },
    headerTitleStyle: {
      fontSize: fontSize + 2,
      fontWeight: '600' as const,
      color: highContrast ? '#ffffff' : '#1f2937',
    },
    headerTintColor: highContrast ? '#ffffff' : '#2563eb',
    // Larger back button area for elderly users
    headerLeftContainerStyle: {
      paddingLeft: 16,
    },
    headerRightContainerStyle: {
      paddingRight: 16,
    },
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar
            style={highContrast ? 'light' : 'auto'}
            backgroundColor={highContrast ? '#000000' : '#ffffff'}
          />

          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={screenOptions}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'Memoria',
                headerShown: true,
                // Add accessibility labels
                headerAccessibilityLabel: 'Memoria home screen',
              }}
            />

            <Stack.Screen
              name="Recording"
              component={RecordingScreen}
              options={{
                title: 'Record Memory',
                headerShown: true,
                headerAccessibilityLabel: 'Record new memory screen',
                // Prevent accidental back navigation during recording
                gestureEnabled: false,
              }}
            />

            <Stack.Screen
              name="Memories"
              component={MemoriesScreen}
              options={({ route }) => {
                const filter = route.params?.filter || 'all';
                const titles = {
                  all: 'All Memories',
                  favorites: 'Favorite Memories',
                  recent: 'Recent Memories',
                };

                return {
                  title: titles[filter] || 'Memories',
                  headerShown: true,
                  headerAccessibilityLabel: `${titles[filter]} screen`,
                };
              }}
            />

            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
                headerShown: true,
                headerAccessibilityLabel: 'Settings screen',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
