import { assessmentSummaries, handoverAnalytics, handoverCertificate, handoverCourse, handoverProgress, handoverQuestions, youtubeEmbed } from '@/lms/handoverContracts';
import { handoverClient } from '@/lms/handoverClient';
const account = { id: 7, email: 'learner@example.invalid', name: 'Learner', role: 'Learner' };
const row = { id: 6, studentEmail: account.email, courseAccess: true, enrollmentStatus: 'ENROLLED', batch: { course: { id: 9, title: 'Python' } } };
const course = { id: 9, title: 'Python', description: 'Course', modules: [{ id: 6, courseId: 9, title: 'Introduction', lessons: [
  { id: 5, moduleId: 6, title: 'Video', videoUrl: 'https://www.youtube.com/watch?v=6i3EGqOBRiU', duration: '3', order: 1, content: 'Notes' },
] }] };
const progress = [{ enrollmentId: 6, lessonId: 5, completed: true, completedAt: '2026-10-09T04:20:06.040Z' }];
const summary = { enrollmentId: 6, totalLessons: 1, completedLessons: 1, completionPercentage: 100 };
const assessment = { id: 8, moduleId: 6, title: 'Add Two Numbers', status: 'ACTIVE', duration: 30, questions: [
  { id: 9, assessmentId: 8, questionText: 'Add two numbers', questionType: 'CODING', marks: 10,
    options: [], supportedLanguages: ['python'], starterCode: { python: 'print(1)' },
    codingTestCases: [{ isHidden: true, input: 'secret-input', expectedOutput: 'secret-output' }], isCorrect: true },
] };
const cert = { id: 21, enrollmentId: 6, certificateNo: 'CERT / 1', studentName: 'Learner', courseName: 'Python', issuedAt: '2026-11-05T00:00:00Z', pdfUrl: 'https://untrusted.invalid/file.pdf' };
const trends = [{ period: '2026-11-02', enrollments: 2 }, { period: '2026-11-03', enrollments: 3 }];
const enrollmentCounts = [{ courseId: 9, courseName: 'Python', enrollments: 5 }];
const completedCounts = [{ courseId: 9, totalEnrollments: 5, completedEnrollments: 4 }];
const grades = { totalSubmissions: 3, averageScore: 0.67, averagePercentage: 6.67 };

