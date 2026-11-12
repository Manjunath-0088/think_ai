import { lmsApi } from '@/lms/api';
let mockToken = 'assessment-session';
let sequence = 0;
jest.mock('@/lms/deployment', () => ({ ...jest.requireActual('@/lms/deployment'), HANDOVER_READ_API: true }));
jest.mock('@/api/session', () => ({ getSession: () => ({ token: mockToken }), restoreSession: jest.fn(), signIn: jest.fn() }));
const contract = () => ({ openapi: '3.0.3', paths: {
  '/api/lms/assessments/{id}/start': { post: {} },
  '/api/lms/assessments/{id}/submit': { post: {} },
  '/api/lms/attempts/{id}/results': { get: {} },
}, components: { schemas: { Attempt: { properties: {
  attemptId: { type: 'integer' }, startedAt: { format: 'date-time' }, expiresAt: { format: 'date-time' }, serverTime: { format: 'date-time' },
} } } } });
const response = (data: unknown, status = 200) => ({ ok: status < 300, status, json: async () => data });
const attempt = () => ({ attemptId: 44, startedAt: '2026-11-11T06:00:00Z', expiresAt: '2026-11-11T06:30:00Z',
  serverTime: '2026-11-11T06:01:00Z', assessment: { id: 8, title: 'Quiz', questions: [] } });
beforeEach(() => { mockToken = `assessment-session-${++sequence}`; global.fetch = jest.fn(); });
test('missing deployment never starts or submits legacy grading', async () => {
  (fetch as jest.Mock).mockResolvedValue(response({ message: 'Not found' }, 404));
  expect(await lmsApi.timedAssessmentAvailable()).toBe(false);
  await expect(lmsApi.start(8, 6)).rejects.toMatchObject({ code: 'ASSESSMENT_API_UNAVAILABLE' });
  expect((fetch as jest.Mock).mock.calls.every(([url, options]) => url.endsWith('/lms-openapi.json') && options.method === 'GET')).toBe(true);
});
test.each(['expiry', 'results', 'legacy-only'])('incomplete %s contract cannot enable grading', async kind => {
  const doc = contract();
  if (kind === 'expiry') delete (doc.components.schemas.Attempt.properties as any).expiresAt;
  if (kind === 'results') delete (doc.paths as any)['/api/lms/attempts/{id}/results'];
  if (kind === 'legacy-only') (doc as any).paths = { '/api/assessments/{id}/start': { post: {} } };
  (fetch as jest.Mock).mockResolvedValue(response(doc));
  expect(await lmsApi.timedAssessmentAvailable()).toBe(false);
});
test('Retry discovers newly deployed support without rebuilding the handover APK', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response(contract()));
  expect(await lmsApi.timedAssessmentAvailable()).toBe(false);
  expect(await lmsApi.timedAssessmentAvailable()).toBe(true);
});
test('compatible deployment uses canonical start, same attempt submit and owned results', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response(contract()))
    .mockResolvedValueOnce(response({ success: true, data: attempt() }))
    .mockResolvedValueOnce(response({ success: true, data: { attemptId: 44, status: 'GRADING' } }))
    .mockResolvedValueOnce(response({ success: true, data: { attemptId: 44, status: 'GRADED' } }));
  expect((await lmsApi.start(8, 6)).attemptId).toBe(44);
  await lmsApi.submit(8, 44, [{ questionId: 9, selectedOptionId: 10 }], [9]);
  expect(await lmsApi.result(44)).toMatchObject({ status: 'GRADED' });
  const calls = (fetch as jest.Mock).mock.calls;
  expect(calls.map(([url]) => url.split('/api').pop())).toEqual(['/lms-openapi.json', '/lms/assessments/8/start', '/lms/assessments/8/submit', '/lms/attempts/44/results']);
  expect(JSON.parse(calls[2][1].body)).toMatchObject({ attemptId: 44, flaggedQuestionIds: [9], answers: [{ questionId: 9, selectedOptionId: 10 }] });
});
test.each([{ expiresAt: undefined }, { attemptId: 0 }, { assessment: { id: 99, questions: [] } }, { expiresAt: 'not-a-time' },
  { expiresAt: '2026-11-11T05:00:00Z' }])('invalid attempt cannot create a fabricated timer: %j', async invalid => {
  (fetch as jest.Mock).mockResolvedValueOnce(response(contract())).mockResolvedValueOnce(response({ success: true, data: { ...attempt(), ...invalid } }));
  await expect(lmsApi.start(8, 6)).rejects.toMatchObject({ code: 'INVALID_ASSESSMENT_RESPONSE' });
});
test('support cache never crosses account changes', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce(response(contract())).mockResolvedValueOnce(response({}, 404));
  expect(await lmsApi.timedAssessmentAvailable()).toBe(true);
  mockToken = 'another-account';
  expect(await lmsApi.timedAssessmentAvailable()).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
});
test('network failure remains a connection error, not a fabricated attempt', async () => {
  (fetch as jest.Mock).mockRejectedValue(new Error('network down'));
  await expect(lmsApi.timedAssessmentAvailable()).rejects.toMatchObject({ status: 0 });
});
