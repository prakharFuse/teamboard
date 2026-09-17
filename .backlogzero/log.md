2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (`src/index.js`, `src/api-client.js`,
  `src/logger.js`, `src/store.js`, `test/logger.test.js`, `package.json`,
  `README.md`). The pre-built repository map supplied for this run described
  a different, unrelated codebase (`client/src/App.tsx`, `server/src/db.ts`,
  a `node:sqlite`-backed members API) that does not exist anywhere in this
  repo's working tree at HEAD — it was ignored in favor of the real files.
- Captured one genuine divergence between README.md and the code: README
  claims env vars are read from `src/config.ts`; no such file exists and
  nothing in `src/` reads `process.env`. Recorded in
  `knowledge/overview.md` and cross-referenced from
  `conventions/fixture-notes.md`.
- Skipped `knowledge/data-model.md` — no database, schema, or ORM in the
  repo (`src/store.js` is an in-memory `Map`, not persisted).
