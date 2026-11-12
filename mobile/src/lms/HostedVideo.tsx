import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
export function HostedVideo({ url }: { url: string }) {
  // Direct YouTube WebViews do not automatically send the embedding app identity.
  const appId = Platform.OS === 'ios'
    ? Constants.expoConfig?.ios?.bundleIdentifier
    : Constants.expoConfig?.android?.package;
  const headers = appId && /^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*$/.test(appId)
    ? { Referer: `https://${appId.toLowerCase()}/` } : undefined;
  return <View style={{ width: '100%', height: 230, backgroundColor: '#000' }}>
    <WebView source={{ uri: url, headers }} allowsFullscreenVideo allowsInlineMediaPlayback
      javaScriptEnabled originWhitelist={['https://*']} accessibilityLabel="Lesson video player" />
  </View>;
}
