import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { ApiError } from '@/api/http';
import { getJitsiCredentials, type JitsiCredentials } from '@/api/liveStudioApi';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemedStyles } from '@/theme/useThemedStyles';

/**
 * Builds the self-hosted Jitsi Meet URL. Authentication uses the short-lived
 * token issued by the backend; the app's own bearer token is never exposed to
 * the embedded page.
 */
export function buildJitsiUrl(credentials: JitsiCredentials): string {
  const configured = (credentials.domain || '').trim().replace(/\/+$/, '');
  const base = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  const room = encodeURIComponent(credentials.room || 'live');
  const config = [
    'config.prejoinPageEnabled=false',
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=false',
  ].join('&');
  return `${base}/${room}?jwt=${encodeURIComponent(credentials.token)}#${config}`;
}

async function requestMediaPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const permissions = [
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ];
  const result = await PermissionsAndroid.requestMultiple(permissions);
  return permissions.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

export function JitsiRoom({ sessionId, title }: { sessionId: string; title: string }) {
  const { palette } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [credentials, setCredentials] = useState<JitsiCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCredentials(null);
    try {
      const granted = await requestMediaPermissions();
      if (mounted.current && !granted) {
        setMediaNotice(
          'Camera or microphone permission was not granted. You can still watch and listen, then allow access in Android settings to speak or share video.',
        );
      }
      const next = await getJitsiCredentials(sessionId);
      if (mounted.current) setCredentials(next);
    } catch (caught) {
      if (mounted.current) {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Could not open the video room. Check your connection and try again.',
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  if (loading) {
    return (
      <View style={styles.state}>
        <ActivityIndicator color={palette.brand} />
        <Text style={styles.muted}>Preparing the secure video room…</Text>
      </View>
    );
  }

  if (error || !credentials) {
    return (
      <View style={styles.state}>
        <Text style={styles.errorText}>{error || 'The video room is not available right now.'}</Text>
        <Pressable accessibilityRole="button" onPress={() => void load()} style={styles.secondary}>
          <Text style={styles.secondaryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {mediaNotice ? <Text style={styles.notice}>{mediaNotice}</Text> : null}
      <WebView
        testID="jitsi-room-webview"
        source={{ uri: buildJitsiUrl(credentials) }}
        style={styles.webview}
        originWhitelist={['https://*', 'about:*']}
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserGesture={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaCapturePermissionGrantType="grant"
        androidLayerType="hardware"
        onError={() =>
          setError('The video room failed to load. Check your connection and try again.')
        }
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400) {
            setError(`The video room could not be loaded (HTTP ${event.nativeEvent.statusCode}).`);
          }
        }}
        accessibilityLabel={`${title} video room`}
      />
    </View>
  );
}

const createStyles = (palette: Palette) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
      backgroundColor: '#050814',
      borderRadius: radii.lg,
      padding: spacing.xs,
      overflow: 'hidden',
      borderColor: palette.border,
      borderWidth: 1,
    },
    webview: { minHeight: 240, backgroundColor: '#050814', borderRadius: radii.md },
    state: {
      minHeight: 120,
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: radii.lg,
      borderColor: palette.border,
      borderWidth: 1,
    },
    muted: { ...typography.body, color: palette.textSecondary, textAlign: 'center' },
    errorText: { ...typography.body, color: palette.danger, textAlign: 'center' },
    notice: { ...typography.caption, color: palette.textSecondary, paddingHorizontal: spacing.xs },
    secondary: {
      borderWidth: 1,
      borderColor: palette.brand,
      borderRadius: radii.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    secondaryText: { ...typography.label, color: palette.brand },
  });
