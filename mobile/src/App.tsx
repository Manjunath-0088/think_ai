import { useEffect, useState } from 'react';

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary } from '@/components/common';
import { getSession, restoreSession } from '@/api/session';
import { isOnboardingCompleted } from '@/features/onboarding/utils/onboardingStorage';
import { ApiClientProvider } from '@/hooks/useApiClient';
import type { RootStackParamList } from '@/navigation/types';
import { useDeepLinks } from '@/navigation/useDeepLinks';
import { withErrorBoundary } from '@/navigation/withErrorBoundary';
import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { CourseDetailScreen } from '@/screens/course/CourseDetailScreen';
import { BookmarksScreen } from '@/screens/forum/BookmarksScreen';
import { CreatePostScreen } from '@/screens/forum/CreatePostScreen';
import { ForumHomeScreen } from '@/screens/forum/ForumHomeScreen';
import { ForumThreadDetailScreen } from '@/screens/forum/ForumThreadDetailScreen';
import { ModerationScreen } from '@/screens/forum/ModerationScreen';
import { LearnerDashboardScreen } from '@/screens/learner/LearnerDashboardScreen';
import { MyCoursesScreen } from '@/screens/learner/MyCoursesScreen';
import { MyLearningScreen } from '@/screens/learner/MyLearningScreen';
import { ProfileScreen } from '@/screens/learner/ProfileScreen';
import { WishlistScreen } from '@/screens/learner/WishlistScreen';
import { GlobalSearchScreen } from '@/screens/search/GlobalSearchScreen';
import { NotificationPreferencesScreen } from '@/features/notifications/screens/NotificationPreferencesScreen';
import { PaymentFailedScreen } from '@/features/payments/screens/PaymentFailedScreen';
import { PaymentSuccessScreen } from '@/features/payments/screens/PaymentSuccessScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { AssessmentScreen } from '@/screens/learning/AssessmentScreen';
import { CertificateScreen } from '@/screens/learning/CertificateScreen';
import { OnboardingFlowScreen } from '@/screens/onboarding/OnboardingFlowScreen';
import { ResultsScreen } from '@/screens/learning/ResultsScreen';
import { VideoPlayerScreen } from '@/screens/learning/VideoPlayerScreen';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { ErrorBoundary } from "@/components/common";
import { withErrorBoundary } from "@/navigation/withErrorBoundary";
import { NotificationPreferencesScreen } from "@/features/notifications/screens/NotificationPreferencesScreen";
import { PaymentFailedScreen } from "@/features/payments/screens/PaymentFailedScreen";
import { PaymentSuccessScreen } from "@/features/payments/screens/PaymentSuccessScreen";
import { AssessmentScreen } from "@/screens/learning/AssessmentScreen";
import { CertificateScreen as CompanyCertificateScreen } from "@/screens/learning/CertificateScreen";
import { ResultsScreen } from "@/screens/learning/ResultsScreen";
import { VideoPlayerScreen } from "@/screens/learning/VideoPlayerScreen";
import { useEffect, useMemo, type ComponentType } from "react";
import { Pressable, Text, View } from "react-native";
import { signOut } from "@/api/session";
import { AccessGate } from "@/lms/AccessGate";
import { isAdministrator, type AccessAudience } from "@/lms/access";
import {
  AdminHomeScreen,
  AccountScreen,
  SignInScreen,
} from "@/lms/screens/AdminHomeScreen";
import type { ScreenProps } from "@/navigation/types";
import { LmsErrorBoundary } from "@/lms/ErrorBoundary";
import { useLms } from "@/lms/LmsProvider";
import { LmsProvider } from "@/lms/LmsProvider";
import { LmsHomeScreen } from "@/lms/screens/HomeScreen";
import { CoursePlayerScreen } from "@/lms/screens/CoursePlayerScreen";
import { AssessmentTakingScreen } from "@/lms/screens/AssessmentTakingScreen";
import { AssessmentResultsScreen } from "@/lms/screens/ResultsScreen";
import { CertificateScreen as LmsCertificateScreen } from "@/lms/screens/CertificateScreen";
import { DownloadsScreen } from "@/lms/screens/DownloadsScreen";
import { AnalyticsScreen } from "@/lms/screens/AnalyticsScreen";
import {
  CodePlaygroundScreen,
  PlaygroundHistoryScreen,
} from "@/lms/screens/PlaygroundScreen";
import {
  LearnerProfileScreen,
  LmsSettingsScreen,
} from "@/lms/screens/ProfileScreen";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { ApiClientProvider } from "@/hooks/useApiClient";
import { linkingForRole } from "@/navigation/linking";
import type { RootStackParamList } from "@/navigation/types";
import { CheckoutScreen } from "@/screens/checkout/CheckoutScreen";
import { CourseDetailScreen } from "@/screens/course/CourseDetailScreen";
import { BookmarksScreen } from "@/screens/forum/BookmarksScreen";
import { CreatePostScreen } from "@/screens/forum/CreatePostScreen";
import { ForumHomeScreen } from "@/screens/forum/ForumHomeScreen";
import { ForumThreadDetailScreen } from "@/screens/forum/ForumThreadDetailScreen";
import { ModerationScreen } from "@/screens/forum/ModerationScreen";
import { LearnerDashboardScreen } from "@/screens/learner/LearnerDashboardScreen";
import { MyCoursesScreen } from "@/screens/learner/MyCoursesScreen";
import { GlobalSearchScreen } from "@/screens/search/GlobalSearchScreen";
import { palette } from "@/theme/tokens";

