---
name: overview
description: What this repository actually is — a small fixture app, not a product — and why its content looks deliberately unfinished
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - package.json
  - src/index.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is a fixture repository for an automated "journey suite" test harness (see README.md).
It is not a real product — it's a deliberately small task-tracking CLI kept around so that
agent-planning journeys have real files to clone, branch, and open pull requests against.

## What actually exists

- `src/index.js` — CLI entrypoint. Commands: `status`, `tasks`, `help`. Flags: `--verbose`, `-h`/`--help`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`), writes `warn`/`error` to stderr, everything else to stdout.
- `src/api-client.js` — `ApiClient` class, a `fetch`-based HTTP client with manual retry/backoff for a `/tasks` endpoint.
- `src/store.js` — in-memory global settings store (`Map` + hardcoded `DEFAULTS`).
- `test/logger.test.js` — the only test file, covers `setLevel` only.
- Run with `npm start -- <command>`, test with `npm test` (Node's built-in `node --test` runner).

There is no client, no server, no database, and no `src/config.ts` in the working tree — see
"Divergences" below.

## Fixture-note convention

Several source files contain a `FIXTURE NOTE:` comment block explaining that some piece of
"bad" code (a misspelling, a magic number, a global-only store) is intentional bait for a
specific test-suite tier (`tiers.easy` / `tiers.medium` / `tiers.complex`). These notes are
load-bearing: they mark code that must NOT be silently "fixed" as part of an unrelated change,
because doing so would make the corresponding fixture ticket unanswerable. Always read the
`FIXTURE NOTE:` in a file before editing it — see [[fixture-notes]].

## Divergences

- Diverges from the pre-built repository index available to planning tools: that index describes
  `client/src/App.tsx` (React), `server/src/routes/members.ts` (Express), and `server/src/db.ts`
  (`node:sqlite`) — none of these files, directories, or dependencies exist in the working tree.
  The actual repo is the flat `src/*.js` CLI described above. Treat the working tree, not that
  index, as ground truth.
- Diverges from README.md's "Configuration" section, which says "Environment variables are read
  in `src/config.ts`" → no `src/config.ts` exists; `src/store.js` holds the only settings, and
  they are hardcoded defaults, not environment variables. `src/api-client.js` also hardcodes a
  base URL and region rather than reading them from the environment.
