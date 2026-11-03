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

import { restoreSession, signOut } from '@/api/session';
import { ErrorBoundary } from '@/components/common';
import { subscribeToNotificationDeepLinks } from '@/features/notifications/pushRegistration';
import { isOnboardingCompleted } from '@/features/onboarding/utils/onboardingStorage';
import { ApiClientProvider } from '@/hooks/useApiClient';
import { AccessGate } from '@/lms/AccessGate';
import { isAdministrator, type AccessAudience } from '@/lms/access';
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
import { ModerationScreen } from '@/screens/forum/ModerationScreen';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { AssessmentScreen } from '@/screens/learning/AssessmentScreen';
import { CertificateScreen } from '@/screens/learning/CertificateScreen';
import { ResultsScreen } from '@/screens/learning/ResultsScreen';
import { VideoPlayerScreen } from '@/screens/learning/VideoPlayerScreen';
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
          props.navigation.navigate(isAdministrator(account?.role) ? 'AdminHome' : 'LmsHome');
        }}>
        <Component {...props} />
      </AccessGate>
    );
  }
  ProtectedScreen.displayName = `Protected(${Component.displayName || Component.name})`;
  return withErrorBoundary(ProtectedScreen, Component.displayName || Component.name);
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const { handleReady } = useDeepLinks(navigationRef);
  const { session, account, ready, accessStatus } = useLms();
  const { palette, isDark } = useTheme();
  const admin = isAdministrator(account?.role ?? session.profile?.role);
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
        initialRouteName={!session.token ? 'Login' : admin ? 'AdminHome' : 'LearnerDashboard'}
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
                    onPress={() => navigation.navigate(admin ? 'AdminHome' : 'LearnerDashboard')}
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
        <Stack.Screen name="ForumThread" component={protect(ForumThreadDetailScreen, 'account')} options={{ title: 'Thread' }} />
        <Stack.Screen name="CreatePost" component={protect(CreatePostScreen, 'account')} options={{ title: 'New Thread' }} />
        <Stack.Screen name="Bookmarks" component={protect(BookmarksScreen, 'account')} options={{ title: 'Bookmarks' }} />
        <Stack.Screen name="Moderation" component={protect(ModerationScreen, 'moderation')} options={{ title: 'Moderation' }} />
        <Stack.Screen name="Checkout" component={protect(CheckoutScreen, 'learner')} options={{ title: 'Checkout' }} />
        <Stack.Screen name="PaymentSuccess" component={protect(PaymentSuccessScreen, 'learner')} options={{ title: 'Payment Successful' }} />
        <Stack.Screen name="PaymentFailed" component={protect(PaymentFailedScreen, 'learner')} options={{ title: 'Payment Failed' }} />
        <Stack.Screen name="NotificationPreferences" component={protect(NotificationPreferencesScreen, 'account')} options={{ title: 'Notification Preferences' }} />
        <Stack.Screen name="VideoPlayer" component={protect(VideoPlayerScreen, 'learner')} options={{ title: 'Lesson' }} />
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
        <Stack.Screen name="StaffTools" component={StaffToolsScreen} options={{ title: 'Teaching tools' }} />
        <Stack.Screen name="LiveStudio" component={LiveStudioScreen} options={{ title: 'Live Studio' }} />
        <Stack.Screen name="AttendanceRegister" component={AttendanceRegisterScreen} options={{ title: 'Attendance register' }} />
        <Stack.Screen name="AttendanceReport" component={AttendanceReportScreen} options={{ title: 'Attendance report' }} />
        <Stack.Screen name="GradingQueue" component={GradingQueueScreen} options={{ title: 'Grading queue' }} />
        <Stack.Screen name="InstructorControls" component={InstructorControlsScreen} options={{ title: 'Instructor controls' }} />
        <Stack.Screen name="RbacMatrix" component={RbacMatrixScreen} options={{ title: 'Role permissions' }} />
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
