2026-09-18 · first-run · created .backlogzero

- Indexed the actual working tree (flat `src/`/`test/` Node ESM CLI, zero
  npm dependencies) — the pre-built repo map handed in for this run described
  an unrelated client/server/SQLite project and was discarded as stale.
- Wrote knowledge/overview.md, knowledge/architecture.md (module call graph,
  no database so no data-model.md), knowledge/fixture-gotchas.md (the
  intentional rough edges this fixture repo depends on), and
  conventions/testing.md.
- Recorded a divergence: README.md points to `src/config.ts` for env vars;
  that file doesn't exist and no code reads `process.env`.
