import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform, StyleSheet } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      style={[
        props.style,
        styles.elderlyFriendlyTab
      ]}
      onPressIn={(ev) => {
        // Stronger haptic feedback for elderly users
        if (Platform.OS === 'ios') {
          // Use medium impact for better tactile feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (Platform.OS === 'android') {
          // Android haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        props.onPressIn?.(ev);
      }}
      onPress={(ev) => {
        // Additional haptic feedback on successful press
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (Platform.OS === 'android') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        props.onPress?.(ev);
      }}
      // Enhanced accessibility for elderly users
      accessibilityRole="tab"
      accessibilityHint="Double tap to navigate to this section"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Larger touch area
    />
  );
}

const styles = StyleSheet.create({
  elderlyFriendlyTab: {
    // Ensure minimum touch target size of 44x44 points (iOS HIG)
    minHeight: 44,
    minWidth: 44,
    // Add padding to increase touch area
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
