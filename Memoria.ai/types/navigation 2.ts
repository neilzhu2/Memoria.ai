/**
 * Navigation Types for Memoria.ai Asymmetric Tab System
 *
 * Defines TypeScript interfaces for the 3-tab asymmetric navigation:
 * [🏠 Home] [🎙️ FAB] [📖 My Life]
 */

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Root tab navigator param list
export type RootTabParamList = {
  home: undefined;
  mylife: {
    section?: 'memories' | 'profile';
    memoryId?: string;
  };
};

// Navigation prop types for each screen
export type HomeScreenNavigationProp = StackNavigationProp<RootTabParamList, 'home'>;
export type MyLifeScreenNavigationProp = StackNavigationProp<RootTabParamList, 'mylife'>;

// Route prop types for each screen
export type HomeScreenRouteProp = RouteProp<RootTabParamList, 'home'>;
export type MyLifeScreenRouteProp = RouteProp<RootTabParamList, 'mylife'>;

// Combined navigation and route props for screens
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

export interface MyLifeScreenProps {
  navigation: MyLifeScreenNavigationProp;
  route: MyLifeScreenRouteProp;
}

// Tab bar configuration types
export interface TabBarConfig {
  activeTintColor: string;
  inactiveTintColor: string;
  backgroundColor: string;
  height: number;
  paddingBottom: number;
  paddingTop: number;
}

// Asymmetric tab layout types
export interface AsymmetricTabConfig {
  homeTabWidth: number;
  fabWidth: number;
  myLifeTabWidth: number;
  totalWidth: number;
}

// Tab accessibility types
export interface TabAccessibilityConfig {
  label: string;
  hint?: string;
  testID: string;
  role?: string;
}