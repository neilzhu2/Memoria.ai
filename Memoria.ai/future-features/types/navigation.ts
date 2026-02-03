/**
 * Navigation TypeScript interfaces for Memoria.ai
 * Designed for simple, accessible navigation for elderly users
 */

import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Main navigation stack with limited complexity for elderly users
export type RootStackParamList = {
  Home: undefined;
  Recording: {
    editMemoryId?: string; // Optional: if editing existing memory
  };
  Memories: {
    filter?: 'all' | 'favorites' | 'recent';
  };
  MemoryDetails: {
    memoryId: string;
  };
  Settings: undefined;
  Onboarding: undefined;
  AccessibilitySetup: undefined;
  Help: undefined;
};

// Navigation props for each screen
export type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
export type RecordingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Recording'>;
export type MemoriesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Memories'>;
export type MemoryDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MemoryDetails'>;
export type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;
export type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

// Route props for each screen
export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
export type RecordingScreenRouteProp = RouteProp<RootStackParamList, 'Recording'>;
export type MemoriesScreenRouteProp = RouteProp<RootStackParamList, 'Memories'>;
export type MemoryDetailsScreenRouteProp = RouteProp<RootStackParamList, 'MemoryDetails'>;
export type SettingsScreenRouteProp = RouteProp<RootStackParamList, 'Settings'>;
export type OnboardingScreenRouteProp = RouteProp<RootStackParamList, 'Onboarding'>;

// Screen props combining navigation and route
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

export interface RecordingScreenProps {
  navigation: RecordingScreenNavigationProp;
  route: RecordingScreenRouteProp;
}

export interface MemoriesScreenProps {
  navigation: MemoriesScreenNavigationProp;
  route: MemoriesScreenRouteProp;
}

export interface MemoryDetailsScreenProps {
  navigation: MemoryDetailsScreenNavigationProp;
  route: MemoryDetailsScreenRouteProp;
}

export interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
  route: SettingsScreenRouteProp;
}

export interface OnboardingScreenProps {
  navigation: OnboardingScreenNavigationProp;
  route: OnboardingScreenRouteProp;
}

// Tab navigation icons with accessibility labels
export interface TabBarIcon {
  name: string;
  label: string;
  accessibilityLabel: string;
  accessibilityHint: string;
}