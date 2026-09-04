---
name: gotchas
description: Known-red CI test and other non-obvious behavior that looks broken but is either intentional or unvalidated — check before touching members.ts or CI
type: knowledge
scope: global
updated: '2026-09-04'
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

- **CI is intentionally red on `main` right now.** `server/src/routes/members.test.ts:70-85` asserts `POST /api/members` returns `400` for an invalid `department`, but `server/src/routes/members.ts:26-46` performs no department validation at all — it inserts whatever string is sent. Both the test file header and `.github/workflows/ci.yml:1-7` say this is deliberate, tracked as **TM-105**, so that a PR against this repo has a real failing check for the Fix-CI / Refine-PR flow to pick up. Don't "fix" this by loosening the test — the fix is adding department validation to the route (e.g. a `CHECK`/enum of allowed departments) so the test goes green.
- `POST /api/members` also does no format validation beyond presence checks (`server/src/routes/members.ts:28`) — an `email` value only has to be a non-empty string; the only email-format-adjacent guard is the DB-level `UNIQUE` constraint (409 on collision), not shape validation.
- `PATCH /api/members/:id` accepts a new `email` with no uniqueness handling — unlike `POST`, it doesn't catch the `UNIQUE` constraint violation, so patching to a duplicate email will throw an unhandled DB error instead of returning a clean `409`.
- See [[data-model]] for the related `is_active`/hard-delete divergence.
