/**
 * Mock for React Native PixelRatio API
 * This provides a stable mock for testing across all platforms
 */

const PixelRatio = {
  get: jest.fn(() => 2),
  getFontScale: jest.fn(() => 1),
  getPixelSizeForLayoutSize: jest.fn((size) => Math.round(size * 2)),
  roundToNearestPixel: jest.fn((size) => {
    const ratio = PixelRatio.get();
    return Math.round(size * ratio) / ratio;
  }),
};

module.exports = PixelRatio;
