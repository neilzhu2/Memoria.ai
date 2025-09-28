module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Temporarily disabled tamagui plugin to fix import.meta issues
      // ['@tamagui/babel-plugin', { components: ['tamagui'], config: './tamagui.config.ts' }],
      // Reanimated plugin MUST be last:
      'react-native-reanimated/plugin',
    ],
  }
}
