import api from "./axios";

/**
 * Judge0 runs are asynchronous: POST /code/execute only returns a token
 * (202 Accepted). The real result arrives later via the Judge0 -> LMS
 * callback and is read back with GET /code/submissions/:submissionId.
 */

const TERMINAL_STATUS_IDS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
const IN_PROGRESS_STATUS_IDS = new Set([1, 2]); // In Queue, Processing

/**
 * Submit code for execution. Returns the raw 202 payload:
 * { submissionId, judge0Token, status, ... }
 */
export const executeCode = ({ language, code, stdin = "", submissionId }) =>
  api
    .post("/code/execute", { language, code, stdin, submissionId })
    .then((res) => res.data.data);

/**
 * Fetch the current state of a submission (used for polling).
 */
export const getSubmissionResult = (submissionId) =>
  api.get(`/code/submissions/${submissionId}`).then((res) => res.data.data);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * High-level helper: submit code, then poll until Judge0 reaches a
 * terminal status (or we time out). Resolves with a normalized shape
 * that UI components can render directly.
 *
 * @param {{language: string, code: string, stdin?: string, submissionId: number, signal?: AbortSignal, onStatusChange?: (status: object) => void, pollIntervalMs?: number, timeoutMs?: number}} params
 */
export const runCode = async ({
  language,
  code,
  stdin = "",
  submissionId,
  signal,
  onStatusChange,
  pollIntervalMs = 1200,
  timeoutMs = 20000,
}) => {
  const submitted = await executeCode({ language, code, stdin, submissionId });
  onStatusChange?.(submitted.status);

  const startedAt = Date.now();

  // Submission may already be complete if Judge0 called back fast.
  let latest = submitted;

  while (IN_PROGRESS_STATUS_IDS.has(latest.status?.id) || !latest.status) {
    if (signal?.aborted) {
      throw new Error("Execution cancelled.");
    }

    if (Date.now() - startedAt > timeoutMs) {
      throw new Error("Execution timed out waiting for a result.");
    }

    await sleep(pollIntervalMs);

    latest = await getSubmissionResult(submissionId);
    onStatusChange?.(latest.status);
  }

  const statusId = latest.status?.id;
  const isAccepted = statusId === 3;

  return {
    submissionId,
    judge0Token: latest.judge0Token,
    status: latest.status,
    stdout: latest.stdout ?? "",
    stderr: latest.stderr ?? "",
    compileOutput: latest.compileOutput ?? "",
    time: latest.time ?? null,
    memory: latest.memory ?? null,
    exitCode: isAccepted ? 0 : 1,
    isTerminal: TERMINAL_STATUS_IDS.has(statusId),
  };
};
