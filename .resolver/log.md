2026-08-11 · first-run · created .resolver

- Indexed the repo (single-package Express + React + `node:sqlite` app). CLAUDE.md and README.md already document layout, commands, and endpoints accurately — cited rather than duplicated.
- Added knowledge pages: overview, architecture (Mermaid flowchart of client→proxy→server→SQLite), data-model (Mermaid ER diagram of the single `members` table), and gotchas.
- Key finding captured in gotchas.md: `server/src/routes/members.test.ts` has an intentionally red test for missing department validation (TM-105), CI (`.github/workflows/ci.yml`) runs it on every PR, seed data in `db.ts` already has inconsistent department spellings (`Engineering` vs `Eng`), `DELETE /api/members/:id` is a hard delete despite the `is_active` column, and CSV export is unescaped.
- Added one convention page (testing) covering the no-framework/in-memory-SQLite/real-HTTP-listener test pattern.
- No divergences found between CLAUDE.md/README.md and the code — only gaps, which are covered in the new pages.
