import { DEFAULT_PREFS } from '../constants';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';

describe('useNotificationPreferences', () => {
  it('exposes the hook and default preference groups', () => {
    expect(typeof useNotificationPreferences).toBe('function');
    expect(DEFAULT_PREFS.replies.email).toBe(true);
    expect(DEFAULT_PREFS.mentions).toBeDefined();
    expect(DEFAULT_PREFS.sessions).toBeDefined();
    expect(DEFAULT_PREFS.payments).toBeDefined();
  });
});
