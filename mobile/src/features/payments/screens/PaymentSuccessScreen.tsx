import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { PaymentDetails } from '../types';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { SuccessCheckmark } from '../components/SuccessCheckmark';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { ReceiptSummary } from '../components/ReceiptSummary';
import { AccessCourseButton } from '../components/AccessCourseButton';
import { EmailConfirmationNote } from '../components/EmailConfirmationNote';

export function PaymentSuccessScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { paymentId, payment: initialPayment } = route.params || {};
  const { payment, status } = usePaymentStatus(paymentId ?? null) as {
    payment?: PaymentDetails;
    status: 'idle' | 'polling' | 'success' | 'timeout' | 'error';
  };

  const p: PaymentDetails | undefined = payment || initialPayment;
  const redirected = useRef(false);

  useEffect(() => {
    if (status === 'timeout' && !redirected.current) {
      redirected.current = true;
      nav.replace('PaymentFailed', { reason: 'network', preserve: true });
    }
    if (status === 'error' && p?.failureReason && !redirected.current) {
      redirected.current = true;
      nav.replace('PaymentFailed', { reason: p.failureReason, preserve: true });
    }
  }, [status, p, nav]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID="payment-success-screen">
      <SuccessCheckmark />
      <ConfettiBurst />
      <Text style={styles.title} testID="payment-success-title">
        Payment successful
      </Text>
      {p && <ReceiptSummary p={p} />}
      {p?.courseId ? (
        <AccessCourseButton
          courseId={p.courseId}
          courseTitle={p.courseTitle}
          onPress={() => nav.navigate('CourseDetail', { courseId: p.courseId })}
        />
      ) : null}
      {p?.receiptEmail ? <EmailConfirmationNote email={p.receiptEmail} /> : null}
      {status === 'polling' ? (
        <Text style={styles.polling} testID="payment-status-polling">
          Confirming payment...
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
  },
  polling: {
    color: '#666',
    fontSize: 14,
  },
});
