import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import api from '../api/axios';
import { startCodingAttempt } from '../api/codingAttempt';
import reducer from '../features/codeExecution/codeExecutionSlice';
import CodeExecutionPage from '../pages/learner/CodePlayground/CodeExecutionPage';

vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('../components/ThemeContext', () => ({ useTheme: () => ({ isDarkMode: true }) }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@monaco-editor/react', () => ({ default: ({ value, onChange, options }) =>
  <textarea aria-label="Code" value={value} readOnly={options.readOnly} onChange={e => onChange(e.target.value)} /> }));

const assessment = { id: 8, moduleId: 3, enrollmentId: 11, title: 'Add two numbers', questions: [
  { id: 41, questionText: 'Add two numbers', starterCode: { python: 'print(11)' },
    testCases: [{ id: 51, input: '4 7', isHidden: false }] },
] };
const enrollment = (id, courseId) => ({ id, courseAccess: true, enrollmentStatus: 'ENROLLED', batch: { courseId } });
const payload = data => ({ data: { data } });
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  localStorage.setItem('activeSubmissionId', '999');
  localStorage.setItem('activeEnrollmentId', '888');
  api.get.mockImplementation(async url => {
    if (url === '/code/assessments/8') return payload(assessment);
    if (url === '/modules/3') return payload({ id: 3, courseId: 4 });
    if (url === '/enrollments') return payload([enrollment(11, 4), enrollment(12, 5)]);
    throw new Error(`Unexpected GET ${url}`);
  });
  api.post.mockImplementation(async (url, body) => {
    if (url === '/assessments/8/start') return payload({ submissionId: 731, assessmentId: 8, enrollmentId: body.enrollmentId, status: 'IN_PROGRESS' });
    if (url === '/code/run') return payload({ status: { id: 3 }, stdout: '11' });
    if (url === '/code/submit') return payload({ status: 'COMPLETED', verdict: 'ACCEPTED', score: 10, totalMarks: 10 });
    throw new Error(`Unexpected POST ${url}`);
  });
});

describe('real server-created coding attempt', () => {
  it('ignores stale global submission/enrollment IDs and resolves the matching course', async () => {
    expect(await startCodingAttempt(assessment)).toBe(731);
    expect(api.post).toHaveBeenCalledWith('/assessments/8/start', { enrollmentId: 11 });
  });
  it('refuses a different course enrollment without creating an attempt', async () => {
    await expect(startCodingAttempt(assessment, 12)).rejects.toThrow('active enrolled course');
    expect(api.post).not.toHaveBeenCalled();
  });
  it('fails clearly on missing or closed attempt responses', async () => {
    api.post.mockResolvedValueOnce(payload({}));
    await expect(startCodingAttempt(assessment)).rejects.toThrow('valid assessment attempt');
    api.post.mockResolvedValueOnce(payload({ submissionId: 731, assessmentId: 8, enrollmentId: 11, status: 'COMPLETED' }));
    await expect(startCodingAttempt(assessment)).rejects.toThrow('already closed');
  });
  it('refuses metadata without a server-verified enrollment', async () => {
    await expect(startCodingAttempt({ ...assessment, enrollmentId: null })).rejects.toThrow('active enrolled course');
    expect(api.post).not.toHaveBeenCalled();
  });
});

function page() {
  return render(<Provider store={configureStore({ reducer: { codeExecution: reducer } })}>
    <MemoryRouter initialEntries={['/learner/code-execution/8']}><Routes>
      <Route path="/learner/code-execution/:assessmentId" element={<CodeExecutionPage />} />
    </Routes></MemoryRouter>
  </Provider>);
}
it('uses the returned ID for Run/Submit, sends public stdin, and prevents duplicate submit', async () => {
  page();
  const run = await screen.findByRole('button', { name: 'Run Code' });
  fireEvent.click(run);
  const submit = await screen.findByRole('button', { name: 'Submit & Evaluate' });
  expect(api.post).toHaveBeenCalledWith('/code/run', expect.objectContaining({ submissionId: 731, stdin: '4 7' }));
  fireEvent.click(submit);
  await screen.findByRole('status');
  expect(api.post).toHaveBeenCalledWith('/code/submit', expect.objectContaining({ submissionId: 731, questionId: 41 }));
  expect(screen.queryByRole('button', { name: 'Submit & Evaluate' })).not.toBeInTheDocument();
  expect(run).toBeDisabled();
});
it('code edits require a new successful run and execution errors never unlock submit', async () => {
  page();
  fireEvent.click(await screen.findByRole('button', { name: 'Run Code' }));
  await screen.findByRole('button', { name: 'Submit & Evaluate' });
  fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), { target: { value: 'bad code' } });
  expect(screen.queryByRole('button', { name: 'Submit & Evaluate' })).not.toBeInTheDocument();
  api.post.mockResolvedValueOnce(payload({ status: { id: 6, description: 'Compilation Error' } }));
  fireEvent.click(screen.getByRole('button', { name: 'Run Code' }));
  await waitFor(() => expect(api.post).toHaveBeenCalledTimes(3));
  expect(screen.queryByRole('button', { name: 'Submit & Evaluate' })).not.toBeInTheDocument();
});
it('renders a start error instead of a workspace that submits a guessed ID', async () => {
  api.post.mockRejectedValueOnce(new Error('Attempt service unavailable'));
  page();
  expect(await screen.findByRole('alert')).toHaveTextContent('Attempt service unavailable');
  expect(screen.queryByRole('button', { name: 'Run Code' })).not.toBeInTheDocument();
});
