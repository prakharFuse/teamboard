---
name: department-values
description: Seed data uses inconsistent department strings and no canonical department list exists anywhere in code — read before adding department validation
type: knowledge
scope:
  - server/src/**
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/db.ts
---

There is no enum, constant, or config listing valid departments anywhere in the codebase.
`department` is a plain `TEXT NOT NULL` column (`server/src/db.ts`, `CREATE TABLE members`)
and the seed rows inserted in `getDb()` are inconsistent about naming for the same department:

- Alice Chen → `'Engineering'`
- David Kim, Hiro Tanaka → `'Eng'`
- Grace Lin → `'Human Resources'`

So `'Engineering'` and `'Eng'` both exist as seeded, currently-valid values for the same real
department. Any fix for [[ci-red-tm-105]] that introduces a fixed allow-list must either pick
one canonical spelling and migrate/reseed the `'Eng'` rows, or accept both — otherwise the
existing seed data itself will start failing `GET /api/members` expectations or fail validation
retroactively. Check `client/src/App.tsx`'s department `<input>` (free-text, not a `<select>`)
too — it has no client-side list of departments either, so a server-side allow-list needs a
matching client affordance (e.g. a `<select>`) if the goal is to actually stop invalid values,
not just annotate them after submission.
