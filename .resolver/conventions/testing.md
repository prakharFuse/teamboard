---
name: testing
description: How server tests are structured — Node's built-in test runner, in-memory DB, and the intentional-red-test pattern for open tickets
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

Server tests use Node's built-in `node:test` + `node:assert/strict` — no Jest/Vitest/Mocha dependency. `pnpm test` runs `pnpm build` first, then `node --test "dist/server/**/*.test.js"` (`package.json:16`), so tests execute against the **compiled** output, not `ts-node` or similar. A test-only change that doesn't also compile cleanly under `server/tsconfig.build.json` won't be picked up correctly.

Test files spin up a real (ephemeral) HTTP server per test via `app.listen(0)` and hit it with `fetch` against `127.0.0.1:<port>` rather than mounting the Express app in-process with a mock request/response — see the `call()` helper in `members.test.ts:35-53`. Follow that pattern for new route tests rather than introducing `supertest` or a different HTTP mocking approach.

Isolate the DB with `process.env.TEAMBOARD_DB_PATH = ':memory:'` set at **module top-level**, before importing the router — see [[gotchas]] for why the timing matters (the DB singleton only reads the env var once, on first `getDb()` call).

This repo currently keeps one test intentionally failing on `main`: `members.test.ts:70-85` is written test-first against ticket TM-105 and is expected to go green only once department validation ships. If you're asked to add tests for an *unimplemented* feature tied to an open ticket, this file is the precedent for writing a red test with a comment naming the ticket and explaining why it fails today — don't "fix" that test by loosening its assertion.