const Stack = createNativeStackNavigator<RootStackParamList>();
import { StaffToolsScreen } from "@/screens/staff/StaffToolsScreen";
import { AttendanceRegisterScreen } from "@/screens/staff/AttendanceRegisterScreen";
import { AttendanceReportScreen } from "@/screens/staff/AttendanceReportScreen";
import { GradingQueueScreen } from "@/screens/staff/GradingQueueScreen";
import { InstructorControlsScreen } from "@/screens/staff/InstructorControlsScreen";
import { RbacMatrixScreen } from "@/screens/staff/RbacMatrixScreen";
import { LiveStudioScreen } from "@/screens/staff/LiveStudioScreen";
import { subscribeToNotificationDeepLinks } from "@/features/notifications/pushRegistration";

const LearnerDashboardRoute = withErrorBoundary(
  LearnerDashboardScreen,
  'learner-dashboard'
);
const MyCoursesRoute = withErrorBoundary(MyCoursesScreen, 'my-courses');
const MyLearningRoute = withErrorBoundary(MyLearningScreen, 'my-learning');
const WishlistRoute = withErrorBoundary(WishlistScreen, 'wishlist');
const ProfileRoute = withErrorBoundary(ProfileScreen, 'profile');
const CourseDetailRoute = withErrorBoundary(CourseDetailScreen, 'course-detail');
const GlobalSearchRoute = withErrorBoundary(GlobalSearchScreen, 'global-search');
const ForumHomeRoute = withErrorBoundary(ForumHomeScreen, 'forum-home');
const ForumThreadRoute = withErrorBoundary(ForumThreadDetailScreen, 'forum-thread');
const CreatePostRoute = withErrorBoundary(CreatePostScreen, 'create-post');
const BookmarksRoute = withErrorBoundary(BookmarksScreen, 'bookmarks');
const ModerationRoute = withErrorBoundary(ModerationScreen, 'moderation');
const CheckoutRoute = withErrorBoundary(CheckoutScreen, 'checkout');
const PaymentSuccessRoute = withErrorBoundary(
  PaymentSuccessScreen,
  'payment-success'
);
const PaymentFailedRoute = withErrorBoundary(
  PaymentFailedScreen,
  'payment-failed'
);
const NotificationPreferencesRoute = withErrorBoundary(
  NotificationPreferencesScreen,
  'notification-preferences'
);
const LoginRoute = withErrorBoundary(LoginScreen, 'login');
const VideoPlayerRoute = withErrorBoundary(VideoPlayerScreen, 'video-player');
const AssessmentRoute = withErrorBoundary(AssessmentScreen, 'assessment');
const ResultsRoute = withErrorBoundary(ResultsScreen, 'results');
const CertificateRoute = withErrorBoundary(CertificateScreen, 'certificate');

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { handleReady } = useDeepLinks(navigationRef);
  const { palette: themePalette, isDark } = useTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const activeNavigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: themePalette.background,
      card: themePalette.surface,
      text: themePalette.textPrimary,
      border: themePalette.border,
      primary: themePalette.brand,
      notification: themePalette.danger,
    },
  };
