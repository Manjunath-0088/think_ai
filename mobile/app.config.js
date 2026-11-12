/** Expo's debug builds may call a local Android emulator backend over HTTP.
 * Release builds keep Android cleartext traffic disabled; configure the live
 * backend URL with EXPO_PUBLIC_API_URL (HTTPS) for an APK/AAB release.
 */
module.exports = ({ config }) => ({
  ...(() => {
    if (process.env.EAS_BUILD_PROFILE !== 'production') return {};
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (!apiUrl) {
      throw new Error('EXPO_PUBLIC_API_URL must be set for production Android builds.');
    }
    let parsed;
    try {
      parsed = new URL(apiUrl);
    } catch {
      throw new Error('EXPO_PUBLIC_API_URL must be an absolute HTTPS URL for production builds.');
    }
    if (parsed.protocol !== 'https:') {
      throw new Error('EXPO_PUBLIC_API_URL must use HTTPS for production builds.');
    }
    return {};
  })(),
  ...config,
  plugins: Array.from(new Set([
    ...(config.plugins ?? []),
    '@react-native-community/datetimepicker',
    'expo-sharing',
    'expo-secure-store',
  ])),
  android: {
    ...config.android,
    // Live Studio uses the platform WebView, which needs camera/microphone
    // permission to publish audio/video to the Jitsi room. Declaring them here
    // keeps the runtime permission prompt and Play Store manifest in sync.
    permissions: Array.from(new Set([
      ...(config.android?.permissions ?? []),
      'CAMERA',
      'RECORD_AUDIO',
      'MODIFY_AUDIO_SETTINGS',
    ])),
    usesCleartextTraffic: process.env.EAS_BUILD_PROFILE !== 'production'
      && process.env.NODE_ENV !== 'production',
  },
});
