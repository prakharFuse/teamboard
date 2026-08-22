2026-08-14 · first-run · created .resolver

- Indexed TeamBoard (Express + SQLite server, React/Vite client) via CLAUDE.md, README.md, package.json, and the source under `server/src/` and `client/src/`.
- Wrote knowledge pages: overview, architecture (client↔server↔DB flow), data-model (single `members` table), gotchas (intentionally-red department-validation test / TM-105, hard-delete vs. `is_active`, unescaped CSV export, PATCH error-handling gap).
- Wrote convention pages: backend (sync handlers, route ordering, no central error middleware), testing (node:test + in-memory SQLite pattern, DB singleton timing).
- No divergences required correcting CLAUDE.md's documented rules directly — the JSON-error-contract gap was recorded as a code-level divergence in `knowledge/gotchas.md`.
