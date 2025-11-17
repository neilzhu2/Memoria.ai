/**
 * Color system for Memoria.ai
 * Now powered by DesignTokens for consistency and accessibility
 *
 * This file provides backward compatibility by mapping to the new DesignTokens system.
 * Optimized for elderly users (65+) with WCAG AAA contrast standards.
 *
 * Updated: November 11, 2025 - Warm color palette implementation
 */

import { DesignTokens } from './DesignTokens';

export const Colors = {
  light: {
    // Core colors mapped to DesignTokens
    text: DesignTokens.colors.text.primary,
    background: DesignTokens.colors.background.default,
    tint: DesignTokens.colors.primary.main,
    icon: DesignTokens.colors.text.tertiary,
    tabIconDefault: DesignTokens.colors.text.tertiary,
    tabIconSelected: DesignTokens.colors.primary.main,

    // Elderly-specific colors - Updated to warm palette
    elderlyTabActive: DesignTokens.colors.highlight.main,        // Honey gold (strategic rebalancing)
    elderlyTabInactive: DesignTokens.colors.neutral[400],        // #A8A198 Lighter gray (less competitive)
    tabBarBackground: DesignTokens.colors.background.paper,      // Pure white

    // Contrast levels
    elderlyHighContrast: DesignTokens.colors.text.primary,       // Dark warm gray
    elderlyMediumContrast: DesignTokens.colors.text.secondary,   // Medium warm gray
    elderlyLightContrast: DesignTokens.colors.text.tertiary,     // Light warm gray

    // Semantic colors
    elderlySuccess: DesignTokens.colors.secondary.main,          // Sage green
    elderlyWarning: DesignTokens.colors.warning.main,            // Warm orange
    elderlyError: DesignTokens.colors.error.main,                // High contrast red

    // Additional token access for direct use
    primary: DesignTokens.colors.primary.main,
    primaryDark: DesignTokens.colors.primary.dark,
    primaryLight: DesignTokens.colors.primary.light,

    secondary: DesignTokens.colors.secondary.main,
    secondaryDark: DesignTokens.colors.secondary.dark,
    secondaryLight: DesignTokens.colors.secondary.light,

    accent: DesignTokens.colors.accent.main,
    accentDark: DesignTokens.colors.accent.dark,
    accentLight: DesignTokens.colors.accent.light,

    highlight: DesignTokens.colors.highlight.main,
    highlightDark: DesignTokens.colors.highlight.dark,
    highlightLight: DesignTokens.colors.highlight.light,
    highlightContrast: DesignTokens.colors.highlight.contrast,

    // Surface colors
    backgroundDefault: DesignTokens.colors.background.default,
    backgroundPaper: DesignTokens.colors.background.paper,
    backgroundElevated: DesignTokens.colors.background.elevated,

    // Text colors
    textPrimary: DesignTokens.colors.text.primary,
    textSecondary: DesignTokens.colors.text.secondary,
    textTertiary: DesignTokens.colors.text.tertiary,
    textDisabled: DesignTokens.colors.text.disabled,

    // Border colors
    borderLight: DesignTokens.colors.neutral[200],
    borderMedium: DesignTokens.colors.neutral[300],
  },

  dark: {
    // Dark mode with warm color palette
    text: DesignTokens.colors.text.primaryDark,
    background: DesignTokens.colors.background.defaultDark,
    tint: DesignTokens.colors.primary.mainDark,
    icon: DesignTokens.colors.text.tertiaryDark,
    tabIconDefault: DesignTokens.colors.text.tertiaryDark,
    tabIconSelected: DesignTokens.colors.primary.mainDark,

    // Elderly-specific colors - Updated to warm palette for dark mode
    elderlyTabActive: DesignTokens.colors.highlight.mainDark,         // Bright honey gold (strategic rebalancing)
    elderlyTabInactive: DesignTokens.colors.neutral[400],             // #A8A198 Lighter gray (less competitive)
    tabBarBackground: DesignTokens.colors.background.paperDark,       // Warm dark

    // Contrast levels
    elderlyHighContrast: DesignTokens.colors.text.primaryDark,        // Light warm text
    elderlyMediumContrast: DesignTokens.colors.text.secondaryDark,    // Medium light text
    elderlyLightContrast: DesignTokens.colors.text.tertiaryDark,      // Tertiary text

    // Semantic colors
    elderlySuccess: DesignTokens.colors.secondary.mainDark,           // Sage green (light)
    elderlyWarning: DesignTokens.colors.warning.mainDark,             // Warm orange (light)
    elderlyError: DesignTokens.colors.error.mainDark,                 // Light red

    // Additional token access for direct use
    primary: DesignTokens.colors.primary.mainDark,
    primaryDark: DesignTokens.colors.primary.darkDark,
    primaryLight: DesignTokens.colors.primary.lightDark,

    secondary: DesignTokens.colors.secondary.mainDark,
    secondaryDark: DesignTokens.colors.secondary.darkDark,
    secondaryLight: DesignTokens.colors.secondary.lightDark,

    accent: DesignTokens.colors.accent.mainDark,
    accentDark: DesignTokens.colors.accent.darkDark,
    accentLight: DesignTokens.colors.accent.lightDark,

    highlight: DesignTokens.colors.highlight.mainDark,
    highlightDark: DesignTokens.colors.highlight.darkDark,
    highlightLight: DesignTokens.colors.highlight.lightDark,
    highlightContrast: DesignTokens.colors.highlight.contrast,

    // Surface colors
    backgroundDefault: DesignTokens.colors.background.defaultDark,
    backgroundPaper: DesignTokens.colors.background.paperDark,
    backgroundElevated: DesignTokens.colors.background.elevatedDark,

    // Text colors
    textPrimary: DesignTokens.colors.text.primaryDark,
    textSecondary: DesignTokens.colors.text.secondaryDark,
    textTertiary: DesignTokens.colors.text.tertiaryDark,
    textDisabled: DesignTokens.colors.text.disabledDark,

    // Border colors
    borderLight: DesignTokens.colors.neutral[700],
    borderMedium: DesignTokens.colors.neutral[600],
  },
};
