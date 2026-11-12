import { renderHook } from '@testing-library/react-native';

import { useProgressSync } from '@/hooks/useProgressSync';
import { flushAllPendingWork } from '@/tests/helpers';

const mockGetSession = jest.fn();
const mockSync = jest.fn();
const mockLoadQueue = jest.fn();
const mockAcknowledge = jest.fn(async (..._args: unknown[]) => undefined);

jest.mock('@/api/session', () => ({
  getSession: () => mockGetSession(),
}));

jest.mock('@/lms/api', () => ({
  LmsApiError: class LmsApiError extends Error {
    status = 0;
  },
  lmsApi: {
    sync: (...args: unknown[]) => mockSync(...args),
  },
}));

jest.mock('@/lms/storage', () => ({
  loadQueue: (...args: unknown[]) => mockLoadQueue(...args),
  acknowledgeProgress: (...args: unknown[]) => mockAcknowledge(...args),
}));

jest.mock('@/lms/access', () => ({
  isAdministrator: () => false,
}));

const session = { userId: 'u1', token: 't1' } as never;
const refreshAccess = jest.fn(async () => undefined);
const progress = (index: number) => ({
  enrollmentId: index,
  lessonId: 1,
  watchedSeconds: 10,
  completed: false,
  updatedAt: '2026-11-08T10:00:00.000Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockReturnValue({ userId: 'u1', token: 't1' });
});

test('a queue that does not shrink stops after one batch instead of looping', async () => {
  mockLoadQueue.mockResolvedValue([progress(1)]);
  mockSync.mockResolvedValue([]);

  const { result } = renderHook(() =>
    useProgressSync(session, true, 'Learner', refreshAccess),
  );
  await flushAllPendingWork();

  expect(mockSync).toHaveBeenCalledTimes(1);
  expect(result.current.syncStatus).toBe('Some progress could not be confirmed; sync will retry.');
});

test('draining a large queue is capped and reports remaining work', async () => {
  let size = 1500;
  mockLoadQueue.mockImplementation(async () =>
    Array.from({ length: size }, (_, index) => progress(index + 1)),
  );
  mockSync.mockImplementation(async (batch: unknown[]) => {
    size = Math.max(0, size - batch.length);
    return [];
  });

  const { result } = renderHook(() =>
    useProgressSync(session, true, 'Learner', refreshAccess),
  );
  await flushAllPendingWork(10);

  expect(mockSync).toHaveBeenCalledTimes(10);
  expect(result.current.syncStatus).toBe('Progress synced; remaining updates will send shortly.');
});
