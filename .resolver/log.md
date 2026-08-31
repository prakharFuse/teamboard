2026-08-31 · first-run · created .resolver

- Indexed teamboard (Express + node:sqlite server, React/Vite client, single non-workspace package).
- README.md already covers tech stack, scripts, and the API table accurately — knowledge pages point to it rather than duplicating it.
- Captured two real code-verified gaps: missing department validation on POST/PATCH /api/members (tracked as TM-105, intentionally red in CI) and unescaped CSV export.
- Captured architecture (client→Vite proxy→Express→SQLite) and data model (single `members` table, hard-delete despite an `is_active` soft-delete column) as Mermaid diagrams.
- Captured server test conventions (node:test, in-memory DB via TEAMBOARD_DB_PATH, tests run against compiled dist/, real-HTTP ephemeral-server pattern).
