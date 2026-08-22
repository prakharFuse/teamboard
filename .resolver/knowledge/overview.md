---
name: overview
description: What TeamBoard is and where the real gaps are beyond CLAUDE.md/README
type: knowledge
scope: global
updated: 2026-08-12 (IONE-959)
captured_sha: 18b1194567ac04eac17a111d2c9e4f49e2375ef8
sources:
  - package.json
  - pnpm-lock.yaml
---

TeamBoard's stack, layout, commands, and endpoint list are accurately documented in
`../../CLAUDE.md` and `../../README.md` — read those first; this page only covers what
they don't say.

## Department is free text, not an enum

`department` is stored as plain `TEXT` (`server/src/db.ts:24`) and `POST`/`PATCH`
`/api/members` accept whatever string the caller sends (`server/src/routes/members.ts:27-36,92-101`)
— there is no allow-list or validation. The seed data itself is inconsistent: some rows
use `"Engineering"` and others use `"Eng"` for the same team (`server/src/db.ts:37,40,44`).
`GET /api/members/stats` groups by the raw `department` string, so `"Engineering"` and
`"Eng"` currently show up as two separate departments in the stats sidebar
(`client/src/App.tsx:138-152`). See `[[gotchas]]` for the CI test that expects this to
be rejected.

## `getDb()` is a lazy module-level singleton

`server/src/db.ts:9-16` caches the `DatabaseSync` handle in a module-level `let db`. The
first call to `getDb()` — from any route handler — decides which file the process talks
to for its whole lifetime. Tests rely on this: `TEAMBOARD_DB_PATH` must be set to
`':memory:'` before the first request hits any route (`server/src/routes/members.test.ts:24`).

## `path-to-regexp` is pinned via pnpm override

`package.json`'s `pnpm.overrides` forces `path-to-regexp` to `0.1.13` regardless of what
`express` (a transitive dependency of it) requests, to remediate GHSA-37ch-88jc-xwx2 (ReDoS).
Updating `express` or removing the override without checking the transitive resolution can
silently reintroduce the vulnerable version — verify `pnpm-lock.yaml` still resolves
`path-to-regexp` to `0.1.13` after any dependency bump.
