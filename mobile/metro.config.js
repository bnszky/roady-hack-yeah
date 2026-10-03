// Monorepo-aware Metro config for Expo.
// getDefaultConfig(__dirname) auto-detects the workspace root (npm workspaces).
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
