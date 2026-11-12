// Real routes/controllers/services/repository with isolated in-memory persistence
// and a deterministic Judge0 transport. Never connects to any deployment or DB.
const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const backend = process.env.SUBMIT_REVIEW_BASELINE || path.resolve(__dirname, '../..');
let state;
function fixtures() {
  return {
    submission: null, answers: [], executions: [], judgeCalls: [], output: '11', judgeStatus: 3,
    assessment: { id: 8, status: 'ACTIVE', duration: 30, totalMarks: 10, passPercentage: 80,
      module: { courseId: 4 }, questions: [{ id: 41, assessmentId: 8, questionType: 'CODING', marks: 10 }] },
    enrollment: { id: 11, studentEmail: 'learner@test.invalid', courseAccess: true, enrollmentStatus: 'ENROLLED',
      batch: { courseId: 4, status: 'ACTIVE', course: { status: 'ACTIVE' } } },
    testCases: [{ id: 51, questionId: 41, input: '4 7', expectedOutput: '11', marks: 5, isHidden: false },
      { id: 52, questionId: 41, input: '5 6', expectedOutput: '11', marks: 5, isHidden: true }],
  };
}
const db = {
  user: { findUnique: async () => ({ id: 7, role: 'Learner', email: 'learner@test.invalid' }) },
  enrollment: { findUnique: async ({ where, include }) => {
    if (where.id !== 11) return null;
    if (!include) return state.enrollment;
    return { ...state.enrollment, batch: { ...state.enrollment.batch, course: {
      modules: [{ assessments: [{ ...state.assessment, submissions: state.submission ? [state.submission] : [] }] }],
    } } };
  } },
  assessment: { findUnique: async ({ where }) => where.id === 8 ? state.assessment : null },
  assessmentSubmission: {
    findUnique: async ({ where, include }) => state.submission?.id === where.id
      ? { ...state.submission, ...(include ? { assessment: state.assessment } : {}) } : null,
    findFirst: async () => state.submission,
    create: async ({ data }) => (state.submission = { id: 731, ...data, startedAt: new Date() }),
    update: async ({ data }) => Object.assign(state.submission, data),
  },
  question: { findUnique: async ({ where }) => state.assessment.questions.find(q => q.id === where.id) },
  codingTestCase: {
    findMany: async ({ where }) => state.testCases.filter(tc => tc.questionId === where.questionId),
    findUnique: async ({ where }) => state.testCases.find(tc => tc.id === where.id),
  },
  codingTestCaseExecution: {
    create: async ({ data }) => {
      const execution = { id: state.executions.length + 1, ...data, testCase: state.testCases.find(tc => tc.id === data.testCaseId) };
      state.executions.push(execution); return execution;
    },
    findUnique: async ({ where }) => state.executions.find(row => row.id === where.id),
    update: async ({ where, data }) => Object.assign(state.executions.find(row => row.id === where.id), data),
    findMany: async (args) => {
      assert.deepEqual(Object.keys(args).sort(), ['orderBy', 'where']); // Prisma findMany has no data argument.
      return state.executions.filter(row => row.submissionId === args.where.submissionId && row.questionId === args.where.questionId).sort((a,b) => b.id-a.id);
    },
  },
  submissionAnswer: {
    upsert: async ({ create, update, where }) => {
      const found = state.answers.find(a => a.submissionId === where.submissionId_questionId.submissionId && a.questionId === where.submissionId_questionId.questionId);
      if (found) return Object.assign(found, update);
      const answer = { id: state.answers.length + 1, ...create }; state.answers.push(answer); return answer;
    },
    updateMany: async ({ where, data }) => {
      const rows = state.answers.filter(a => a.submissionId === where.submissionId && a.questionId === where.questionId);
      rows.forEach(a => Object.assign(a, data)); return { count: rows.length };
    },
    findMany: async () => state.answers,
  },
  $transaction: async (callback) => callback(db),
};
const originalLoad = Module._load;
let repository, assessmentRouter, codeRouter;
try {
  Module._load = function(name, parent, ...args) {
    const target = name.startsWith('.') && parent ? path.resolve(path.dirname(parent.filename), name).replace(/\.js$/, '') : '';
    if (target === path.join(backend, 'config/database')) return db;
    return originalLoad.call(this, name, parent, ...args);
  };
  repository = require(path.join(backend, 'repositories/assessmentRepository'));
  assessmentRouter = require(path.join(backend, 'routes/assessmentRoutes'));
  codeRouter = require(path.join(backend, 'routes/codeExecutionRoutes'));
} finally { Module._load = originalLoad; }
const app = express();
app.use(express.json());
app.use('/api/assessments', assessmentRouter);
app.use('/api/code', codeRouter);
app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: err.message, code: err.code }));
const originalFetch = global.fetch;
const oldEnv = { ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET, JUDGE0_URL: process.env.JUDGE0_URL };
process.env.ACCESS_TOKEN_SECRET = 'isolated-submit-regression-only';
process.env.JUDGE0_URL = 'http://judge0.invalid';
beforeEach(() => {
  state = fixtures();
  global.fetch = async (url, options) => {
    assert.ok(String(url).startsWith('http://judge0.invalid/'));
    state.judgeCalls.push({ url, body: options.body && JSON.parse(options.body) });
    if (options.method === 'POST') return { ok: true, json: async () => ({ token: `test-${state.judgeCalls.length}` }) };
    return { ok: true, json: async () => ({ status: { id: state.judgeStatus, description: state.judgeStatus === 3 ? 'Accepted' : 'Compilation Error' }, stdout: state.output, stderr: null, time: '0.01', memory: 1000 }) };
  };
});
after(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(oldEnv)) if (value === undefined) delete process.env[key]; else process.env[key] = value;
});
const call = (url, body) => request(app).post(url).set('Authorization', `Bearer ${jwt.sign({ id: 7 }, process.env.ACCESS_TOKEN_SECRET)}`).send(body);
const submitBody = { submissionId: 731, questionId: 41, language: 'python', code: 'a,b=map(int,input().split())\nprint(a+b)' };
async function start() {
  const response = await call('/api/assessments/8/start', { enrollmentId: 11 });
  assert.equal(response.status, 200);
  assert.equal(response.body.data.submissionId, 731);
}
test('start → run → submit saves a real answer, evaluates all cases and persists final grade', async () => {
  await start();
  const run = await call('/api/code/run', { ...submitBody, testCaseId: 51, stdin: '4 7' });
  assert.equal(run.status, 200);
  assert.equal(run.body.data.stdout, '11');
  assert.equal(state.answers.length, 0, 'practice execution must not award a grade');
  const result = await call('/api/code/submit', submitBody);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(result.body.data.verdict, 'ACCEPTED');
  assert.equal(result.body.data.status, 'COMPLETED');
  assert.equal(state.submission.score, 10);
  assert.equal(state.submission.percentage, 100);
  assert.equal(state.answers[0].code, submitBody.code);
  assert.equal(state.answers[0].marksObtained, 10);
  assert.equal(result.body.data.results[1].stdout, undefined); // hidden output redacted by real middleware
  const duplicate = await call('/api/code/submit', submitBody);
  assert.equal(duplicate.status, 409);
  assert.equal(state.executions.length, 2);
});
test('missing or unrelated attempt rejects before Judge0 and never creates a grade', async () => {
  const result = await call('/api/code/submit', submitBody);
  assert.equal(result.status, 403);
  assert.deepEqual(state.judgeCalls, []);
  await start();
  const mismatch = await call('/api/code/submit', { ...submitBody, questionId: 99 });
  assert.equal(mismatch.status, 403);
  assert.deepEqual(state.judgeCalls, []);
});
test('wrong output and compilation error finalize with zero rather than a passing grade', async () => {
  for (const [output, status] of [['99', 3], ['', 6]]) {
    state = fixtures(); state.output = output; state.judgeStatus = status;
    await start();
    const result = await call('/api/code/submit', submitBody);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.notEqual(result.body.data.verdict, 'ACCEPTED');
    assert.equal(state.submission.score, 0);
    assert.equal((await repository.getEnrollmentAssessmentStatus(11)).allPassed, false);
  }
});
test('certificate eligibility uses configured 80% and a finalized attempt, not draft score or hard-coded 40%', async () => {
  await start();
  state.submission.percentage = 100;
  assert.equal((await repository.getEnrollmentAssessmentStatus(11)).allPassed, false);
  state.submission.status = 'COMPLETED'; state.submission.percentage = 60;
  assert.equal((await repository.getEnrollmentAssessmentStatus(11)).allPassed, false);
  state.submission.percentage = 80;
  assert.equal((await repository.getEnrollmentAssessmentStatus(11)).allPassed, true);
});
test('one graded coding question cannot complete a multi-question assessment or unlock a certificate', async () => {
  state.assessment.questions.push({ id: 42, assessmentId: 8, questionType: 'CODING', marks: 10 });
  state.assessment.totalMarks = 20;
  await start();
  const result = await call('/api/code/submit', submitBody);
  assert.equal(result.status, 200, JSON.stringify(result.body));
  assert.equal(state.submission.status, 'IN_PROGRESS');
  assert.equal((await repository.getEnrollmentAssessmentStatus(11)).allPassed, false);
});
test('missing test-case execution cannot mark an answer or assessment complete', async () => {
  await start();
  await repository.prepareCodingSubmission(submitBody);
  state.executions = [{ id: 1, submissionId: 731, questionId: 41, testCaseId: 51, judge0Status: 'Accepted', passed: true, marksObtained: 5 }];
  const result = await repository.recalculateCodingQuestionScore(731, 41);
  assert.equal(result.allCompleted, false);
  assert.equal(result.status, 'IN_PROGRESS');
  assert.equal(state.answers[0].isCorrect, null);
});
