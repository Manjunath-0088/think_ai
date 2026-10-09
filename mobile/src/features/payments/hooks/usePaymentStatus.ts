import { useEffect, useRef, useState } from 'react';

import { PaymentStatusResponse } from '../types';

export function usePaymentStatus(
  paymentId: string | null,
  opts = { intervalMs: 2000, maxAttempts: 30 }
) {
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [status, setStatus] = useState<'idle' | 'polling' | 'success' | 'timeout' | 'error'>('idle');
  const [attempts, setAttempts] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const optsRef = useRef(opts);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  useEffect(() => {
    optsRef.current = opts;
  }, [opts]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    if (!paymentId) return;
    let cancelled = false;
    const poll = async () => {
      if (attemptsRef.current >= optsRef.current.maxAttempts) {
        if (!cancelled) setStatus('timeout');
        return;
      }
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`);
        const json: PaymentStatusResponse = await res.json();
        if (cancelled) return;
        setData(json);
        const s = json.status;
        if (s === 'confirmed' || s === 'succeeded' || s === 'completed') {
          setStatus('success');
          return;
        }
        if (s === 'failed' || s === 'cancelled') {
          setStatus('error');
          return;
        }
        setAttempts((a) => a + 1);
        timer.current = setTimeout(poll, optsRef.current.intervalMs);
      } catch {
        if (cancelled) return;
        setAttempts((a) => a + 1);
        timer.current = setTimeout(poll, optsRef.current.intervalMs);
      }
    };
    setStatus('polling');
    poll();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [paymentId]);

  return { ...data, status, attempts };
}
