/**
 * Mock for React Native Dimensions API
 * This provides a stable mock for testing across all platforms
 */

const Dimensions = {
  get: jest.fn((dimension) => {
    if (dimension === 'window') {
      return {
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      };
    }
    if (dimension === 'screen') {
      return {
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      };
    }
    return {
      width: 375,
      height: 667,
      scale: 2,
      fontScale: 1,
    };
  }),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  set: jest.fn(),
};

module.exports = Dimensions;
