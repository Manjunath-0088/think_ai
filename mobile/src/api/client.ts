import type {
  CourseSearchParams,
  CourseSearchResult,
  Course,
  CreateThreadInput,
  Enrollment,
  ForumCategory,
  ForumThreadPage,
  ForumThreadQuery,
  GlobalSearchResponse,
  SearchResultType,
} from '@/types';

/**
 * Single seam between the screens and the data layer.
 *
 * Every hook in this app depends on this interface only, so swapping the mock
 * implementation for a generated OpenAPI client is a one-line change in
 * `src/api/index.ts`. No component or screen imports a transport directly.
 */
export interface LearningApiClient {
  // Page 1 — Learner Dashboard
  fetchEnrollments(): Promise<Enrollment[]>;

  // Page 2 — My Courses
  searchCourses(params: CourseSearchParams): Promise<CourseSearchResult>;

  // Page 3 — Course Detail
  fetchCourse(courseId: string): Promise<Course>;

  // Page 4 — Global Search
  fetchAllTags(): Promise<string[]>;
  searchGlobal(
    query: string,
    type: SearchResultType
  ): Promise<GlobalSearchResponse>;

  // Page 5 — Forum Home
  fetchForumCategories(): Promise<ForumCategory[]>;
  fetchForumThreads(query: ForumThreadQuery): Promise<ForumThreadPage>;
  createThread(input: CreateThreadInput): Promise<{ id: string }>;
}
