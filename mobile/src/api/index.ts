import type { LearningApiClient } from './client';
import { createMockApiClient } from './mockClient';
import { createLiveApiClient } from './liveClient';

export type { LearningApiClient } from './client';
export type { CommunityApiClient, CommunityApiMethod } from './client';
export { createMockApiClient } from './mockClient';
export type { MockApiClient, MockApiOptions } from './mockClient';
export { createCommunityClient } from './communityClient';
export { createLiveApiClient } from './liveClient';
export { API_BASE_URL, ApiError } from './http';

/**
 * The single active data source for the app.
 *
 * Mobile builds use the backend client. Fixtures are enabled only for Jest or
 * when a developer explicitly opts in with EXPO_PUBLIC_USE_MOCK_API=true.
 * This keeps demos deterministic without shipping mock data as production data.
 */
const useMockClient =
  process.env.NODE_ENV === 'test' ||
  process.env.EXPO_PUBLIC_USE_MOCK_API === 'true';

let activeClient: LearningApiClient = useMockClient
  ? createMockApiClient()
  : createLiveApiClient();

export function getApiClient(): LearningApiClient {
  return activeClient;
}

/** Escape hatch used by tests and Storybook-style previews. */
export function setApiClient(client: LearningApiClient): void {
  activeClient = client;
}

export function useMockApi(): LearningApiClient {
  return activeClient;
}
