require('@testing-library/react-native/extend-expect');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

/**
 * Fake timers are enabled globally so `Animated` never ticks mid-assertion
 * (which would otherwise produce `act()` warnings) and debounce/300 ms search
 * windows can be advanced deterministically. `@testing-library/react-native`
 * detects fake timers and advances them inside `waitFor`, so async helpers keep
 * working.
 */
jest.useFakeTimers();
