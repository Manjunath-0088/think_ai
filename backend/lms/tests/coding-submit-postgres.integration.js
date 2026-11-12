// Dedicated review DB only. Judge0, PDF rendering and email are simulated;
// routes, authentication, Prisma queries, scoring, and certificate records are real.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

test('dedicated PostgreSQL: owned attempt → persisted grading → eligibility → one certificate', async () => {
  const url = 'postgresql://review@127.0.0.1:55479/submit_review?schema=public';
  assert.equal(process.env.SUBMIT_REVIEW_DATABASE_URL, url, 'explicit isolated database opt-in required');
  const db = new PrismaClient({ datasourceUrl: url });
  const backend = path.resolve(__dirname, '../..');
  const queued = [];
  const originalLoad = Module._load;
  let certificateService, repository, assessmentRouter, codeRouter;
  try {
    Module._load = function(name, parent, ...args) {
      const target = name.startsWith('.') && parent ? path.resolve(path.dirname(parent.filename), name).replace(/\.js$/, '') : '';
      if (target === path.join(backend, 'config/database')) return db;
      if (target === path.join(backend, 'utils/certificatePdf')) return { generateCertificatePdf: async () => '/isolated/renderer-fixture.pdf' };
      if (target === path.join(backend, 'services/notificationQueueService')) return { enqueue: job => queued.push(job) };
      return originalLoad.call(this, name, parent, ...args);
    };
    repository = require('../../repositories/assessmentRepository');
    certificateService = require('../../services/certificateService');
    assessmentRouter = require('../../routes/assessmentRoutes');
    codeRouter = require('../../routes/codeExecutionRoutes');
  } finally { Module._load = originalLoad; }
  const app = express(); app.use(express.json());
  app.use('/api/assessments', assessmentRouter); app.use('/api/code', codeRouter);
  app.use((err, _req, res, _next) => res.status(err.status || 500).json({ message: err.message }));
  process.env.ACCESS_TOKEN_SECRET = 'isolated-postgres-test-secret';
  process.env.JUDGE0_URL = 'http://judge0.invalid';
  const realFetch = global.fetch;
  let judgeCalls = 0;
  global.fetch = async (url, options) => {
    assert.ok(String(url).startsWith('http://judge0.invalid/'));
    judgeCalls++;
    return { ok: true, json: async () => options.method === 'POST'
      ? { token: `pg-fixture-${Date.now()}-${judgeCalls}` }
      : { status: { id: 3, description: 'Accepted' }, stdout: '11', time: '0.01', memory: 1000 } };
  };
  try {
    const stamp = Date.now();
    const learner = await db.user.create({ data: { email: `submit-review-${stamp}@example.invalid`, role: 'Learner' } });
    const course = await db.course.create({ data: { title: 'Isolated submit review', description: 'Test fixture', category: 'test', price: 0, duration: '1 hour' } });
    const batch = await db.batch.create({ data: { courseId: course.id, name: 'Review', instructorName: 'Fixture', capacity: 1, startDate: new Date(), endDate: new Date(Date.now()+86400000) } });
    const enrollment = await db.enrollment.create({ data: { batchId: batch.id, studentName: 'Review Learner', studentEmail: learner.email, courseAccess: true } });
    const module = await db.module.create({ data: { courseId: course.id, title: 'Review module' } });
    const lesson = await db.lesson.create({ data: { moduleId: module.id, title: 'Review lesson' } });
    const assessment = await db.assessment.create({ data: {
      moduleId: module.id, title: 'Add two numbers', type: 'CODING', duration: 30, totalMarks: 10, passPercentage: 80,
      questions: { create: { questionText: 'Add two numbers', questionType: 'CODING', marks: 10,
        starterCode: { python: 'print(11)' }, codingTestCases: { create: [
          { input: '4 7', expectedOutput: '11', marks: 5, isHidden: false },
          { input: '5 6', expectedOutput: '11', marks: 5, isHidden: true },
        ] } } },
    }, include: { questions: { include: { codingTestCases: true } } } });
    const auth = jwt.sign({ id: learner.id }, process.env.ACCESS_TOKEN_SECRET);
    const post = (url, body) => request(app).post(url).set('Authorization', `Bearer ${auth}`).send(body);
    const metadata = await request(app).get(`/api/code/assessments/${assessment.id}`).set('Authorization', `Bearer ${auth}`);
    assert.equal(metadata.status, 200, JSON.stringify(metadata.body));
    assert.equal(metadata.body.data.enrollmentId, enrollment.id);
    assert.equal(metadata.body.data.questions[0].testCases.length, 1);
    assert.ok(!JSON.stringify(metadata.body).includes('expectedOutput'));
    const started = await post(`/api/assessments/${assessment.id}/start`, { enrollmentId: enrollment.id });
    assert.equal(started.status, 200, JSON.stringify(started.body));
    const submissionId = started.body.data.submissionId;
    const again = await post(`/api/assessments/${assessment.id}/start`, { enrollmentId: enrollment.id });
    assert.equal(again.body.data.submissionId, submissionId, 'resume returns same server-created attempt');
    const body = { submissionId, questionId: assessment.questions[0].id, language: 'python', code: 'a,b=map(int,input().split())\nprint(a+b)' };
    const result = await post('/api/code/submit', body);
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.data.verdict, 'ACCEPTED');
    const persisted = await db.assessmentSubmission.findUnique({ where: { id: submissionId }, include: { answers: true, codingTestCaseExecutions: true } });
    assert.equal(persisted.status, 'COMPLETED'); assert.equal(persisted.score, 10);
    assert.equal(persisted.answers[0].code, body.code); assert.equal(persisted.answers[0].marksObtained, 10);
    assert.equal(persisted.codingTestCaseExecutions.length, 2);
    assert.equal((await post('/api/code/submit', body)).status, 409);
    await assert.rejects(certificateService.generateCertificate(enrollment.id), /Course completion/);
    assert.equal(await db.certificate.count({ where: { enrollmentId: enrollment.id } }), 0);
    await db.lessonProgress.create({ data: { enrollmentId: enrollment.id, lessonId: lesson.id, completed: true } });
    await db.assessmentSubmission.update({ where: { id: submissionId }, data: { status: 'IN_PROGRESS' } });
    await assert.rejects(certificateService.generateCertificate(enrollment.id), /required assessments/);
    await db.assessmentSubmission.update({ where: { id: submissionId }, data: { status: 'COMPLETED', percentage: 60 } });
    assert.equal((await repository.getEnrollmentAssessmentStatus(enrollment.id)).allPassed, false);
    await assert.rejects(certificateService.generateCertificate(enrollment.id), /required assessments/);
    await db.assessmentSubmission.update({ where: { id: submissionId }, data: { percentage: 100 } });
    const certificate = await certificateService.generateCertificate(enrollment.id);
    const repeated = await certificateService.generateCertificate(enrollment.id);
    assert.equal(repeated.id, certificate.id);
    assert.equal(await db.certificate.count({ where: { enrollmentId: enrollment.id } }), 1);
    assert.equal(queued.length, 1, 'one simulated email job, no actual email sent');
    console.log(JSON.stringify({ isolatedDatabase: 'submit_review:55479', submissionId, score: persisted.score, verdict: result.body.data.verdict, certificateRecords: 1, realJudge0: false, realPdfOrEmail: false }));
  } finally { global.fetch = realFetch; await db.$disconnect(); }
});
