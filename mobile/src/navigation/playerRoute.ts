import type { RootStackParamList } from './types';

/** Convert public string IDs into the numeric IDs required by the LMS player. */
export function parseNativePlayerParams(
  courseId: string,
  lessonId?: string,
): RootStackParamList['CoursePlayer'] | null {
  const numericCourseId = Number(courseId);
  const numericLessonId = lessonId === undefined ? undefined : Number(lessonId);
  if (!Number.isSafeInteger(numericCourseId) || numericCourseId <= 0) return null;
  return {
    courseId: numericCourseId,
    ...(Number.isSafeInteger(numericLessonId) && numericLessonId! > 0
      ? { lessonId: numericLessonId }
      : {}),
  };
}
