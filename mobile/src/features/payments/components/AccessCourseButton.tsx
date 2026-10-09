import { Button } from 'react-native';

export function AccessCourseButton({
  onPress,
}: {
  courseId: string;
  courseTitle?: string;
  onPress: () => void;
}) {
  return (
    <Button
      title="Open Enrolled Course"
      onPress={onPress}
      accessibilityLabel="access-enrolled-course"
    />
  );
}
