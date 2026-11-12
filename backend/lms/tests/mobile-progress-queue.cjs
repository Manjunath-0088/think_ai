// Run actual mobile queue logic in Node with a durable file adapter for AsyncStorage.
// This verifies the client/server contract, not the Android AsyncStorage native bridge.
const fs = require('node:fs/promises');
const path = require('node:path');
const Module = require('node:module');
module.exports = function loadMobileQueue(directory) {
  const filename = path.resolve(__dirname, '../../../mobile/src/lms/storage.ts');
  const mobileRequire = Module.createRequire(path.resolve(__dirname, '../../../mobile/package.json'));
  const ts = mobileRequire('typescript');
  const adapter = {
    getItem: async key => {
      try { return await fs.readFile(path.join(directory, encodeURIComponent(key)), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    setItem: async (key, value) => {
      const target = path.join(directory, encodeURIComponent(key));
      await fs.writeFile(target + '.tmp', value);
      await fs.rename(target + '.tmp', target);
    },
    removeItem: async key => {
      try { await fs.unlink(path.join(directory, encodeURIComponent(key))); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
  };
  const module = new Module(filename);
  module.filename = filename;
  module.require = id => {
    if (id === '@react-native-async-storage/async-storage') return adapter;
    if (id === './deployment') return { HANDOVER_READ_API: false, DEPLOYMENT_API: 'http://127.0.0.1/api' };
    return mobileRequire(id);
  };
  return fs.readFile(filename, 'utf8').then(source => {
    module._compile(ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    } }).outputText, filename);
    return module.exports;
  });
};
