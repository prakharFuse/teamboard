2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (`src/index.js`, `src/api-client.js`,
  `src/logger.js`, `src/store.js`, `test/logger.test.js`, `README.md`,
  `package.json`). Note: the pre-built repository map provided at task start
  (referencing `client/src/App.tsx`, `server/src/routes/members.ts`,
  `server/src/db.ts`) does not match this working tree at all — those files
  don't exist here. Treated the actual working tree as ground truth per
  instructions and ignored the stale map.
- Found this is a journey-suite fixture repo (per README.md), not a real
  product — most "code smells" in `src/` are intentionally planted fixture
  issues (see `knowledge/gotchas.md`). Captured them so future agents don't
  "clean up" the subject of an actual ticket.
- Found and recorded one genuine divergence: README.md says env vars are
  read in `src/config.ts`; that file does not exist and no source file reads
  `process.env`.
- No database in this repo — skipped `knowledge/data-model.md` per
  instructions.
