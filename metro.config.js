const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 * 
 */
const {
    wrapWithReanimatedMetroConfig,
  } = require('react-native-reanimated/metro-config');
  
const config = {
    resetCache: true
};

module.exports = wrapWithReanimatedMetroConfig(config);
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
