require('@testing-library/react-native');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/**
 * SecureStore is a native module. Keep an in-memory implementation so session
 * persistence tests exercise the secure path without Android/iOS runtimes.
 */
const mockSecureStoreData = new Map();
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key) => mockSecureStoreData.get(key) ?? null),
  setItemAsync: jest.fn(async (key, value) => {
    mockSecureStoreData.set(key, String(value));
  }),
  deleteItemAsync: jest.fn(async (key) => {
    mockSecureStoreData.delete(key);
  }),
  isAvailableAsync: jest.fn(async () => true),
}));

jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

/**
 * WebView is a native component. Tests only need to assert that the secure
 * Jitsi room was mounted, so the mock renders a plain View but forwards
 * test-relevant props.
 */
jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  function WebView(props) {
    return React.createElement(View, {
      testID: props.testID ?? 'mock-webview',
      mediaCapturePermissionGrantType: props.mediaCapturePermissionGrantType,
    });
  }
  return { __esModule: true, WebView, default: WebView };
});

/**
 * NetInfo is a native module with no Jest implementation, so it is mocked
 * globally. Tests drive connectivity through `src/utils/connectivity`'s
 * `__setOnlineForTests` seam, or by emitting here.
 */
jest.mock('@react-native-community/netinfo', () => {
  const listeners = new Set();
  const netInfo = {
    addEventListener: jest.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
    fetch: jest.fn(() =>
      Promise.resolve({ isConnected: true, isInternetReachable: true })
    ),
  };
  return {
    __esModule: true,
    default: netInfo,
    __emit: (state) => listeners.forEach((listener) => listener(state)),
    __reset: () => listeners.clear(),
  };
});



/**
 * Mock notification components and hooks for tests
 */
jest.mock('@/features/notifications/hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: () => ({
    prefs: {
      replies: { email: true, inApp: true, sms: false },
      mentions: { email: true, inApp: true, sms: false },
      sessions: { email: false, inApp: true, sms: false },
      payments: { email: true, inApp: true, sms: false },
    },
    loading: false,
    saving: false,
    hasUnsavedChanges: false,
    error: null,
    setGroupChannel: jest.fn(),
    save: jest.fn().mockResolvedValue(true),
  }),
}));

jest.mock('@/features/notifications/components/ChannelToggles', () => ({
  ChannelToggles: () => null,
}));

jest.mock('@/features/notifications/components/PreferenceGroup', () => ({
  PreferenceGroup: () => null,
}));

jest.mock('@/features/notifications/components/UnsavedWarningModal', () => ({
  UnsavedWarningModal: () => null,
}));

jest.mock('@/features/notifications/components/NotificationDropdown', () => {
  const React = require('react');
  const NotificationDropdown = React.forwardRef((props, ref) => React.createElement('View', { ref, ...props, testID: 'notification-dropdown' }));
  return {
    __esModule: true,
    default: NotificationDropdown,
    NotificationDropdown,
  };
}, { virtual: true });


/**
 * Mock RefreshControl for tests that use ScrollView with refreshControl
 * Returns a valid React component that renders nothing
 */
jest.mock('react-native/Libraries/Components/RefreshControl/RefreshControl', () => {
  const React = require('react');
  return { __esModule: true, default: React.forwardRef((props, ref) => React.createElement('View', { ref, ...props })) };
});

/**
 * Fake timers are enabled globally so `Animated` never ticks mid-assertion
 * (which would otherwise produce `act()` warnings) and debounce/300 ms search
 * windows can be advanced deterministically. `@testing-library/react-native`
 * detects fake timers and advances them inside `waitFor`, so async helpers keep
 * working. */
jest.useFakeTimers();

/**
 * Every test starts with empty storage and a restored online connection so the
 * offline cache/queue modules cannot leak state between cases (the mocked
 * AsyncStorage is a shared in-memory store for the whole file). */
beforeEach(async () => {
  require('expo-secure-store').__reset();
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  const asyncStorage = asyncStorageModule.default ?? asyncStorageModule;
  await asyncStorage.clear();
  mockSecureStoreData.clear();
  require('./src/utils/connectivity').__resetConnectivityForTests();
});