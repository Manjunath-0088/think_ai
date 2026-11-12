// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  settings: {
    'import/resolver': {
      typescript: { project: require('node:path').join(__dirname, 'tsconfig.json') },
    },
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'coverage/'],
  rules: {
    // The Expo 58 rule set enables React Compiler diagnostics in addition to
    // normal correctness checks. This app uses React Native Animated refs and
    // async data-loading effects intentionally, so these compiler-only rules
    // are not actionable for its runtime architecture.
    'react-hooks/refs': 'off',
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/preserve-manual-memoization': 'off',
  },
  overrides: [
    {
      // Build and test tooling runs on Node, not in the React Native runtime.
      files: ['*.js', '*.cjs', 'babel.config.js', 'metro.config.js', 'jest.setup.js'],
      env: { node: true, jest: true },
    },
    {
      files: ['src/tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
      env: { jest: true },
    },
  ],
};
