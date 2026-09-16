2026-09-16 · first-run · created .backlogzero

- Indexed the actual working tree (`src/index.js`, `src/api-client.js`, `src/logger.js`,
  `src/store.js`, `test/logger.test.js`, `README.md`, `package.json`). The pre-built
  repository map supplied for this run (React `client/`, Express `server/`,
  `node:sqlite`) does not match this checkout at all — no such files exist here — so
  it was disregarded in favor of the real tree.
- Wrote `knowledge/overview.md`, `knowledge/architecture.md` (module-graph Mermaid
  diagram), `conventions/fixture-conventions.md`, and `conventions/testing.md`.
- No database in this repo → skipped `knowledge/data-model.md` per instructions.
- Recorded one divergence: README.md claims env vars are read from `src/config.ts`,
  but no such file exists; `src/store.js` is the actual settings source.
