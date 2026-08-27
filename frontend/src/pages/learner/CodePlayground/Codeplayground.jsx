import React, { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../components/ThemeContext';
import { submitCode, resetExecution } from '../../../features/codeExecution/codeExecutionSlice';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monacoId: 'javascript' },
  { id: 'python', label: 'Python', monacoId: 'python' },
  { id: 'java', label: 'Java', monacoId: 'java' },
  { id: 'cpp', label: 'C++', monacoId: 'cpp' },
];

const DEFAULT_SNIPPETS = {
  javascript: `function greet(name) {\n  return \`Hello, \${name}!\`;\n}\n\nconsole.log(greet("world"));\n`,
  python: `def greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("world"))\n`,
  java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}\n`,
  cpp: `#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}\n`,
};

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-0.5" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const STATUS_LABEL = {
  idle: 'idle',
  submitting: 'sending…',
  polling: 'running…',
  success: 'success',
  error: 'error',
};

/**
 * `submissionId` identifies the assessment/practice submission row this
 * run belongs to. In a standalone practice playground (no assessment
 * context) the backend should accept a scratch/practice submission id;
 * swap this prop wiring for whatever your route provides.
 */
export default function CodePlayground({ submissionId }) {
  const { isDarkMode } = useTheme();
  const dispatch = useDispatch();
  const execution = useSelector((state) => state.codeExecution) ?? {
    status: 'idle',
    compileOutput: '',
    stdout: '',
    stderr: '',
    errorMessage: null,
    time: null,
    memory: null,
  };

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_SNIPPETS.javascript);
  const [localError, setLocalError] = useState(null); // client-side guard, never reaches Redux/server
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort?.(), []);

  const status = execution.status; // idle | submitting | polling | success | error
  const isRunning = status === 'submitting' || status === 'polling';

  const handleRun = useCallback(() => {
    if (!submissionId) {
      setLocalError('No submission context — this playground needs a valid submissionId to run code.');
      return;
    }
    setLocalError(null);
    const thunkPromise = dispatch(submitCode({ language, code, submissionId }));
    abortRef.current = thunkPromise;
  }, [dispatch, language, code, submissionId]);

  const handleLanguageChange = (e) => {
    const next = e.target.value;
    setLanguage(next);
    setCode(DEFAULT_SNIPPETS[next] ?? '');
    setLocalError(null);
    dispatch(resetExecution());
  };

  const output = [execution.compileOutput, execution.stdout, execution.stderr]
    .filter(Boolean)
    .join('\n');

  const outputText = localError
    ? localError
    : status === 'idle'
      ? 'Run your code to see output here.'
      : output || (status === 'success' ? '(no output)' : execution.errorMessage || 'Execution failed.');

  const badgeLabel = localError
    ? 'error'
    : execution.errorMessage && status === 'error'
      ? 'error'
      : STATUS_LABEL[status] || status;

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4">
      {/* toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-to)]/80">
            Code Playground
          </p>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Practice &amp; Experiment</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            aria-label="Select language"
            disabled={isRunning}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-glass)] px-3 py-2 text-sm
                       text-[var(--text-primary)] outline-none focus:border-[var(--border-hover)]
                       disabled:opacity-60"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning || !submissionId}
            className="flex items-center gap-2 rounded-lg bg-green-600
               px-4 py-2 text-sm font-semibold text-green-100 transition-all
               hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? <SpinnerIcon /> : <PlayIcon />}
            {status === 'submitting' ? 'Submitting…' : status === 'polling' ? 'Running…' : 'Run'}
          </button>
        </div>
      </div>

      {/* editor + output */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="min-h-[320px] lg:min-h-0 overflow-hidden rounded-xl border border-[var(--border)]">
          <Editor
            height="100%"
            language={LANGUAGES.find((l) => l.id === language)?.monacoId}
            value={code}
            onChange={(value) => setCode(value ?? '')}
            theme={isDarkMode ? 'vs-dark' : 'light'}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        <div className="min-h-[240px] lg:min-h-0 flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Output
            </span>
            <span
              className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${status === 'success'
                  ? 'bg-[var(--success)]/15 text-[var(--success)]'
                  : status === 'error'
                    ? 'bg-[var(--danger)]/15 text-[var(--danger)]'
                    : isRunning
                      ? 'bg-[var(--accent-to)]/15 text-[var(--accent-to)]'
                      : 'bg-[var(--surface-hover)] text-[var(--text-muted)]'
                }`}
            >
              {badgeLabel}
            </span>
          </div>
          <pre className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-[var(--text-secondary)]">
            {outputText}
          </pre>
          {(execution.time || execution.memory) && (
            <div className="flex gap-4 border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
              {execution.time && <span>Time: {execution.time}s</span>}
              {execution.memory && <span>Memory: {execution.memory} KB</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}