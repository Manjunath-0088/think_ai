import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon, type AppIconName } from '@/components/common/AppIcon';
import { palette } from '@/theme/tokens';
import type { RootStackParamList } from './types';

export type BottomDestination = 'LmsHome' | 'GlobalSearch' | 'CodePlayground' | 'Downloads' |
  'LearnerProfile' | 'AdminHome' | 'Analytics' | 'ForumHome' | 'Account';
type Item = { route: BottomDestination; label: string; icon: AppIconName; pages: readonly (keyof RootStackParamList)[] };

const learnerItems: readonly Item[] = [
  { route: 'LmsHome', label: 'My learning', icon: 'book-open', pages: ['LmsHome', 'LearnerDashboard', 'MyCourses', 'CourseDetail', 'CoursePlayer', 'AssessmentTaking', 'AssessmentResults', 'LmsCertificate', 'VideoPlayer', 'Assessment', 'Results', 'Certificate', 'Checkout', 'PaymentSuccess', 'PaymentFailed'] },
  { route: 'GlobalSearch', label: 'Search', icon: 'search', pages: ['GlobalSearch'] },
  { route: 'CodePlayground', label: 'Playground', icon: 'code', pages: ['CodePlayground', 'PlaygroundHistory'] },
  { route: 'Downloads', label: 'Downloads', icon: 'download', pages: ['Downloads'] },
  { route: 'LearnerProfile', label: 'Account', icon: 'user-circle', pages: ['LearnerProfile', 'LmsSettings', 'Account', 'NotificationPreferences'] },
];
const adminItems: readonly Item[] = [
  { route: 'AdminHome', label: 'Workspace', icon: 'th-large', pages: ['AdminHome'] },
  { route: 'Analytics', label: 'Reports', icon: 'chart-bar', pages: ['Analytics'] },
  { route: 'GlobalSearch', label: 'Search', icon: 'search', pages: ['GlobalSearch'] },
  { route: 'ForumHome', label: 'Community', icon: 'comments', pages: ['ForumHome', 'ForumThread', 'CreatePost', 'Bookmarks', 'Moderation'] },
  { route: 'Account', label: 'Account', icon: 'user-circle', pages: ['Account', 'NotificationPreferences'] },
];

export function BottomNavigation({ admin, route, onNavigate }: {
  admin: boolean;
  route: keyof RootStackParamList;
  onNavigate: (destination: BottomDestination) => void;
}) {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible || route === 'SignIn' || route === 'Login') return null;
  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]} testID="bottom-navigation">
      <View style={styles.row}>
        {(admin ? adminItems : learnerItems).map((item) => {
          const active = item.pages.includes(route);
          return (
            <Pressable key={item.route} accessibilityRole="tab" accessibilityLabel={item.label}
              accessibilityState={{ selected: active }} testID={`nav-${item.route}`}
              onPress={() => { if (route !== item.route) onNavigate(item.route); }}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={[styles.icon, active && styles.activeIcon]}>
                <AppIcon name={item.icon} size={21} color={active ? '#C4B5FD' : palette.textSecondary} />
              </View>
              <Text style={[styles.label, active && styles.activeLabel]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 8 },
  row: { flexDirection: 'row', width: '100%', maxWidth: 760, alignSelf: 'center' },
  item: { flex: 1, minWidth: 0, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 },
  icon: { width: 48, height: 30, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  activeIcon: { backgroundColor: '#30234F' },
  label: { width: '100%', textAlign: 'center', flexShrink: 0, color: palette.textSecondary, fontSize: 10, fontWeight: '500' },
  activeLabel: { color: palette.textPrimary, fontWeight: '700' },
  pressed: { opacity: 0.65 },
});
