import { getStateFromPath } from '@react-navigation/native';
import type { LinkingOptions, PathConfigMap } from '@react-navigation/native';
import { allowsAudience, roleHome, routeAudience } from '@/lms/access';
import type { RootStackParamList } from './types';

export type ScreenName = keyof RootStackParamList;

/** Every URL scheme the app answers to. */
export const DEEP_LINK_PREFIXES = [
  'thinkzai://',
  'thinkz://',
  'https://app.thinkzai.com',
] as const;

/** Short aliases accepted in addition to the canonical routes below. */
export const DEEP_LINK_ALIASES = [
  'course/:id',
  'forum/thread/:id',
  'assessment/:id',
] as const;

/** Canonical route paths shared by React Navigation and the URL parser. */
export const DEEP_LINK_ROUTES: Readonly<Partial<Record<ScreenName, string>>> = {
  SignIn: 'auth/login',
  Login: 'login',
  AdminHome: 'admin',
  Account: 'account',
  LmsHome: 'learner/workspace',
  LearnerDashboard: 'learner/dashboard',
  MyLearning: 'learner/my-learning',
  MyCourses: 'learner/courses',
  CourseDetail: 'learner/courses/:courseId',
  GlobalSearch: 'search',
  Wishlist: 'learner/wishlist',
  Profile: 'learner/profile',
  ForumHome: 'forum',
  ForumThread: 'forum/threads/:threadId',
  CreatePost: 'forum/new',
  Bookmarks: 'forum/bookmarks',
  Moderation: 'forum/moderate',
  Checkout: 'checkout',
  PaymentSuccess: 'checkout/success',
  PaymentFailed: 'checkout/failed',
  NotificationPreferences: 'settings/notifications',
  CoursePlayer: 'learner/courses/:courseId/play',
  AssessmentTaking: 'learner/assessments/:assessmentId/take',
  AssessmentResults: 'learner/assessments/:assessmentId/results',
  LmsCertificate: 'learner/certificates/:certificateId',
  Analytics: 'admin/analytics',
  CodePlayground: 'learner/playground',
  PlaygroundHistory: 'learner/playground/history',
  LearnerProfile: 'learner/account-profile',
  LmsSettings: 'learner/settings',
  Downloads: 'learner/downloads',
  VideoPlayer: 'learning/courses/:courseId/play',
  Assessment: 'learning/assessments/:assessmentId',
  Results: 'learning/assessments/:assessmentId/results',
  Certificate: 'learning/certificates/:courseId',
  StaffTools: 'staff/tools',
  LiveStudio: 'staff/live-studio',
  AttendanceRegister: 'staff/attendance',
  AttendanceReport: 'staff/attendance/report',
  GradingQueue: 'staff/grading',
  InstructorControls: 'staff/instructor-controls',
  RbacMatrix: 'admin/roles',
};

function canonicalPath(path: string) {
  return path
    .replace(/^\/?course\//, 'learner/courses/')
    .replace(/^\/?forum\/thread\//, 'forum/threads/')
    .replace(/^\/?assessment\//, 'learning/assessments/');
}

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [...DEEP_LINK_PREFIXES],
  getStateFromPath: (path, options) => getStateFromPath(canonicalPath(path), options),
  config: {
    screens: {
      ...DEEP_LINK_ROUTES,
      CoursePlayer: {
        path: DEEP_LINK_ROUTES.CoursePlayer!,
        parse: { courseId: Number, lessonId: Number },
      },
      AssessmentTaking: {
        path: DEEP_LINK_ROUTES.AssessmentTaking!,
        parse: { assessmentId: Number, enrollmentId: Number },
      },
      AssessmentResults: {
        path: DEEP_LINK_ROUTES.AssessmentResults!,
        parse: { assessmentId: Number, attemptId: Number },
      },
      LmsCertificate: {
        path: DEEP_LINK_ROUTES.LmsCertificate!,
        parse: { certificateId: Number },
      },
    } as PathConfigMap<RootStackParamList>,
  },
};

export function linkingForRole(
  role: string | null,
  signedIn: boolean,
): LinkingOptions<RootStackParamList> {
  return {
    ...linking,
    getStateFromPath(path, options) {
      const state = getStateFromPath(canonicalPath(path), options);
      if (!state) return state;
      const current = state.routes[state.index ?? state.routes.length - 1];
      const name = current?.name as ScreenName | undefined;
      if (name === 'SignIn' || name === 'Login') {
        return signedIn ? { routes: [{ name: roleHome(role) }] } : state;
      }
      const audience = name ? routeAudience[name] : undefined;
      if (!signedIn || !audience || !allowsAudience(audience, role)) {
        return { routes: [{ name: signedIn ? roleHome(role) : 'SignIn' }] };
      }
      return state;
    },
  };
}
