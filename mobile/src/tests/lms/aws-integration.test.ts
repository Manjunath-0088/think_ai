import { login, request } from '@/lms/api';
import { signIn } from '@/api/session';
import { normalizeApiBase } from '@/lms/deployment';
jest.mock('@/api/session', () => ({
  getSession: () => ({ token: 'test-session' }), restoreSession: jest.fn(), signIn: jest.fn(),
}));
const response = (data: unknown, status = 200) => ({ ok: status < 300, status, json: async () => data });
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(); });
test('API base has one /api and strips trailing slash', () => {
  expect(normalizeApiBase('https://example.com/api/')).toBe('https://example.com/api');
});
test.each(['https://example.com/api/api', 'https://user:secret@example.com/api', 'https://example.com/api?key=secret'])('rejects invalid API config %s', value => {
  expect(() => normalizeApiBase(value)).toThrow();
});
test('successful login saves only returned user identity and token', async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ success: true, token: 'returned-token', user: { id: 17 } }));
  await login('approved@example.test', 'test-password');
  expect(signIn).toHaveBeenCalledWith('17', 'returned-token');
  expect((fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/api\/auth\/login$/);
});
test.each([{ token: 'x' }, { token: '', user: { id: 1 } }, { token: 'x', user: { id: {} } }])('incomplete session never signs in', async data => {
  (fetch as jest.Mock).mockResolvedValue(response(data));
  await expect(login('approved@example.test', 'test')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  expect(signIn).not.toHaveBeenCalled();
});
test('bad credentials preserve the server explanation', async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ error: 'Invalid credentials' }, 401));
  await expect(login('approved@example.test', 'test')).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });
});
test('network failure is actionable and never signs in', async () => {
  (fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));
  await expect(login('approved@example.test', 'test')).rejects.toMatchObject({ code: 'LOGIN_UNAVAILABLE' });
  expect(signIn).not.toHaveBeenCalled();
});

test('accepted login distinguishes secure session storage failure from network failure', async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ token: 'private-token', user: { id: 17 } }));
  (signIn as jest.Mock).mockRejectedValueOnce(new Error('Keystore unavailable'));
  await expect(login('approved@example.test', 'private-password')).rejects.toMatchObject({
    code: 'SESSION_STORAGE_FAILED', status: 0,
  });
});
test('HTML/error page does not masquerade as a login', async () => {
  (fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('HTML'); } });
  await expect(login('approved@example.test', 'test')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
test('login deadline aborts a stalled request', async () => {
  (fetch as jest.Mock).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const outcome = login('approved@example.test', 'test').catch(error => error);
  jest.advanceTimersByTime(15000);
  expect(await outcome).toMatchObject({ code: 'REQUEST_TIMEOUT' });
});
test('missing AWS LMS route explains deployment issue instead of an empty course list', async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ message: 'Route not found' }, 404));
  await expect(request('/lms/enrollments')).rejects.toMatchObject({ status: 404, code: 'LMS_API_NOT_DEPLOYED' });
});
