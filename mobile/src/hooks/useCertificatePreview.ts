import { useEffect, useState } from 'react';
import { certificatePdfBytes } from '@/lms/certificateTransport';
import type { Certificate } from '@/lms/types';
export function useCertificatePreview(certificate: Certificate | null) {
  const [document, setDocument] = useState<{ owner: Certificate; url: string } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setDocument(null); setError('');
    if (certificate?.enrollmentId) void certificatePdfBytes(certificate).then(bytes => {
      if (active) setDocument({ owner: certificate, url: `data:application/pdf;base64,${bytes}` });
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'PDF preview could not load.'); });
    return () => { active = false; };
  }, [certificate]);
  return { url: certificate?.enrollmentId ? (document?.owner === certificate ? document.url : null) : certificate?.pdfUrl, error };
}
