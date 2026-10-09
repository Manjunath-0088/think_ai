import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ErrorIcon } from '../components/ErrorIcon';
import { FailureReason } from '../components/FailureReason';
import { RetryButton } from '../components/RetryButton';
import { SupportContactLink } from '../components/SupportContactLink';
import { usePaymentFailure } from '../hooks/usePaymentFailure';

export function PaymentFailedScreen() {
  const nav = useNavigation<any>();
  const { reason, preserve, formValues } = usePaymentFailure();
  const onRetry = () => {
    if (preserve) {
      nav.navigate('Checkout', { formValues });
    } else {
      nav.navigate('Checkout');
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container} testID="payment-failed-screen">
      <ErrorIcon type={reason} />
      <FailureReason type={reason} />
      <RetryButton onPress={onRetry} />
      <SupportContactLink />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
});
