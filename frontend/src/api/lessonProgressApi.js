import api from "./axios";

export const getProgressByEnrollment = (enrollmentId) =>
  api.get(`/lesson-progress/enrollment/${enrollmentId}`);

export const getLessonProgress = (enrollmentId, lessonId) =>
  api.get(
    `/lesson-progress/enrollment/${enrollmentId}/lesson/${lessonId}`
  );

export const completeLesson = (lessonId, enrollmentId) =>
  api.post(
    `/lesson-progress/lesson/${lessonId}/complete`,
    { enrollmentId }
  );

export const getProgressSummary = (enrollmentId) =>
  api.get(`/lesson-progress/enrollment/${enrollmentId}/summary`);