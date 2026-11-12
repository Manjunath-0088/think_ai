import { fireEvent } from '@testing-library/react-native';

import {
  createLiveSession,
  getBreakoutRooms,
  getLiveMessages,
  joinLiveSession,
  listLiveSessions,
} from '@/api/liveStudioApi';
import { LiveStudioScreen } from '@/screens/staff/LiveStudioScreen';
import { flushAllPendingWork, renderScreen } from '@/tests/helpers';

jest.mock('@/lms/LmsProvider', () => ({
  useLms: () => ({ account: { role: 'Instructor' } }),
}));

jest.mock('@/api/liveStudioApi', () => ({
  listLiveSessions: jest.fn(),
  createLiveSession: jest.fn(),
  joinLiveSession: jest.fn(),
  getLiveMessages: jest.fn(),
  getBreakoutRooms: jest.fn(),
  sendLiveMessage: jest.fn(),
  updateLiveSessionStatus: jest.fn(),
  createLivePoll: jest.fn(),
  createBreakoutRoom: jest.fn(),
  joinBreakoutRoom: jest.fn(),
  leaveBreakoutRoom: jest.fn(),
  voteLivePoll: jest.fn(),
  getJitsiCredentials: jest.fn(),
}));

jest.mock('@/offline/liveChatQueue', () => ({
  flushLiveChat: jest.fn(async () => 0),
  queueLiveChat: jest.fn(async () => undefined),
}));

const listMock = listLiveSessions as jest.MockedFunction<typeof listLiveSessions>;
const createMock = createLiveSession as jest.MockedFunction<typeof createLiveSession>;
const joinMock = joinLiveSession as jest.MockedFunction<typeof joinLiveSession>;
const messagesMock = getLiveMessages as jest.MockedFunction<typeof getLiveMessages>;
const roomsMock = getBreakoutRooms as jest.MockedFunction<typeof getBreakoutRooms>;

const session = {
  id: 'session-a',
  title: 'System design',
  hostId: '7',
  status: 'scheduled',
  scheduledAt: null,
  startedAt: null,
  attendees: [],
  polls: [],
  messages: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  listMock.mockResolvedValue([session]);
  joinMock.mockResolvedValue(session);
  messagesMock.mockResolvedValue([]);
  roomsMock.mockResolvedValue([]);
});

test('shows server sessions and joins the selected class instead of a fixed demo id', async () => {
  const view = renderScreen(LiveStudioScreen, { name: 'LiveStudio' });
  await flushAllPendingWork();

  expect(view.getByText('System design')).toBeTruthy();
  fireEvent.press(view.getByText('System design'));
  await flushAllPendingWork();

  expect(joinMock).toHaveBeenCalledWith('session-a');
  expect(joinMock).not.toHaveBeenCalledWith('demo-live-session');
  expect(view.getByText('Video room')).toBeTruthy();
  expect(view.getByText('Join video')).toBeTruthy();
});

test('creates a live class explicitly and opens the created session', async () => {
  const created = { ...session, id: 'session-new', title: 'New class' };
  createMock.mockResolvedValue(created);
  joinMock.mockResolvedValue(created);

  const view = renderScreen(LiveStudioScreen, { name: 'LiveStudio' });
  await flushAllPendingWork();

  fireEvent.changeText(view.getByPlaceholderText('Class title'), 'New class');
  fireEvent.press(view.getByText('Create live class'));
  await flushAllPendingWork();

  expect(createMock).toHaveBeenCalledWith({ title: 'New class', scheduledAt: undefined });
  expect(joinMock).toHaveBeenCalledWith('session-new');
});

test('a deep-linked session is joined directly without selecting a demo session', async () => {
  const view = renderScreen(LiveStudioScreen, {
    name: 'LiveStudio',
    params: { sessionId: 'session-a' },
  });
  await flushAllPendingWork();

  expect(joinMock).toHaveBeenCalledWith('session-a');
  expect(joinMock).not.toHaveBeenCalledWith('demo-live-session');
  expect(view.getByText('Video room')).toBeTruthy();
});

test('polling skips a new refresh while the previous request is still in flight', async () => {
  let resolveJoin!: (value: typeof session) => void;
  joinMock.mockImplementation(() => new Promise((resolve) => { resolveJoin = resolve; }));

  renderScreen(LiveStudioScreen, {
    name: 'LiveStudio',
    params: { sessionId: 'session-a' },
  });
  await flushAllPendingWork();

  expect(joinMock).toHaveBeenCalledTimes(1);
  await flushAllPendingWork(5, 8000);
  expect(joinMock).toHaveBeenCalledTimes(1);

  resolveJoin(session);
  await flushAllPendingWork();
  expect(joinMock).toHaveBeenCalledTimes(1);
});
