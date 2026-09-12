---
name: gotchas
description: Known sharp edges in the members API and client — read before touching validation, routing, or delete/remove behavior
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - client/src/App.tsx
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  client/src/App.tsx: 50903abfd99acdd441fab7e3084e6e6f1dc989627e78c4d76c0a4bc911639c14
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## POST /api/members accepts any `department` string (intentionally red in CI)

`router.post('/')` in `server/src/routes/members.ts` only checks that `department` is present/truthy — it never validates it against a known set of departments. `server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that is deliberately failing on `main` today: the test file's own header comment says this is left red on purpose (tracked as TM-105) so CI has a real failing check to exercise the Fix-CI/Refine-PR flow. If you're asked to add department validation, this is the test that should flip green — don't just delete or skip it.

## Route order matters: `/export` and `/stats` must stay before `/:id`

In `members.ts`, `GET /export` and `GET /stats` are declared before `GET /:id`. Express matches routes in declaration order, so if `/:id` were moved above them, requests to `/api/members/export` or `/api/members/stats` would be swallowed by the `:id` param handler (and fail as `Number('export') → NaN`, returning a spurious 404 instead of the export/stats response). Keep any new static sub-routes above `/:id`.

## DELETE is a hard delete, not a soft delete

`DELETE /api/members/:id` runs `DELETE FROM members WHERE id = ?` — despite the schema having an `is_active` flag (see [[data-model]]), nothing in the codebase ever sets `is_active = 0`. If a "deactivate but keep history" feature is requested, don't assume the flag is already wired up for it — it currently only serves as a filter on `GET /` and `/stats`.

## Client fetch calls assume success

`loadMembers`, `loadStats`, and `removeMember` in `client/src/App.tsx` call `fetch(...)` and immediately read `.json()` without checking `res.ok` or catching network errors — only `addMember` checks `res.ok` (to surface the 400/409 error message). A failed GET/DELETE will throw or silently render stale state rather than showing an error to the user.
