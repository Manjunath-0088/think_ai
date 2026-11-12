import { render } from '@testing-library/react-native';
import Constants from 'expo-constants';
import { HostedVideo } from '@/lms/HostedVideo';
jest.mock('expo-constants', () => ({ __esModule: true, default: {
  expoConfig: { android: { package: 'com.thinkzai.mobile.usbpreview' }, ios: { bundleIdentifier: 'com.thinkzai.mobile.usbpreview' } },
} }));
jest.mock('react-native-webview', () => ({ WebView: require('react-native').View }));
test('sends build identity and preserves the selected video', () => {
  const url = 'https://www.youtube-nocookie.com/embed/abcdefghijk';
  const screen = render(<HostedVideo url={url} />);
  expect(screen.getByLabelText('Lesson video player').props.source).toEqual({
    uri: url, headers: { Referer: 'https://com.thinkzai.mobile.usbpreview/' },
  });
});
test('does not invent an identity when configuration is missing', () => {
  const config = Constants.expoConfig!;
  const previous = config.android;
  const previousIos = config.ios;
  config.android = undefined;
  config.ios = undefined;
  try {
    const screen = render(<HostedVideo url="https://www.youtube-nocookie.com/embed/abcdefghijk" />);
    expect(screen.getByLabelText('Lesson video player').props.source.headers).toBeUndefined();
  } finally { config.android = previous; config.ios = previousIos; }
});
