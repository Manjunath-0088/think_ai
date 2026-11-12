import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAssessment } from '@/lms/useAssessment';
import { lmsApi } from '@/lms/api';
jest.mock('@/lms/deployment', () => ({ ...jest.requireActual('@/lms/deployment'), HANDOVER_READ_API: true }));
jest.mock('@/lms/LmsProvider', () => ({ useLms: () => ({ ready: true, online: true, syncStatus: '', session: { userId: 'test-learner', token: 'test-token' } }) }));
jest.mock('@/lms/api', () => ({ lmsApi: { timedAssessmentAvailable: jest.fn(async () => false), start: jest.fn(), submit: jest.fn(), assessmentPreview: jest.fn() }, LmsApiError: class extends Error {} }));
jest.mock('@/lms/CodeEditor', () => ({ CodeEditor: () => null }));
jest.mock('@/components/common/AppIcon', () => ({ AppIcon: () => null, screenIcon: () => 'book', actionIcon: () => null }));
test('live assessment preview loads real questions without a graded attempt, submission or fabricated timer', async () => {
  (lmsApi.assessmentPreview as jest.Mock).mockResolvedValue({ id: 8, title: 'Real assessment', questions: [
    { id: 9, questionText: 'Real question', questionType: 'MCQ', marks: 10, options: [{ id: 10, optionText: 'Answer A' }] },
  ] });
  const onSubmitted = jest.fn();
  const hook = renderHook(() => useAssessment(8, 6, onSubmitted));
  await waitFor(() => expect(hook.result.current.preview?.questions[0]?.questionText).toBe('Real question'));
  expect(hook.result.current.attempt).toBeNull();
  expect(hook.result.current.seconds).toBe(0);
  await act(async () => { await hook.result.current.submit(); });
  expect(lmsApi.start).not.toHaveBeenCalled(); expect(lmsApi.submit).not.toHaveBeenCalled();
  expect(onSubmitted).not.toHaveBeenCalled();
});

test('handover build starts a real assessment when the deployed timed contract is available', async () => {
  (lmsApi.timedAssessmentAvailable as jest.Mock).mockResolvedValueOnce(true);
  const now = Date.now();
  (lmsApi.start as jest.Mock).mockResolvedValueOnce({ attemptId: 44,
    startedAt: new Date(now).toISOString(), serverTime: new Date(now).toISOString(),
    expiresAt: new Date(now + 600000).toISOString(), assessment: { id: 8, title: 'Timed assessment', questions: [] } });
  const hook = renderHook(() => useAssessment(8, 6, jest.fn()));
  await waitFor(() => expect(hook.result.current.attempt?.attemptId).toBe(44));
  expect(hook.result.current.preview).toBeNull();
  expect(hook.result.current.seconds).toBeGreaterThan(0);
  expect(lmsApi.start).toHaveBeenCalledWith(8, 6);
  hook.unmount();
});

test('leaving while support is being checked never creates an attempt', async () => {
  jest.clearAllMocks();
  let resolve!: (value: boolean) => void;
  (lmsApi.timedAssessmentAvailable as jest.Mock).mockReturnValueOnce(new Promise<boolean>(done => { resolve = done; }));
  const hook = renderHook(() => useAssessment(8, 6, jest.fn()));
  await waitFor(() => expect(lmsApi.timedAssessmentAvailable).toHaveBeenCalled());
  hook.unmount();
  await act(async () => { resolve(true); });
  expect(lmsApi.start).not.toHaveBeenCalled();
});
