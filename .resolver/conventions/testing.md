---
name: testing-conventions
description: How server tests are structured — Node's built-in test runner, in-memory SQLite, ephemeral per-call server
type: convention
scope:
  - server/src/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` (see [CLAUDE.md](../../CLAUDE.md)) builds then runs compiled `.test.js` files with Node's built-in `node --test` — there is no Jest/Vitest/Mocha dependency for the server.

Conventions to follow, from `server/src/routes/members.test.ts`:

- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load, before importing/using the router. `getDb()` caches its connection on first call ([[architecture]]), so the env var must be set before any request reaches a handler — setting it inside a `test()` body is too late if an earlier test already triggered `getDb()`.
- Build the Express app once at module scope (`makeApp()`), but start/stop a fresh `listen(0)` server *per request* inside the `call()` helper, using the OS-assigned port from `server.address()`. This avoids port collisions between test files and keeps each HTTP round-trip isolated, at the cost of a listen/close per call — keep using this pattern rather than sharing one long-lived listener across tests.
- Use `node:assert/strict`, not a matcher library.
- When a test is intentionally red pending a fix (like the TM-105 department-validation test), say so in a comment referencing the ticket — don't silently skip or delete it. See [[gotchas]].
