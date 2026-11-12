const http = require('node:http');
const UPSTREAM = 'https://40.192.27.248';
const ORIGIN = 'http://localhost:8094';
function allowed(method, path) {
  if (method === 'POST') return path === '/api/auth/login' || path === '/api/code/practice-run';
  return method === 'GET' && /^\/api\/(?:auth\/me|enrollments|courses\/\d+\/content|assessments(?:\/\d+)?|lesson-progress\/enrollment\/\d+(?:\/summary)?|certificates\/(?:enrollment\/\d+|eligibility\/\d+|[^/]+\/download|verify\/[^/]+)|analytics\/(?:enrollments|course-enrollments|course-completion|assessment))$/.test(path);
}
function createProxy() {
  return http.createServer(async (req, res) => {
    if (!['127.0.0.1:5094', 'localhost:5094'].includes(req.headers.host) || (req.headers.origin && req.headers.origin !== ORIGIN)) {
      res.writeHead(403); res.end(); return;
    }
    const incoming = new URL(req.url, 'http://127.0.0.1:5094');
    res.setHeader('Access-Control-Allow-Origin', ORIGIN);
    res.setHeader('Vary', 'Origin'); res.setHeader('Cache-Control', 'no-store');
    if (incoming.pathname === '/review-health' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ service: 'lms-aws-review-proxy-v1', upstream: UPSTREAM, gradedWrites: false })); return;
    }
    if (req.method === 'OPTIONS') {
      if (!allowed(req.headers['access-control-request-method'], incoming.pathname)) { res.writeHead(403); res.end(); return; }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type'); res.writeHead(204); res.end(); return;
    }
    if (!allowed(req.method, incoming.pathname)) { res.writeHead(403); res.end(JSON.stringify({ success: false, message: 'This local review proxy permits reads and practice runs only.' })); return; }
    try {
      const chunks = []; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 256 * 1024) throw new Error('Request too large'); chunks.push(chunk); }
      const headers = { Accept: req.headers.accept || 'application/json', 'Content-Type': 'application/json' };
      if (req.headers.authorization) headers.Authorization = req.headers.authorization;
      const upstream = await fetch(UPSTREAM + incoming.pathname + incoming.search, { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined, redirect: 'error', signal: AbortSignal.timeout(35000) });
      res.statusCode = upstream.status;
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      const bytes = Buffer.from(await upstream.arrayBuffer());
      if (bytes.length > 10 * 1024 * 1024) throw new Error('Response too large');
      res.end(bytes);
    } catch {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'The HTTPS API could not be reached from this local preview. Try again.' }));
    }
  });
}
module.exports = { createProxy, allowed };
