---
name: overview
description: What TeamBoard is, the stack, and where things live — start here
type: knowledge
scope: global
updated: '2026-08-26'
captured_sha: 221c3c38dc1464695c6402832dc7657e83d6d2a0
sources:
  - package.json
  - server/src/db.ts
  - server/src/routes/members.test.ts
sources_sha256:
  package.json: 18a1323a5738fdea35d5d336cb3b3cdf79a1b76ae97ca8886052d844d2e63551
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
---

TeamBoard is an internal team-directory app: Express + TypeScript + SQLite
(`node:sqlite`) server, React + Vite client. Tech stack, the API surface, and
project layout are accurately documented in [../../README.md](../../README.md)
— read that first; this page only adds what it omits.

## Not in the README

- **DB access is a lazy singleton.** `getDb()` in `server/src/db.ts:11` opens
  the SQLite file (or `:memory:`) on first call and caches it in a module-level
  `db` variable. Any code path that needs an isolated DB (tests) must set
  `TEAMBOARD_DB_PATH` **before** the first `getDb()` call in the process —
  there is no way to reset or reopen it afterwards.
- **Seed data is 8 members**, inserted once when the `members` table is empty
  (`server/src/db.ts:37-44`). Their `department` values are used verbatim
  elsewhere — see [[gotchas]] for the "Engineering" vs "Eng" inconsistency
  this creates.
- **`server/src/routes/members.test.ts` is intentionally red on `main`**: it
  asserts `POST /api/members` rejects an unknown department with 400, but no
  such validation exists in `members.ts` yet (tracked as TM-105). See
  [[gotchas]] and [[testing]].
