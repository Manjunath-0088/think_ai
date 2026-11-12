const { test } = require('node:test');
const assert = require('node:assert/strict');
const { allowed, createProxy } = require('./aws-review-proxy.cjs');
test('review allowlist permits safe reads and practice, and refuses every graded or administrative mutation', () => {
  for (const route of ['/api/auth/login', '/api/code/practice-run']) assert.equal(allowed('POST', route), true);
  for (const route of ['/api/assessments/8/start', '/api/assessments/8/submit', '/api/code/submit', '/api/lesson-progress/lesson/5/complete', '/api/certificates/generate', '/api/admin/users']) {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) assert.equal(allowed(method, route), false);
  }
  for (const route of ['/api/auth/me', '/api/courses/9/content', '/api/assessments/8', '/api/certificates/enrollment/6', '/api/certificates/CERT-1/download', '/api/analytics/assessment']) assert.equal(allowed('GET', route), true);
  for (const route of ['https://attacker.invalid/api/auth/me', '//attacker.invalid', '/api/admin/users']) assert.equal(allowed('GET', route), false);
});
test('loopback proxy rejects hostile origins and Host headers without contacting upstream', async () => {
  const server = createProxy(); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = `http://127.0.0.1:${server.address().port}`;
  const request = (route, headers = {}, method = 'GET') => new Promise((resolve, reject) => {
    const req = require('node:http').request(address + route, { headers, method }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }); req.on('error', reject); req.end();
  });
  try {
    const badHost = await request('/review-health'); assert.equal(badHost.status, 403);
    const badOrigin = await request('/review-health', { Host: '127.0.0.1:5094', Origin: 'https://attacker.invalid' }); assert.equal(badOrigin.status, 403);
    const health = await request('/review-health', { Host: '127.0.0.1:5094', Origin: 'http://localhost:8094' });
    assert.equal(health.status, 200); assert.equal(JSON.parse(health.body).upstream, 'https://40.192.27.248');
    const graded = await request('/api/code/submit', { Host: '127.0.0.1:5094', Origin: 'http://localhost:8094', 'Access-Control-Request-Method': 'POST' }, 'OPTIONS'); assert.equal(graded.status, 403);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
