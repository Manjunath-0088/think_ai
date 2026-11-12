import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { registerAccount } from '@/api/auth';
import { signIn } from '@/api/session';
import { registerPushNotifications } from '@/features/notifications/pushRegistration';
import type { ScreenProps } from '@/navigation/types';
import { roleHome } from '@/lms/access';
import { consumeAllowedPendingDeepLink } from '@/navigation/deepLinks';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';
import { useTheme } from '@/theme/ThemeProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen({ navigation }: ScreenProps<'Register'>) {
  const styles = useThemedStyles(createStyles);
  const { palette } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name.trim()) {
      setError('Enter your name to create an account.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Accept the terms and conditions to continue.');
      return;
    }

    setSubmitting(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const result = await registerAccount(name, email, password, controller.signal);
      await signIn(String(result.user.id), result.token, result.user);
      void registerPushNotifications().catch(() => undefined);
      const pendingRoute = consumeAllowedPendingDeepLink(result.user.role);
      if (pendingRoute) {
        navigation.reset({
          index: 0,
          routes: [{ name: pendingRoute.screen, params: pendingRoute.params } as never],
        });
      } else {
        navigation.replace(roleHome(result.user.role));
      }
    } catch (registrationError) {
      setError(
        registrationError instanceof Error && registrationError.name === 'AbortError'
          ? 'The server did not respond. Start the backend and check that your phone and laptop use the same Wi-Fi.'
          : registrationError instanceof Error
            ? registrationError.message
            : 'Could not create your account. Please try again.',
      );
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="register-screen">
      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Start learning with Thinkz AI.</Text>
        <TextInput
          accessibilityLabel="Full name"
          autoCapitalize="words"
          autoComplete="name"
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          testID="register-name"
          value={name}
        />
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          testID="register-email"
          value={email}
        />
        <TextInput
          accessibilityLabel="Password"
          autoComplete="new-password"
          onChangeText={setPassword}
          placeholder="Password (at least 6 characters)"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={styles.input}
          testID="register-password"
          value={password}
        />
        <TextInput
          accessibilityLabel="Confirm password"
          autoComplete="new-password"
          onChangeText={setConfirmPassword}
          placeholder="Confirm password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          style={styles.input}
          testID="register-confirm-password"
          value={confirmPassword}
        />
        <Pressable
          accessibilityLabel="Accept terms and conditions"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acceptTerms }}
          onPress={() => setAcceptTerms((value) => !value)}
          style={styles.terms}
          testID="register-terms">
          <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
            {acceptTerms ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.termsLabel}>I accept the terms and conditions.</Text>
        </Pressable>

        {error ? (
          <Text accessibilityLiveRegion="assertive" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ busy: submitting, disabled: submitting }}
          disabled={submitting}
          onPress={() => void submit()}
          style={[styles.button, submitting && styles.buttonDisabled]}
          testID="register-submit">
          {submitting ? (
            <ActivityIndicator color={palette.textInverse} />
          ) : (
            <Text style={styles.buttonLabel}>Create account</Text>
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
          testID="register-login-link">
          <Text style={styles.loginLabel}>Already have an account? Sign in</Text>
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
  terms: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: palette.brand, borderColor: palette.brand },
  checkmark: { ...typography.caption, color: palette.textInverse, fontWeight: '700' },
  termsLabel: { ...typography.caption, color: palette.textSecondary, flex: 1 },
  error: { ...typography.caption, color: '#F87171' },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: palette.brand,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonLabel: { ...typography.label, color: palette.textInverse, fontWeight: '700' },
  loginLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  loginLabel: { ...typography.caption, color: palette.accent },
});

export default RegisterScreen;
