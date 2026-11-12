import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { registerAccount } from '@/api/auth';
import { signIn } from '@/api/session';
import { RegisterScreen } from '@/screens/auth/RegisterScreen';
import { createMockNavigation, renderScreen } from '@/tests/helpers';

jest.mock('@/api/auth', () => ({ registerAccount: jest.fn() }));
jest.mock('@/api/session', () => ({ signIn: jest.fn() }));
jest.mock('@/features/notifications/pushRegistration', () => ({
  registerPushNotifications: jest.fn().mockResolvedValue(undefined),
}));

const registerMock = registerAccount as jest.MockedFunction<typeof registerAccount>;
const signInMock = signIn as jest.MockedFunction<typeof signIn>;

beforeEach(() => {
  registerMock.mockReset();
  signInMock.mockReset();
});

it('validates registration fields before calling the shared auth endpoint', async () => {
  renderScreen(RegisterScreen, { name: 'Register' });
  fireEvent.changeText(screen.getByTestId('register-email'), 'bad-email');
  fireEvent.press(screen.getByTestId('register-submit'));

  expect(screen.getByText('Enter your name to create an account.')).toBeTruthy();
  expect(registerMock).not.toHaveBeenCalled();
});

it('creates a learner account, persists the bearer token, then opens the learner workspace', async () => {
  registerMock.mockResolvedValue({
    token: 'registered-token',
    user: {
      id: 42,
      name: 'New Learner',
      email: 'new@example.test',
      role: 'Learner',
      createdAt: null,
    },
  });
  const navigation = createMockNavigation();

  renderScreen(RegisterScreen, { name: 'Register', navigation });
  fireEvent.changeText(screen.getByTestId('register-name'), ' New Learner ');
  fireEvent.changeText(screen.getByTestId('register-email'), 'NEW@example.test');
  fireEvent.changeText(screen.getByTestId('register-password'), 'password');
  fireEvent.changeText(screen.getByTestId('register-confirm-password'), 'password');
  fireEvent.press(screen.getByTestId('register-terms'));
  expect(screen.getByTestId('register-terms').props.accessibilityState).toEqual({ checked: true });
  fireEvent.press(screen.getByTestId('register-submit'));

  await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('LearnerDashboard'));
  expect(registerMock).toHaveBeenCalledWith(' New Learner ', 'NEW@example.test', 'password', expect.any(AbortSignal));
  expect(signInMock).toHaveBeenCalledWith('42', 'registered-token', expect.objectContaining({
    email: 'new@example.test',
    role: 'Learner',
  }));
});

it('keeps the registration form connected to the sign-in screen', () => {
  const navigation = createMockNavigation();
  renderScreen(RegisterScreen, { name: 'Register', navigation });
  fireEvent.press(screen.getByTestId('register-login-link'));
  expect(navigation.navigate).toHaveBeenCalledWith('Login');
});
