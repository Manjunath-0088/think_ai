import { act, fireEvent, render } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { BottomNavigation } from '@/navigation/BottomNavigation';

jest.mock('@/components/common/AppIcon', () => ({ AppIcon: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 20 }) }));

afterEach(() => jest.restoreAllMocks());

test('learning detail routes keep My learning selected and tabs open their real destinations', () => {
  const navigate = jest.fn();
  const view = render(<BottomNavigation admin={false} route="CoursePlayer" onNavigate={navigate} />);
  expect(view.getByRole('tab', { name: 'My learning' }).props.accessibilityState.selected).toBe(true);
  fireEvent.press(view.getByRole('tab', { name: 'Playground' }));
  expect(navigate).toHaveBeenLastCalledWith('CodePlayground');
  fireEvent.press(view.getByRole('tab', { name: 'Search' }));
  expect(navigate).toHaveBeenLastCalledWith('GlobalSearch');
  fireEvent.press(view.getByRole('tab', { name: 'Downloads' }));
  expect(navigate).toHaveBeenLastCalledWith('Downloads');
  fireEvent.press(view.getByRole('tab', { name: 'Account' }));
  expect(navigate).toHaveBeenLastCalledWith('LearnerProfile');
});

test('current destination does not push another copy; history stays in Playground', () => {
  const navigate = jest.fn();
  const view = render(<BottomNavigation admin={false} route="CodePlayground" onNavigate={navigate} />);
  fireEvent.press(view.getByRole('tab', { name: 'Playground' }));
  expect(navigate).not.toHaveBeenCalled();
  view.rerender(<BottomNavigation admin={false} route="PlaygroundHistory" onNavigate={navigate} />);
  expect(view.getByRole('tab', { name: 'Playground' }).props.accessibilityState.selected).toBe(true);
});

test('admin navigation exposes reports and account without learner-only destinations', () => {
  const navigate = jest.fn();
  const view = render(<BottomNavigation admin route="Analytics" onNavigate={navigate} />);
  expect(view.queryByRole('tab', { name: 'My learning' })).toBeNull();
  expect(view.queryByRole('tab', { name: 'Playground' })).toBeNull();
  expect(view.getByRole('tab', { name: 'Reports' }).props.accessibilityState.selected).toBe(true);
  fireEvent.press(view.getByRole('tab', { name: 'Account' }));
  expect(navigate).toHaveBeenCalledWith('Account');
});

test('login and keyboard entry hide the bottom bar and keyboard listeners are cleaned up', () => {
  const listeners: Record<string, () => void> = {};
  const remove = jest.fn();
  const addListener = Keyboard.addListener.bind(Keyboard);
  jest.spyOn(Keyboard, 'addListener').mockImplementation((name, callback) => {
    listeners[name] = callback as () => void;
    const subscription = addListener(name, callback);
    const cleanup = subscription.remove.bind(subscription);
    subscription.remove = () => { remove(); cleanup(); };
    return subscription;
  });
  const view = render(<BottomNavigation admin={false} route="SignIn" onNavigate={jest.fn()} />);
  expect(view.queryByTestId('bottom-navigation')).toBeNull();
  view.rerender(<BottomNavigation admin={false} route="LmsHome" onNavigate={jest.fn()} />);
  expect(view.getByTestId('bottom-navigation')).toBeTruthy();
  act(() => listeners.keyboardDidShow!());
  expect(view.queryByTestId('bottom-navigation')).toBeNull();
  act(() => listeners.keyboardDidHide!());
  expect(view.getByTestId('bottom-navigation')).toBeTruthy();
  view.unmount();
  expect(remove).toHaveBeenCalledTimes(2);
});
