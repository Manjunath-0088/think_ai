/** One API origin per build; session storage is isolated across deployments. */
import { Platform } from 'react-native';
export function normalizeApiBase(value: string): string {
  const raw = value.trim().replace(/\/+$/, '');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new Error('Configure an HTTP(S) API URL without credentials, query or fragment.');
  if (url.pathname === '/' || url.pathname === '') return `${raw}/api`;
  if (url.pathname !== '/api') throw new Error('API URL must end with /api exactly once.');
  return raw;
}
export const DEPLOYMENT_API = normalizeApiBase(
  (Platform.OS === 'web' && process.env.EXPO_PUBLIC_WEB_API_URL) || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api',
);
export const SESSION_STORAGE_KEY = 'thinkz_auth_' + DEPLOYMENT_API.replace(/[^a-zA-Z0-9._-]/g, '_');
export const PLAYGROUND_API = process.env.EXPO_PUBLIC_PLAYGROUND_API === 'handover' ? 'handover' : 'lms';
export const HANDOVER_READ_API = process.env.EXPO_PUBLIC_READ_API === 'handover';
