---
name: gotchas
description: Known-broken or intentionally-red behavior — read before touching members API validation or export
type: knowledge
scope: global
updated: 2026-08-14 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.test.ts
  - server/src/routes/members.ts
  - .github/workflows/ci.yml
  - server/src/db.ts
---

## Department validation is a known-open gap (TM-105), with a RED test already in the suite

`server/src/routes/members.test.ts:70-85` asserts `POST /api/members` returns `400` for an invalid `department`. This test is currently failing on `main` by design — `POST /api/members` (`server/src/routes/members.ts:26-46`) accepts any non-empty `department` string with no allow-list check, so the handler returns `201`. CI (`.github/workflows/ci.yml`) runs `pnpm test` on every PR, so this failure is visible as a real check run, not a flake.

The seed data already shows the effect: `server/src/db.ts:37` inserts department `'Engineering'` while `server/src/db.ts:40` and `:44` insert `'Eng'` — two different strings for what looks like the same team, because nothing constrains the value.

**If asked to fix or extend department handling:** the fix belongs in `POST /api/members` (and likely `PATCH /api/members/:id`, which also writes `department` unchecked at `server/src/routes/members.ts:92-101`). Making the RED test pass means adding a department allow-list/enum check — do not "fix" this by weakening or deleting the test.

## CSV export does not escape field values

`GET /api/members/export` (`server/src/routes/members.ts:48-58`) builds CSV rows with plain template-string interpolation and no quoting/escaping:

```ts
`${r.id},${r.name},${r.email},${r.role},${r.department},${r.start_date},${r.is_active}`
```

A `name` or `role` containing a comma or double quote will silently shift columns in the downloaded file. There is no test covering this. Since the export is described (in CLAUDE.md and README) as an HR integration feed, a comma in a name (e.g. "Smith, Jr.") will corrupt the row.
