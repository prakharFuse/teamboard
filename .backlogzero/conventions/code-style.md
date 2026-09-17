---
name: code-style
description: Module format, exports, and error/logging conventions used across src/
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- ESM only: `package.json` sets `"type": "module"`; all `src/` files use
  `import`/`export`, no `require`. No build step, no TypeScript, no bundler —
  the CLI runs the `.js` files directly (`node src/index.js`).
- Named exports, not default exports, for everything (`export function`,
  `export const`, `export class`). `src/index.js` is the one file with no
  exports (it's the entrypoint, uses top-level `main().catch(...)`).
- Logging goes through `logger` from `src/logger.js` (`logger.debug/info/warn/error`),
  never raw `console.*`, everywhere except `printHelp` in `src/index.js`, which
  writes help text straight to `process.stdout` since it isn't a log line.
- Errors surface via `process.exitCode = 1` plus a `logger.error(...)` call,
  not `process.exit()` — see `src/index.js`'s `main().catch(...)` and the
  `unknown command` branch.
- Classes are used only where there's real instance state (`ApiClient` holds
  `baseUrl`/`region`); everything else (`logger.js`, `store.js`) is plain
  functions over module-level state. Don't convert `store.js`/`logger.js` to
  classes without a task that asks for it.