const StaffToolsRoute = withErrorBoundary(StaffToolsScreen, "staff-tools");
const AttendanceRegisterRoute = withErrorBoundary(AttendanceRegisterScreen, "attendance-register");
const AttendanceReportRoute = withErrorBoundary(AttendanceReportScreen, "attendance-report");
const GradingQueueRoute = withErrorBoundary(GradingQueueScreen, "grading-queue");
const InstructorControlsRoute = withErrorBoundary(InstructorControlsScreen, "instructor-controls");
const RbacMatrixRoute = withErrorBoundary(RbacMatrixScreen, "rbac-matrix");
const LiveStudioRoute = withErrorBoundary(LiveStudioScreen, "live-studio");
const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.background,
    card: palette.surface,
    text: palette.textPrimary,
    border: palette.border,
    primary: palette.brand,
  },
};

function protect<Name extends keyof RootStackParamList>(
  Component: ComponentType<ScreenProps<Name>>,
  audience: AccessAudience,
) {
  function ProtectedScreen(props: ScreenProps<Name>) {
    const { account } = useLms();
    return (
      <AccessGate
        audience={audience}
        onHome={() => {
          if (isAdministrator(account?.role))
            props.navigation.navigate("AdminHome");
          else props.navigation.navigate("LmsHome");
        }}
      >
        <Component {...props} />
      </AccessGate>
    );
  }
  return withErrorBoundary(ProtectedScreen, Component.displayName || Component.name);
}
const ProtectedAdminHome = protect<"AdminHome">(AdminHomeScreen, "admin");
const ProtectedAccount = protect<"Account">(AccountScreen, "account");
const ProtectedLmsHome = protect<"LmsHome">(LmsHomeScreen, "learner");
const ProtectedCoursePlayer = protect<"CoursePlayer">(
  CoursePlayerScreen,
  "learner",
);
const ProtectedAssessmentTaking = protect<"AssessmentTaking">(
  AssessmentTakingScreen,
  "learner",
);
const ProtectedAssessmentResults = protect<"AssessmentResults">(
  AssessmentResultsScreen,
  "learner",
);
const ProtectedLmsCertificate = protect<"LmsCertificate">(
  LmsCertificateScreen,
  "learner",
);
const ProtectedDownloads = protect<"Downloads">(DownloadsScreen, "learner");
const ProtectedAnalytics = protect<"Analytics">(AnalyticsScreen, "admin");
const ProtectedCodePlayground = protect<"CodePlayground">(
  CodePlaygroundScreen,
  "learner",
);
const ProtectedPlaygroundHistory = protect<"PlaygroundHistory">(
  PlaygroundHistoryScreen,
  "learner",
);
const ProtectedLearnerProfile = protect<"LearnerProfile">(
  LearnerProfileScreen,
  "learner",
);
const ProtectedLmsSettings = protect<"LmsSettings">(
  LmsSettingsScreen,
  "learner",
);
const ProtectedLearnerDashboard = protect<"LearnerDashboard">(
  LearnerDashboardScreen,
  "learner",
);
const ProtectedMyCourses = protect<"MyCourses">(MyCoursesScreen, "learner");
const ProtectedCourseDetail = protect<"CourseDetail">(
  CourseDetailScreen,
  "learner",
);
const ProtectedGlobalSearch = protect<"GlobalSearch">(
  GlobalSearchScreen,
  "account",
);
const ProtectedForumHome = protect<"ForumHome">(ForumHomeScreen, "account");
const ProtectedForumThread = protect<"ForumThread">(
  ForumThreadDetailScreen,
  "account",
);
const ProtectedCreatePost = protect<"CreatePost">(CreatePostScreen, "account");
const ProtectedBookmarks = protect<"Bookmarks">(BookmarksScreen, "account");
const ProtectedModeration = protect<"Moderation">(
  ModerationScreen,
  "moderation",
);
const ProtectedCheckout = protect<"Checkout">(CheckoutScreen, "learner");

const ProtectedPaymentSuccess = protect<"PaymentSuccess">(PaymentSuccessScreen, "learner");
const ProtectedPaymentFailed = protect<"PaymentFailed">(PaymentFailedScreen, "learner");
const ProtectedNotificationPreferences = protect<"NotificationPreferences">(NotificationPreferencesScreen, "account");
const ProtectedVideoPlayer = protect<"VideoPlayer">(VideoPlayerScreen, "learner");
const ProtectedAssessment = protect<"Assessment">(AssessmentScreen, "learner");
const ProtectedResults = protect<"Results">(ResultsScreen, "learner");
const ProtectedCompanyCertificate = protect<"Certificate">(CompanyCertificateScreen, "learner");

