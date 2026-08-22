---
name: testing
description: How TeamBoard's server tests are structured — Node's built-in test runner, in-memory SQLite, no client tests yet
type: convention
scope:
  - server/src/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - package.json
  - .github/workflows/ci.yml
---

CLAUDE.md's `pnpm test` command (`pnpm build` then `node --test`) is the whole story for how tests run — see it for the command. This page covers how tests are written.

- Tests use Node's built-in `node:test` + `node:assert/strict` — no Jest, Mocha, or Vitest dependency exists in `package.json`. Follow the existing pattern in `server/src/routes/members.test.ts`: build an in-process `express()` app, mount the router under test, `listen(0)` for an ephemeral port, `fetch()` against it, then `server.close()` in a `finally`.
- Set `process.env.TEAMBOARD_DB_PATH = ':memory:'` as a top-level statement immediately after imports, before constructing the app — `getDb()` is a lazy singleton (see [[gotchas]]) that opens on first request, so this must happen before any request is issued, not merely before the test file's first `test(...)` block runs.
- There is currently no client-side test setup — no `vitest`/`@testing-library/react` devDependency and no client `*.test.tsx` files exist. Adding client tests means introducing a new test runner + config from scratch, not extending an existing pattern.
- `.github/workflows/ci.yml` runs `pnpm typecheck`, `pnpm lint`, then `pnpm test` on every PR and push to `main`. One test in `members.test.ts` is intentionally red on `main` right now (department validation, TM-105) — see [[gotchas]] before assuming a failing `pnpm test` locally means you broke something new.
