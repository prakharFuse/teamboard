---
name: gotchas
description: Non-obvious traps in TeamBoard's server routing, seed data, and DB lifecycle
type: knowledge
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - server/src/routes/members.ts
  - server/src/db.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **Department validation does not exist yet, and CI is red on `main` by
  design.** `POST /api/members` inserts whatever `department` string the
  caller sends (`server/src/routes/members.ts:26-46`). The contract test
  `server/src/routes/members.test.ts:70-85` asserts a 400 for an unknown
  department and currently fails on `main` — this is intentional, tracked
  as TM-105, and gives `pnpm test` / the CI job (`.github/workflows/ci.yml`)
  a genuine failing check. Don't "fix" the test by loosening its assertion;
  fix it by adding the validation.
- **Seed data itself already has an inconsistent department set.** Of the 8
  seeded members (`server/src/db.ts:37-44`), Alice Chen is `"Engineering"`
  while David Kim and Hiro Tanaka are `"Eng"` — two distinct strings for
  what reads as the same department. `GET /api/members/stats` groups by the
  literal string, so today's stats already show `Engineering` and `Eng` as
  separate rows. Any department allow-list added for TM-105 must decide
  which of these survives; don't just read the seed data as the source of
  truth for valid departments.
- **Fixed sub-paths must be declared before `/:id`.** `members.ts` defines
  `GET /export` and `GET /stats` before `GET /:id` (`server/src/routes/members.ts:48-70`
  vs. `:71`). If a new literal path is added under `/api/members/*` and
  placed after the `/:id` route, Express will match it as an id instead —
  keep new fixed routes above the `/:id` block.
- **`getDb()` is a one-time singleton with no reset hook**
  (`server/src/db.ts:9-48`). `TEAMBOARD_DB_PATH` must be set before the
  *first* call in the process; `members.test.ts` relies on this by setting
  `process.env.TEAMBOARD_DB_PATH = ':memory:'` at module load time, before
  any request is made (`server/src/routes/members.test.ts:24`).
- **`DELETE /:id` is a hard delete, not the soft-delete the `is_active`
  column implies** — see [[data-model]].
