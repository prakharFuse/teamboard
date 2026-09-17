2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (single-package Node ESM CLI: `src/index.js`,
  `src/api-client.js`, `src/logger.js`, `src/store.js`, one test file under
  `test/`). The pre-built repository map supplied for this run described a
  client/server React+Express+SQLite app that does not exist in this
  checkout — discarded it in favor of the real files on disk.
- Wrote `knowledge/overview.md`, `knowledge/architecture.md` (with a Mermaid
  module-wiring diagram), `conventions/fixture-notes.md`, and
  `conventions/code-style.md`.
- Recorded one divergence: README.md's "Configuration" section points to a
  `src/config.ts` that does not exist and no `process.env` usage exists
  anywhere in `src/` — see `knowledge/overview.md`.
- Skipped `knowledge/data-model.md` — no database, schema, or ORM in this
  repo.
