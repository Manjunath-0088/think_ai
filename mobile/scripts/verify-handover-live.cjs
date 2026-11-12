/* Approved read-only integration check. Supply test credentials through process
 * environment, never command arguments, source control or the saved report.
 * Does not start/submit assessments, complete lessons, issue certificates,
 * modify users, send email or stop shared Judge0 infrastructure. */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
};
const { handoverClient } = require('../src/lms/handoverClient.ts');
const { practiceBody, practiceResult } = require('../src/lms/handoverPlayground.ts');
const base = process.env.LMS_VERIFY_API || 'https://40.192.27.248/api';
if (base !== 'https://40.192.27.248/api') throw new Error('This verifier is restricted to the approved HTTPS test API.');
const evidence = { at: new Date().toISOString(), api: base, checks: [], limitations: [
  'No graded writes, certificate issuance or email deliveries performed.',
  'Program runtime memory is not Judge0 container memory or queue telemetry.',
  'This is a sequential smoke test, not the Day 7 concurrency baseline.',
] };
async function connection(role) {
  const email = process.env[`LMS_${role}_EMAIL`], password = process.env[`LMS_${role}_PASSWORD`];
  if (!email || !password) throw new Error(`Approved ${role} credentials were not supplied.`);
  const response = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), signal: AbortSignal.timeout(20000) });
  const session = await response.json();
  if (!response.ok || !session.token) throw new Error(`${role} sign-in failed (${response.status}).`);
  const request = async (route, body) => {
    const r = await fetch(base + route, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(35000) });
    const payload = await r.json();
    if (!r.ok || payload.success === false) { const error = new Error(payload.message || 'API request failed'); error.status = r.status; throw error; }
    return route === '/auth/me' ? payload.user : payload.data;
  };
  return { api: handoverClient(request, base, error => error.status === 404 && error.message === 'Certificate not found'), request };
}
async function check(name, run) {
  try { const data = await run(); evidence.checks.push({ name, status: 'PASS', ...data }); console.log('PASS ' + name); }
  catch (error) { evidence.checks.push({ name, status: 'FAIL', error: error.message }); console.log('FAIL ' + name + ': ' + error.message); process.exitCode = 1; }
}
(async () => {
  const learner = await connection('LEARNER');
  let enrollments;
  await check('Learner enrollments and eligibility', async () => { enrollments = await learner.api.enrollments(); return { courses: enrollments.map(e => ({ enrollmentId: e.id, courseId: e.batch.course.id, percentage: e.summary.percentage, eligible: e.summary.eligible })) }; });
  for (const enrollment of enrollments || []) await check(`Course ${enrollment.batch.course.id} content and server progress`, async () => {
    const data = await learner.api.player(enrollment.batch.course.id);
    return { modules: data.course.modules.length, lessons: data.summary.totalLessons, completed: data.summary.completedLessons, hostedVideoCount: data.course.modules.flatMap(m => m.lessons).filter(l => l.videoUrl?.includes('youtube')).length };
  });
  await check('Owned assessment question preview', async () => {
    const data = await learner.api.assessmentPreview(8, 6);
    if (JSON.stringify(data).includes('codingTestCases') || JSON.stringify(data).includes('isCorrect')) throw new Error('Learner model contains answer keys.');
    return { assessmentId: data.id, questions: data.questions.length, writesPerformed: false };
  });
  await check('Profile and issued-certificate lookup', async () => {
    const data = await learner.api.profile(); return { completedCourses: data.stats.coursesCompleted, issuedCertificates: data.certificates.length, studyHoursAvailable: data.stats.totalHours !== null };
  });
  await check('Ineligible certificate cannot be generated', async () => {
    try { await learner.api.generate(6); } catch (e) { if (e.message.includes('requirements have not been met')) return { generationPerformed: false }; throw e; }
    throw new Error('Unexpected eligible certificate state; test assumptions need review.');
  });
  const programs = {
    python: 'a,b=map(int,input().split())\nprint(a+b)',
    javascript: "const a=require('fs').readFileSync(0,'utf8').trim().split(/\\s+/).map(Number); console.log(a[0]+a[1]);",
    java: 'import java.util.*; public class Main { public static void main(String[] args) { Scanner s=new Scanner(System.in); System.out.println(s.nextInt()+s.nextInt()); }}',
    cpp: '#include <iostream>\nint main(){int a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}',
  };
  for (const [language, code] of Object.entries(programs)) await check(`${language} real practice execution`, async () => {
    const start = Date.now(); const result = practiceResult(language, await learner.request('/code/practice-run', practiceBody(language, code, '4 7')), '11');
    if (!result.results[0]?.passed || result.results[0]?.statusId !== 3) throw new Error('Practice result did not match expected output 11.');
    return { elapsedMs: Date.now() - start, output: result.results[0].stdout, time: result.results[0].time, programMemoryKb: result.results[0].memory };
  });
  const admin = await connection('ADMIN');
  for (const bucket of ['daily', 'weekly', 'monthly', 'quarterly']) await check(`Admin ${bucket} analytics reconciliation`, async () => {
    const data = await admin.api.analytics('2026-10-01', '2026-11-05', bucket);
    return { kpis: data.kpis, courseRows: data.courses.length, trendBuckets: data.trend.length };
  });
})().catch(error => { evidence.checks.push({ name: 'Connection', status: 'FAIL', error: error.message }); process.exitCode = 1; })
  .finally(() => {
    const target = path.resolve(__dirname, '../../integration-2026-11-05/live-verification.json');
    fs.writeFileSync(target, JSON.stringify(evidence, null, 2)); console.log('Saved verification report.');
  });