export function RootNavigator() {
  const { session, account, ready, accessStatus } = useLms();
  const admin = isAdministrator(account?.role);
  const roleLinking = useMemo(
    () => linkingForRole(account?.role || null, Boolean(session.token)),
    [account?.role, session.token],
  );
  if (!ready || (session.token && accessStatus !== "ready"))
    return <AccessGate audience="account" onHome={() => {}} />;
  return (
    <NavigationContainer
      onReady={handleReady}
      ref={navigationRef}
      theme={activeNavigationTheme}>
      key={`${session.userId}:${Boolean(session.token)}:${account?.role || "guest"}`}
      linking={roleLinking}
      theme={navigationTheme}
    >
      <Stack.Navigator
        initialRouteName={
          !session.token ? "SignIn" : admin ? "AdminHome" : "LmsHome"
        }
        screenOptions={{
          headerStyle: { backgroundColor: themePalette.surface },
          headerTintColor: themePalette.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: themePalette.background },
        }}>
        screenOptions={({ navigation }) => ({
          headerRight: session.token
            ? () => (
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open my workspace"
                    style={{
                      padding: 8,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                    onPress={() =>
                      admin
                        ? navigation.navigate("AdminHome")
                        : navigation.navigate("LmsHome")
                    }
                  >
                    <Text style={{ color: palette.textPrimary }}>Home</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                    style={{
                      padding: 8,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                    onPress={() => void signOut()}
                  >
                    <Text style={{ color: palette.textSecondary }}>
                      Sign out
                    </Text>
                  </Pressable>
                </View>
              )
            : undefined,
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: palette.background },
        })}
      >
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ title: "Sign in" }}
        />
        <Stack.Screen
          name="AdminHome"
          component={ProtectedAdminHome}
          options={{ title: "Admin workspace" }}
        />
        <Stack.Screen
          name="Account"
          component={ProtectedAccount}
          options={{ title: "My account" }}
        />
        <Stack.Screen
          component={MyLearningRoute}
          name="MyLearning"
          options={{ title: 'My Learning' }}
        />
        <Stack.Screen
          component={WishlistRoute}
          name="Wishlist"
          options={{ title: 'Wishlist' }}
        />
        <Stack.Screen
          component={ProfileRoute}
          name="Profile"
          options={{ title: 'Profile' }}
        />
        <Stack.Screen
          component={CourseDetailRoute}
          name="CourseDetail"
          options={{ title: 'Course Detail' }}
          name="LmsHome"
          component={ProtectedLmsHome}
          options={{ title: "My learning" }}
        />
        <Stack.Screen
          name="CoursePlayer"
          component={ProtectedCoursePlayer}
          options={{ title: "Course player" }}
        />
        <Stack.Screen
          name="AssessmentTaking"
          component={ProtectedAssessmentTaking}
          options={{ title: "Assessment" }}
        />
        <Stack.Screen
          name="AssessmentResults"
          component={ProtectedAssessmentResults}
          options={{ title: "Results" }}
        />
        <Stack.Screen
          name="LmsCertificate"
          component={ProtectedLmsCertificate}
          options={{ title: "Certificate" }}
        />
        <Stack.Screen
          name="Downloads"
          component={ProtectedDownloads}
          options={{ title: "Downloads" }}
        />
        <Stack.Screen
          name="Analytics"
          component={ProtectedAnalytics}
          options={{ title: "Analytics" }}
        />
        <Stack.Screen
          name="CodePlayground"
          component={ProtectedCodePlayground}
          options={{ title: "Playground" }}
        />
        <Stack.Screen
          name="PlaygroundHistory"
          component={ProtectedPlaygroundHistory}
          options={{ title: "History" }}
        />
        <Stack.Screen
          name="LearnerProfile"
          component={ProtectedLearnerProfile}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="LmsSettings"
          component={ProtectedLmsSettings}
          options={{ title: "Settings" }}
        />
        <Stack.Screen
          component={ProtectedLearnerDashboard}
          name="LearnerDashboard"
          options={{ title: "Dashboard" }}
        />
        <Stack.Screen
          component={ProtectedMyCourses}
          name="MyCourses"
          options={{ title: "My Courses" }}
        />
        <Stack.Screen
          component={ProtectedCourseDetail}
          name="CourseDetail"
          options={{ title: "Course Detail" }}
        />
        <Stack.Screen
          component={ProtectedGlobalSearch}
          name="GlobalSearch"
          options={{ title: "Search" }}
        />
        <Stack.Screen
          component={ProtectedForumHome}
          name="ForumHome"
          options={{ title: "Forum" }}
        />
        <Stack.Screen
          component={ProtectedForumThread}
          name="ForumThread"
          options={{ title: "Thread" }}
        />
        <Stack.Screen
          component={ProtectedCreatePost}
          name="CreatePost"
          options={{ title: "New Thread" }}
        />
        <Stack.Screen
          component={ProtectedBookmarks}
          name="Bookmarks"
          options={{ title: "Bookmarks" }}
        />
        <Stack.Screen
          component={ProtectedModeration}
          name="Moderation"
          options={{ title: "Moderation" }}
        />
        <Stack.Screen
          component={ProtectedCheckout}
          name="Checkout"
          options={{ title: "Checkout" }}
        />
        <Stack.Screen component={StaffToolsRoute} name="StaffTools" options={{ title: 'Teaching tools' }} />
        <Stack.Screen component={LiveStudioRoute} name="LiveStudio" options={{ title: 'Live Studio' }} />
        <Stack.Screen component={AttendanceRegisterRoute} name="AttendanceRegister" options={{ title: 'Attendance register' }} />
        <Stack.Screen component={AttendanceReportRoute} name="AttendanceReport" options={{ title: 'Attendance report' }} />
        <Stack.Screen component={GradingQueueRoute} name="GradingQueue" options={{ title: 'Grading queue' }} />
        <Stack.Screen component={InstructorControlsRoute} name="InstructorControls" options={{ title: 'Instructor controls' }} />
        <Stack.Screen component={RbacMatrixRoute} name="RbacMatrix" options={{ title: 'Role permissions' }} />
        <Stack.Screen name="Login" component={SignInScreen} options={{ title: "Sign in" }} />
        <Stack.Screen name="PaymentSuccess" component={ProtectedPaymentSuccess} options={{ title: "Payment Successful" }} />
        <Stack.Screen name="PaymentFailed" component={ProtectedPaymentFailed} options={{ title: "Payment Failed" }} />
        <Stack.Screen name="NotificationPreferences" component={ProtectedNotificationPreferences} options={{ title: "Notification Preferences" }} />
        <Stack.Screen name="VideoPlayer" component={ProtectedVideoPlayer} options={{ title: "Lesson" }} />
        <Stack.Screen name="Assessment" component={ProtectedAssessment} options={{ title: "Assessment" }} />
        <Stack.Screen name="Results" component={ProtectedResults} options={{ title: "Results" }} />
        <Stack.Screen name="Certificate" component={ProtectedCompanyCertificate} options={{ title: "Certificate" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export function App() {
  const [checking, setChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    Promise.all([isOnboardingCompleted(), restoreSession()])
      .then(([completed]) => {
        setShowOnboarding(!completed);
      })
      .catch(() => {
        setShowOnboarding(true);
      })
      .finally(() => {
        setChecking(false);
      });
  }, []);

  if (checking) {
    return null;
  }

  if (showOnboarding) {
    return (
      <ThemeProvider>
        <SafeAreaProvider>
          <ApiClientProvider>
            <ErrorBoundary context="root">
              <ThemedStatusBar />
              <OnboardingFlowScreen onFinish={() => setShowOnboarding(false)} />
            </ErrorBoundary>
          </ApiClientProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <ApiClientProvider>
          <ErrorBoundary context="root">
            <ThemedStatusBar />
            <RootNavigator />
          </ErrorBoundary>
        </ApiClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  // Foreground notifications display through Expo; notification taps reuse the
  // app's established deep-link paths.
  useEffect(() => subscribeToNotificationDeepLinks(), []);
  return (
    <SafeAreaProvider>
      <ApiClientProvider>
        <StatusBar style="light" />
        <ErrorBoundary context="root">
          <LmsProvider>
            <LmsErrorBoundary>
              <RootNavigator />
            </LmsErrorBoundary>
          </LmsProvider>
        </ErrorBoundary>
      </ApiClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
