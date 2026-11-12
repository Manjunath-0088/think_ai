import type { ScreenProps } from '@/navigation/types';
import { parseNativePlayerParams } from '@/navigation/playerRoute';
import { CoursePlayerScreen } from '@/lms/screens/CoursePlayerScreen';
import { VideoPlayerScreen } from './VideoPlayerScreen';

/** Route old course-play links into the authenticated native media player. */
export function IntegratedVideoPlayerScreen(props: ScreenProps<'VideoPlayer'>) {
  const params = parseNativePlayerParams(
    props.route.params.courseId,
    props.route.params.lessonId,
  );
  if (!params) {
    return <VideoPlayerScreen {...props} />;
  }

  const route = {
    ...props.route,
    name: 'CoursePlayer',
    params,
  } as unknown as ScreenProps<'CoursePlayer'>['route'];
  const navigation = props.navigation as unknown as ScreenProps<'CoursePlayer'>['navigation'];
  const playerProps: ScreenProps<'CoursePlayer'> = { ...props, route, navigation } as ScreenProps<'CoursePlayer'>;
  return <CoursePlayerScreen {...playerProps} />;
}

export default IntegratedVideoPlayerScreen;
