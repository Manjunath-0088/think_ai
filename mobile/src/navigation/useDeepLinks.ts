import { useCallback, useEffect, useRef } from 'react';
import type { NavigationContainerRef } from '@react-navigation/native';

import {
  getInitialDeepLink,
  rememberPendingDeepLink,
  subscribeToDeepLinks,
  type DeepLinkResolution,
} from './deepLinks';
import type { RootStackParamList } from './types';
import { allowsAudience, roleHome, routeAudience } from '@/lms/access';

/**
 * Bridges incoming deep links to the navigator.
 *
 * Applies sign-in gating (auth-gated routes bounce to the dashboard) and
 * defers the launch URL until the container reports ready via `handleReady`,
 * which should be wired to `NavigationContainer`'s `onReady`.
 */
export function useDeepLinks(
  navigationRef: NavigationContainerRef<RootStackParamList>,
  role?: string | null,
): { handleReady: () => void } {
  const pending = useRef<DeepLinkResolution | null>(null);

  const apply = useCallback(
    (resolution: DeepLinkResolution) => {
      if (resolution.status === 'not-found') {
        return;
      }
      if (!navigationRef.isReady()) {
        pending.current = resolution;
        return;
      }
      if (resolution.status === 'auth-required') {
        rememberPendingDeepLink(resolution.route);
        navigationRef.navigate(resolution.redirectTo);
        return;
      }
      const { screen, params } = resolution.route;
      const navigate = navigationRef.navigate as unknown as (
        name: string,
        args?: object
      ) => void;
      const audience = routeAudience[screen];
      if (audience && !allowsAudience(audience, role)) {
        navigate(roleHome(role));
        return;
      }
      navigate(screen, params);
    },
    [navigationRef, role]
  );

  useEffect(() => {
    const unsubscribe = subscribeToDeepLinks(apply);
    void getInitialDeepLink().then((resolution) => {
      if (resolution) {
        apply(resolution);
      }
    });
    return unsubscribe;
  }, [apply]);

  const handleReady = useCallback(() => {
    const resolution = pending.current;
    pending.current = null;
    if (resolution) {
      apply(resolution);
    }
  }, [apply]);

  return { handleReady };
}

export default useDeepLinks;
