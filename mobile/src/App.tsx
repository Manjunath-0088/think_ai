import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { registerSignOutCleanup, restoreSession, signOut } from '@/api/session';
import { ErrorBoundary } from '@/components/common';
import {
  subscribeToNotificationDeepLinks,
  unregisterPushNotifications,
} from '@/features/notifications/pushRegistration';
import { isOnboardingCompleted } from '@/features/onboarding/utils/onboardingStorage';
import { ApiClientProvider } from '@/hooks/useApiClient';
import { AccessGate } from '@/lms/AccessGate';
import { roleHome, type AccessAudience } from '@/lms/access';
import { LmsErrorBoundary } from '@/lms/ErrorBoundary';
import { useLms, LmsProvider } from '@/lms/LmsProvider';
import { AdminHomeScreen, AccountScreen } from '@/lms/screens/AdminHomeScreen';
import { LmsHomeScreen } from '@/lms/screens/HomeScreen';
import { CoursePlayerScreen } from '@/lms/screens/CoursePlayerScreen';
import { AssessmentTakingScreen } from '@/lms/screens/AssessmentTakingScreen';
import { AssessmentResultsScreen } from '@/lms/screens/ResultsScreen';
import { CertificateScreen as LmsCertificateScreen } from '@/lms/screens/CertificateScreen';
import { DownloadsScreen } from '@/lms/screens/DownloadsScreen';
import { AnalyticsScreen } from '@/lms/screens/AnalyticsScreen';
import { CodePlaygroundScreen, PlaygroundHistoryScreen } from '@/lms/screens/PlaygroundScreen';
import { LearnerProfileScreen, LmsSettingsScreen } from '@/lms/screens/ProfileScreen';
import type { RootStackParamList, ScreenProps } from '@/navigation/types';
import { useDeepLinks } from '@/navigation/useDeepLinks';
import { withErrorBoundary } from '@/navigation/withErrorBoundary';
import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { CourseDetailScreen } from '@/screens/course/CourseDetailScreen';
import { BookmarksScreen } from '@/screens/forum/BookmarksScreen';
import { CreatePostScreen } from '@/screens/forum/CreatePostScreen';
import { ForumHomeScreen } from '@/screens/forum/ForumHomeScreen';
import { ForumThreadDetailScreen } from '@/screens/forum/ForumThreadDetailScreen';
import { ForumCategoriesScreen } from '@/screens/forum/ForumCategoriesScreen';
import { ForumNotificationsScreen } from '@/screens/forum/ForumNotificationsScreen';
import { ModerationScreen } from '@/screens/forum/ModerationScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { AssessmentScreen } from '@/screens/learning/AssessmentScreen';
import { CertificateScreen } from '@/screens/learning/CertificateScreen';
import { ResultsScreen } from '@/screens/learning/ResultsScreen';
import { IntegratedVideoPlayerScreen } from '@/screens/learning/IntegratedVideoPlayerScreen';
import { LearnerDashboardScreen } from '@/screens/learner/LearnerDashboardScreen';
import { MyCoursesScreen } from '@/screens/learner/MyCoursesScreen';
import { MyLearningScreen } from '@/screens/learner/MyLearningScreen';
import { ProfileScreen } from '@/screens/learner/ProfileScreen';
import { WishlistScreen } from '@/screens/learner/WishlistScreen';
import { GlobalSearchScreen } from '@/screens/search/GlobalSearchScreen';
import { PaymentFailedScreen } from '@/features/payments/screens/PaymentFailedScreen';
import { PaymentSuccessScreen } from '@/features/payments/screens/PaymentSuccessScreen';
import { NotificationPreferencesScreen } from '@/features/notifications/screens/NotificationPreferencesScreen';
import { OnboardingFlowScreen } from '@/screens/onboarding/OnboardingFlowScreen';
import { StaffToolsScreen } from '@/screens/staff/StaffToolsScreen';
import { AttendanceRegisterScreen } from '@/screens/staff/AttendanceRegisterScreen';
import { AttendanceReportScreen } from '@/screens/staff/AttendanceReportScreen';
import { GradingQueueScreen } from '@/screens/staff/GradingQueueScreen';
import { InstructorControlsScreen } from '@/screens/staff/InstructorControlsScreen';
import { RbacMatrixScreen } from '@/screens/staff/RbacMatrixScreen';
import { LiveStudioScreen } from '@/screens/staff/LiveStudioScreen';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
          props.navigation.navigate(roleHome(account?.role));
        }}>
        <Component {...props} />
      </AccessGate>
    );
  }
  ProtectedScreen.displayName = `Protected(${Component.displayName || Component.name})`;
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

