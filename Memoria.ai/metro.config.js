const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable import.meta support for web builds
config.transformer.unstable_allowRequireContext = true;

// Configure web-specific settings
if (config.resolver.platforms && !config.resolver.platforms.includes('web')) {
  config.resolver.platforms.push('web');
}

module.exports = config;