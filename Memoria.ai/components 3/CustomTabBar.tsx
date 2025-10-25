import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { IconSymbol } from './ui/IconSymbol';
import { FloatingRecordButton } from './FloatingRecordButton';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onRecordPress: () => void;
  isRecording?: boolean;
}

export function CustomTabBar({
  state,
  descriptors,
  navigation,
  onRecordPress,
  isRecording = false
}: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleTabPress = async (route: any, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Don't navigate to the record tab - it's handled by the floating button
    if (route.name === 'explore') {
      onRecordPress();
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const getTabIcon = (routeName: string, focused: boolean) => {
    const size = focused ? 28 : 24;
    const color = focused ? colors.elderlyTabActive : colors.elderlyTabInactive;

    switch (routeName) {
      case 'index':
        return <IconSymbol name="book.fill" size={size} color={color} />;
      case 'profile':
        return <IconSymbol name="person.fill" size={size} color={color} />;
      default:
        return <IconSymbol name="questionmark" size={size} color={color} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Memories';
      case 'explore':
        return 'Record';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View style={styles.container}>
      {/* Curved background for the floating button */}
      <View style={[styles.curvedBackground, { backgroundColor: colors.tabBarBackground }]} />

      {/* Tab bar content */}
      <View style={[styles.tabBar, { backgroundColor: colors.tabBarBackground }]}>

        {/* Left tab - Memories */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress(state.routes[0], 0)}
          accessibilityLabel="View your saved memories"
        >
          <View style={styles.tabContent}>
            {getTabIcon('index', state.index === 0)}
            <Text style={[
              styles.tabLabel,
              {
                color: state.index === 0 ? colors.elderlyTabActive : colors.elderlyTabInactive,
                fontWeight: state.index === 0 ? '600' : '400'
              }
            ]}>
              {getTabLabel('index')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Center space for floating button */}
        <View style={styles.centerSpace}>
          <FloatingRecordButton
            onPress={onRecordPress}
            isRecording={isRecording}
            size={70}
          />
        </View>

        {/* Right tab - Profile */}
        <TouchableOpacity
          style={styles.tab}
          onPress={() => handleTabPress(state.routes[2], 2)}
          accessibilityLabel="View and edit your profile settings"
        >
          <View style={styles.tabContent}>
            {getTabIcon('profile', state.index === 2)}
            <Text style={[
              styles.tabLabel,
              {
                color: state.index === 2 ? colors.elderlyTabActive : colors.elderlyTabInactive,
                fontWeight: state.index === 2 ? '600' : '400'
              }
            ]}>
              {getTabLabel('profile')}
            </Text>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  curvedBackground: {
    position: 'absolute',
    top: -35,
    left: width / 2 - 50,
    width: 100,
    height: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    zIndex: 0,
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.select({
      ios: 88,
      default: 80,
    }),
    paddingBottom: Platform.select({
      ios: 20,
      default: 16,
    }),
    paddingTop: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 60,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  centerSpace: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 15, // Lift the button slightly above the tab bar
    minWidth: 100,
  },
});