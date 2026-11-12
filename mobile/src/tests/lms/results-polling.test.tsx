import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useAssessmentResults } from '@/hooks/useAssessmentResults';
import { lmsApi } from '@/lms/api';
jest.mock('@/lms/LmsProvider', () => ({ useLms: () => ({ session: { token: 'test' } }) }));
jest.mock('@/lms/api', () => ({ lmsApi: { result: jest.fn() } }));
const response = { attemptId: 4, status: 'GRADING' };
beforeEach(() => { jest.clearAllMocks(); (lmsApi.result as jest.Mock).mockResolvedValue(response); });
async function tick(ms: number) { await act(async () => { jest.advanceTimersByTime(ms); }); }
test('polls with backoff, caps automatic requests and allows manual retry', async () => {
  const { result } = renderHook(() => useAssessmentResults(4));
  await waitFor(() => expect(result.current.data).toEqual(response));
  for(let n=0;n<12;n++) await tick(Math.min(2000*2**n,30000));
  expect(lmsApi.result).toHaveBeenCalledTimes(13);
  expect(result.current.polling).toBe(false);
  await tick(60000); expect(lmsApi.result).toHaveBeenCalledTimes(13);
  await act(async () => { await result.current.checkNow(); });
  expect(lmsApi.result).toHaveBeenCalledTimes(14);
  expect(result.current.polling).toBe(true);
});
test('does not overlap a pending result request and cleans up on unmount', async () => {
  let complete!: (value: any) => void;
  (lmsApi.result as jest.Mock).mockResolvedValueOnce(response).mockImplementationOnce(() => new Promise(r=>{complete=r;}));
  const view=renderHook(()=>useAssessmentResults(4));
  await waitFor(()=>expect(view.result.current.data).toEqual(response));
  await tick(2000); await tick(90000); expect(lmsApi.result).toHaveBeenCalledTimes(2);
  await act(async()=>{complete(response);}); view.unmount(); await tick(90000);
  expect(lmsApi.result).toHaveBeenCalledTimes(2);
});
test('stops after a final grade or request error', async () => {
  (lmsApi.result as jest.Mock).mockResolvedValueOnce(response).mockResolvedValueOnce({...response,status:'GRADED'});
  const view=renderHook(()=>useAssessmentResults(4));
  await waitFor(()=>expect(view.result.current.data).toEqual(response)); await tick(2000); await tick(90000);
  expect(view.result.current.polling).toBe(false); expect(lmsApi.result).toHaveBeenCalledTimes(2); view.unmount();
  (lmsApi.result as jest.Mock).mockReset().mockResolvedValueOnce(response).mockRejectedValueOnce(Error('Unavailable'));
  const retry=renderHook(()=>useAssessmentResults(4)); await waitFor(()=>expect(retry.result.current.data).toEqual(response));
  await tick(2000); expect(retry.result.current.error).toBe('Unavailable'); await tick(90000);
  expect(lmsApi.result).toHaveBeenCalledTimes(2);
});
