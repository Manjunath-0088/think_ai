import { useContext } from 'react';
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from 'react-native-safe-area-context';

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Safe-area insets that degrade to zero when there is no `SafeAreaProvider`.
 *
 * The app always mounts a provider at the root; this fallback only exists so
 * components such as the forum FAB and the create-post sheet can also render
 * in isolation (unit tests, storybook-style previews) without throwing.
 */
export function useOptionalSafeAreaInsets(): EdgeInsets {
  return useContext(SafeAreaInsetsContext) ?? ZERO_INSETS;
}

export default useOptionalSafeAreaInsets;
