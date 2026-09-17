---
name: code-style
description: Module system, tooling, and formatting conventions for src/
type: convention
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

- Pure ESM: `package.json` sets `"type": "module"`, and every file under
  `src/` uses `import`/`export` — no `require()`, no `.cjs`.
- Plain JavaScript, no TypeScript: an earlier version of this fixture pack
  had a `server/tsconfig.json` (removed in commit `972029c`, "no longer in
  the pack"); the current tree has no `.ts` files and no TS build step.
  Don't reintroduce TypeScript tooling unless a ticket specifically asks.
- No linter or formatter config exists in the repo (no `.eslintrc*`, no
  `.prettierrc*`). Match the existing style by hand: single quotes, 2-space
  indentation, semicolons, trailing commas in multiline literals/args.
- No build step: `src/index.js` is executed directly by Node
  (`node src/index.js`, or `npm start -- <args>`); there's no bundler,
  transpiler, or `dist/` output.
- Each `src/` file opens with a `/** ... */` block comment describing its
  role; several also carry a `FIXTURE NOTE` explaining an intentional rough
  edge — see [[gotchas]] before "cleaning up" any of those.