const StaffToolsRoute = withErrorBoundary(StaffToolsScreen, "StaffTools");
const AttendanceRegisterRoute = withErrorBoundary(AttendanceRegisterScreen, "AttendanceRegister");
const AttendanceReportRoute = withErrorBoundary(AttendanceReportScreen, "AttendanceReport");
const GradingQueueRoute = withErrorBoundary(GradingQueueScreen, "GradingQueue");
const InstructorControlsRoute = withErrorBoundary(InstructorControlsScreen, "InstructorControls");
const RbacMatrixRoute = withErrorBoundary(RbacMatrixScreen, "RbacMatrix");
const LiveStudioRoute = withErrorBoundary(LiveStudioScreen, "LiveStudio");
const MyLearningRoute = withErrorBoundary(MyLearningScreen, "MyLearning");
const WishlistRoute = withErrorBoundary(WishlistScreen, "Wishlist");
const ProfileRoute = withErrorBoundary(ProfileScreen, "Profile");

export function RootNavigator() {
  const { session, account, ready, accessStatus } = useLms();
  const { palette: themePalette, isDark } = useTheme();
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const activeNavigationTheme = { ...baseTheme, colors: { ...baseTheme.colors,
    background: themePalette.background, card: themePalette.surface,
    text: themePalette.textPrimary, border: themePalette.border,
    primary: themePalette.brand, notification: themePalette.danger,
  } };
  const admin = isAdministrator(account?.role);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { handleReady } = useDeepLinks(navigationRef);
  const [currentRoute, setCurrentRoute] = useState<keyof RootStackParamList | null>(null);
  const updateCurrentRoute = () => setCurrentRoute(
    (navigationRef.getCurrentRoute()?.name as keyof RootStackParamList | undefined) ?? null,
  );
  const roleLinking = useMemo(
    () => linkingForRole(account?.role || null, Boolean(session.token)),
    [account?.role, session.token],
  );
  if (!ready || (session.token && accessStatus !== "ready"))
    return <AccessGate audience="account" onHome={() => {}} />;
  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => { handleReady(); updateCurrentRoute(); }}
      onStateChange={updateCurrentRoute}
      key={`${session.userId}:${Boolean(session.token)}:${account?.role || "guest"}`}
      linking={roleLinking}
      theme={activeNavigationTheme}
    >
      <View style={{ flex: 1 }}>
      <Stack.Navigator
        initialRouteName={
          !session.token ? "SignIn" : admin ? "AdminHome" : "LmsHome"
        }
        screenOptions={({ navigation }) => ({
          headerTitle: session.token ? () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <AppIcon name="graduation-cap" color="#C4B5FD" size={22} />
              <Text style={{ color: palette.textPrimary, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 }}>ThinkZai</Text>
            </View>
          ) : undefined,
          headerRight: session.token
            ? () => (
                <View style={{ flexDirection: "row", gap: 4 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Notification preferences"
                    style={{
                      padding: 8,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                    onPress={() => navigation.navigate("NotificationPreferences")}
                  >
                    <AppIcon name="bell" color={palette.textSecondary} size={20} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                    style={{ minHeight: 44, padding: 8, justifyContent: "center" }}
                    onPress={() => { void signOut().catch(() => {}); }}
                  >
                    <Text style={{ color: palette.textSecondary }}>Sign out</Text>
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
        <Stack.Screen name="Login" component={SignInScreen} options={{ title: "Sign in" }} />
        <Stack.Screen name="PaymentSuccess" component={ProtectedPaymentSuccess} options={{ title: "Payment Successful" }} />
        <Stack.Screen name="PaymentFailed" component={ProtectedPaymentFailed} options={{ title: "Payment Failed" }} />
        <Stack.Screen name="NotificationPreferences" component={ProtectedNotificationPreferences} options={{ title: "Notification Preferences" }} />
        <Stack.Screen name="VideoPlayer" component={ProtectedVideoPlayer} options={{ title: "Lesson" }} />
        <Stack.Screen name="Assessment" component={ProtectedAssessment} options={{ title: "Assessment" }} />
        <Stack.Screen name="Results" component={ProtectedResults} options={{ title: "Results" }} />
        <Stack.Screen name="Certificate" component={ProtectedCompanyCertificate} options={{ title: "Certificate" }} />
        <Stack.Screen name="StaffTools" component={StaffToolsRoute} />
        <Stack.Screen name="AttendanceRegister" component={AttendanceRegisterRoute} />
        <Stack.Screen name="AttendanceReport" component={AttendanceReportRoute} />
        <Stack.Screen name="GradingQueue" component={GradingQueueRoute} />
        <Stack.Screen name="InstructorControls" component={InstructorControlsRoute} />
        <Stack.Screen name="RbacMatrix" component={RbacMatrixRoute} />
        <Stack.Screen name="LiveStudio" component={LiveStudioRoute} />
        <Stack.Screen name="MyLearning" component={MyLearningRoute} />
        <Stack.Screen name="Wishlist" component={WishlistRoute} />
        <Stack.Screen name="Profile" component={ProfileRoute} />
      </Stack.Navigator>
      </View>
      {session.token ? <BottomNavigation admin={admin}
        route={currentRoute ?? (admin ? 'AdminHome' : 'LmsHome')}
        onNavigate={(destination) => { if (navigationRef.isReady()) navigationRef.navigate(destination); }} /> : null}
    </NavigationContainer>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { session, account, ready, accessStatus } = useLms();
  const { handleReady } = useDeepLinks(
    navigationRef,
    account?.role ?? session.profile?.role,
  );
  const { palette, isDark } = useTheme();
  const workspaceRoute = roleHome(account?.role ?? session.profile?.role);
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = useMemo(() => ({
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: palette.background,
      card: palette.surface,
      text: palette.textPrimary,
      border: palette.border,
      primary: palette.brand,
      notification: palette.danger,
    },
  }), [baseTheme, palette]);

  if (!ready) return null;
  if (session.token && accessStatus !== 'ready') {
    return <AccessGate audience="account" onHome={() => {}} />;
  }

  return (
    <NavigationContainer
      key={`${session.userId}:${Boolean(session.token)}:${account?.role || session.profile?.role || 'guest'}`}
      onReady={handleReady}
      ref={navigationRef}
      theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={!session.token ? 'Login' : workspaceRoute}
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.background },
          headerRight: session.token
            ? () => (
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open my workspace"
                    onPress={() => navigation.navigate(workspaceRoute)}
                    style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ color: palette.textPrimary }}>Home</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Sign out"
                    onPress={() => void signOut()}
                    style={{ padding: 8, minHeight: 44, justifyContent: 'center' }}>
                    <Text style={{ color: palette.textSecondary }}>Sign out</Text>
                  </Pressable>
                </View>
              )
            : undefined,
        })}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Sign in', headerShown: false }} />
        <Stack.Screen name="SignIn" component={LoginScreen} options={{ title: 'Sign in', headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account', headerShown: false }} />
        <Stack.Screen name="AdminHome" component={protect(AdminHomeScreen, 'admin')} options={{ title: 'Admin workspace' }} />
        <Stack.Screen name="Account" component={protect(AccountScreen, 'account')} options={{ title: 'My account' }} />
        <Stack.Screen name="LearnerDashboard" component={protect(LearnerDashboardScreen, 'learner')} options={{ title: 'Dashboard' }} />
        <Stack.Screen name="LmsHome" component={protect(LmsHomeScreen, 'learner')} options={{ title: 'Learning workspace' }} />
        <Stack.Screen name="MyLearning" component={protect(MyLearningScreen, 'learner')} options={{ title: 'My Learning' }} />
        <Stack.Screen name="MyCourses" component={protect(MyCoursesScreen, 'learner')} options={{ title: 'My Courses' }} />
        <Stack.Screen name="CourseDetail" component={protect(CourseDetailScreen, 'learner')} options={{ title: 'Course Detail' }} />
        <Stack.Screen name="GlobalSearch" component={protect(GlobalSearchScreen, 'account')} options={{ title: 'Search' }} />
        <Stack.Screen name="Wishlist" component={protect(WishlistScreen, 'learner')} options={{ title: 'Wishlist' }} />
        <Stack.Screen name="Profile" component={protect(ProfileScreen, 'learner')} options={{ title: 'Profile' }} />
        <Stack.Screen name="ForumHome" component={protect(ForumHomeScreen, 'account')} options={{ title: 'Forum' }} />
        <Stack.Screen name="ForumCategories" component={protect(ForumCategoriesScreen, 'account')} options={{ title: 'Forum Categories' }} />
        <Stack.Screen name="ForumNotifications" component={protect(ForumNotificationsScreen, 'account')} options={{ title: 'Notifications' }} />
        <Stack.Screen name="ForumThread" component={protect(ForumThreadDetailScreen, 'account')} options={{ title: 'Thread' }} />
        <Stack.Screen name="CreatePost" component={protect(CreatePostScreen, 'account')} options={{ title: 'New Thread' }} />
        <Stack.Screen name="Bookmarks" component={protect(BookmarksScreen, 'account')} options={{ title: 'Bookmarks' }} />
        <Stack.Screen name="Moderation" component={protect(ModerationScreen, 'moderation')} options={{ title: 'Moderation' }} />
        <Stack.Screen name="Checkout" component={protect(CheckoutScreen, 'learner')} options={{ title: 'Checkout' }} />
        <Stack.Screen name="PaymentSuccess" component={protect(PaymentSuccessScreen, 'learner')} options={{ title: 'Payment Successful' }} />
        <Stack.Screen name="PaymentFailed" component={protect(PaymentFailedScreen, 'learner')} options={{ title: 'Payment Failed' }} />
        <Stack.Screen name="NotificationPreferences" component={protect(NotificationPreferencesScreen, 'account')} options={{ title: 'Notification Preferences' }} />
        <Stack.Screen name="VideoPlayer" component={protect(IntegratedVideoPlayerScreen, 'learner')} options={{ title: 'Lesson' }} />
        <Stack.Screen name="Assessment" component={protect(AssessmentScreen, 'learner')} options={{ title: 'Assessment' }} />
        <Stack.Screen name="Results" component={protect(ResultsScreen, 'learner')} options={{ title: 'Results' }} />
        <Stack.Screen name="Certificate" component={protect(CertificateScreen, 'learner')} options={{ title: 'Certificate' }} />
        <Stack.Screen name="CoursePlayer" component={protect(CoursePlayerScreen, 'learner')} options={{ title: 'Course player' }} />
        <Stack.Screen name="AssessmentTaking" component={protect(AssessmentTakingScreen, 'learner')} options={{ title: 'Assessment' }} />
        <Stack.Screen name="AssessmentResults" component={protect(AssessmentResultsScreen, 'learner')} options={{ title: 'Results' }} />
        <Stack.Screen name="LmsCertificate" component={protect(LmsCertificateScreen, 'learner')} options={{ title: 'Certificate' }} />
        <Stack.Screen name="Downloads" component={protect(DownloadsScreen, 'learner')} options={{ title: 'Downloads' }} />
        <Stack.Screen name="Analytics" component={protect(AnalyticsScreen, 'admin')} options={{ title: 'Analytics' }} />
        <Stack.Screen name="CodePlayground" component={protect(CodePlaygroundScreen, 'learner')} options={{ title: 'Playground' }} />
        <Stack.Screen name="PlaygroundHistory" component={protect(PlaygroundHistoryScreen, 'learner')} options={{ title: 'History' }} />
        <Stack.Screen name="LearnerProfile" component={protect(LearnerProfileScreen, 'learner')} options={{ title: 'Profile' }} />
        <Stack.Screen name="LmsSettings" component={protect(LmsSettingsScreen, 'learner')} options={{ title: 'Settings' }} />
        <Stack.Screen name="StaffTools" component={protect(StaffToolsScreen, 'staff')} options={{ title: 'Teaching tools' }} />
        <Stack.Screen name="LiveStudio" component={protect(LiveStudioScreen, 'account')} options={{ title: 'Live Studio' }} />
        <Stack.Screen name="AttendanceRegister" component={protect(AttendanceRegisterScreen, 'staff')} options={{ title: 'Attendance register' }} />
        <Stack.Screen name="AttendanceReport" component={protect(AttendanceReportScreen, 'staff')} options={{ title: 'Attendance report' }} />
        <Stack.Screen name="GradingQueue" component={protect(GradingQueueScreen, 'staff')} options={{ title: 'Grading queue' }} />
        <Stack.Screen name="InstructorControls" component={protect(InstructorControlsScreen, 'staff')} options={{ title: 'Instructor controls' }} />
        <Stack.Screen name="RbacMatrix" component={protect(RbacMatrixScreen, 'admin')} options={{ title: 'Role permissions' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function App() {
  const [checking, setChecking] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    return subscribeToNotificationDeepLinks();
  }, []);

  useEffect(
    () => registerSignOutCleanup(() => unregisterPushNotifications().then(() => undefined)),
    [],
  );

  useEffect(() => {
    Promise.all([isOnboardingCompleted(), restoreSession()])
      .then(([completed]) => setShowOnboarding(!completed))
      .catch(() => setShowOnboarding(true))
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

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
          <ThemedStatusBar />
          <ErrorBoundary context="root">
            <ThemedStatusBar />
            <LmsProvider>
              <LmsErrorBoundary>
                <RootNavigator />
              </LmsErrorBoundary>
            </LmsProvider>
          </ErrorBoundary>
        </ApiClientProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
export default App;
