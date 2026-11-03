import { getSession, restoreSession } from './session';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Minimal `fetch` transport for Pages 6–10.
 *
 * Contract (confirmed against `think_ai/backend`):
 *   - Base URL: `EXPO_PUBLIC_API_URL` when configured. Expo Go on a physical
 *     device uses the LAN host serving Metro; Android emulators use 10.0.2.2.
 *   - Auth: a bearer token proves identity; `x-user-id` is retained only for
 *     local fixture compatibility and is ignored by authenticated routes.
 *   - Envelope: success `{ success: true, data, ...extras }`,
 *     failure `{ success: false, message, ...extras }` with 4xx/5xx.
 */
function getExpoLanHost(hostUri?: string | null): string | null {
  const authority = hostUri
    ?.trim()
    .replace(/^[a-z][a-z\d+.-]*:\/\//i, '')
    .split(/[/?#]/, 1)[0];
  const host = authority?.split(':', 1)[0];
  if (!host || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) return null;

  const octets = host.split('.').map(Number);
  if (
    octets.some((octet) => octet > 255) ||
    octets[0] === 0 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254)
  ) {
    return null;
  }
  return host;
}

export function resolveApiBaseUrl(
  platform: typeof Platform.OS,
  configuredUrl?: string,
  expoHostUri?: string | null,
): string {
  const configured = configuredUrl?.trim().replace(/\/+$/, '');
  if (configured) return configured;

  const expoHost = getExpoLanHost(expoHostUri);
  if (expoHost && (platform === 'android' || platform === 'ios')) {
    return `http://${expoHost}:5000/api`;
  }
  if (platform === 'android') return 'http://10.0.2.2:5000/api';
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = resolveApiBaseUrl(
  Platform.OS,
  process.env.EXPO_PUBLIC_API_URL,
  Constants.expoConfig?.hostUri,
);

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  status?: string;
  notificationsCreated?: number;
  syncedAt?: string;
  [extra: string]: unknown;
}

export type QueryValue = string | number | boolean | undefined | null;

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

/** HTTP + payload error carrying the raw body so callers can branch on `status`. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiEnvelope<unknown> | null;

  constructor(message: string, status: number, payload: ApiEnvelope<unknown> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function buildRequestUrl(path: string, query?: Record<string, QueryValue>): string {
  const base = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) {
    return base;
  }
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  return params.length > 0 ? `${base}?${params.join('&')}` : base;
}

/** Headers every forum/payments request carries — auth proof per endpoint docs. */
export async function buildHeaders(hasBody: boolean): Promise<Record<string, string>> {
  await restoreSession();
  const { userId, token } = getSession();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'x-user-id': userId,
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, query } = options;
  const hasBody = body !== undefined;
  const url = buildRequestUrl(path, query);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: await buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError('Network error — is the backend running?', 0, null);
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.message ??
      (typeof payload?.error === 'string' ? payload.error : `Request failed (${response.status})`);
    throw new ApiError(message, response.status, payload);
  }

  if (payload === null) {
    throw new ApiError('Unexpected response from the server.', response.status, null);
  }

  return payload;
}

/** `apiRequest` that unwraps the `{ success, data }` envelope. */
export async function apiData<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const payload = await apiRequest<T>(path, options);
  return payload.data;
}
