import { StyleSheet, Text, View } from 'react-native';

import { FailureReasonKey } from '../failure';

const ICONS: Record<FailureReasonKey, string> = {
  declined: '!',
  insufficient_funds: '$',
  expired: '...',
  network: '~',
  unknown: 'x',
};

export function ErrorIcon({ type }: { type: FailureReasonKey }) {
  return (
    <View style={styles.container}>
      <Text accessibilityLabel={`error-icon-${type}`} style={styles.icon}>
        {ICONS[type] ?? ICONS.unknown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 60,
    fontWeight: '700',
    color: '#d32f2f',
  },
});
