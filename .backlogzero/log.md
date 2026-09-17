2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (`src/index.js`, `src/api-client.js`, `src/logger.js`, `src/store.js`, `test/logger.test.js`). The pre-built repo map supplied for this run described a different, older shape of this repo (a `client/`+`server/` TypeScript/React/SQLite app) that no longer exists in the working tree — commit `972029c` ("remove server/tsconfig.json (no longer in the pack)") corroborates that the fixture pack was slimmed down since that map was generated. Ignored the stale map in favor of the current tree.
- Found and recorded one genuine divergence: README.md claims env vars are read from `src/config.ts`, but no such file exists and no `src/` file reads `process.env`. See `knowledge/overview.md`.
- No database in the repo, so no `knowledge/data-model.md` was created.
