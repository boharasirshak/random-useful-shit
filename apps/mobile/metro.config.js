const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('riv'); // Rive animations in assets/rive/
config.resolver.blockList = [...config.resolver.blockList, /^(?:ios|android)-(?:dev|prod)$/]; // parked native folders (scripts/native.sh)
// Unrot's cards live in packages/unrot-content so the server can serve the same file.
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../../packages/unrot-content')];
module.exports = config;
