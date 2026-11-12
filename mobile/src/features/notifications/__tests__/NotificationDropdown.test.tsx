import { render } from '@testing-library/react-native';
import { NotificationDropdown } from '../components/NotificationDropdown';

jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}) }));
jest.mock('../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({
    prefs: {}, loading: true, hasUnsavedChanges: false, error: null,
    setGroupChannel: jest.fn(), save: jest.fn(),
  }),
}));
jest.mock('../components/PreferenceGroup', () => ({ PreferenceGroup: () => null }));

describe('NotificationDropdown loading', () => {
  it('renders the loading indicator without crashing when opened', () => {
    const { getByTestId, getByLabelText } = render(
      <NotificationDropdown visible onClose={jest.fn()} anchorRef={{ current: null } as any} />
    );
    expect(getByTestId('prefs-loading')).toBeTruthy();
    expect(getByLabelText('Loading notification preferences')).toBeTruthy();
  });
});
