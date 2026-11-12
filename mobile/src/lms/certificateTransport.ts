import { API_BASE_URL } from '@/api/http';
import { getSession, restoreSession } from '@/api/session';
import type { Certificate } from './types';

export function ownedCertificateUrl(certificate: Certificate): string {
  const base = new URL(API_BASE_URL);
  const url = new URL(certificate.pdfUrl, base);
  const expected = `${base.pathname.replace(/\/$/, '')}/certificates/${encodeURIComponent(certificate.certificateNo)}/download`;
  if (!certificate.enrollmentId || url.origin !== base.origin || url.pathname !== expected || url.search || url.hash || url.username || url.password)
    throw new Error('The certificate download route does not match the configured API. Refresh the certificate.');
  return url.href;
}
export function base64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const n = bytes[i]! << 16 | (bytes[i + 1] || 0) << 8 | (bytes[i + 2] || 0);
    parts.push(chars[n >>> 18]! + chars[n >>> 12 & 63]! + (i + 1 < bytes.length ? chars[n >>> 6 & 63] : '=') + (i + 2 < bytes.length ? chars[n & 63] : '='));
  }
  return parts.join('');
}
export async function certificatePdfBytes(certificate: Certificate): Promise<string> {
  const url = ownedCertificateUrl(certificate);
  await restoreSession();
  const token = getSession().token;
  if (!token) throw new Error('Sign in to download your certificate.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    // Do not forward a bearer token through a server redirect or third-party PDF viewer.
    const response = await fetch(url, { headers: { Accept: 'application/pdf', Authorization: `Bearer ${token}` }, redirect: 'error', signal: controller.signal });
    if (!response.ok) throw new Error('Certificate PDF is not available. Refresh and contact the administrator if it has not been issued.');
    const limit = 5 * 1024 * 1024;
    if (Number(response.headers.get('content-length')) > limit) throw new Error('The certificate exceeds the 5 MB preview limit.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length > limit || bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 5)) !== '%PDF-') throw new Error('The server did not return a valid certificate PDF.');
    if (getSession().token !== token) throw new Error('Your account changed. Open the certificate again.');
    return base64(bytes);
  } finally { clearTimeout(timer); }
}
