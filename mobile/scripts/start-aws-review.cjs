const { spawn } = require('node:child_process');
const path = require('node:path');
const { createProxy } = require('./aws-review-proxy.cjs');
const server = createProxy();
server.on('error', e => { console.error('Cannot start the local review proxy: ' + e.code); process.exitCode = 1; });
server.listen(5094, '127.0.0.1', () => {
  console.log('Local review proxy: loopback only; upstream uses verified HTTPS; graded writes blocked.');
  const child = spawn(process.execPath, [path.resolve(__dirname, '../node_modules/expo/bin/cli'), 'start', '--web', '--offline', '--port', '8094'], {
    cwd: path.resolve(__dirname, '..'), stdio: 'inherit', windowsHide: true,
    env: { ...process.env, LOCAL_USB_TEST: '0', EXPO_PUBLIC_API_URL: 'https://40.192.27.248/api', EXPO_PUBLIC_WEB_API_URL: 'http://127.0.0.1:5094/api',
      EXPO_PUBLIC_APP_URL: 'http://localhost:8094', LMS_AWS_REVIEW: '1', EXPO_PUBLIC_READ_API: 'handover', EXPO_PUBLIC_PLAYGROUND_API: 'handover', CI: '1', EXPO_NO_TELEMETRY: '1', BROWSER: 'none' },
  });
  child.on('exit', code => { server.close(); process.exitCode = code || 0; });
  child.on('error', () => { server.close(); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(); server.close(); });
});
