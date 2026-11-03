import type {
  Course,
  CourseModule,
  CourseSearchParams,
  CourseSearchResult,
  Enrollment,
  ForumCategory,
  ForumThread,
  ForumThreadPage,
  ForumThreadQuery,
  GlobalSearchResponse,
  Lesson,
  SearchResultType,
} from '@/types';
import type { LearningApiClient } from './client';
import { createCommunityClient } from './communityClient';
import { apiData } from './http';

type BackendLesson = {
  id: number | string;
  title: string;
  description?: string | null;
  content?: string | null;
  videoUrl?: string | null;
  duration?: string | null;
};

type BackendModule = {
  id: number | string;
  title: string;
  description?: string | null;
  lessons?: BackendLesson[];
};

type BackendCourse = {
  id: number | string;
  title: string;
  description?: string | null;
  category?: string | null;
  price?: number;
  duration?: string | null;
  thumbnail?: string | null;
  videoUrl?: string | null;
  instructorName?: string | null;
  instructorDetails?: string | null;
  status?: string;
  modules?: BackendModule[];
};

type BackendEnrollment = {
  id: number | string;
  studentName: string;
  studentEmail: string;
  enrollmentStatus: string;
  enrolledAt: string;
  batchName: string;
  course: BackendCourse;
  lessonProgress: {
    lessonId: number | string;
    completed: boolean;
    completedAt?: string | null;
    watchedSeconds?: number;
    watchPercentage?: number;
  }[];
};

type CourseList = { courses?: BackendCourse[]; pagination?: { total?: number } };
type DiscussionList = {
  items?: {
    id: string;
    title: string;
    body?: string;
    categoryId: string;
    tags?: string[];
    authorId: string;
    author?: { id: string; name: string; username?: string };
    upvotes?: number;
    replyCount?: number;
    views?: number;
    pinned?: boolean;
    solved?: boolean;
    createdAt: string;
    updatedAt?: string;
  }[];
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
};

function durationMinutes(duration: string | null | undefined): number {
  if (!duration) return 0;
  const value = duration.toLowerCase();
  const amount = Number(value.match(/[\d.]+/)?.[0] ?? 0);
  if (/\b(hour|hours|hr|hrs|h)\b/.test(value)) return Math.round(amount * 60);
  if (/\b(day|days)\b/.test(value)) return Math.round(amount * 24 * 60);
  return Math.round(amount);
}

function mapLesson(row: BackendLesson): Lesson {
  return {
    id: String(row.id),
    title: row.title,
    type: row.videoUrl ? 'video' : 'article',
    durationMinutes: durationMinutes(row.duration),
    ...(row.description || row.content
      ? { description: row.description ?? row.content ?? undefined }
      : {}),
    ...(row.videoUrl ? { videoUrl: row.videoUrl } : {}),
  };
}
function mapModule(row: BackendModule): CourseModule {
  const lessons = (row.lessons ?? []).map(mapLesson);
  return {
    id: String(row.id),
    title: row.title,
    description: row.description ?? '',
    durationMinutes: lessons.reduce((total, lesson) => total + lesson.durationMinutes, 0),
    lessons,
  };
}

function mapCourse(row: BackendCourse, isEnrolled = false): Course {
  const modules = (row.modules ?? []).map(mapModule);
  return {
    id: String(row.id),
    title: row.title,
    subtitle: row.category ?? '',
    description: row.description ?? '',
    thumbnailUrl: row.thumbnail ?? '',
    level: 'beginner',
    durationMinutes: durationMinutes(row.duration),
    rating: 0,
    enrolledCount: 0,
    isEnrolled,
    instructor: {
      id: `course-${row.id}-instructor`,
      name: row.instructorName ?? 'Thinkz AI Team',
      bio: row.instructorDetails ?? '',
      avatarUrl: '',
      title: row.instructorDetails ?? 'Instructor',
    },
    modules,
    tags: row.category ? [row.category] : [],
  };
}

function mapEnrollment(row: BackendEnrollment): Enrollment {
  const lessonProgress = row.lessonProgress ?? [];
  const completedLessonIds = lessonProgress
    .filter((progress) => progress.completed)
    .map((progress) => String(progress.lessonId));
  const totalLessons = (row.course.modules ?? []).reduce(
    (total, module) => total + (module.lessons?.length ?? 0),
    0
  );
  const completedLessons = completedLessonIds.length;
  const progressPercent = totalLessons === 0
    ? 0
    : Math.round((completedLessons / totalLessons) * 100);
  const status = row.enrollmentStatus.toUpperCase() === 'COMPLETED' || progressPercent === 100
    ? 'completed'
    : progressPercent > 0
      ? 'in-progress'
      : 'not-started';
  const lastProgress = [...lessonProgress]
    .filter((progress) => progress.completedAt)
    .sort((left, right) => String(right.completedAt).localeCompare(String(left.completedAt)))[0];

  return {
    id: String(row.id),
    userId: row.studentEmail,
    courseId: String(row.course.id),
    course: mapCourse(row.course, true),
    batchName: row.batchName,
    status,
    progressPercent,
    completedLessons,
    totalLessons,
    lastAccessedAt: lastProgress?.completedAt ?? row.enrolledAt,
    completedLessonIds,
  };
}

