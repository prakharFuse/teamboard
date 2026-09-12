---
name: gotchas
description: Known-red CI test, seed-data inconsistency, and other sharp edges to check before touching members code
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/db.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## `pnpm test` is intentionally RED on `main` right now

`server/src/routes/members.test.ts:70-85` asserts `POST /api/members` returns 400 for an invalid `department`. `members.ts` performs no department validation (`server/src/routes/members.ts:26-46` inserts whatever string is sent), so this test fails today by design (tracked as TM-105 in the test's own comment). This is deliberate, not a broken build — don't "fix" it by loosening the assertion; fix it by adding department validation to the `POST` (and likely `PATCH`) handlers. `.github/workflows/ci.yml` runs this same `pnpm test` on every PR, so this is the check a PR needs to turn green.

## Seed data already contains an inconsistent department name

`server/src/db.ts:37-44` seeds two different spellings for the same department: `'Engineering'` (Alice Chen) vs `'Eng'` (David Kim, Hiro Tanaka). Any allow-list added for TM-105 needs to either treat these as one canonical value or decide `'Eng'` is invalid — either way, seeding will need a fix alongside the validation, or the seeded rows themselves will fail newly-added validation on read/update paths.

## CSV export doesn't escape delimiters

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV via plain string interpolation with no quoting/escaping. A `name` or `department` containing a comma or newline would corrupt the exported file (not currently exploitable for injection since there's no formula-prefix escaping either, but any field with a `,` breaks column alignment for the HR consumer).

## `PATCH /api/members/:id` silently ignores `start_date` and `is_active`

Only `name`, `email`, `role`, `department` are read from the body (`server/src/routes/members.ts:92-101`); sending `start_date` or `is_active` in a PATCH request is a no-op with no error returned.

## Route order in `members.ts` is load-bearing

`/export` and `/stats` (literal paths) are registered before the `/:id` param route (`server/src/routes/members.ts:48,60,71`). Adding a new literal sub-route must go before `/:id` too, or Express will match it as `id`.
