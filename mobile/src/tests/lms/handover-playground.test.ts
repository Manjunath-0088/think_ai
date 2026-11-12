import { lmsApi } from '@/lms/api';
import { practiceBody, practiceResult } from '@/lms/handoverPlayground';
import type { Language } from '@/lms/types';
let mockPlaygroundApi = 'handover';
jest.mock('@/lms/deployment', () => Object.defineProperty(
  { ...jest.requireActual('@/lms/deployment') }, 'PLAYGROUND_API',
  { get: () => mockPlaygroundApi },
));
jest.mock('@/api/session', () => ({ getSession: () => ({token:'approved-test-token'}), restoreSession: jest.fn(), signIn: jest.fn() }));
const accepted = { status: { id: 3, description: 'Accepted' }, stdout: 'Hello\n', stderr: null, compileOutput: null, time: '0.02', memory: 4096 };
beforeEach(() => {
  mockPlaygroundApi = 'handover';
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true, data: accepted }) });
});
test.each<Language>(['python','javascript','java','cpp'])('%s uses the handover practice endpoint, bearer token and stdin without fake assessment IDs', async language => {
  const result = await lmsApi.execute(language, 'user source', 'one\ntwo', 'Hello', 'captured-user-token');
  const [url, options] = (fetch as jest.Mock).mock.calls[0];
  expect(url).toMatch(/\/api\/code\/practice-run$/);
  expect(options.headers.Authorization).toBe('Bearer captured-user-token');
  expect(JSON.parse(options.body)).toEqual({language, code:'user source', stdin:'one\ntwo'});
  expect(result.results[0]).toMatchObject({statusId:3,stdout:'Hello\n',passed:true});
});
test('the existing LMS endpoint remains available when the handover option is absent', async () => {
  mockPlaygroundApi = 'lms';
  await lmsApi.execute('python', 'print(1)', '');
  expect((fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/lms\/code\/execute$/);
});
test('optional expected output never reports a match by default', () => {
  expect(practiceResult('python', accepted).results[0]?.passed).toBeNull();
  expect(practiceResult('python', accepted, 'different').results[0]?.passed).toBe(false);
});
test('Unicode and multiline output are preserved', () => {
  expect(practiceResult('python', {...accepted, stdout:'नमस्ते\nمرحبا\n🙂\n'}).results[0]?.stdout).toBe('नमस्ते\nمرحبا\n🙂\n');
});
test('compile errors are shown without claiming accepted output', () => {
  expect(practiceResult('cpp', {...accepted,status:{id:6,description:'Compilation Error'},stdout:null,compileOutput:'syntax error'}, '').results[0]).toMatchObject({statusId:6,compileOutput:'syntax error',passed:false});
});
test('missing execution metrics remain unknown', () => {
  expect(practiceResult('java', {...accepted,time:null,memory:null}).results[0]).toMatchObject({time:null,memory:null});
});
test.each([null, {}, {...accepted,status:{id:99,description:'unknown'}}, {...accepted,stdout:{html:'bad'}}, {...accepted,memory:-1}])('malformed results are rejected', data => {
  expect(() => practiceResult('python', data)).toThrow();
});
test.each([1,2])('queued/running status %i is not presented as completed', id => {
  try { practiceResult('python', {...accepted,status:{id,description:'Processing'}}); throw new Error('Expected a pending error'); }
  catch(error) { expect(error).toMatchObject({code:'EXECUTION_PENDING'}); }
});
test('a backend local-timeout marker is an execution timeout', () => {
  expect(() => practiceResult('python', {...accepted,localTimeout:true})).toThrow('timed out');
});
test('control sequences are removed and large output is capped', () => {
  expect(practiceResult('javascript', {...accepted,stdout:'\u001b[31mHi\u0000'}).results[0]?.stdout).toBe('Hi');
  expect(practiceResult('python', {...accepted,stdout:'x'.repeat(100001)}).results[0]?.stdout).toContain('[Output truncated]');
});
test('blank source is rejected before network execution', () => {
  expect(() => practiceBody('python','  ','')).toThrow('Enter source code');
});
test('authorization and unavailable-service errors are preserved', async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({ok:false,status:401,json:async()=>({success:false,message:'Sign in required'})});
  await expect(lmsApi.execute('python','print(1)','')).rejects.toMatchObject({status:401,message:'Sign in required'});
  (fetch as jest.Mock).mockResolvedValueOnce({ok:false,status:503,json:async()=>({success:false,message:'Code service unavailable'})});
  await expect(lmsApi.execute('java','source','')).rejects.toMatchObject({status:503,message:'Code service unavailable'});
});
test('the practice request has a 35-second network deadline', async () => {
  (fetch as jest.Mock).mockImplementation((_url, options) => new Promise((_resolve,reject) => options.signal.addEventListener('abort',()=>reject(new Error('aborted')))));
  const result=lmsApi.execute('python','while True: pass','').catch(error=>error);
  await Promise.resolve();
  jest.advanceTimersByTime(35000);
  expect(await result).toMatchObject({code:'REQUEST_TIMEOUT'});
});
