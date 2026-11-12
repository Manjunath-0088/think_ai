import { useEffect, useRef } from 'react';

type FocusNavigation = {
  addListener: (event: 'focus', listener: () => void) => () => void;
};

/** Refresh a stack screen when the user returns to it after the first mount. */
export function useRefreshOnFocus(
  navigation: FocusNavigation,
  refresh: () => Promise<void>,
): void {
  const hasFocused = useRef(false);

  useEffect(() => navigation.addListener('focus', () => {
    if (hasFocused.current) {
      void refresh();
    } else {
      hasFocused.current = true;
    }
  }), [navigation, refresh]);
}
