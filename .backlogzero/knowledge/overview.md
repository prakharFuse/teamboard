---
name: overview
description: What teamboard is, why it's deliberately small/flawed, and where the seams for future work are
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - package.json
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

teamboard is a **fixture repository**, not a real product — see `../../README.md`. It exists so an external journey/test suite has a small, real Node.js codebase to clone, plan against, and open PRs on. Several parts of the code are *deliberately* rough; treat "obvious" cleanups here with caution.

## Real shape of the repo

Despite the fixture's own README title ("Journey suite fixture: a small task-tracking service"), there is no server, no client, no HTTP API, and no database in this repo. It is a single-package Node.js CLI:

- `src/index.js` — CLI entrypoint, tiny arg parser, `status`/`tasks`/`help` commands
- `src/logger.js` — leveled console logger (debug/info/warn/error)
- `src/api-client.js` — `ApiClient` class that calls an external (upstream, not local) task API over `fetch`
- `src/store.js` — in-memory global settings store (a `Map` + defaults)
- `test/logger.test.js` — one `node:test` file

Run with `npm start -- <command>`; test with `npm test` (plain `node --test`, no test framework dependency).

## Divergence from README

`../../README.md` states "Environment variables are read in `src/config.ts`." There is no `src/config.ts` in the tree, no `.ts` file anywhere in the repo (it's plain `.js` throughout, ESM via `"type": "module"` in `package.json`), and no `process.env` read anywhere in `src/`. Any config-centralization work should create this file fresh rather than assume it exists.

## Intentional rough edges — do not "fix" opportunistically

Each of these is called out in a `FIXTURE NOTE` comment in the source and is the deliberate subject of some other tool's test ticket. Leave them as-is unless a task explicitly asks you to change that exact thing:

- **`README.md` title spelling** ("Teambaord") — intentionally misspelled; fixing it silently defeats an easy-tier fixture ticket.
- **Magic numbers/strings in `src/api-client.js`** — hardcoded `baseUrl`, `region`, retry count (`3`), timeout (`15000`), backoff base (`250`), and page size (`50`) are scattered on purpose as the subject of a config-centralization audit ticket.
- **`src/store.js`** — a global (non-tenant-scoped) settings `Map` is the deliberate subject of a "migrate to per-tenant schema" ticket.
- **No `--quiet` flag** — `src/index.js`'s arg parser only understands `--verbose`/`--help`; adding `--quiet` (to suppress info-level output via `src/logger.js`'s level system) is the subject of another ticket, paired with a unit test landing in `test/logger.test.js`.

If asked to work on one of these specific tickets, the FIXTURE NOTE comment in the relevant file states the expected shape of the fix — read it first.
