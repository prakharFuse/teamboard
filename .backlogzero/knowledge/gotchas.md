---
name: gotchas
description: The intentionally-red CI test, TM-105 department validation gap, and why not to "fix" it by editing the test
type: knowledge
scope: global
updated: 2026-09-12 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
  - server/src/routes/members.ts
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

`server/src/routes/members.test.ts` has a test, `POST /api/members rejects an invalid department with 400`, that is **intentionally failing on `main`** right now. `POST /api/members` in `server/src/routes/members.ts` performs no validation on `department` — it inserts whatever string the caller sends and returns 201 — so the test's expectation of a 400 currently fails. Both the test file's header comment and `.github/workflows/ci.yml`'s comment confirm this is deliberate: it's tracked as ticket TM-105 and exists to give CI a real, readable red check.

**How to apply:** if asked to fix CI, add department validation, or address a failing test in this repo, the correct fix is adding real validation to `POST /api/members` (and likely `PATCH /api/members/:id`, which also accepts `department` unchecked) — not loosening or deleting the test assertion. Any allow-list of valid departments must account for the existing data-quality split between `"Eng"` and `"Engineering"` in the seed data (see [[data-model]]); a naive validator that rejects `"Eng"` would break the seeded David Kim / Hiro Tanaka rows on the next `PATCH`.
