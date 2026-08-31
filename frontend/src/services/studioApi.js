import { forumGet, forumPost } from "./forumHttpClient";

/** Live Class Studio REST API — Phase 6/7 sessions, polls. */

export function fetchStudioSession(sessionId) {
  return forumGet(`/studio/sessions/${sessionId}`).then((payload) => payload.data);
}

export function joinStudioSession(sessionId) {
  return forumPost(`/studio/sessions/${sessionId}/join`).then(
    (payload) => payload.data
  );
}

export function createStudioPoll(sessionId, { question, options }) {
  return forumPost(`/studio/sessions/${sessionId}/polls`, {
    question,
    options,
  }).then((payload) => payload.data);
}

export function voteStudioPoll(pollId, optionId) {
  return forumPost(`/studio/polls/${pollId}/vote`, { optionId }).then(
    (payload) => payload.data
  );
}
