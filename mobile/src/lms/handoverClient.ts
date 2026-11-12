import type { AnalyticsBucket, Certificate, Enrollment, PlayerData, Profile } from './types';
import { enrollmentSummary, ownedEnrollmentRows, verifiedIdentity } from './handoverRead';
import { assessmentSummaries, handoverAnalytics, handoverCertificate, handoverCourse, handoverProgress, handoverQuestions, positiveId, record } from './handoverContracts';

type Reader = <T = unknown>(path: string) => Promise<T>;
export const handoverUnavailable = (feature: string): never => {
  throw new Error(`${feature} is unavailable on this server. Contact your administrator.`);
};
// A new client is created per operation with a captured token. No cross-account cache.
export function handoverClient(read: Reader, apiBase: string, notFound: (error: unknown) => boolean, publicApiBase = apiBase) {
  const identity = async () => verifiedIdentity(await read('/auth/me'));
  const rows = async () => ownedEnrollmentRows(await read('/enrollments'), await identity());
  const summary = async (row: Record<string, any>): Promise<Enrollment> => {
    const [progress, eligibility] = await Promise.all([
      read(`/lesson-progress/enrollment/${row.id}/summary`), read(`/certificates/eligibility/${row.id}`),
    ]);
    return enrollmentSummary(row, progress, eligibility);
  };
  const owned = async (enrollmentId: number) => {
    positiveId(enrollmentId);
    const row = (await rows()).find(r => r.id === enrollmentId);
    if (!row || !row.courseAccess || row.enrollmentStatus !== 'ENROLLED') throw new Error('This course is not unlocked for your learner account.');
    return row;
  };
  const issued = async (enrollmentId: number): Promise<Certificate | null> => {
    try {
      const certificate = handoverCertificate(await read(`/certificates/enrollment/${enrollmentId}`), enrollmentId, apiBase);
      return { ...certificate, verificationUrl: `${publicApiBase.replace(/\/$/, '')}/certificates/verify/${encodeURIComponent(certificate.certificateNo)}` };
    }
    catch (error) { if (notFound(error)) return null; throw error; }
  };
  return {
    enrollments: async () => Promise.all((await rows()).map(summary)),
    player: async (courseId: number): Promise<PlayerData> => {
      positiveId(courseId);
      const matches = (await rows()).filter(r => r.batch.course.id === courseId && r.courseAccess && r.enrollmentStatus === 'ENROLLED');
      if (matches.length !== 1) throw new Error('Select a uniquely assigned, unlocked course enrollment before opening this player.');
      const row = matches[0]!;
      const [content, progress, enrollment] = await Promise.all([
        read(`/courses/${courseId}/content`), read(`/lesson-progress/enrollment/${row.id}`), summary(row),
      ]);
      if (!record(content) || !Array.isArray(content.modules)) throw new Error('The API returned incomplete course content.');
      const moduleAssessments = await Promise.all(content.modules.map(async (m: any) => {
        const id = positiveId(m?.id);
        return [id, assessmentSummaries(await read(`/assessments?moduleId=${id}`), id)] as const;
      }));
      const course = handoverCourse(content, courseId, new Map(moduleAssessments));
      const normalizedProgress = handoverProgress(progress, row.id, course);
      const lessons = course.modules.flatMap(m => m.lessons);
      if (enrollment.summary.totalLessons !== lessons.length || normalizedProgress.filter(p => p.completed).length !== enrollment.summary.completedLessons)
        throw new Error('Course content and progress changed during loading. Refresh to reload consistent records.');
      return { course, enrollmentId: row.id, progress: normalizedProgress, summary: enrollment.summary, progressPolicy: 'server-only' };
    },
    assessmentPreview: async (assessmentId: number, enrollmentId: number) => {
      positiveId(assessmentId);
      const enrollment = await owned(enrollmentId);
      const content = await read(`/courses/${enrollment.batch.course.id}/content`);
      if (!record(content) || !Array.isArray(content.modules)) throw new Error('Course modules could not be verified.');
      return handoverQuestions(await read(`/assessments/${assessmentId}`), assessmentId, content.modules.map((m: any) => positiveId(m?.id)));
    },
    certificate: async (id: number) => {
      positiveId(id);
      const certificates = await Promise.all((await rows()).map(r => issued(r.id)));
      const cert = certificates.find(c => c?.id === id);
      if (!cert) throw new Error('No issued certificate with this ID belongs to your account.');
      return cert;
    },
    generate: async (enrollmentId: number) => {
      const enrollment = await summary(await owned(enrollmentId));
      if (!enrollment.summary.eligible) throw new Error('Certificate requirements have not been met. Complete the required lessons and pass the assessments first.');
      const certificate = await issued(enrollmentId);
      if (!certificate) throw new Error('Your certificate has not been issued by the server yet. Generation is automatic; refresh after the administrator checks the automation.');
      return certificate;
    },
    profile: async (): Promise<Profile> => {
      const user = await identity();
      const ownedRows = ownedEnrollmentRows(await read('/enrollments'), user);
      const enrollments = await Promise.all(ownedRows.map(summary));
      const certificates = (await Promise.all(ownedRows.map(r => issued(r.id)))).filter((c): c is Certificate => c !== null);
      return { user, stats: { coursesCompleted: enrollments.filter(e => e.summary.totalLessons > 0 && e.summary.percentage === 100).length,
        certificatesEarned: certificates.length, totalHours: null }, certificates, activity: [],
        activityAvailable: false };
    },
    analytics: async (from: string, to: string, bucket: AnalyticsBucket) => {
      const account = await identity();
      if (!['admin', 'superadmin', 'super_admin'].includes(account.role.toLowerCase())) throw new Error('Admin access is required for analytics.');
      if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(bucket) || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to) || from > to)
        throw new Error('Choose a valid report date range and grouping.');
      const query = `fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`;
      const [trend, enrollments, completion, assessment] = await Promise.all([
        read(`/analytics/enrollments?period=CUSTOM&${query}`), read(`/analytics/course-enrollments?${query}`),
        read(`/analytics/course-completion?${query}`), read(`/analytics/assessment?${query}`),
      ]);
      return handoverAnalytics(trend, enrollments, completion, assessment, bucket, from, to);
    },
  };
}
