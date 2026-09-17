---
name: overview
description: What teamboard is (a journey-suite fixture repo, not a product) and how the pieces fit together
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: a22cf770a237002cf84ea8aa9b3727e5cba8abc9
sources:
  - README.md
  - src/index.js
  - src/auth.js
  - src/server.js
  - src/members-router.js
  - src/members-store.js
  - package.json
sources_sha256:
  README.md: 68996f1e3ec9ba024f257a0745ac4eeb06d44e63caf506f4228aef394026a134
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/auth.js: c8938490036a55911f2be42edd1a6a6b39e44b78ae71c031b6b155a00253df7a
  src/index.js: b7aefa54197edbf1f8b2cde8b14dee528b392e0dcc3beb6d8361ba8ca00931c6
  src/members-router.js: 40d168abbaffba79a920cc457b7277e1c6b21f78c6f556226c72b393e862210f
  src/members-store.js: 4bd22c3c27ae6bfce5f10f53f1f31b94e8c3978714013d1ee1f34829cd60796d
  src/server.js: 2cca4b7749fe550814e752a0fa766f8b4665ec5ffd3dadda7569131a8b59557c
diverges_from:
  - source: README.md:44 ("Environment variables are read in `src/config.ts`")
    claim: Environment variables are read in src/config.ts.
    reality: src/config.ts does not exist; TEAMBOARD_API_TOKEN is read directly in src/auth.js and src/index.js, with no centralizing config module.
    authority: code
    detected: '2026-09-17'
    run: 0fb9296f-19a2-4987-92f1-431e8d731541
---

Teamboard is a deliberately small fixture repository (see README.md) used by a
journey-test suite to give agents a real repo to plan against, clone, branch,
and open PRs on. It is not a real product — several files carry `FIXTURE NOTE`
comments explaining a planted issue the fixture expects an agent to solve. See
[[gotchas]] before changing any of `src/api-client.js`, `src/logger.js`, or
`src/store.js` — those planted issues are load-bearing for the test suite.

## Layout

- `src/index.js` — CLI entrypoint (`node src/index.js`). Parses `argv` into
  `{ command, verbose }` and dispatches to `status`, `tasks`, `serve`, or `help`.
- `src/logger.js` — levelled console logger (`debug`/`info`/`warn`/`error`),
  writes `warn`/`error` to stderr and everything else to stdout.
- `src/api-client.js` — `ApiClient` class, a `fetch`-based HTTP client with
  manual retry/backoff for a (non-existent) upstream task API.
- `src/store.js` — in-memory global settings store (`Map` + defaults),
  `getSetting`/`setSetting`/`allSettings`.
- `src/server.js` — `node:http` listener started by the `serve` CLI command;
  delegates all routing to `members-router.js`.
- `src/members-router.js` — route matching, method/auth checks, and JSON
  responses for `GET /api/members/count`.
- `src/members-store.js` — in-memory array of seeded members backing the
  members API (separate store from `src/store.js`).
- `src/auth.js` — bearer-token check against `TEAMBOARD_API_TOKEN`, using
  `timingSafeEqual` to avoid timing leaks.
- `test/logger.test.js`, `test/auth.test.js`, `test/members-store.test.js`,
  `test/server.test.js` — all use Node's built-in `node:test` + `node:assert`
  (no Jest/Mocha/Vitest).

## Running it

```bash
npm install     # no external dependencies today — see conventions/tooling.md
npm start -- --help
npm start -- serve   # starts the members API on 127.0.0.1:3000
npm test        # runs `node --test`
```

`package.json` declares `"type": "module"` — all source is ESM (`import`/
`export`, `.js` extensions required in relative imports).

The `serve` command needs `TEAMBOARD_API_TOKEN` set in the environment;
without it every request to `GET /api/members/count` gets `401`. Startup only
logs a warning (not an error) if the variable is unset, then still starts the
server.

## Divergence from README.md

README.md says "Environment variables are read in `src/config.ts`. See that
file for the current list." No `src/config.ts` exists anywhere in the working
tree. As of the members API, this is no longer purely aspirational about *env
vars existing at all*: `src/auth.js` and `src/index.js` do read
`process.env.TEAMBOARD_API_TOKEN` directly — there just isn't a centralizing
`config.ts` module. The other config values (`baseUrl`, `region`, timeouts,
retry counts, defaults in `store.js`) remain hardcoded in place. Treat the
README's `config.ts` reference as stale about *where* config lives, not about
whether env vars are read at all.
