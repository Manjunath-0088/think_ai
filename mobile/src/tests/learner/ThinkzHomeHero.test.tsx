import { fireEvent, render, screen } from '@testing-library/react-native';
import * as Native from 'react-native';
import { ThinkzHomeHero } from '@/components/learner/ThinkzHomeHero';

describe('Thinkz website hero on Android', () => {
  afterEach(() => jest.restoreAllMocks());
  it.each([[320, 1, false], [360, 1, false], [412, 1, false], [768, 1, true], [1024, 1, true], [768, 2, false]])(
    'keeps actions available at width %i and font scale %i', (width, fontScale) => {
      const dimensions = { width: Number(width), height: 840, scale: 1, fontScale: Number(fontScale) };
      Native.Dimensions.set({ window: dimensions, screen: dimensions });
      const browse = jest.fn();
      const learning = jest.fn();
      render(<ThinkzHomeHero onBrowse={browse} onLearning={learning} />);
      const layout = Native.StyleSheet.flatten(screen.getByTestId('thinkz-home-hero').props.style);
      expect(layout.flexDirection === 'column').toBe(Number(width) < 340 || Number(fontScale) > 1.3);
      expect(screen.getByText(/Learn. Practice./)).toBeTruthy();
      expect(screen.queryByTestId('home-code-panel')).toBeNull();
      fireEvent.press(screen.getByTestId('browse-tab'));
      expect(browse).toHaveBeenCalledTimes(1);
      expect(learning).not.toHaveBeenCalled();
    }
  );
});
