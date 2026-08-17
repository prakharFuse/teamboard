2026-08-17 · first-run · created .resolver

- Explored: CLAUDE.md, README.md, package.json, server/src (index.ts, db.ts, routes/members.ts, members.test.ts), client/src/App.tsx, client/vite.config.ts, tsconfig*.json, eslint.config.mjs, .github/workflows/ci.yml.
- CLAUDE.md and README.md are accurate for stack, layout, endpoints, and rules — cited by pointer rather than duplicated.
- Wrote knowledge/architecture.md (client→proxy→server→sqlite flow, mermaid), knowledge/data-model.md (members table erDiagram), knowledge/gotchas.md (intentional red TM-105 department-validation test, hard-delete vs is_active, unescaped CSV export, dev watch only covers dist not src), conventions/testing.md (node:test + in-memory db + ephemeral per-test server pattern).
- No divergence from CLAUDE.md/README found — docs are correct where they make claims; gaps were filled instead.
