/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Optimized for elderly users (65+) with high contrast and accessibility standards.
 * Follows WCAG 2.1 AA guidelines for color contrast ratios.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Elderly-friendly colors with high contrast ratios
const elderlyActiveColor = '#2E86AB'; // High contrast blue
const elderlyInactiveColor = '#4A4A4A'; // Dark gray for better visibility
const elderlyTabBackground = '#FFFFFF'; // Pure white for maximum contrast

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Elderly-specific colors
    elderlyTabActive: elderlyActiveColor,
    elderlyTabInactive: elderlyInactiveColor,
    tabBarBackground: elderlyTabBackground,
    elderlyHighContrast: '#000000',
    elderlyMediumContrast: '#333333',
    elderlyLightContrast: '#666666',
    elderlySuccess: '#2E7D32', // High contrast green
    elderlyWarning: '#F57F17', // High contrast amber
    elderlyError: '#C62828', // High contrast red
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Elderly-specific dark mode colors
    elderlyTabActive: '#64B5F6', // Lighter blue for dark mode
    elderlyTabInactive: '#BDBDBD', // Light gray for dark mode
    tabBarBackground: '#1E1E1E', // Dark background
    elderlyHighContrast: '#FFFFFF',
    elderlyMediumContrast: '#E0E0E0',
    elderlyLightContrast: '#BDBDBD',
    elderlySuccess: '#4CAF50', // Lighter green for dark mode
    elderlyWarning: '#FFC107', // Lighter amber for dark mode
    elderlyError: '#F44336', // Lighter red for dark mode
  },
};
