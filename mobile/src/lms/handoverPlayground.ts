import type { Execution, Language } from './types';

// Candidate contract: handover /code/practice-run + supplied backend source.
// AWS acceptance still requires approved test accounts and deployed examples.
export class HandoverExecutionError extends Error {
  constructor(message: string, public code: string) { super(message); }
}
export function practiceBody(language: Language, code: string, stdin: string) {
  if (!['python', 'javascript', 'java', 'cpp'].includes(language))
    throw new HandoverExecutionError('Choose Python, JavaScript, Java or C++.', 'INVALID_LANGUAGE');
  if (!code.trim()) throw new HandoverExecutionError('Enter source code before running.', 'EMPTY_SOURCE');
  return { language, code, stdin };
}
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value !== 'string') throw new HandoverExecutionError('The code service returned invalid output.', 'INVALID_EXECUTION_RESPONSE');
  const safe = value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  return safe.length > 100000 ? safe.slice(0, 100000) + '\n[Output truncated]' : safe;
}
export function practiceResult(language: Language, data: unknown, expected?: string): Execution {
  const invalid = () => new HandoverExecutionError('The code service response does not match the handover contract.', 'INVALID_EXECUTION_RESPONSE');
  if (!record(data) || !record(data.status) || !Number.isInteger(data.status.id) ||
      typeof data.status.description !== 'string' || !data.status.description.trim()) throw invalid();
  const id = data.status.id as number;
  if (data.localTimeout === true)
    throw new HandoverExecutionError('Code execution timed out. Try a shorter program or contact your administrator.', 'EXECUTION_TIMEOUT');
  if (id === 1 || id === 2)
    throw new HandoverExecutionError('The code service has not finished this run. Try again later.', 'EXECUTION_PENDING');
  if (id < 3 || id > 14) throw invalid();
  if (data.time != null && (typeof data.time !== 'string' || !Number.isFinite(Number(data.time)) || Number(data.time) < 0)) throw invalid();
  if (data.memory != null && (typeof data.memory !== 'number' || !Number.isFinite(data.memory) || data.memory < 0)) throw invalid();
  const stdout = text(data.stdout);
  const completeOutput = typeof data.stdout === 'string' ? data.stdout : '';
  const normalize = (value: string) => value.replace(/\r\n/g, '\n').trimEnd();
  return { language, results: [{
    status: text(data.status.description), statusId: id, stdout,
    stderr: text(data.stderr), compileOutput: text(data.compileOutput),
    // Optional practice comparison only; this never awards assessment marks.
    passed: expected === undefined ? null : id === 3 && normalize(completeOutput) === normalize(expected),
    time: data.time == null ? null : data.time as string,
    memory: data.memory == null ? null : data.memory as number,
  }] };
}
