---
name: testing
description: How server tests are structured — Node's built-in test runner, in-memory SQLite, real HTTP calls per test
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` builds first, then runs `node --test` over `dist/server/**/*.test.js` (`package.json:16`) — there's no separate test-only tsconfig or watch mode; tests always run against the compiled output.

- **No test framework dependency.** `members.test.ts` uses only `node:test` + `node:assert/strict`. Don't introduce Jest/Vitest/Mocha for server tests — follow the existing built-in-runner pattern.
- **Each test spins up a real HTTP server on an ephemeral port** via the `call()` helper (`members.test.ts:35-53`): `app.listen(0)`, read the assigned port off `server.address()`, `fetch()` against it, then `server.close()` in a `finally`. This is deliberate — it exercises the actual Express/Router stack rather than calling handlers directly, and there's no `supertest` dependency to reach for instead.
- **Isolate the DB by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module top-level**, before constructing the `express.Express` app — see the [[gotchas]] note on `getDb()`'s singleton memoization for why ordering matters here.
- **A red test can be intentional.** `rejects an invalid department with 400` fails on `main` by design, tracking ticket TM-105 (department validation not yet implemented in `members.ts`). When adding new tests, check whether an existing red test already covers the behavior you're about to add before writing a duplicate — and don't "fix" a red test by weakening its assertion instead of implementing the feature.
- New route tests should follow the same file-per-router naming (`<router-file>.test.ts` colocated next to the route module), matching `members.ts` / `members.test.ts`.
