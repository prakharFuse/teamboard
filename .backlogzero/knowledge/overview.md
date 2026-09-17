---
name: overview
description: What teamboard is, why it's deliberately small, and where the fixture gotchas live
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
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

teamboard is not a product — see `README.md` for the full statement of intent
("Fixture content, not a product"). It's a deliberately small Node/ESM CLI
used as a planning target for an external journey-test suite: the code
contains intentional rough edges (magic numbers, a global settings store, a
misspelled README heading) that specific fixture tickets ask an agent to fix.
Do not "clean up" these rough edges unless the task you're given is the one
that targets them — doing so removes the subject of that ticket.

## Runtime shape

Single CLI process, no server, no database:

- `src/index.js` — entrypoint, hand-rolled arg parser (`parseArgs`), dispatches
  to `status` or `tasks` commands.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`),
  module-level mutable `currentLevel`.
- `src/store.js` — in-memory settings `Map` with hardcoded `DEFAULTS`, global
  (no tenant/session dimension).
- `src/api-client.js` — `fetch`-based HTTP client (`ApiClient`) with retry +
  backoff, hardcoded base URL/region/timeouts/page size.

Run it with `npm start -- <command>` (`status`, `tasks`, or `--help`/`-h`).
Tests run with `npm test` (Node's built-in `node --test` runner, no separate
framework).

## Known gap: README references a file that doesn't exist

`README.md` says: "Environment variables are read in `src/config.ts`. See
that file for the current list." **`src/config.ts` does not exist anywhere in
this repo** — there is no config module; settings live in `src/store.js`
(in-memory `Map`), and nothing reads environment variables. Diverges from
README.md: it points to a config file for env vars → no such file exists, and
no env vars are read anywhere in `src/`.

If a task asks you to add configuration/env-var support, `src/store.js` is
the closest existing analogue, not a `config.ts` that needs to be located.

## Fixture gotchas (do not silently "fix" these)

Each of these is called out with a `FIXTURE NOTE` comment in the source and
is the deliberate subject of a specific fixture ticket. See
[[fixture-gotchas]] for the full list and which file backs which ticket.
