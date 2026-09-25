---
name: code-style
description: Module system, exports, and error/logging idioms used across src/
type: convention
scope: global
updated: 2026-09-24 (IONE-959)
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Native ESM throughout (`"type": "module"` in `package.json`) — use
  `import`/`export`, not `require`. No TypeScript, no build/transpile step;
  files run as plain `.js` under Node directly.
- Prefer named exports of plain functions (`logger.js`, `store.js`) or a single
  exported class (`api-client.js`'s `ApiClient`) over default exports — no
  file in `src/` uses `export default`.
- All user-facing/diagnostic output goes through `src/logger.js`'s `logger`
  object (`logger.debug/info/warn/error`), never raw `console.log`. `warn`
  and `error` write to `stderr`; `debug`/`info` write to `stdout`. Level
  filtering is controlled process-wide by `setLevel`.
- Async entrypoints follow the `main().catch(...)` pattern seen at the bottom
  of `src/index.js`: catch at the top level, log via `logger.error`, and set
  `process.exitCode` rather than calling `process.exit()` directly.
- Comments prefixed `FIXTURE NOTE` mark intentional rough edges for the test
  suite, not TODOs — see [[gotchas]] before changing anything they're attached
  to.
