import type { Analytics, AnalyticsBucket, AssessmentSummary, Certificate, Course, PlayerData, Question } from './types';

export const record = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const invalid = (kind: string): never => { throw new Error(`The server returned invalid ${kind}. Refresh and contact the API administrator if this continues.`); };
export const positiveId = (v: unknown): number => Number.isSafeInteger(v) && Number(v) > 0 ? Number(v) : invalid('record IDs');
const text = (v: unknown): string => typeof v === 'string' && v.trim() ? v : invalid('text fields');
const count = (v: unknown): number => Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : invalid('counts');
const percent = (v: unknown): number => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100 ? v : invalid('percentages');
export function httpUrl(value: unknown): string {
  if (typeof value !== 'string') return invalid('media URLs');
  try { const u = new URL(value); if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return invalid('media URLs'); return value; }
  catch { return invalid('media URLs'); }
}
export function youtubeEmbed(value: string | null): string | null {
  if (!value) return null;
  let u: URL; try { u = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const id = host === 'youtu.be' ? u.pathname.slice(1)
    : ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)
      ? (u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(?:embed|shorts)\/([^/]+)$/.exec(u.pathname)?.[1]) : null;
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0` : null;
}
export function assessmentSummaries(value: unknown, moduleId: number): AssessmentSummary[] {
  if (!Array.isArray(value)) return invalid('assessments');
  const seen = new Set<number>();
  return value.map(a => {
    if (!record(a) || seen.has(a.id) || a.moduleId !== moduleId || typeof a.status !== 'string' ||
        (a.duration != null && (typeof a.duration !== 'number' || !Number.isFinite(a.duration) || a.duration <= 0))) return invalid('assessments');
    seen.add(positiveId(a.id));
    return { id: a.id, title: text(a.title), status: a.status, duration: a.duration ?? null };
  });
}
export function handoverCourse(value: unknown, courseId: number, assessments: Map<number, AssessmentSummary[]>): Course {
  if (!record(value) || value.id !== courseId || !Array.isArray(value.modules)) return invalid('course content');
  const ids = new Set<number>();
  const modules = new Set<number>();
  return {
    id: positiveId(value.id), title: text(value.title), description: typeof value.description === 'string' ? value.description : '',
    thumbnail: value.thumbnail == null ? null : httpUrl(value.thumbnail),
    modules: value.modules.map((m: any, index: number) => {
      if (!record(m) || m.courseId !== courseId || !Array.isArray(m.lessons)) return invalid('course modules');
      const moduleId = positiveId(m.id);
      if (modules.has(moduleId)) return invalid('course modules');
      modules.add(moduleId);
      return { id: moduleId, title: text(m.title), order: index, assessments: assessments.get(moduleId) || [],
        lessons: m.lessons.map((l: any) => {
          if (!record(l) || l.moduleId !== moduleId || ids.has(l.id)) return invalid('course lessons');
          ids.add(positiveId(l.id));
          return { id: l.id, title: text(l.title), order: count(l.order),
            content: typeof l.content === 'string' ? l.content : undefined,
            videoUrl: l.videoUrl == null ? null : httpUrl(l.videoUrl),
            // The legacy duration string has no documented unit or watch rule.
            // Zero disables client completion calculations; server records are authoritative.
            durationSeconds: 0, completionThreshold: 0, videoBytes: null };
        }).sort((a: any, b: any) => a.order - b.order) };
    }),
  };
}
export function handoverProgress(value: unknown, enrollmentId: number, course: Course): PlayerData['progress'] {
  if (!Array.isArray(value)) return invalid('lesson progress');
  const ids = new Set(course.modules.flatMap(m => m.lessons.map(l => l.id)));
  const seen = new Set<number>();
  return value.map(p => {
    if (!record(p) || p.enrollmentId !== enrollmentId || !ids.has(p.lessonId) || seen.has(p.lessonId) || typeof p.completed !== 'boolean') return invalid('lesson progress');
    seen.add(p.lessonId);
    if (p.completedAt != null && (typeof p.completedAt !== 'string' || !Number.isFinite(Date.parse(p.completedAt)))) return invalid('lesson progress dates');
    return { lessonId: p.lessonId, enrollmentId, completed: p.completed,
      watchedSeconds: 0, totalDuration: 0, watchPercentage: p.completed ? 100 : 0,
      updatedAt: p.completedAt || '' };
  });
}
export function handoverQuestions(value: unknown, assessmentId: number, moduleIds: number[]): { id: number; title: string; questions: Question[] } {
  if (!record(value) || value.id !== assessmentId || !moduleIds.includes(value.moduleId) || !Array.isArray(value.questions)) return invalid('assessment content');
  const seen = new Set<number>();
  const questions: Question[] = value.questions.map((q: any) => {
    if (!record(q) || q.assessmentId !== assessmentId || !['MCQ', 'CODING'].includes(q.questionType) || seen.has(q.id) || !Array.isArray(q.options)) return invalid('questions');
    seen.add(positiveId(q.id));
    if (typeof q.marks !== 'number' || !Number.isFinite(q.marks) || q.marks <= 0) return invalid('question marks');
    const languages = ['python', 'javascript', 'java', 'cpp'];
    const supported = q.supportedLanguages == null ? undefined : q.supportedLanguages;
    if (supported && (!Array.isArray(supported) || !supported.length || supported.some((l: unknown) => !languages.includes(String(l))))) return invalid('coding languages');
    const starter = record(q.starterCode) ? Object.fromEntries(Object.entries(q.starterCode).filter(([l, code]) => languages.includes(l) && typeof code === 'string')) : undefined;
    return { id: q.id, questionText: [text(q.questionText), typeof q.problemStatement === 'string' ? q.problemStatement : ''].filter(Boolean).join('\n\n'),
      questionType: q.questionType, marks: q.marks,
      options: q.options.map((o: any) => ({ id: positiveId(o.id), optionText: text(o.optionText) })),
      supportedLanguages: supported, starterCode: starter };
    // No answer keys or hidden test cases are copied into the learner model/cache.
  });
  if (!questions.length) return invalid('assessment questions');
  return { id: assessmentId, title: text(value.title), questions };
}
export function handoverCertificate(value: unknown, enrollmentId: number, apiBase: string): Certificate {
  if (!record(value) || value.enrollmentId !== enrollmentId || typeof value.issuedAt !== 'string' || !Number.isFinite(Date.parse(value.issuedAt))) return invalid('certificate metadata');
  const certificateNo = text(value.certificateNo);
  return { id: positiveId(value.id), enrollmentId, certificateNo,
    studentName: text(value.studentName), courseName: text(value.courseName), issuedAt: value.issuedAt,
    // Use the owned authenticated download route, not an unverified URL in metadata.
    pdfUrl: `${apiBase.replace(/\/$/, '')}/certificates/${encodeURIComponent(certificateNo)}/download`,
    verificationUrl: `${apiBase.replace(/\/$/, '')}/certificates/verify/${encodeURIComponent(certificateNo)}` };
}
function bucketDate(value: string, bucket: AnalyticsBucket): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) return invalid('report dates');
  if (bucket === 'monthly') return value.slice(0, 7);
  if (bucket === 'quarterly') return `${value.slice(0, 4)}-Q${Math.floor((Number(value.slice(5, 7)) - 1) / 3) + 1}`;
  if (bucket === 'weekly') { const d = new Date(`${value}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); }
  return value;
}
export function handoverAnalytics(trend: unknown, enrollments: unknown, completion: unknown, assessment: unknown, bucket: AnalyticsBucket, from: string, to: string): Analytics {
  if (!Array.isArray(trend) || !Array.isArray(enrollments) || !Array.isArray(completion) || !record(assessment)) return invalid('analytics');
  const grouped = new Map<string, number>();
  for (const p of trend) {
    if (!record(p) || typeof p.period !== 'string' || p.period < from || p.period > to) return invalid('enrollment trend');
    const key = bucketDate(p.period, bucket); grouped.set(key, (grouped.get(key) || 0) + count(p.enrollments));
  }
  const complete = new Map<number, any>();
  for (const row of completion) {
    if (!record(row) || complete.has(row.courseId)) return invalid('completion rows');
    complete.set(positiveId(row.courseId), row);
  }
  const seen = new Set<number>();
  const courses = enrollments.map(e => {
    if (!record(e) || seen.has(e.courseId)) return invalid('enrollment rows');
    seen.add(positiveId(e.courseId));
    const c = complete.get(e.courseId), total = count(e.enrollments);
    if (!c || count(c.totalEnrollments) !== total || count(c.completedEnrollments) > total) return invalid('analytics reconciliation');
    return { id: e.courseId, title: text(e.courseName), enrollments: total, completed: c.completedEnrollments };
  });
  if (complete.size !== courses.length) return invalid('analytics reconciliation');
  const total = courses.reduce((sum, c) => sum + c.enrollments, 0), done = courses.reduce((sum, c) => sum + c.completed, 0);
  if (Array.from(grouped.values()).reduce((a, b) => a + b, 0) !== total) return invalid('analytics reconciliation');
  const submissions = count(assessment.totalSubmissions);
  return { kpis: { enrollmentCount: total, completionRate: total ? done / total * 100 : 0,
    averageScore: submissions ? percent(assessment.averagePercentage) : null,
    activeUsers: null, attendancePercentage: null },
    trend: Array.from(grouped, ([date, value]) => ({ date, count: value })).sort((a, b) => a.date.localeCompare(b.date)), courses,
    attendance: { status: 'unavailable', source: 'Not supplied by this API', eligible: null, attended: null, excused: null } };
}
