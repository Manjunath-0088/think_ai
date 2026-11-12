import { renderHook } from '@testing-library/react-native';

import {
  ASSESSMENT_POLL_MAX_ATTEMPTS,
  useAssessmentResults,
} from '@/hooks/useAssessmentResults';
import { flushAllPendingWork } from '@/tests/helpers';

const mockResult = jest.fn();

jest.mock('@/lms/api', () => ({
  lmsApi: {
    result: (...args: unknown[]) => mockResult(...args),
  },
}));

beforeEach(() => {
  mockResult.mockReset();
  mockResult.mockResolvedValue({ status: 'PENDING' });
});

test('pending grading polls with exponential backoff rather than every two seconds', async () => {
  const { result } = renderHook(() => useAssessmentResults(1));
  await flushAllPendingWork();

  expect(mockResult).toHaveBeenCalledTimes(1);
  expect(result.current.polling).toBe(true);

  await flushAllPendingWork(1, 1999);
  expect(mockResult).toHaveBeenCalledTimes(1);
  await flushAllPendingWork(2, 1);
  expect(mockResult).toHaveBeenCalledTimes(2);

  // The next wait is 3s, not another 2s.
  await flushAllPendingWork(1, 2000);
  expect(mockResult).toHaveBeenCalledTimes(2);
  await flushAllPendingWork(2, 1000);
  expect(mockResult).toHaveBeenCalledTimes(3);
});

test('polling stops at the attempt cap until the learner asks for a refresh', async () => {
  const { result } = renderHook(() => useAssessmentResults(1));
  await flushAllPendingWork();

  for (let index = 0; index < 16; index += 1) {
    await flushAllPendingWork(2, 30000);
  }

  expect(mockResult).toHaveBeenCalledTimes(ASSESSMENT_POLL_MAX_ATTEMPTS + 1);
  expect(result.current.polling).toBe(false);
});

test('no polling is scheduled once grading is complete', async () => {
  mockResult.mockResolvedValue({ status: 'GRADED' });
  const { result } = renderHook(() => useAssessmentResults(1));
  await flushAllPendingWork();
  await flushAllPendingWork(5, 30000);

  expect(mockResult).toHaveBeenCalledTimes(1);
  expect(result.current.polling).toBe(false);
});
