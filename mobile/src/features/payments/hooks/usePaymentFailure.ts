import { useMemo } from 'react';
import { useRoute } from '@react-navigation/native';

import { FailureReasonKey } from '../failure';

export function usePaymentFailure() {
  const route = useRoute<any>();
  const p = route.params || {};
  const reason: FailureReasonKey = (p.reason as FailureReasonKey) || 'unknown';
  const errorCode = p.errorCode as string | undefined;
  const message = p.message as string | undefined;
  const preserve = !!p.preserve;
  const formValues = p.formValues || {};

  return useMemo(
    () => ({
      reason,
      errorCode,
      message,
      preserve,
      formValues,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reason, errorCode, message, preserve, JSON.stringify(formValues)]
  );
}
