2026-08-21 · first-run · created .resolver

- Explored CLAUDE.md, README.md, package.json, server/, client/, .github/workflows/ci.yml.
- Wrote knowledge/architecture.md (client↔server↔SQLite flow, Vite proxy), knowledge/data-model.md (members table, dead is_active flag), knowledge/gotchas.md (TM-105 intentionally-red CI test).
- Wrote conventions/api.md (error/SQL handling patterns beyond CLAUDE.md) and conventions/testing.md (Node test runner + in-memory DB setup).
- No divergences found between CLAUDE.md/README.md and the code — both are accurate as far as they go; gaps were filled instead (TM-105, is_active dead code, PATCH field scope).
