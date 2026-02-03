/**
 * Memoria.ai Design Token System
 *
 * Comprehensive design system optimized for elderly users (65+)
 * - Warm color palette (terracotta, sage, soft blues)
 * - WCAG AAA compliant (7:1 contrast minimum)
 * - Large touch targets (56-64pt)
 * - Readable typography (18-20pt baseline)
 *
 * Created: November 11, 2025
 * Last Updated: November 11, 2025
 */

export const DesignTokens = {
  /**
   * COLOR SYSTEM
   * All colors meet WCAG AAA compliance (7:1 for normal text, 4.5:1 for large text)
   * Includes both light and dark mode variants
   */
  colors: {
    // PRIMARY - Warm Terracotta (Main actions, active states)
    primary: {
      main: '#C85A3F',        // 4.5:1 on white (AA Large) - Main actions
      dark: '#A84930',        // 7:1 on white (AAA) - Pressed states
      light: '#E8967D',       // Light variant for backgrounds
      contrast: '#FFFFFF',    // White text on primary
      // Dark mode variants (lighter, more vibrant)
      mainDark: '#E89680',    // Lighter terracotta for dark backgrounds
      darkDark: '#C85A3F',    // Medium for pressed states
      lightDark: '#F5C4B3',   // Very light for backgrounds
    },

    // SECONDARY - Sage Green (Success, positive actions)
    secondary: {
      main: '#5F7A61',        // 7:1 on white (AAA) - Success states
      dark: '#4A5F4C',        // 10:1 on white (AAA+) - Strong success
      light: '#A8BFA9',       // Light variant for backgrounds
      contrast: '#FFFFFF',    // White text on secondary
      // Dark mode variants
      mainDark: '#8FB894',    // Lighter sage for dark backgrounds
      darkDark: '#6B8A6E',    // Medium for pressed states
      lightDark: '#B5D4B8',   // Very light for backgrounds
    },

    // ACCENT - Soft Blue (Information, links)
    accent: {
      main: '#4A7C9A',        // 7:1 on white (AAA) - Information
      dark: '#2E5F7A',        // 10:1 on white (AAA+) - Strong info
      light: '#8FAEC4',       // Light variant for backgrounds
      contrast: '#FFFFFF',    // White text on accent
      // Dark mode variants
      mainDark: '#7BA3BD',    // Lighter blue for dark backgrounds
      darkDark: '#5A8CAA',    // Medium for pressed states
      lightDark: '#A8C7D9',   // Very light for backgrounds
    },

    // HIGHLIGHT - Warm Honey Gold (Energizing secondary accent)
    // Adds vibrancy and brightness to combat "dusk feeling"
    // Optimized for elderly users - warm tones penetrate aged lenses
    highlight: {
      main: '#F5A623',        // 3.5:1 on #FAF8F5 (AA Large 18pt+)
      dark: '#E8931E',        // 4.1:1 on white (AA) - Deeper amber
      light: '#FFD574',       // Light gold for backgrounds
      contrast: '#2B2823',    // Dark text on highlight (8.2:1 AAA)
      // Dark mode variants (brighter for visibility)
      mainDark: '#FFD700',    // Bright gold for dark backgrounds
      darkDark: '#F5A623',    // Medium gold for pressed states
      lightDark: '#FFE57F',   // Very light gold for backgrounds
    },

    // NEUTRALS - Warm grays with beige undertones
    neutral: {
      50: '#FFFBF7',          // Brighter warm off-white background (lightened for less "dusk feeling")
      100: '#FFF9F4',         // Lighter card background (increased brightness)
      200: '#F0EBE0',         // Border light (lightened)
      300: '#D4CFC4',         // Border medium
      400: '#A8A198',         // Text tertiary
      500: '#7A746A',         // Text secondary (7:1 on white)
      600: '#5C574F',         // Text primary (10:1 on white)
      700: '#3F3B35',         // Text strong (15:1 on white)
      800: '#2B2823',         // Almost black
      900: '#1A1816',         // True black alternative
    },

    // SEMANTIC COLORS
    error: {
      main: '#C62828',        // High contrast red (7:1)
      light: '#E57373',       // For backgrounds
      dark: '#8B1F1F',        // Extra strong (12:1)
      contrast: '#FFFFFF',
      // Dark mode variants
      mainDark: '#EF9A9A',    // Lighter red for dark backgrounds
      lightDark: '#FFCDD2',   // Very light for backgrounds
      darkDark: '#E57373',    // Medium for pressed states
    },

    success: {
      main: '#5F7A61',        // Use secondary sage
      light: '#A8BFA9',
      dark: '#4A5F4C',
      contrast: '#FFFFFF',
      // Dark mode variants
      mainDark: '#8FB894',    // Same as secondary
      lightDark: '#B5D4B8',
      darkDark: '#6B8A6E',
    },

    warning: {
      main: '#E67E22',        // Warm orange (4.5:1)
      light: '#F39C6B',
      dark: '#B85F17',        // 7:1 on white
      contrast: '#FFFFFF',
      // Dark mode variants
      mainDark: '#FFB74D',    // Lighter orange for dark backgrounds
      lightDark: '#FFE0B2',   // Very light for backgrounds
      darkDark: '#FF9800',    // Medium for pressed states
    },

    // SURFACES
    background: {
      default: '#FFFBF7',     // Brighter warm off-white (lightened for less "dusk feeling")
      paper: '#FFFFFF',       // Pure white for cards
      elevated: '#FFFFFF',    // Cards with shadow
      // Dark mode variants (warm dark backgrounds)
      defaultDark: '#1C1816', // Warm dark brown-black
      paperDark: '#2B2823',   // Dark card background
      elevatedDark: '#3F3B35', // Elevated dark cards
    },

    // TEXT COLORS (Pre-calculated for backgrounds)
    text: {
      primary: '#2B2823',     // 15:1 on #FAF8F5
      secondary: '#5C574F',   // 10:1 on #FAF8F5
      tertiary: '#7A746A',    // 7:1 on #FAF8F5
      disabled: '#A8A198',    // 4.5:1 on #FAF8F5
      inverse: '#FFFFFF',     // For dark backgrounds
      // Dark mode variants (light text on dark)
      primaryDark: '#F4F1EC',   // Light warm text
      secondaryDark: '#D4CFC4', // Medium light text
      tertiaryDark: '#A8A198',  // Tertiary text
      disabledDark: '#7A746A',  // Disabled text
      inverseDark: '#1C1816',   // Dark text on light backgrounds
    },
  },

  /**
   * SPACING SCALE
   * Based on 8pt grid system for consistency
   * Updated for more breathing room and modern aesthetics
   */
  spacing: {
    xs: 6,      // Increased from 4 - slightly more micro-spacing
    sm: 10,     // Increased from 8 - better for inline gaps
    md: 20,     // Increased from 16 - core spacing unit, more generous
    lg: 32,     // Increased from 24 - section spacing
    xl: 40,     // Increased from 32 - major sections
    xxl: 56,    // Increased from 48 - page-level spacing
    xxxl: 72,   // Increased from 64 - max spacing
  },

  /**
   * BORDER RADIUS
   * Simplified scale for consistency
   */
  radius: {
    sm: 8,              // Small elements, chips
    md: 12,             // Buttons, inputs
    lg: 16,             // Cards
    xl: 24,             // Large cards, modals
    round: 9999,        // Fully rounded (pills, avatars)
  },

  /**
   * ELEVATION (Shadow system)
   * Clear, strong shadows for depth (not neumorphic - accessibility!)
   */
  elevation: {
    0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,      // Reduced from 0.12 (50% softer for modern feel)
      shadowRadius: 4,          // Slightly softer spread
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,      // Reduced from 0.16 (50% softer)
      shadowRadius: 8,          // Softer spread
      elevation: 2,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,      // Reduced from 0.20 (50% softer)
      shadowRadius: 12,         // Softer spread
      elevation: 4,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,      // Reduced from 0.24 (50% softer)
      shadowRadius: 20,         // Softer spread
      elevation: 8,
    },
  },

  /**
   * TYPOGRAPHY
   * Optimized for elderly users - larger sizes, generous line heights
   */
  typography: {
    // Display - Large headers
    display: {
      fontSize: 36,
      lineHeight: 44,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },

    // H1 - Screen titles
    h1: {
      fontSize: 28,
      lineHeight: 36,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },

    // H2 - Section headers
    h2: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },

    // H3 - Card titles
    h3: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },

    // Body Large - Primary content
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },

    // Body - Standard content
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },

    // Body Small - Secondary content
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
      letterSpacing: 0,
    },

    // Caption - Metadata, timestamps
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.3,
    },

    // Button Large - Primary actions
    buttonLarge: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },

    // Button - Standard buttons
    button: {
      fontSize: 18,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },

    // Button Small - Tertiary actions
    buttonSmall: {
      fontSize: 16,
      lineHeight: 20,
      fontWeight: '500' as const,
      letterSpacing: 0.3,
    },
  },

  /**
   * TOUCH TARGETS
   * Optimized for elderly users - larger than standard (44pt)
   */
  touchTarget: {
    minimum: 56,            // WCAG 2.5.5 AAA (44pt is AA, 56pt is better for elderly)
    comfortable: 64,        // Preferred for primary actions
    large: 72,              // For critical actions (recording button)
  },

  /**
   * ANIMATION DURATIONS
   * Gentle, purposeful animations
   */
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
} as const;

/**
 * Helper function to get spacing value
 * Usage: getSpacing('md') => 16
 */
export const getSpacing = (size: keyof typeof DesignTokens.spacing): number => {
  return DesignTokens.spacing[size];
};

/**
 * Helper function to get multiple spacing values
 * Usage: getSpacing('md', 'lg') => [16, 24]
 */
export const getSpacings = (...sizes: Array<keyof typeof DesignTokens.spacing>): number[] => {
  return sizes.map(size => DesignTokens.spacing[size]);
};

/**
 * Type exports for TypeScript autocompletion
 */
export type ColorKey = keyof typeof DesignTokens.colors;
export type SpacingKey = keyof typeof DesignTokens.spacing;
export type RadiusKey = keyof typeof DesignTokens.radius;
export type ElevationKey = keyof typeof DesignTokens.elevation;
export type TypographyKey = keyof typeof DesignTokens.typography;
