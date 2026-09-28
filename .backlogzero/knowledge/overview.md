---
name: overview
description: What this repo is, its real scope, and why the code looks half-finished on purpose
type: knowledge
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - package.json
  - README.md
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
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

Teamboard is not a product — see ../../README.md for the full "fixture, not
product" framing. It's a deliberately small task-tracking CLI that exists so
BacklogZero's journey test suite has a real repo to clone, plan against, and
open PRs on.

## Actual surface (verified against code, not the README)

The entire runtime is 4 files, ~120 lines total:

- `src/index.js` — CLI entrypoint. `parseArgs` supports only `--verbose`,
  `--help`/`-h`, and a positional command (`status`, `tasks`, else `help`
  fallthrough on unknown command → exit code 1). There is **no `--quiet` flag
  yet** despite `src/logger.js`'s comment implying one is expected — that flag
  is unimplemented, not just undocumented.
- `src/logger.js` — 4-level console logger (`debug`/`info`/`warn`/`error`),
  default level `'info'`, warn/error go to stderr.
- `src/store.js` — in-memory `Map`-backed settings store, module-level
  singleton (`const settings = new Map()`), seeded by a `DEFAULTS` object. No
  persistence, no tenant/namespace dimension — resets every process run.
- `src/api-client.js` — `ApiClient` wraps `fetch` against a hardcoded
  `https://api.teamboard.example.com/v1` base URL, with 3 retries, a 15000ms
  per-attempt timeout, and `250 * 2 ** attempt` backoff, all inlined as
  literals rather than named constants or config.

## Divergences from README.md

Diverges from README.md: the README says "Environment variables are read in
`src/config.ts`" and directs readers there for the current list. There is no
`src/config.ts` (no `.ts` file exists anywhere in the repo) and no code reads
`process.env` at all — grepping the whole tree for `process.env` returns
nothing. Treat the actual config surface as: `src/store.js`'s `DEFAULTS`
object and the hardcoded literals in `src/api-client.js`'s constructor —
there is no env-based config layer today.

## Intentional incompleteness — read before "fixing" anything

Several source files carry `FIXTURE NOTE:` comments marking gaps that are
**load-bearing for other tickets in the parent journey suite**, not bugs:
see [[fixture-notes]] before touching magic numbers, the missing `--quiet`
flag, or the global settings store.
