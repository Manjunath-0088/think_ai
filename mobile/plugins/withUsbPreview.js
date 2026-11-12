const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod } = require("@expo/config-plugins");

// Only the usb-preview EAS profile enables this local testing configuration.
module.exports = function withUsbPreview(config) {
  if (process.env.LOCAL_USB_TEST !== "1") return config;
  config.name = "ThinkZai USB Test";
  config.android = { ...config.android, package: "com.thinkzai.mobile.usbpreview" };
  config = withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0];
    application.$["android:networkSecurityConfig"] = "@xml/usb_preview_network_security";
    return mod;
  });
  return withDangerousMod(config, ["android", async (mod) => {
    const dir = path.join(mod.modRequest.platformProjectRoot, "app/src/main/res/xml");
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, "usb_preview_network_security.xml"),
      `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="false">127.0.0.1</domain>
  </domain-config>
</network-security-config>
`);
    return mod;
  }]);
};
