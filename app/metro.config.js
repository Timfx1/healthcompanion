// Expo projects must use Sentry's Expo-specific Metro wrapper. Using the bare
// React Native `withSentryConfig(getDefaultConfig(...))` breaks Sentry's Metro
// serializer on export (TypeError in determineDebugIdFromBundleSource).
// See: https://docs.sentry.io/platforms/react-native/manual-setup/metro/
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = getSentryExpoConfig(__dirname);
