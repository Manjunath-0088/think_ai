import api from './axios';

const unwrap = (response) => response?.data?.data ?? response?.data;
const positiveId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;

// Resolve the enrollment for this assessment, never an unrelated global storage ID.
export async function startCodingAttempt(assessment, requestedEnrollmentId) {
  if (!positiveId(assessment?.id)) throw new Error('Assessment is unavailable.');
  if (!positiveId(assessment.enrollmentId) || (requestedEnrollmentId !== undefined &&
      Number(requestedEnrollmentId) !== Number(assessment.enrollmentId))) {
    throw new Error('Open this assignment from an active enrolled course.');
  }
  const enrollment = { id: Number(assessment.enrollmentId) };
  const attempt = unwrap(await api.post(`/assessments/${assessment.id}/start`, { enrollmentId: Number(enrollment.id) }));
  if (!positiveId(attempt?.submissionId) || Number(attempt.assessmentId) !== Number(assessment.id) ||
      Number(attempt.enrollmentId) !== Number(enrollment.id)) {
    throw new Error('The server did not return a valid assessment attempt.');
  }
  if (attempt.status !== 'IN_PROGRESS') throw new Error('This assessment attempt is already closed.');
  return Number(attempt.submissionId);
}
