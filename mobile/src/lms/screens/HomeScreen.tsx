import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { AppButton } from "@/components/common/AppButton";
import { AppIcon } from "@/components/common/AppIcon";
import { palette } from "@/theme/tokens";
import type { ScreenProps } from "@/navigation/types";
import { lmsApi } from "../api";
import { useLms } from "../LmsProvider";
import { useLmsResource } from "../useLmsResource";
import { Card, LoadState, Screen, useLmsStyles } from "../ui";
export function LmsHomeScreen({ navigation }: ScreenProps<"LmsHome">) {
  const styles = useLmsStyles();
  const { session, sync, account } = useLms();
  const focused = useIsFocused();
  const fetcher = useCallback(() => lmsApi.enrollments(), [session.token]);
  const resource = useLmsResource(fetcher);
  useEffect(() => {
    if (focused && session.token) void resource.refresh();
  }, [focused, session.token]);
  return (
    <Screen title="Learning workspace">
      <View style={styles.row}>
        <AppButton
          title="My profile"
          variant="secondary"
          onPress={() => navigation.navigate("LearnerProfile")}
        />
        <AppButton
          title="Playground"
          variant="secondary"
          onPress={() => navigation.navigate("CodePlayground")}
        />
        <AppButton
          title="Downloads"
          variant="secondary"
          onPress={() => navigation.navigate("Downloads")}
        />
      </View>
      <LoadState {...resource} retry={resource.refresh} />
      {resource.data?.length === 0 ? (
        <Card>
          <Text style={styles.text}>
            No enrollments yet. Your payment or enrollment administrator can
            enroll you in a course.
          </Text>
        </Card>
      ) : null}
      {resource.data?.map((row) => (
        <Card key={row.id}>
          <View style={home.courseHeading}>
            <View style={home.courseIcon}><AppIcon name="book-open" color="#C4B5FD" size={24} /></View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={home.eyebrow}>YOUR LEARNING PATH</Text>
              <Text style={styles.heading}>{row.batch.course.title}</Text>
            </View>
          </View>
          <Text style={styles.muted}>
            {row.summary.completedLessons}/{row.summary.totalLessons} lessons ·{" "}
            {row.summary.percentage.toFixed(1)}% complete
          </Text>
          <View accessibilityRole="progressbar" accessibilityLabel={`${row.batch.course.title} progress`}
            accessibilityValue={{ min: 0, max: 100, now: row.summary.percentage }} style={home.progressTrack}>
            <View style={[home.progressFill, { width: `${Math.max(0, Math.min(100, row.summary.percentage))}%` }]} />
          </View>
          <View style={home.access}>
            <AppIcon name={row.courseAccess ? 'check-circle' : 'lock'} size={13} color={row.courseAccess ? palette.success : palette.warning} />
            <Text style={styles.muted}>{row.courseAccess ? row.enrollmentStatus : 'Awaiting enrollment unlock'}</Text>
          </View>
          <AppButton
            title="Continue learning"
            disabled={!row.courseAccess}
            onPress={() =>
              navigation.navigate("CoursePlayer", {
                courseId: row.batch.course.id,
              })
            }
          />
        </Card>
      ))}
      <AppButton title="Teaching tools" variant="secondary" onPress={() => navigation.navigate("StaffTools")} />
      <AppButton
        title="Community dashboard"
        variant="secondary"
        onPress={() => navigation.navigate("LearnerDashboard")}
      />
    </Screen>
  );
}

const home = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderRadius: 22, backgroundColor: '#241A43', borderWidth: 1, borderColor: '#44316D' },
  eyebrow: { color: '#B9A5E9', fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  greeting: { color: palette.textPrimary, fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.5 },
  heroText: { color: '#C4BED7', fontSize: 13, lineHeight: 20 },
  heroIcon: { height: 60, width: 60, borderRadius: 20, backgroundColor: '#3A285E', alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', gap: 10 },
  shortcut: { flex: 1, paddingVertical: 16, gap: 9, alignItems: 'center', backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.border },
  shortcutIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#28213F' },
  shortcutLabel: { color: palette.textPrimary, fontSize: 11, fontWeight: '600' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  courseHeading: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  courseIcon: { width: 62, height: 70, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#28213F' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: palette.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#A78BFA', borderRadius: 3 },
  access: { flexDirection: 'row', gap: 7, alignItems: 'center' },
});
