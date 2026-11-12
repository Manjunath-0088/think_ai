import { enrollmentSummary, ownedEnrollmentRows, verifiedIdentity } from '@/lms/handoverRead';
import { lmsApi } from '@/lms/api';
jest.mock('@/lms/deployment', () => ({ ...jest.requireActual('@/lms/deployment'), HANDOVER_READ_API: true }));
jest.mock('@/api/session', () => ({ getSession: () => ({ token: 'test-token' }), restoreSession: jest.fn() }));
const account = { id: 7, email: 'learner@example.invalid', name: 'Learner', role: 'Learner' };
const row = { id: 6, studentEmail: account.email, enrollmentStatus: 'ENROLLED', courseAccess: true, batch: { course: { id: 9, title: 'Python' } } };
const progress = { enrollmentId: 6, totalLessons: 1, completedLessons: 1, completionPercentage: 100 };
const eligibility = { enrollmentId: 6, eligible: false };
test('validates actual auth identity without fabricating profile statistics', () => {
  expect(verifiedIdentity(account)).toEqual(account);
  expect(() => verifiedIdentity({ ...account, id: '7' })).toThrow('invalid account');
  expect(() => verifiedIdentity({ id: 7 })).toThrow('invalid account');
});
test('rejects the entire response if any enrollment belongs to another learner', () => {
  expect(ownedEnrollmentRows([row], account)).toHaveLength(1);
  expect(() => ownedEnrollmentRows([row, { ...row, studentEmail: 'other@example.invalid' }], account)).toThrow('signed-in learner');
  expect(() => ownedEnrollmentRows([row], { ...account, role: 'Admin' })).toThrow('learner test account');
});
test('uses actual progress and certificate eligibility without marking a 100% course eligible automatically', () => {
  const result = enrollmentSummary(row, progress, eligibility);
  expect(result.summary).toEqual({ percentage: 100, totalLessons: 1, completedLessons: 1, eligible: false });
  expect((result.batch.course as any).modules).toBeUndefined();
});
test.each([
  { ...progress, enrollmentId: 8 }, { ...progress, completionPercentage: NaN },
  { ...progress, completionPercentage: 101 }, { ...progress, totalLessons: -1 },
  { ...progress, completedLessons: 2 }, { ...progress, completionPercentage: undefined },
])('rejects mismatched or invalid progress %j', invalid => {
  expect(() => enrollmentSummary(row, invalid, eligibility)).toThrow('invalid course progress');
});
test('handover mode verifies identity and uses only the observed read routes with the captured token', async () => {
  global.fetch = jest.fn().mockImplementation(async (url: string) => {
    const body = url.endsWith('/auth/me') ? { success: true, user: account }
      : url.endsWith('/enrollments') ? { success: true, data: [row] }
      : url.endsWith('/summary') ? { success: true, data: progress }
      : { success: true, data: eligibility };
    return { ok: true, status: 200, json: async () => body };
  });
  expect(await lmsApi.identity('captured')).toEqual(account);
  expect(await lmsApi.enrollments()).toHaveLength(1);
  expect((fetch as jest.Mock).mock.calls.every(([url]) => !url.includes('/lms/'))).toBe(true);
  expect((fetch as jest.Mock).mock.calls[0][1].headers.Authorization).toBe('Bearer captured');
  expect((fetch as jest.Mock).mock.calls.slice(1).every(([, options]) => options.headers.Authorization === 'Bearer test-token')).toBe(true);
});
