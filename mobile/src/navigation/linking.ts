import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

/**
 * Deep-link map for the five assigned pages.
 *
 * React Navigation appends unrecognised query parameters to `route.params`,
 * so `thinkzai://learner/courses/course-1?moduleId=mod-1-0` arrives at
 * `CourseDetail` as `{ courseId: 'course-1', moduleId: 'mod-1-0' }`.
 *
 * Examples:
 *   thinkzai://learner/dashboard
 *   thinkzai://learner/courses
 *   thinkzai://learner/courses/course-1?moduleId=mod-1-0
 *   thinkzai://search
 *   thinkzai://forum?categoryId=cat-1
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['thinkzai://', 'https://app.thinkzai.com'],
  config: {
    screens: {
      LearnerDashboard: 'learner/dashboard',
      MyCourses: 'learner/courses',
      CourseDetail: 'learner/courses/:courseId',
      GlobalSearch: 'search',
      ForumHome: 'forum',
      // Pages 6–10 mirror the web routes.
      ForumThread: 'forum/threads/:threadId',
      CreatePost: 'forum/new',
      Bookmarks: 'forum/bookmarks',
      Moderation: 'forum/moderate',
      Checkout: 'checkout',
    },
  },
};
