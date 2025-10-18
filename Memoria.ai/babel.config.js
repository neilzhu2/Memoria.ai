module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Re-enabled tamagui plugin (was disabled, causing build to hang)
      ['@tamagui/babel-plugin', { components: ['tamagui'], config: './tamagui.config.ts' }],
      // Reanimated plugin MUST be last:
      'react-native-reanimated/plugin',
    ],
  }
}
