---
name: overview
description: What teamboard is, why it exists, and where its four source files sit
type: knowledge
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - package.json
  - src/index.js
  - README.md
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

Teamboard is a fixture repository, not a product under active development — see
`README.md` for the full explanation of its purpose (it exists so the "journey
suite" has a real repo to clone/branch/PR against). Read `README.md` first; this
page only adds what that file doesn't already cover.

## Shape of the code

The entire implementation is four files under `src/`, plus one test:

- `src/index.js` — CLI entrypoint. Parses `argv` into `{ command, verbose }` and
  dispatches to `status`, `tasks`, or `help`. Run via `npm start -- <command>`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`),
  writes `warn`/`error` to stderr and everything else to stdout.
- `src/api-client.js` — `ApiClient` class, a `fetch`-based HTTP client with
  manual retry/backoff, used only by the `tasks` command.
- `src/store.js` — in-memory global settings store (`getSetting`/`setSetting`/
  `allSettings`) with hardcoded defaults, used only by the `status` command.

There is no server, database, or client app in this repository — the
`client/`, `server/`, and SQLite-backed `Member`/`Stats` structures referenced
in some indexing tools do not exist here; treat any reference to them as stale.

## Running it

```bash
npm install
npm start -- --help
npm start -- status
npm start -- tasks
npm test
```

`npm test` runs `node --test`, which picks up `test/logger.test.js`. There is
no build step — the package is plain ESM (`"type": "module"` in
`package.json`) run directly by Node, with no TypeScript, bundler, linter, or
formatter configured anywhere in the repo.

## Related pages

- [[architecture]] — module dependency diagram.
- [[fixture-gotchas]] — code that looks unfinished or messy on purpose; do not
  clean it up incidentally.
- [[coding-style]] — conventions inferred from the existing four files.
