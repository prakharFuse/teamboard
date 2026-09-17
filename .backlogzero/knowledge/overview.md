---
name: overview
description: What teamboard is, its module layout, and how to run it
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - README.md
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is fixture content, not a real product — see README.md for the full
rationale (it's a small task-tracking CLI used to give an external journey
test suite a real repository to clone, plan against, and open PRs on).

## Layout

- `src/index.js` — CLI entrypoint. Parses `argv` into `{ command, verbose }`
  and dispatches `status`, `tasks`, or `help`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`).
- `src/api-client.js` — `ApiClient` class wrapping `fetch` against an upstream
  task API, with manual retry/backoff.
- `src/store.js` — in-memory, process-global settings store with defaults.
- `test/logger.test.js` — the only test file, covering `setLevel`.

There is no build step and no framework: run directly with
`node src/index.js <command>` or `npm start -- <command>`. Commands are
`status` (prints current settings via the logger), `tasks` (fetches page 1
from `ApiClient` and logs the count), and `help`.

## Divergence from README.md

README.md's Configuration section states: "Environment variables are read in
`src/config.ts`. See that file for the current list." No `src/config.ts`
exists in this working tree, and no file under `src/` reads `process.env`
anywhere — `src/store.js` holds settings in-memory with hardcoded
`DEFAULTS`, not environment variables. Treat `src/store.js`'s `DEFAULTS`
object as the actual current source of configurable values instead.

See also [[gotchas]] before touching any file with a `FIXTURE NOTE` comment.
