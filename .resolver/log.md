2026-08-11 · first-run · created .resolver

- Indexed the repo (single Express router `members.ts`, single `node:sqlite` table, Vite/React client) and wrote knowledge pages for architecture, data model, and gotchas, plus convention pages for coding and testing.
- Key non-obvious finding: `server/src/routes/members.test.ts` ships an intentionally red test tied to ticket TM-105 (department validation on `POST /api/members` doesn't exist yet) — documented in `knowledge/gotchas.md` and `conventions/testing.md` so it isn't mistaken for a broken test.
- No divergences from `CLAUDE.md`/`README.md` found — both are accurate as written; overlay pages cite them rather than restating, and add only gaps (delete semantics, route ordering, CSV escaping, PATCH field scope) not covered by those docs.
