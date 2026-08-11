---
name: ci-red-tm-105
description: CI is intentionally red on main — POST /api/members has no department validation (TM-105); read before touching members.ts or its tests
type: knowledge
scope:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
---

`pnpm test` / the CI `build-and-test` job (`../../.github/workflows/ci.yml`) is failing on
`main` today, on purpose. `server/src/routes/members.test.ts` has a test,
`'POST /api/members rejects an invalid department with 400'`, that posts
`department: 'NotARealDepartment'` and asserts a `400`. `POST /api/members` in
`server/src/routes/members.ts` (`router.post('/', ...)`, around line 26) only checks that
`department` is a non-empty string — it never validates it against a known set — so the insert
succeeds and the handler returns `201`, failing the test.

This is tracked as TM-105 (department validation). Landing it means adding real validation to
both `router.post('/', ...)` and `router.patch('/:id', ...)` (the PATCH handler has the same
gap — it `COALESCE`s whatever `department` string is sent, with no check at all). Neither
`CLAUDE.md` nor `README.md` mentions this failing check or TM-105 — this is a gap in those docs,
not a divergence, since neither file makes a claim this contradicts.

Before writing the validation, read [[department-values]] — the existing seed data itself is
inconsistent about department names, which the fix needs to reconcile.
