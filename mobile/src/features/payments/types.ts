export type PaymentStatus = 'pending' | 'confirmed' | 'succeeded' | 'completed' | 'failed' | 'cancelled';
export interface PaymentDetails {
  id: string;
  planName: string;
  amount: number;
  currency: string;
  transactionId: string;
  paidAt: string;
  courseId: string;
  courseTitle?: string;
  receiptEmail?: string;
  failureReason?: string;
}
export interface PaymentStatusResponse {
  status: PaymentStatus;
  payment?: PaymentDetails;
}
