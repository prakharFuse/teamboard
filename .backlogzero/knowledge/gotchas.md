---
name: gotchas
description: Known sharp edges — intentional RED test, department string drift, unescaped CSV, partial PATCH
type: knowledge
scope: global
updated: '2026-09-13'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
  - server/src/db.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **CI is expected to be RED on `main` right now.** `server/src/routes/members.test.ts:70-85` ("rejects an invalid department with 400") fails deliberately because `POST /api/members` (`server/src/routes/members.ts:26-46`) performs no department validation — it inserts whatever string is sent. This is tracked as TM-105 and both the test file's header comment and `.github/workflows/ci.yml`'s top comment call it out explicitly. Don't "fix" this by weakening the test — the fix belongs in `members.ts` (validate `department` against an allowed set before inserting).
- **Seed data itself has inconsistent department names.** `server/src/db.ts:37-44` seeds `'Engineering'` (Alice Chen) but also `'Eng'` (David Kim, Hiro Tanaka) as separate strings. `GET /api/members/stats` groups by raw `department` value (`server/src/routes/members.ts:65-67`), so these show up as two distinct departments in stats/UI even though they're meant to be the same team. Any department-validation work (TM-105) should reconcile this seed inconsistency too, or the allowed-department list needs to decide which spelling is canonical.
- **CSV export has no escaping/quoting.** `router.get('/export', ...)` (`server/src/routes/members.ts:48-58`) builds CSV by joining raw field values with commas — a `name`, `email`, `role`, or `department` containing a comma or newline will corrupt the CSV. There's no `csv-stringify`-style dependency in `package.json` to reach for; escaping would need to be hand-rolled.
- **PATCH silently ignores `start_date` and `is_active`.** `router.patch('/:id', ...)` (`server/src/routes/members.ts:83-104`) only destructures and updates `name`, `email`, `role`, `department` from the body — sending `start_date` or `is_active` in a PATCH request has no effect, with no error surfaced to the caller.
- **NodeNext module resolution requires `.js` extensions in relative imports even though source is `.ts`.** E.g. `server/src/routes/members.ts:2` imports `'../db.js'` for `db.ts`. Both `server/tsconfig.json` (`module`/`moduleResolution: NodeNext`) and the ESM `"type": "module"` in `package.json` require this. New server files must follow the same `.js`-suffixed import pattern or `tsc` will fail.
