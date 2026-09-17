---
name: overview
description: What teamboard is (a journey-suite fixture repo, not a product) and how the pieces fit together
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - package.json
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

Teamboard is a deliberately small fixture repository (see README.md) used by a
journey-test suite to give agents a real repo to plan against, clone, branch,
and open PRs on. It is not a real product — several files carry `FIXTURE NOTE`
comments explaining a planted issue the fixture expects an agent to solve. See
[[gotchas]] before changing any of `src/api-client.js`, `src/logger.js`, or
`src/store.js` — those planted issues are load-bearing for the test suite.

## Layout

- `src/index.js` — CLI entrypoint (`node src/index.js`). Parses `argv` into
  `{ command, verbose }` and dispatches to `status`, `tasks`, or `help`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`),
  writes `warn`/`error` to stderr and everything else to stdout.
- `src/api-client.js` — `ApiClient` class, a `fetch`-based HTTP client with
  manual retry/backoff for a (non-existent) upstream task API.
- `src/store.js` — in-memory global settings store (`Map` + defaults),
  `getSetting`/`setSetting`/`allSettings`.
- `test/logger.test.js` — the only test file, uses Node's built-in
  `node:test` + `node:assert` (no Jest/Mocha/Vitest).

## Running it

```bash
npm install     # no external dependencies today — see conventions/tooling.md
npm start -- --help
npm test        # runs `node --test`
```

`package.json` declares `"type": "module"` — all source is ESM (`import`/
`export`, `.js` extensions required in relative imports).

## Divergence from README.md

README.md says "Environment variables are read in `src/config.ts`. See that
file for the current list." No `src/config.ts` exists anywhere in the working
tree, and no source file reads `process.env`. The current config values
(`baseUrl`, `region`, timeouts, retry counts, defaults in `store.js`) are all
hardcoded in place, not centralized or environment-driven. Treat the README's
`config.ts` reference as aspirational/stale, not as current behavior.