test('legacy video duration has no inferred unit or completion threshold', () => {
  const normalized = handoverCourse(course, 9, new Map([[6, assessmentSummaries([assessment], 6)]]));
  expect(normalized.modules[0]?.lessons[0]).toMatchObject({ durationSeconds: 0, completionThreshold: 0, videoBytes: null });
  expect(handoverProgress(progress, 6, normalized)[0]).toMatchObject({ completed: true });
  expect(() => handoverProgress([{ ...progress[0], lessonId: 999 }], 6, normalized)).toThrow('invalid lesson progress');
  expect(() => handoverCourse({ ...course, id: 10 }, 9, new Map())).toThrow('invalid course');
  expect(() => handoverCourse({ ...course, modules: [...course.modules, ...course.modules] }, 9, new Map())).toThrow('invalid course modules');
  expect(() => assessmentSummaries([assessment, assessment], 6)).toThrow('invalid assessments');
});
test('provider URLs use an exact trusted hostname and validated video ID', () => {
  expect(youtubeEmbed(course.modules[0]!.lessons[0]!.videoUrl)).toBe('https://www.youtube-nocookie.com/embed/6i3EGqOBRiU?playsinline=1&rel=0');
  expect(youtubeEmbed('https://youtube.com.attacker.invalid/watch?v=6i3EGqOBRiU')).toBeNull();
  expect(youtubeEmbed('javascript:alert(1)')).toBeNull();
  expect(youtubeEmbed('https://youtu.be/../malicious')).toBeNull();
});
test('learner question model excludes answer keys and hidden fixtures, and verifies course relationship', () => {
  const result = handoverQuestions(assessment, 8, [6]);
  expect(result.questions).toHaveLength(1);
  expect(JSON.stringify(result)).not.toMatch(/secret-input|secret-output|isCorrect|codingTestCases/);
  expect(() => handoverQuestions(assessment, 8, [88])).toThrow('invalid assessment');
  expect(() => handoverQuestions({ ...assessment, questions: [assessment.questions[0], assessment.questions[0]] }, 8, [6])).toThrow('invalid questions');
});
test('certificate uses actual certificate ID, separate enrollment ID and authenticated download route', () => {
  const result = handoverCertificate(cert, 6, 'https://api.example.invalid/api');
  expect(result.id).toBe(21); expect(result.enrollmentId).toBe(6);
  expect(result.pdfUrl).toBe('https://api.example.invalid/api/certificates/CERT%20%2F%201/download');
  expect(result.pdfUrl).not.toContain('untrusted');
  expect(() => handoverCertificate(cert, 10, 'https://api.example.invalid/api')).toThrow('invalid certificate');
});
test('analytics reconciles real counts, groups UTC weeks and keeps unavailable metrics null', () => {
  const result = handoverAnalytics(trends, enrollmentCounts, completedCounts, grades, 'weekly', '2026-11-01', '2026-11-05');
  expect(result.kpis).toEqual({ enrollmentCount: 5, completionRate: 80, averageScore: 6.67, activeUsers: null, attendancePercentage: null });
  expect(result.trend).toEqual([{ date: '2026-11-02', count: 5 }]);
});
test.each([
  [[{ period: '2026-11-06', enrollments: 5 }], enrollmentCounts, completedCounts, grades],
  [trends, enrollmentCounts, [{ courseId: 9, totalEnrollments: 4, completedEnrollments: 4 }], grades],
  [trends, enrollmentCounts, completedCounts, { ...grades, averagePercentage: 101 }],
  [trends, [...enrollmentCounts, ...enrollmentCounts], completedCounts, grades],
])('rejects inconsistent analytics rather than presenting invented KPIs', (a, b, c, d) => {
  expect(() => handoverAnalytics(a, b, c, d, 'daily', '2026-11-01', '2026-11-05')).toThrow();
});
function makeClient(overrides: Record<string, unknown> = {}) {
  const responses: Record<string, unknown> = {
    '/auth/me': account, '/enrollments': [row], '/courses/9/content': course,
    '/lesson-progress/enrollment/6': progress, '/lesson-progress/enrollment/6/summary': summary,
    '/certificates/eligibility/6': { enrollmentId: 6, eligible: false },
    '/assessments?moduleId=6': [assessment], '/assessments/8': assessment, ...overrides,
  };
  const read = jest.fn(async (path: string) => { if (!(path in responses)) throw new Error('Unexpected route '+path); return responses[path]; });
  return { read, api: handoverClient(read as any, 'https://api.example.invalid/api', () => false) };
}
test('owned player reads actual content and progress without any completion write', async () => {
  const { api, read } = makeClient();
  const result = await api.player(9);
  expect(result).toMatchObject({ enrollmentId: 6, progressPolicy: 'server-only', summary: { eligible: false, percentage: 100 } });
  expect(read.mock.calls.some(([path]) => path.endsWith('/complete'))).toBe(false);
});
test('locked courses, foreign enrollments and changed content fail closed', async () => {
  await expect(makeClient({ '/enrollments': [{ ...row, courseAccess: false }] }).api.player(9)).rejects.toThrow('unlocked');
  await expect(makeClient({ '/enrollments': [{ ...row, studentEmail: 'other@example.invalid' }] }).api.player(9)).rejects.toThrow('signed-in learner');
  await expect(makeClient({ '/lesson-progress/enrollment/6/summary': { ...summary, completedLessons: 0 } }).api.player(9)).rejects.toThrow('changed during loading');
});
test('100% lesson completion does not generate a certificate without server assessment eligibility', async () => {
  const { api, read } = makeClient();
  await expect(api.generate(6)).rejects.toThrow('requirements have not been met');
  expect(read.mock.calls.some(([path]) => path === '/certificates/enrollment/6')).toBe(false);
});
test('preview reads only questions from the owned course and never starts/submits an attempt', async () => {
  const { api, read } = makeClient();
  expect((await api.assessmentPreview(8, 6)).title).toBe('Add Two Numbers');
  expect(read.mock.calls.some(([path]) => /start|submit/.test(path))).toBe(false);
});
