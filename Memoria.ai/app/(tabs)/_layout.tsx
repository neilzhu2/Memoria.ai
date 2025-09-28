import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { useRouter } from 'expo-router';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { EnclaveTabBarBackground } from '@/components/EnclaveTabBarBackground';
import { FloatingTabOverlay } from '@/components/FloatingTabOverlay';
import { RecordingProvider, useRecording } from '@/contexts/RecordingContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { RootTabParamList } from '@/types/navigation';

function TabLayoutContent() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { triggerRecording, isRecording } = useRecording();

  const handleRecordPress = () => {
    // Navigate to the index screen and trigger recording
    router.push('/');
    // Trigger the recording flow
    triggerRecording();
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
      </Tabs>

      {/* Floating Recording Button Overlay */}
      <FloatingTabOverlay
        onRecordPress={handleRecordPress}
        isRecording={isRecording}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <RecordingProvider>
      <TabLayoutContent />
    </RecordingProvider>
  );
}
