import { apiRequest } from './http';
import type { SessionProfile } from './session';

export interface AuthenticatedLearner extends SessionProfile {
  id: number | string;
}

export interface AuthenticationResult {
  token: string;
  user: AuthenticatedLearner;
}

/** Authenticate against the existing LMS PostgreSQL-backed auth endpoint. */
export async function authenticate(
  email: string,
  password: string,
  signal?: AbortSignal
): Promise<AuthenticationResult> {
  const payload = await apiRequest<never>('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
    signal,
  });
  const response = payload as typeof payload & {
    token?: unknown;
    user?: Partial<AuthenticatedLearner>;
    error?: string;
  };

  if (
    typeof response.token !== 'string' ||
    !response.user ||
    (typeof response.user.id !== 'number' && typeof response.user.id !== 'string') ||
    typeof response.user.email !== 'string'
  ) {
    throw new Error('The sign-in service returned an invalid response.');
  }

  return {
    token: response.token,
    user: {
      id: response.user.id,
      name: typeof response.user.name === 'string' ? response.user.name : null,
      email: response.user.email,
      role: typeof response.user.role === 'string' ? response.user.role : 'Learner',
      createdAt: typeof response.user.createdAt === 'string' ? response.user.createdAt : null,
    },
  };
}
