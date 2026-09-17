2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (small Node/ESM CLI fixture: `src/index.js`,
  `src/api-client.js`, `src/logger.js`, `src/store.js`, `test/logger.test.js`).
  The pre-built repository map supplied for this run described a different
  codebase (`client/src/App.tsx`, `server/src/routes/members.ts`, a SQLite
  `db.ts`) that does not exist anywhere in this repo — ignored it and worked
  from the real files on disk instead.
- Captured the repo's stated purpose (journey-suite fixture, not a product)
  and its intentional rough edges from `README.md` and in-source
  `FIXTURE NOTE` comments: misspelled README title, missing `--quiet` flag,
  scattered magic numbers in `src/api-client.js`, and a global (non-tenant)
  settings store in `src/store.js`.
- Recorded one real divergence: `README.md` points to `src/config.ts` for
  environment variable config; that file does not exist and no env vars are
  read anywhere in `src/`.
- Wrote `knowledge/overview.md`, `knowledge/fixture-gotchas.md`,
  `knowledge/architecture.md`, `conventions/testing.md`,
  `conventions/code-style.md`. Skipped `knowledge/data-model.md` — no
  database, schema, or ORM in this repo.
