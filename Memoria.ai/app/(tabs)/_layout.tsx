import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EnclaveTabBarBackground } from '@/components/EnclaveTabBarBackground';
import { FloatingTabOverlay } from '@/components/FloatingTabOverlay';
import { ThemeSelectionModal } from '@/components/ThemeSelectionModal';
import { RecordingProvider, useRecording } from '@/contexts/RecordingContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { MemoryProvider } from '@/contexts/MemoryContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootTabParamList } from '@/types/navigation';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { triggerRecording, isRecording } = useRecording();
  const { user, loading } = useAuth();
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Redirect to welcome if user is not authenticated
  useEffect(() => {
    // Only redirect if loading is complete and there's no user
    if (!loading && !user) {
      console.log('TabLayout: No user after loading complete, redirecting to welcome');
      router.replace('/welcome');
    }
  }, [user, loading]);

  const handleRecordPress = () => {
    // Show theme selection modal instead of directly recording
    setShowThemeModal(true);
  };

  const handleThemeSelect = (theme: any) => {
    console.log('Tab layout - theme selected:', theme.title);
    setShowThemeModal(false);
    // Navigate to the index screen and trigger recording with selected theme
    router.push('/');
    // Trigger the recording flow with the selected theme
    triggerRecording(theme);
  };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].elderlyTabActive,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].elderlyTabInactive,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: EnclaveTabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              backgroundColor: Colors[colorScheme ?? 'light'].tabBarBackground,
              height: 88,
              paddingBottom: 20,
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
              borderTopWidth: 0,
            },
            default: {
              backgroundColor: Colors[colorScheme ?? 'light'].tabBarBackground,
              height: 80,
              paddingBottom: 16,
              paddingTop: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 10,
              borderTopWidth: 0,
            },
          }),
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginTop: 4,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 36 : 32}
                name="house.fill"
                color={color}
              />
            ),
            tabBarAccessibilityLabel: 'Home dashboard with memory overview',
            tabBarTestID: 'home-tab',
          }}
        />
        <Tabs.Screen
          name="mylife"
          options={{
            title: 'My Life',
            tabBarIcon: ({ color, focused }) => (
              <IconSymbol
                size={focused ? 36 : 32}
                name="book.fill"
                color={color}
              />
            ),
            tabBarAccessibilityLabel: 'View memories and profile',
            tabBarTestID: 'mylife-tab',
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            href: null, // This will hide the tab
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null, // This will hide the tab
          }}
        />
      </Tabs>

      {/* Floating Recording Button Overlay */}
      <FloatingTabOverlay
        onRecordPress={handleRecordPress}
        isRecording={isRecording}
      />

      {/* Theme Selection Modal */}
      <ThemeSelectionModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onThemeSelect={handleThemeSelect}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <SettingsProvider>
      <MemoryProvider>
        <RecordingProvider>
          <TabLayoutContent />
        </RecordingProvider>
      </MemoryProvider>
    </SettingsProvider>
  );
}
