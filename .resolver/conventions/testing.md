---
name: testing
description: Node test runner conventions — in-memory DB setup, compiled-dist execution
type: convention
scope:
  - server/**
updated: '2026-08-11'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
---

`pnpm test` is `pnpm build && node --test "dist/server/**/*.test.js"` (`package.json:16`) — tests run against the **compiled** output, not `ts-node`/`tsx` directly. If you add a `*.test.ts` file under `server/src/`, it only gets picked up once `pnpm build` emits it to `dist/server/`; check `server/tsconfig.build.json` includes the path if a new test isn't showing up.

Isolate test DB state by setting `process.env.TEAMBOARD_DB_PATH = ':memory:'` **before the first handler call**, at module load time (see `members.test.ts:24`) — `getDb()` is a lazy singleton (`server/src/db.ts:11`) that reads the env var only on its first invocation, so setting it in a `before()` hook is too late if any import path already triggered a request.

Tests spin up a real Express server on an ephemeral port (`app.listen(0)`) per request rather than using an in-process request mocker — see the `call()` helper in `members.test.ts:35-53`. Follow that pattern for new route tests rather than introducing a mocking library.

One test in this suite is intentionally red — see [[overview]] for the TM-105 department-validation gap. Don't treat an existing red test as license to skip writing new ones for other behavior.
