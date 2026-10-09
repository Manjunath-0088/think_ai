import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Route + param map for the five assigned pages. */
export type RootStackParamList = {
  LearnerDashboard: undefined;
  MyCourses: undefined;
  CourseDetail: { courseId: string; moduleId?: string };
  GlobalSearch: undefined;
  ForumHome: { categoryId?: string; threadId?: string } | undefined;
  // Pages 6–10.
  ForumThread: { threadId: string };
  CreatePost: undefined;
  Bookmarks: undefined;
  Moderation: undefined;
  Checkout: { courseId?: string; formValues?: Record<string, unknown> } | undefined;
  // Day 3 — Manjunath assigned pages.
  PaymentSuccess: { paymentId?: string; payment?: unknown } | undefined;
  PaymentFailed:
    | {
        reason?: 'declined' | 'insufficient_funds' | 'expired' | 'network' | 'unknown';
        errorCode?: string;
        message?: string;
        preserve?: boolean;
        formValues?: Record<string, unknown>;
      }
    | undefined;
  NotificationPreferences: undefined;
};

export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;
