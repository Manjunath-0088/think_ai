const fs = require('fs');
const path = require('path');
const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

// The approved review API now has working TLS. Do not retain the old HTTP exception.
module.exports = config => {
  if (process.env.LMS_AWS_REVIEW !== '1') return config;
  const api = new URL(process.env.EXPO_PUBLIC_API_URL);
  if (api.protocol !== 'https:' || api.hostname !== '40.192.27.248' || api.pathname !== '/api' || api.username || api.password || api.search || api.hash || api.port)
    throw new Error('AWS review configuration must match the approved HTTPS handover test address.');
  config = withAndroidManifest(config, mod => {
    mod.modResults.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/lms_aws_review';
    mod.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'false';
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const dir = path.join(mod.modRequest.platformProjectRoot, 'app/src/main/res/xml');
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'lms_aws_review.xml'), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
</network-security-config>`);
    return mod;
  }]);
};
