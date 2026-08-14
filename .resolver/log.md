2026-08-14 · first-run · created .resolver

- Indexed repo: Express + SQLite server (`server/`), React/Vite client (`client/`), single `members` table.
- CLAUDE.md and README.md already cover layout/commands/endpoints accurately — overlay only adds architecture diagram, ER diagram, gotchas, and testing conventions rather than restating them.
- Notable finding: `server/src/routes/members.test.ts` has an intentionally-red test (TM-105 department validation) with matching comments in `.github/workflows/ci.yml` — captured in knowledge/gotchas.md so future work doesn't mistake it for a flake.
- Notable finding: `is_active` column implies soft-delete but `DELETE /api/members/:id` hard-deletes rows — captured in knowledge/data-model.md and knowledge/gotchas.md.
