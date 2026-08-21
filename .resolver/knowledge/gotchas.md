---
name: gotchas
description: Known-red CI test, missing department validation, and other sharp edges not documented elsewhere
type: knowledge
scope: global
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - server/src/db.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/db.ts: 242c5f190499d9e88e7f019c245b6a61ad9903357bb5e9a92ebc091ddad894ce
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## `pnpm test` is intentionally RED on `main`

`server/src/routes/members.test.ts` has a test, "POST /api/members rejects an invalid
department with 400", that fails today: `POST /api/members` in `server/src/routes/members.ts`
inserts whatever `department` string is sent, with no validation. Neither `CLAUDE.md` nor
`README.md` mention this — it's tracked as TM-105 in the test file's own comments. Any PR
touching `members.ts` should expect this failing check to show up in CI
(`.github/workflows/ci.yml` runs `pnpm test` on every PR) unless it also fixes the validation.

## Seed data already has inconsistent department names

`server/src/db.ts` seeds `'Engineering'` (Alice Chen) but also `'Eng'` (David Kim, Hiro Tanaka)
as department values for what looks like the same department. There is no canonical list of
valid departments anywhere in the code — if implementing department validation (TM-105), the
allowed set has to be decided fresh; it can't be inferred from existing data without first
reconciling `'Eng'` vs `'Engineering'`.

## Static routes must stay above `/:id`

In `server/src/routes/members.ts`, `GET /export` and `GET /stats` are registered *before*
`GET /:id`. Express matches routes in registration order, so moving `/:id` above them would
make `/api/members/export` and `/api/members/stats` get swallowed by the `:id` handler
(`Number('export')` → `NaN` → "Member not found"). Keep any new static sub-routes above `/:id`.

## 409 conflict detection is a string match, not an error code

The unique-email conflict handler in `POST /api/members` checks
`err.message.includes('UNIQUE')` rather than a structured SQLite error code. It works with the
current `node:sqlite` error messages, but is fragile to Node/sqlite version changes — don't
copy this pattern for new constraints without checking the actual error shape first.

## PATCH silently ignores `start_date` and `is_active`

`PATCH /api/members/:id` only accepts `name`, `email`, `role`, `department` in its destructure;
sending `start_date` or `is_active` in the body is a no-op with no error. `CLAUDE.md` describes
PATCH as "update member fields" without qualifying which fields — this is the actual list.
