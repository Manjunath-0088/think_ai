import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { Text, Pressable, View } from 'react-native';
import { useLmsStyles } from '@/lms/ui';

function ThemeProbe() {
  const { mode, setMode } = useTheme();
  return <><Text testID="mode">{mode}</Text><Pressable testID="light" onPress={() => setMode('light')} /><Pressable testID="dark" onPress={() => setMode('dark')} /></>;
}

function LmsStyleProbe() {
  const styles = useLmsStyles();
  return <View testID="lms-screen" style={styles.screen} />;
}

describe('theme preference', () => {
  it('switches between light and dark modes', async () => {
    render(<ThemeProvider initialMode="dark"><><ThemeProbe /><LmsStyleProbe /></></ThemeProvider>);
    expect(screen.getByTestId('mode').props.children).toBe('dark');
    expect(screen.getByTestId('lms-screen').props.style.backgroundColor).toBe('#0B1020');
    await act(async () => { fireEvent.press(screen.getByTestId('light')); });
    expect(screen.getByTestId('mode').props.children).toBe('light');
    expect(screen.getByTestId('lms-screen').props.style.backgroundColor).toBe('#F5F6FB');
    await act(async () => { fireEvent.press(screen.getByTestId('dark')); });
    expect(screen.getByTestId('mode').props.children).toBe('dark');
  });
});
