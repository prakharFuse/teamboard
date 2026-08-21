2026-08-21 · first-run · created .resolver

Explored CLAUDE.md, README.md, package.json, server/src/*, client/src/*, eslint.config.mjs, tsconfig files, and .github/workflows/ci.yml. CLAUDE.md and README.md already cover project layout, commands, and the API table well, so knowledge/convention pages here focus on gaps and derived facts rather than repeating them:

- knowledge/architecture.md — Mermaid flowchart of the real client → Vite proxy → Express → SQLite path.
- knowledge/data-model.md — ERD for the single `members` table (only table in the schema).
- knowledge/gotchas.md — the intentionally-red TM-105 department-validation test, `pnpm dev` not recompiling server TS, `is_active`/soft-delete vs. hard `DELETE` mismatch, and PATCH's limited field support.
- conventions/api-routes.md — static-route-before-`/:id` ordering requirement in the members router.
- conventions/testing.md — in-memory DB isolation pattern and per-request ephemeral server used by server tests.

No divergences found between CLAUDE.md/README and the code — the gaps above are omissions, not contradictions.
