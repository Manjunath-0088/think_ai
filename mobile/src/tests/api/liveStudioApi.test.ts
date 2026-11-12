import { apiData } from '@/api/http';
import {
  createLiveSession,
  getJitsiCredentials,
  listLiveSessions,
  updateLiveSessionStatus,
} from '@/api/liveStudioApi';

jest.mock('@/api/http', () => ({ apiData: jest.fn() }));

const apiDataMock = apiData as jest.MockedFunction<typeof apiData>;

beforeEach(() => apiDataMock.mockReset());

test('live sessions are listed and created through the explicit collection route', async () => {
  apiDataMock.mockResolvedValue([]);
  await listLiveSessions();
  expect(apiDataMock).toHaveBeenCalledWith('/studio/sessions');

  apiDataMock.mockResolvedValue({ id: 'new-class' });
  await createLiveSession({ title: 'System design', scheduledAt: '2026-11-11T10:00:00.000Z' });
  expect(apiDataMock).toHaveBeenCalledWith('/studio/sessions', {
    method: 'POST',
    body: { title: 'System design', scheduledAt: '2026-11-11T10:00:00.000Z' },
  });
});

test('session status and Jitsi tokens use the authenticated session route', async () => {
  apiDataMock.mockResolvedValue({ id: 's 1' });
  await updateLiveSessionStatus('s 1', 'live');
  expect(apiDataMock).toHaveBeenCalledWith('/studio/sessions/s%201/status', {
    method: 'PATCH',
    body: { status: 'live', scheduledAt: undefined },
  });

  apiDataMock.mockResolvedValue({
    room: 'thinkz-s-1',
    token: 'short-lived-jwt',
    domain: 'meet.example.test',
    appId: 'thinkz',
    expiresInSeconds: 600,
  });
  await getJitsiCredentials('s 1');
  expect(apiDataMock).toHaveBeenCalledWith('/studio/sessions/s%201/jitsi-token', {
    method: 'POST',
  });
});
