import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/** Route + param map for the five assigned pages. */
export type RootStackParamList = {
  LearnerDashboard: undefined;
  MyCourses: undefined;
  CourseDetail: { courseId: string; moduleId?: string };
  GlobalSearch: undefined;
  ForumHome: { categoryId?: string; threadId?: string } | undefined;
};

export type ScreenProps<RouteName extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, RouteName>;