function mapForumThread(row: NonNullable<DiscussionList['items']>[number]): ForumThread {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.body ?? '',
    categoryId: row.categoryId,
    tags: row.tags ?? [],
    author: {
      id: row.author?.id ?? row.authorId,
      name: row.author?.name ?? 'Thinkz AI learner',
      avatarUrl: '',
    },
    upvotes: row.upvotes ?? 0,
    replyCount: row.replyCount ?? 0,
    viewCount: row.views ?? 0,
    isPinned: row.pinned ?? false,
    isSolved: row.solved ?? false,
    createdAt: row.createdAt,
    lastActivityAt: row.updatedAt ?? row.createdAt,
  };
}

function categorySlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function createLiveApiClient(): LearningApiClient {
  const community = createCommunityClient();

  const fetchMyEnrollments = async (): Promise<Enrollment[]> => {
    const rows = await apiData<BackendEnrollment[]>('/learner/enrollments');
    return rows.map(mapEnrollment);
  };

  const fetchCourses = async (query: string): Promise<Course[]> => {
    const payload = await apiData<CourseList>('/courses', {
      query: { page: 1, limit: 100, search: query },
    });
    return (payload.courses ?? []).map((course) => mapCourse(course));
  };

  return {
    ...community,

    async fetchEnrollments() {
      return fetchMyEnrollments();
    },

    async searchCourses(params: CourseSearchParams): Promise<CourseSearchResult> {
      const [courses, enrollments] = await Promise.all([
        fetchCourses(params.query.trim()),
        fetchMyEnrollments(),
      ]);
      const enrollmentByCourse = new Map(enrollments.map((entry) => [entry.courseId, entry]));
      const enrolledCourses = enrollments.map((entry) => entry.course);
      const catalog = params.status === 'all'
        ? [...courses, ...enrolledCourses.filter((enrolled) => !courses.some((course) => course.id === enrolled.id))]
        : enrolledCourses.filter((course) => {
            const enrollment = enrollmentByCourse.get(course.id);
            return params.status === 'completed'
              ? enrollment?.status === 'completed'
              : enrollment?.status !== 'completed';
          });
      const seen = new Set<string>();
      const unique = catalog.filter((course) => {
        if (seen.has(course.id)) return false;
        seen.add(course.id);
        const enrolled = enrollmentByCourse.has(course.id);
        course.isEnrolled = enrolled;
        return true;
      });
      return { courses: unique, total: unique.length };
    },

    async fetchCourse(courseId: string): Promise<Course> {
      const [row, enrollments] = await Promise.all([
        apiData<BackendCourse>(`/courses/${encodeURIComponent(courseId)}/content`),
        fetchMyEnrollments(),
      ]);
      return mapCourse(row, enrollments.some((enrollment) => enrollment.courseId === String(row.id)));
    },

    async enrollCourse(courseId: string): Promise<Enrollment> {
      await apiData(`/learner/courses/${encodeURIComponent(courseId)}/enroll`, { method: 'POST' });
      const enrollment = (await fetchMyEnrollments()).find((entry) => entry.courseId === courseId);
      if (!enrollment) throw new Error('The enrollment was saved, but could not be refreshed.');
      return enrollment;
    },

    async updateLessonProgress(input) {
      const enrollment = (await fetchMyEnrollments()).find((entry) => entry.courseId === input.courseId);
      if (!enrollment) throw new Error('You are not enrolled in this course.');
      await apiData(`/learner/enrollments/${encodeURIComponent(enrollment.id)}/lessons/${encodeURIComponent(input.lessonId)}`, {
        method: 'PATCH',
        body: { completed: input.completed },
      });
      const updated = (await fetchMyEnrollments()).find((entry) => entry.id === enrollment.id);
      if (!updated) throw new Error('The lesson progress was saved, but could not be refreshed.');
      return updated;
    },

    async fetchAllTags() {
      const rows = await apiData<(string | { name: string })[]>('/tags');
      return rows.map((row) => typeof row === 'string' ? row : row.name);
    },

    async searchGlobal(query: string, type: SearchResultType): Promise<GlobalSearchResponse> {
      return apiData<GlobalSearchResponse>('/search', { query: { q: query, type } });
    },

    async fetchForumCategories(): Promise<ForumCategory[]> {
      const rows = await apiData<{ id: string; name: string; color?: string }[]>('/categories');
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: categorySlug(row.name),
        color: row.color ?? '#6366f1',
      }));
    },

    async fetchForumThreads(query: ForumThreadQuery): Promise<ForumThreadPage> {
      const page = await apiData<DiscussionList>('/discussions', {
        query: {
          page: query.page,
          limit: query.pageSize,
          categoryId: query.categoryId ?? undefined,
          tag: query.tags[0],
          sort: query.sort === 'most-voted' ? 'votes' : 'recent',
        },
      });
      const total = page.total ?? 0;
      const pageSize = page.limit ?? query.pageSize;
      const pageNumber = page.page ?? query.page;
      return {
        threads: (page.items ?? []).map(mapForumThread),
        page: pageNumber,
        pageSize,
        total,
        hasMore: pageNumber * pageSize < total,
      };
    },

    async createThread(input) {
      const result = await community.createDiscussion(input);
      return { id: result.id };
    },
  };
}
