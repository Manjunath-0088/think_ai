import { API_BASE_URL } from "@/api/http";
import { getSession, restoreSession, signIn } from "@/api/session";
import { practiceBody, practiceResult } from './handoverPlayground';
import { PLAYGROUND_API, HANDOVER_READ_API } from './deployment';
import { verifiedIdentity } from './handoverRead';
import { handoverClient, handoverUnavailable } from './handoverClient';
import type {
  Analytics,
  Answer,
  AssessmentResult,
  Attempt,
  Certificate,
  Enrollment,
  Execution,
  Language,
  PlayerData,
  Profile,
  Progress,
  ProgressUpdate,
  ReportStatus,
} from "./types";
export class LmsApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    timeout?: number;
    token?: string;
    envelopeKey?: 'user' | 'document';
  } = {},
): Promise<T> {
  await restoreSession();
  const token = options.token ?? getSession().token;
  if (!token)
    throw new LmsApiError(
      "Sign in to open your learning workspace.",
      401,
      "AUTH_REQUIRED",
    );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? 15000);
  try {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${path}`, {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    if (response.status === 404 && path.startsWith('/lms/'))
      throw new LmsApiError('Learning APIs are unavailable on this server. Contact your administrator.', 404, 'LMS_API_NOT_DEPLOYED');
    let payload;
    try { payload = await response.json(); }
    catch { throw new LmsApiError('The API returned an invalid JSON response.', response.status, 'INVALID_RESPONSE'); }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new LmsApiError('The API returned an invalid response.', response.status, 'INVALID_RESPONSE');
    if (!response.ok || payload.success === false)
      throw new LmsApiError(
        payload.message || payload.error || "Request failed.",
        response.status,
        payload.code || "REQUEST_FAILED",
      );
    return (options.envelopeKey === 'document' ? payload : options.envelopeKey === 'user' ? payload.user : payload.data) as T;
  } catch (error) {
    if (error instanceof LmsApiError) throw error;
    if (controller.signal.aborted)
      throw new LmsApiError(
        "The request timed out. Please try again.",
        0,
        "REQUEST_TIMEOUT",
      );
    throw new LmsApiError(
      "Connection failed or timed out. Check your internet and API URL.",
      0,
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timer);
  }
}
export async function login(email: string, password: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
  const response = await fetch(
    `${API_BASE_URL.replace(/\/$/, "")}/auth/login`,
    {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  let payload;
  try { payload = await response.json(); }
  catch { throw new LmsApiError('The sign-in service returned an invalid response.', response.status, 'INVALID_RESPONSE'); }
  if (!response.ok || payload?.success === false)
    throw new LmsApiError(payload?.message || payload?.error || 'Sign-in failed.', response.status, 'LOGIN_REJECTED');
  if (typeof payload?.token !== 'string' || !payload.token.trim() ||
      !['string', 'number'].includes(typeof payload?.user?.id) || !String(payload.user.id).trim())
    throw new LmsApiError('The sign-in service returned an incomplete session.', response.status, 'INVALID_RESPONSE');
  try { await signIn(String(payload.user.id), payload.token); }
  catch {
    throw new LmsApiError('Login was accepted, but this phone could not securely save the session. Close and reopen the app, then try again.', 0, 'SESSION_STORAGE_FAILED');
  }
  } catch (error) {
    if (error instanceof LmsApiError) throw error;
    if (controller.signal.aborted)
      throw new LmsApiError('Sign-in timed out. Please try again.', 0, 'REQUEST_TIMEOUT');
    throw new LmsApiError('The app could not reach the sign-in service. Check the phone connection and try again.', 0, 'LOGIN_UNAVAILABLE');
  } finally { clearTimeout(timer); }
}
export function resolveCertificateDownload(certificate: Certificate): Certificate {
  if (!certificate.pdfUrl.startsWith("/api/lms/certificates/")) return certificate;
  const origin = /^https?:\/\//.test(API_BASE_URL)
    ? API_BASE_URL
    : typeof globalThis.location !== "undefined" ? globalThis.location.origin : null;
  if (!origin) throw new LmsApiError("Configure an absolute API URL for certificate downloads.", 0, "API_URL_REQUIRED");
  return { ...certificate, pdfUrl: new URL(certificate.pdfUrl, origin).toString() };
}
async function legacy(token?: string) {
  await restoreSession();
  const captured = token ?? getSession().token;
  if (!captured) throw new LmsApiError('Sign in to continue.', 401, 'AUTH_REQUIRED');
  const read = async <T = unknown>(path: string): Promise<T> => {
    if (getSession().token !== captured) throw new LmsApiError('Your account changed. Refresh this screen.', 401, 'SESSION_CHANGED');
    const value = await request<T>(path, { token: captured, ...(path === '/auth/me' ? { envelopeKey: 'user' as const } : {}) });
    if (getSession().token !== captured) throw new LmsApiError('Your account changed. Refresh this screen.', 401, 'SESSION_CHANGED');
    return value;
  };
  return handoverClient(read, API_BASE_URL, e => e instanceof LmsApiError && e.status === 404 && e.message === 'Certificate not found', process.env.EXPO_PUBLIC_API_URL || API_BASE_URL);
}
// Positive support is scoped to the current login and briefly cached for result polling.
// Unsupported deployments are not cached: Retry can detect a freshly deployed backend.
let assessmentSupport: { token: string; checkedAt: number } | null = null;
async function timedAssessmentAvailable(): Promise<boolean> {
  if (!HANDOVER_READ_API) return true;
  await restoreSession();
  const token = getSession().token;
  if (!token) throw new LmsApiError('Sign in to take an assessment.', 401, 'AUTH_REQUIRED');
  if (assessmentSupport?.token === token && Date.now() - assessmentSupport.checkedAt < 60000) return true;
  let document: any;
  try {
    document = await request('/lms-openapi.json', { token, envelopeKey: 'document' });
  } catch (error) {
    if (error instanceof LmsApiError && error.status === 404) return false;
    throw error;
  }
  if (getSession().token !== token) throw new LmsApiError('Your account changed. Reopen the assessment.', 401, 'SESSION_CHANGED');
  const paths = document?.paths;
  const attempt = document?.components?.schemas?.Attempt?.properties;
  const supported = !!(paths?.['/api/lms/assessments/{id}/start']?.post &&
    paths?.['/api/lms/assessments/{id}/submit']?.post &&
    paths?.['/api/lms/attempts/{id}/results']?.get &&
    attempt?.attemptId?.type === 'integer' && attempt?.expiresAt?.format === 'date-time' &&
    attempt?.startedAt?.format === 'date-time' && attempt?.serverTime?.format === 'date-time');
  if (supported) assessmentSupport = { token, checkedAt: Date.now() };
  return supported;
}
async function assessmentRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!(await timedAssessmentAvailable())) throw new LmsApiError(
    'Timed assessment APIs are not deployed on this server. Your draft has not been submitted.', 503, 'ASSESSMENT_API_UNAVAILABLE');
  await restoreSession();
  const token = getSession().token;
  const result = await request<T>(path, { ...options, token: token ?? undefined });
  if (getSession().token !== token) throw new LmsApiError('Your account changed. Reopen the assessment.', 401, 'SESSION_CHANGED');
  return result;
}
export const lmsApi = {
  enrollments: async () => {
    if (!HANDOVER_READ_API) return request<Enrollment[]>("/lms/enrollments");
    return (await legacy()).enrollments();
  },
  identity: async (token: string) => verifiedIdentity(await request('/auth/me', { token, envelopeKey: 'user' })),
  player: async (courseId: number) => HANDOVER_READ_API ? (await legacy()).player(courseId)
    : request<PlayerData>(`/lms/courses/${courseId}/player`),
  profile: async (token?: string) => HANDOVER_READ_API ? (await legacy(token)).profile() : request<Profile>("/lms/me", { token }),
  updateName: async (name: string) => HANDOVER_READ_API ? handoverUnavailable('Profile editing')
    : request("/lms/me", { method: "PATCH", body: { name } }),
  note: async (enrollmentId: number, lessonId: number) => HANDOVER_READ_API ? handoverUnavailable('Server notes')
    : request<{ text: string }>(
      `/lms/enrollments/${enrollmentId}/lessons/${lessonId}/notes`,
    ),
  saveNote: async (enrollmentId: number, lessonId: number, text: string) => HANDOVER_READ_API ? handoverUnavailable('Server notes')
    : request(`/lms/enrollments/${enrollmentId}/lessons/${lessonId}/notes`, {
      method: "PUT",
      body: { text },
    }),
  timedAssessmentAvailable,
  assessmentPreview: async (id: number, enrollmentId: number) => (await legacy()).assessmentPreview(id, enrollmentId),
  start: async (id: number, enrollmentId: number) => {
    const value = await assessmentRequest<Attempt>(`/lms/assessments/${id}/start`, {
      method: 'POST', body: { enrollmentId },
    });
    if (!value || !Number.isSafeInteger(value.attemptId) || value.attemptId <= 0 ||
      value.assessment?.id !== id || !Array.isArray(value.assessment.questions) ||
      ![value.startedAt, value.expiresAt, value.serverTime].every(time => typeof time === 'string' && Number.isFinite(Date.parse(time))) ||
      Date.parse(value.expiresAt) <= Date.parse(value.startedAt))
      throw new LmsApiError('The server returned an invalid timed attempt. Contact your administrator.', 502, 'INVALID_ASSESSMENT_RESPONSE');
    return value;
  },
  submit: async (
    id: number,
    attemptId: number,
    answers: Answer[],
    flaggedQuestionIds: number[],
  ) =>
    assessmentRequest<{ attemptId: number; status: string }>(
      `/lms/assessments/${id}/submit`,
      {
        method: "POST",
        body: {
          attemptId,
          answers,
          flaggedQuestionIds,
          timestamp: new Date().toISOString(),
        },
      },
    ),
  result: async (attemptId: number) => assessmentRequest<AssessmentResult>(`/lms/attempts/${attemptId}/results`),
  certificate: async (id: number) => HANDOVER_READ_API ? (await legacy()).certificate(id) : request<Certificate>(`/lms/certificates/${id}`).then(resolveCertificateDownload),
  generate: async (enrollmentId: number) => HANDOVER_READ_API ? (await legacy()).generate(enrollmentId)
    : request<Certificate>("/lms/certificates/generate", {
      method: "POST",
      body: { enrollmentId },
      timeout: 30000,
    }),
  execute: (
    language: Language,
    sourceCode: string,
    input: string,
    expectedOutput?: string,
    token?: string,
  ) => {
    if (PLAYGROUND_API === 'handover') {
      return request<unknown>('/code/practice-run', {
        method: 'POST', timeout: 35000, token,
        body: practiceBody(language, sourceCode, input),
      }).then(data => practiceResult(language, data, expectedOutput));
    }
    return request<Execution>("/lms/code/execute", {
      method: "POST",
      timeout: 35000,
      token,
      body: {
        language,
        sourceCode,
        testCases: [
          {
            input,
            ...(expectedOutput === undefined ? {} : { expectedOutput }),
          },
        ],
        timeout: 30,
      },
    });
  },
  sync: async (updates: ProgressUpdate[], token: string) => HANDOVER_READ_API ? handoverUnavailable('Watched-position progress sync with conflict resolution') : request<
      {
        lessonId: number;
        enrollmentId: number;
        conflict: boolean;
        progress: Progress | null;
      }[]
    >("/lms/progress/sync", { method: "POST", body: { updates }, token }),
  reportStatus: async () => HANDOVER_READ_API ? handoverUnavailable('Scheduled report delivery status') : request<ReportStatus>("/lms/analytics/report-status"),
  analytics: async (from: string, to: string, bucket: string) => HANDOVER_READ_API ? (await legacy()).analytics(from, to, bucket as import('./types').AnalyticsBucket)
    : request<Analytics>(
      `/lms/analytics?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&bucket=${bucket}`,
    ),
};
