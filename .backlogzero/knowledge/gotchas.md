---
name: gotchas
description: Known traps — intentional failing CI test, no department validation, DB singleton timing
type: knowledge
scope: global
updated: 2026-09-13 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **`pnpm test` is intentionally RED on a fresh checkout.**
  `server/src/routes/members.test.ts:70` asserts `POST /api/members` returns
  `400` for an invalid `department`, but `members.ts` performs no department
  validation at all — it inserts whatever string is sent
  (`server/src/routes/members.ts:34-36`). The test file and `.github/workflows/ci.yml`
  both document this as deliberate, tied to ticket **TM-105** (add department
  validation). Don't "fix" this by loosening the test — the ticket is to add
  real validation in `members.ts`.
- **No department enum/allowlist exists anywhere** — not in the DB schema, not
  in the API, not in the client form (`client/src/App.tsx:101` is a free-text
  input). Whatever TM-105 lands should decide where the allowed set of
  departments is defined (the seed data alone uses at least 6 distinct
  strings — see [[data-model]]).
- **`getDb()` is a lazy singleton** (`server/src/db.ts:9-16`): the DB path is
  only read from `process.env.TEAMBOARD_DB_PATH` on the *first* call. If you
  add a new entrypoint or test file, set the env var before any route handler
  runs, or it will silently open the real `data/team.db` file instead of an
  in-memory DB.
- **CI order matters**: `pnpm test` runs `pnpm build` first (compiles to
  `dist/`) and then runs the compiled `.test.js` files with `node --test`
  (`package.json` `test` script) — there's no way to run server tests
  directly against `.ts` sources without a build step first.
