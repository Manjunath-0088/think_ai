import { apiRequest } from './http';
import type { SessionProfile } from './session';

export interface AuthenticatedLearner extends SessionProfile {
  id: number | string;
}

export interface AuthenticationResult {
  token: string;
  user: AuthenticatedLearner;
}

function parseAuthenticationResult(
  payload: Awaited<ReturnType<typeof apiRequest<never>>>,
): AuthenticationResult {
  const response = payload as typeof payload & {
    token?: unknown;
    user?: Partial<AuthenticatedLearner>;
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
  return parseAuthenticationResult(payload);
}

/** Create an account through the website's existing PostgreSQL-backed auth endpoint. */
export async function registerAccount(
  name: string,
  email: string,
  password: string,
  signal?: AbortSignal,
): Promise<AuthenticationResult> {
  const payload = await apiRequest<never>('/auth/register', {
    method: 'POST',
    body: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    },
    signal,
  });
  return parseAuthenticationResult(payload);
}
