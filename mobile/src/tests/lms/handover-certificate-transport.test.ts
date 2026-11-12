import { base64, certificatePdfBytes, ownedCertificateUrl } from '@/lms/certificateTransport';
jest.mock('@/api/http', () => ({ API_BASE_URL: 'https://api.example.invalid/api' }));
jest.mock('@/api/session', () => ({ restoreSession: jest.fn(), getSession: jest.fn(() => ({ token: 'approved-session' })) }));
import { getSession } from '@/api/session';
const cert = { id: 21, enrollmentId: 6, certificateNo: 'CERT-1', studentName: 'Learner', courseName: 'Python', issuedAt: '2026-11-05', pdfUrl: 'https://api.example.invalid/api/certificates/CERT-1/download' };
afterEach(() => { jest.clearAllMocks(); });
test.each(['https://third-party.invalid/file.pdf', 'https://api.example.invalid/other', 'https://api.example.invalid/api/certificates/CERT-2/download', cert.pdfUrl + '?token=secret'])('never sends a bearer token to an unverified URL %s', async url => {
  global.fetch = jest.fn();
  await expect(certificatePdfBytes({ ...cert, pdfUrl: url })).rejects.toThrow('does not match');
  expect(fetch).not.toHaveBeenCalled();
});
test('authenticates the known PDF route, rejects redirects and does not put the JWT into the viewer URL', async () => {
  const bytes = Uint8Array.from('%PDF-1.7\n', c => c.charCodeAt(0));
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers(), arrayBuffer: async () => bytes.buffer });
  expect(ownedCertificateUrl(cert)).toBe(cert.pdfUrl);
  expect(await certificatePdfBytes(cert)).toBe('JVBERi0xLjcK');
  expect(fetch).toHaveBeenCalledWith(cert.pdfUrl, expect.objectContaining({ redirect: 'error', headers: { Accept: 'application/pdf', Authorization: 'Bearer approved-session' } }));
});
test('rejects a JSON or HTML error body disguised as a successful PDF download', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers(), arrayBuffer: async () => new ArrayBuffer(20) });
  await expect(certificatePdfBytes(cert)).rejects.toThrow('valid certificate PDF');
});
test('rejects data downloaded after a session changed', async () => {
  const bytes = Uint8Array.from('%PDF-1.7', c => c.charCodeAt(0));
  (getSession as jest.Mock).mockReturnValueOnce({ token: 'approved-session' }).mockReturnValueOnce({ token: 'other-account' });
  global.fetch = jest.fn().mockResolvedValue({ ok: true, headers: new Headers(), arrayBuffer: async () => bytes.buffer });
  await expect(certificatePdfBytes(cert)).rejects.toThrow('account changed');
});
test.each([[[], ''], [[77], 'TQ=='], [[77, 97], 'TWE='], [[77, 97, 110], 'TWFu']])('base64 preserves PDF byte padding', (bytes, expected) => {
  expect(base64(new Uint8Array(bytes as number[]))).toBe(expected);
});
