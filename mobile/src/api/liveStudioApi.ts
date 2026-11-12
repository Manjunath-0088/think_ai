import { apiData } from './http';

export type StudioMessage = { id: number; userId: string; userName: string; text: string; timestamp: string; deleted: boolean };
export type StudioPoll = { id: number; question: string; status: string; totalVotes: number; options: { id: number; text: string; votes: number; percent: number }[] };
export type StudioAttendee = {
  userId: string;
  name: string;
  online: boolean;
  muted: boolean;
  cameraOn: boolean;
  raisedHand: boolean;
  joinedAt?: string | null;
  lastSeenAt?: string | null;
  durationSeconds?: number | null;
};
export type StudioSession = {
  id: string;
  title: string;
  hostId: string;
  status: string;
  scheduledAt: string | null;
  startedAt: string | null;
  attendees: StudioAttendee[];
  polls: StudioPoll[];
  messages: StudioMessage[];
};
export type BreakoutRoom = { id: number; name: string; status: string; members: { userId: string; userName: string }[] };
export type JitsiCredentials = {
  room: string;
  token: string;
  domain: string;
  appId: string;
  expiresInSeconds: number;
};
export type CreateLiveSessionInput = {
  id?: string;
  title: string;
  scheduledAt?: string;
  status?: string;
};

const sessionPath = (id: string) => `/studio/sessions/${encodeURIComponent(id)}`;

export const listLiveSessions = () => apiData<StudioSession[]>('/studio/sessions');
export const createLiveSession = (input: CreateLiveSessionInput) =>
  apiData<StudioSession>('/studio/sessions', { method: 'POST', body: input });
export const getLiveSession = (id: string) => apiData<StudioSession>(sessionPath(id));
export const joinLiveSession = (id: string) => apiData<StudioSession>(`${sessionPath(id)}/join`, { method: 'POST' });
export const updateLiveSessionStatus = (id: string, status: string, scheduledAt?: string) =>
  apiData<StudioSession>(`${sessionPath(id)}/status`, { method: 'PATCH', body: { status, scheduledAt } });
export const getJitsiCredentials = (id: string) =>
  apiData<JitsiCredentials>(`${sessionPath(id)}/jitsi-token`, { method: 'POST' });

export const getLiveMessages = (id: string) => apiData<StudioMessage[]>(`${sessionPath(id)}/messages`);
export const sendLiveMessage = (id: string, text: string) => apiData<StudioMessage>(`${sessionPath(id)}/messages`, { method: 'POST', body: { text } });
export const getBreakoutRooms = (id: string) => apiData<BreakoutRoom[]>(`${sessionPath(id)}/breakouts`);
export const createBreakoutRoom = (id: string, name: string) => apiData<BreakoutRoom>(`${sessionPath(id)}/breakouts`, { method: 'POST', body: { name } });
export const joinBreakoutRoom = (id: number) => apiData<BreakoutRoom>(`/studio/breakouts/${id}/join`, { method: 'POST' });
export const leaveBreakoutRoom = (id: number) => apiData<BreakoutRoom>(`/studio/breakouts/${id}/leave`, { method: 'POST' });
export const voteLivePoll = (pollId: number, optionId: number) => apiData<StudioPoll>(`/studio/polls/${pollId}/vote`, { method: 'POST', body: { optionId } });
export const createLivePoll = (sessionId: string, question: string, options: string[]) => apiData<StudioPoll>(`${sessionPath(sessionId)}/polls`, { method: 'POST', body: { question, options } });
