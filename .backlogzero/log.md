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
0c2c10ae-deaa-4554-a6dd-af9d59dbe728: added fact to knowledge/fixture-gotchas.md noting the pnpm.overrides path-to-regexp pin in package.json is an inert, recurring automated security-fix artifact with no real dependency behind it
