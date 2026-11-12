import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { CoursePlayerScreen } from '@/lms/screens/CoursePlayerScreen';
const mockScrollTo = jest.fn();
const mockPause = jest.fn(async () => {});
const mockSelect = jest.fn();
let mockVideoUrl = 'https://media.example.invalid/video.mp4';
jest.mock('@/lms/LmsProvider', () => ({ useLms: () => ({ session: { userId: 'learner', token: 'token' }, online: true }) }));
jest.mock('@/lms/api', () => ({ lmsApi: { note: jest.fn(async () => ({ text: '' })), saveNote: jest.fn() } }));
jest.mock('@/lms/HostedVideo', () => ({ HostedVideo: () => null }));
jest.mock('expo-av', () => {
  const React = require('react'); const { View } = require('react-native');
  return { ResizeMode: { CONTAIN: 'contain' }, Video: React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ pauseAsync: mockPause }));
    return React.createElement(View);
  }) };
});
jest.mock('@/hooks/useCoursePlayer', () => ({ useCoursePlayer: () => {
  const first = { id: 1, title: 'Python Introduction Video', videoUrl: mockVideoUrl };
  return { resource: { data: { course: { title: 'Python', modules: [{ id: 1, title: 'Introduction', lessons: [first, { id: 2, title: 'Next lesson' }], assessments: [] }] }, enrollmentId: 6 } },
    lesson: first, lessons: [first], uri: mockVideoUrl, message: '', download: null, video: { current: { pauseAsync: mockPause } },
    initialPosition: 0, completed: 0, online: true, playback: jest.fn(), downloadCurrent: jest.fn(), setSelected: mockSelect };
} }));
jest.mock('@/lms/ui', () => {
  const React = require('react'); const { View } = require('react-native');
  return { ...jest.requireActual('@/lms/ui'), Screen: ({ children, scrollRef }: any) => {
    React.useImperativeHandle(scrollRef, () => ({ scrollTo: mockScrollTo }));
    return React.createElement(View, null, children);
  } };
});
beforeEach(() => { jest.clearAllMocks(); mockVideoUrl = 'https://media.example.invalid/video.mp4'; });
const open = () => render(<CoursePlayerScreen {...({ route: { params: { courseId: 9 } }, navigation: { navigate: jest.fn() } } as any)} />);

test.each(['https://media.example.invalid/video.mp4', 'https://www.youtube.com/watch?v=6i3EGqOBRiU'])(
  'selecting current lesson returns to visible player without pausing it: %s', async url => {
    mockVideoUrl = url;
    const screen = open();
    await waitFor(() => expect(screen.getByLabelText('Your notes (save when leaving the field)').props.editable).toBe(true));
    fireEvent.press(screen.getByText('▶ Python Introduction Video'));
    expect(mockScrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
    expect(mockSelect).toHaveBeenCalledWith(1);
    expect(mockPause).not.toHaveBeenCalled();
    screen.unmount();
  });

test('selecting another lesson pauses previous playback and returns to player', async () => {
  const screen = open();
  await waitFor(() => expect(screen.getByLabelText('Your notes (save when leaving the field)').props.editable).toBe(true));
  fireEvent.press(screen.getByText('Next lesson'));
  expect(mockPause).toHaveBeenCalledTimes(1);
  expect(mockSelect).toHaveBeenCalledWith(2);
  expect(mockScrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  screen.unmount();
});
