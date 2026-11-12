import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from '@/api/session';
import { allowsAudience } from '@/lms/access';
import { useLms } from '@/lms/LmsProvider';
import type { ScreenProps } from '@/navigation/types';
import { radii, spacing, typography } from '@/theme/tokens';
import type { Palette } from '@/theme/tokens';
import { useThemedStyles } from '@/theme/useThemedStyles';

const tools = [
  { route: 'LiveStudio' as const, audience: 'instructor' as const, title: 'Live Studio', detail: 'Join a live session, chat, run polls, view attendees, and manage breakout rooms.' },
  { route: 'AttendanceRegister' as const, audience: 'staff' as const, title: 'Attendance register', detail: 'Mark Present, Tardy, Absent, or Excused and save the register.' },
  { route: 'AttendanceReport' as const, audience: 'staff' as const, title: 'Attendance report', detail: 'Filter attendance history and share a CSV report.' },
  { route: 'GradingQueue' as const, audience: 'staff' as const, title: 'Grading queue', detail: 'Review learner submissions, scores, and feedback.' },
  { route: 'InstructorControls' as const, audience: 'staff' as const, title: 'Instructor controls', detail: 'Complete session preparation and manage live-session controls.' },
  { route: 'RbacMatrix' as const, audience: 'admin' as const, title: 'Role permissions', detail: 'Review and stage role-based access permissions.' },
];

export function StaffToolsScreen({ navigation }: ScreenProps<'StaffTools'>) {
  const styles = useThemedStyles(createStyles);
  const { account } = useLms();
  const visibleTools = tools.filter((tool) => allowsAudience(tool.audience, account?.role));
  const logout = async () => {
    await signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };
  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.kicker}>STAFF WORKSPACE</Text><Text style={styles.title}>Teaching tools</Text>
    <Text style={styles.note}>Your account role controls which staff tools are available. Updates are saved through the existing secured APIs.</Text>
    {visibleTools.map((tool) => <Pressable key={tool.route} onPress={() => navigation.navigate(tool.route)} style={styles.card} accessibilityRole="button">
      <View><Text style={styles.cardTitle}>{tool.title}</Text><Text style={styles.detail}>{tool.detail}</Text></View><Text style={styles.arrow}>›</Text>
    </Pressable>)}
    <Pressable onPress={logout} style={styles.logout} accessibilityRole="button"><Text style={styles.logoutText}>Sign out</Text></Pressable>
  </ScrollView></SafeAreaView>;
}
const createStyles = (palette: Palette) => StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.background }, content: { padding: spacing.md, gap: spacing.md }, kicker: { ...typography.caption, color: palette.brand, letterSpacing: 1.2 }, title: { ...typography.display, color: palette.textPrimary }, note: { ...typography.body, color: palette.textSecondary, marginBottom: spacing.sm }, card: { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, borderRadius: radii.lg, padding: spacing.md, minHeight: 94, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }, cardTitle: { ...typography.subtitle, color: palette.textPrimary }, detail: { ...typography.body, color: palette.textSecondary, marginTop: spacing.xs, maxWidth: 285 }, arrow: { fontSize: 34, color: palette.brand }, logout: { borderWidth: 1, borderColor: palette.danger, borderRadius: radii.md, padding: spacing.md, alignItems: 'center' }, logoutText: { ...typography.label, color: palette.danger } });
