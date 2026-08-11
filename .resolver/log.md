2026-08-11 · first-run · created .resolver

- Indexed TeamBoard (Express + SQLite server, React/Vite client). CLAUDE.md and README.md already cover layout/commands/endpoints, so knowledge/overview.md points to them instead of duplicating.
- Added knowledge/architecture.md (client-proxy-server-db flow) and knowledge/data-model.md (single `members` table) as Mermaid diagrams derived from vite.config.ts, index.ts, members.ts, db.ts.
- Added knowledge/gotchas.md capturing: the intentional RED department-validation test (TM-105) referenced in members.test.ts and ci.yml, an existing seed-data department naming inconsistency ("Engineering" vs "Eng"), unescaped CSV export, and the DB singleton + env-var test-isolation timing requirement.
- Added conventions/testing.md (Node test runner, in-memory DB, ephemeral per-request HTTP server pattern) and conventions/typescript.md (NodeNext `.js` import extension requirement on the server).
