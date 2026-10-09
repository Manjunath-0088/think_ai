export type FailureReasonKey = 'declined' | 'insufficient_funds' | 'expired' | 'network' | 'unknown';

export const failureMessages: Record<FailureReasonKey, { title: string; body: string }> = {
  declined: { title: 'Payment Declined', body: 'Your bank declined this transaction. Please try a different payment method.' },
  insufficient_funds: { title: 'Insufficient Funds', body: 'There are not enough funds to complete this payment.' },
  expired: { title: 'Payment Expired', body: 'This checkout session expired. Please restart checkout.' },
  network: { title: 'Network Error', body: 'We could not reach the payment provider. Check your connection and retry.' },
  unknown: { title: 'Payment Failed', body: 'Something went wrong while processing your payment.' },
};
