import type { Enrollment, Profile } from './types';

const object = (value: unknown): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export function verifiedIdentity(value: unknown): Profile['user'] {
  if (!object(value) || !Number.isSafeInteger(value.id) || value.id <= 0 ||
      typeof value.email !== 'string' || !value.email.includes('@') ||
      typeof value.role !== 'string' || (value.name !== null && typeof value.name !== 'string')) {
    throw new Error('The server returned an invalid account identity.');
  }
  return { id: value.id, email: value.email, role: value.role, name: value.name };
}
export function ownedEnrollmentRows(value: unknown, account: Profile['user']): Record<string, any>[] {
  if (account.role.toLowerCase() !== 'learner') throw new Error('This connection requires a learner test account.');
  if (!Array.isArray(value) || !value.every(row => object(row) &&
      Number.isSafeInteger(row.id) && row.id > 0 && typeof row.studentEmail === 'string' &&
      row.studentEmail.toLowerCase() === account.email.toLowerCase() &&
      typeof row.courseAccess === 'boolean' && typeof row.enrollmentStatus === 'string' &&
      Number.isSafeInteger(row.batch?.course?.id) && typeof row.batch.course.title === 'string')) {
    throw new Error('The enrollment response does not match this signed-in learner.');
  }
  return value;
}
export function enrollmentSummary(row: Record<string, any>, progress: unknown, eligibility: unknown): Enrollment {
  if (!object(progress) || !object(eligibility) || Number(progress.enrollmentId) !== row.id ||
      Number(eligibility.enrollmentId) !== row.id || typeof eligibility.eligible !== 'boolean' ||
      !Number.isInteger(progress.totalLessons) || progress.totalLessons < 0 ||
      !Number.isInteger(progress.completedLessons) || progress.completedLessons < 0 ||
      progress.completedLessons > progress.totalLessons ||
      typeof progress.completionPercentage !== 'number' || !Number.isFinite(progress.completionPercentage) ||
      progress.completionPercentage < 0 || progress.completionPercentage > 100) {
    throw new Error('The server returned invalid course progress.');
  }
  // This endpoint supplies course metadata. The player loads its own content;
  // do not invent videos, duration, curriculum or progress from missing fields.
  return { ...row, summary: {
    percentage: progress.completionPercentage, completedLessons: progress.completedLessons,
    totalLessons: progress.totalLessons, eligible: eligibility.eligible,
  } } as Enrollment;
}
