/**
 * Jest Configuration for Memoria.ai
 * Optimized for React Native Expo testing with elderly-friendly features
 */

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/components/**/*.(test|spec).(js|jsx|ts|tsx)',
  ],

  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '@testing-library/jest-native/extend-expect'
  ],

  // Module name mapping for Expo
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
    '^@/contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
  },

  // Transform ignore patterns for React Native modules
  transformIgnorePatterns: [
    'node_modules/(?!(' +
    '@react-native|' +
    'react-native|' +
    'expo|' +
    '@expo|' +
    'expo-av|' +
    'expo-haptics|' +
    'expo-speech|' +
    'expo-font|' +
    'expo-blur|' +
    '@tamagui|' +
    'zustand|' +
    'react-native-reanimated' +
    ')/)',
  ],

  // Coverage settings
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'src/**/*.{js,jsx,ts,tsx}',
    'contexts/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.*',
    '!src/**/*.test.*',
    '!src/**/index.{js,ts}',
    '!**/node_modules/**',
    '!**/.expo/**',
  ],

  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Phase 2 recording flow requires 100% coverage
    './components/Recording*.tsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './components/ActiveRecording*.tsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './components/FloatingRecord*.tsx': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },

  // Test timeout for slower operations (elderly-friendly longer timeouts)
  testTimeout: 15000,

  // Verbose output for better debugging
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Mock static assets
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Globals for React Native
  globals: {
    __DEV__: true,
  },
};