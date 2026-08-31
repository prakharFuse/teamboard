---
name: gotchas
description: Known functional gaps in the members API — read before touching POST /api/members or the CSV export
type: knowledge
scope: global
updated: 2026-08-31 (IONE-959)
captured_sha: 515477ad05c7788f020fac514c42e6ce60492008
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
---

## Department validation is missing (TM-105)

`POST /api/members` (`server/src/routes/members.ts:26-46`) checks only that `department` is non-empty — it accepts any string, so `department: 'NotARealDepartment'` returns `201`. This is a known, tracked gap: `server/src/routes/members.test.ts:70-85` has a test asserting `400` for an invalid department, and it currently fails on `main` by design (the test file's own header comment and `.github/workflows/ci.yml`'s comment both call this out as intentional-RED-until-TM-105). `PATCH /api/members/:id` has the same lack of validation on `department`.

If a task asks for department validation, the enforcement point is the `POST`/`PATCH` handlers in `members.ts`, and there's no existing allow-list of valid departments anywhere in the code to reuse — one needs to be introduced (the seed data in `server/src/db.ts` uses `Engineering`, `Product`, `Design`, `Eng`, `Marketing`, `Sales`, `Human Resources`, note `Engineering` vs `Eng` inconsistency in the seed data itself).

## CSV export doesn't escape fields

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with a plain template-literal join and no quoting/escaping. A `name` or `email` containing a comma, quote, or newline will corrupt the CSV structure (and a leading `=`/`+`/`-`/`@` in a field is a classic CSV/formula-injection vector when opened in Excel). Since the field-level input validation on `POST` is otherwise minimal, this is reachable with attacker-controlled data.
