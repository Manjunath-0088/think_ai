import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ApiClientProvider } from '@/hooks/useApiClient';
import { linking } from '@/navigation/linking';
import type { RootStackParamList } from '@/navigation/types';
import { CheckoutScreen } from '@/screens/checkout/CheckoutScreen';
import { CourseDetailScreen } from '@/screens/course/CourseDetailScreen';
import { BookmarksScreen } from '@/screens/forum/BookmarksScreen';
import { CreatePostScreen } from '@/screens/forum/CreatePostScreen';
import { ForumHomeScreen } from '@/screens/forum/ForumHomeScreen';
import { ForumThreadDetailScreen } from '@/screens/forum/ForumThreadDetailScreen';
import { ModerationScreen } from '@/screens/forum/ModerationScreen';
import { LearnerDashboardScreen } from '@/screens/learner/LearnerDashboardScreen';
import { MyCoursesScreen } from '@/screens/learner/MyCoursesScreen';
import { GlobalSearchScreen } from '@/screens/search/GlobalSearchScreen';
import { palette } from '@/theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

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

export function RootNavigator() {
  return (
    <NavigationContainer linking={linking} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="LearnerDashboard"
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.textPrimary,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: palette.background },
        }}>
        <Stack.Screen
          component={LearnerDashboardScreen}
          name="LearnerDashboard"
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen
          component={MyCoursesScreen}
          name="MyCourses"
          options={{ title: 'My Courses' }}
        />
        <Stack.Screen
          component={CourseDetailScreen}
          name="CourseDetail"
          options={{ title: 'Course Detail' }}
        />
        <Stack.Screen
          component={GlobalSearchScreen}
          name="GlobalSearch"
          options={{ title: 'Search' }}
        />
        <Stack.Screen
          component={ForumHomeScreen}
          name="ForumHome"
          options={{ title: 'Forum' }}
        />
        <Stack.Screen
          component={ForumThreadDetailScreen}
          name="ForumThread"
          options={{ title: 'Thread' }}
        />
        <Stack.Screen
          component={CreatePostScreen}
          name="CreatePost"
          options={{ title: 'New Thread' }}
        />
        <Stack.Screen
          component={BookmarksScreen}
          name="Bookmarks"
          options={{ title: 'Bookmarks' }}
        />
        <Stack.Screen
          component={ModerationScreen}
          name="Moderation"
          options={{ title: 'Moderation' }}
        />
        <Stack.Screen
          component={CheckoutScreen}
          name="Checkout"
          options={{ title: 'Checkout' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export function App() {
  return (
    <SafeAreaProvider>
      <ApiClientProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </ApiClientProvider>
    </SafeAreaProvider>
  );
}

export default App;
