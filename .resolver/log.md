2026-08-11 · first-run · created .resolver

- Indexed the repo (Express + node:sqlite server, React/Vite client) and wrote the knowledge overlay.
- `knowledge/overview.md` — run/port/proxy/seed facts not in CLAUDE.md or README.
- `knowledge/architecture.md` — mermaid flowchart of client/server/DB process boundaries.
- `knowledge/data-model.md` — mermaid erDiagram for the single `members` table.
- `knowledge/gotchas.md` — hard-delete-despite-is_active, PATCH field restrictions, unescaped CSV export, intentionally-red department-validation test (TM-105).
- `conventions/api.md` — response-shape inconsistency, inline existence checks, route-order constraint for `/export` and `/stats` vs `/:id`.
