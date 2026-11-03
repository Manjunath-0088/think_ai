import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { authenticate } from '@/api/auth';
import { signIn } from '@/api/session';
import { registerPushNotifications } from '@/features/notifications/pushRegistration';
import type { ScreenProps } from '@/navigation/types';
import {radii, spacing, typography} from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Sign-in for the deep-link auth gate and learner journey. Credentials are
 * verified by the LMS and the returned bearer token is used for API requests.
 */
export function LoginScreen({ navigation }: ScreenProps<'Login'>) {
  const styles = useThemedStyles(createStyles);
  const { palette } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      setError('Enter your email and a password of at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const result = await authenticate(email, password, controller.signal);
      await signIn(String(result.user.id), result.token, result.user);
      // Permission may be declined; that must never block sign-in.
      void registerPushNotifications().catch(() => undefined);
      navigation.replace('LearnerDashboard');
    } catch (loginError) {
      setError(
        loginError instanceof Error && loginError.name === 'AbortError'
          ? 'The server did not respond. Start the backend and check that your phone and laptop use the same Wi-Fi.'
          : loginError instanceof Error
            ? loginError.message
            : 'Could not sign in. Check your details and try again.',
      );
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="login-screen">
      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue learning.</Text>

        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="learner@example.com"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          testID="login-email"
          value={email}
        />
        <TextInput
          accessibilityLabel="Password"
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={styles.input}
          testID="login-password"
          value={password}
        />

        {error ? (
          <Text accessibilityLiveRegion="assertive" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: submitting }}
          disabled={submitting}
          onPress={submit}
          style={[styles.button, submitting && styles.buttonDisabled]}
          testID="login-submit">
          {submitting ? (
            <ActivityIndicator color={palette.textInverse} />
          ) : (
            <Text style={styles.buttonLabel}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (palette: Palette) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: { ...typography.title, color: palette.textPrimary },
  subtitle: { ...typography.body, color: palette.textSecondary },
  input: {
    ...typography.body,
    color: palette.textPrimary,
    backgroundColor: palette.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { ...typography.caption, color: '#F87171' },
  button: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: palette.brand,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonLabel: {
    ...typography.label,
    color: palette.textInverse,
    fontWeight: '700',
  },
});

export default LoginScreen;
