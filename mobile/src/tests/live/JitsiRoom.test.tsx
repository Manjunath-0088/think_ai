import { render } from '@testing-library/react-native';

import { ApiError } from '@/api/http';
import { getJitsiCredentials } from '@/api/liveStudioApi';
import { flushAllPendingWork } from '@/tests/helpers';
import { buildJitsiUrl, JitsiRoom } from '@/components/live/JitsiRoom';

jest.mock('@/api/liveStudioApi', () => ({ getJitsiCredentials: jest.fn() }));

const credentialsMock = getJitsiCredentials as jest.MockedFunction<typeof getJitsiCredentials>;

const credentials = {
  room: 'thinkz-session-1',
  token: 'server-issued-token',
  domain: 'meet.example.test',
  appId: 'thinkz',
  expiresInSeconds: 600,
};

beforeEach(() => credentialsMock.mockReset());

test('the Jitsi URL carries the short-lived token and no app bearer token', () => {
  const url = buildJitsiUrl(credentials);

  expect(url).toBe(
    'https://meet.example.test/thinkz-session-1?jwt=server-issued-token#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=false',
  );
  expect(url).not.toContain('Authorization');
  expect(url).not.toContain('Bearer');
});

test('the room mounts a WebView after the backend issues credentials', async () => {
  credentialsMock.mockResolvedValue(credentials);
  const view = render(<JitsiRoom sessionId="session-1" title="System design" />);

  expect(view.getByText('Preparing the secure video room…')).toBeTruthy();
  await flushAllPendingWork();
  expect(view.getByTestId('jitsi-room-webview')).toBeTruthy();
  expect(view.getByTestId('jitsi-room-webview').props.mediaCapturePermissionGrantType).toBe('grant');
  expect(credentialsMock).toHaveBeenCalledWith('session-1');
});

test('an unconfigured Jitsi deployment shows the backend error instead of a blank room', async () => {
  credentialsMock.mockRejectedValue(
    new ApiError('Jitsi is not configured for this environment', 503),
  );
  const view = render(<JitsiRoom sessionId="session-1" title="System design" />);

  await flushAllPendingWork();
  expect(view.getByText('Jitsi is not configured for this environment')).toBeTruthy();
  expect(view.queryByTestId('jitsi-room-webview')).toBeNull();
  expect(view.getByText('Try again')).toBeTruthy();
});
