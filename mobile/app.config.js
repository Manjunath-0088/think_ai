/** Expo's debug builds may call a local Android emulator backend over HTTP.
 * Release builds keep Android cleartext traffic disabled; configure the live
 * backend URL with EXPO_PUBLIC_API_URL (HTTPS) for an APK/AAB release.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    usesCleartextTraffic: process.env.NODE_ENV !== 'production',
  },
});
