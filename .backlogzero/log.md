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
0fb9296f-19a2-4987-92f1-431e8d731541: regenerate knowledge/architecture.md — add server.js/members-router.js/members-store.js/auth.js to the module graph (member-count endpoint feature)
0fb9296f-19a2-4987-92f1-431e8d731541: regenerate knowledge/overview.md — layout, running instructions, and config.ts divergence updated for the new members API
0fb9296f-19a2-4987-92f1-431e8d731541: add-fact conventions/tooling.md — document the snapshot/restore pattern used by tests that mutate env vars or module state
0fb9296f-19a2-4987-92f1-431e8d731541: flagged divergence — README.md still points at a nonexistent src/config.ts, but env vars are now genuinely read in src/auth.js and src/index.js
2026-09-17 · 0fb9296f-19a2-4987-92f1-431e8d731541 · corrected knowledge/overview.md — README.md:44 ("Environment variables are read in `src/config.ts`") is stale (src/config.ts does not exist; TEAMBOARD_API_TOKEN is read directly in src/auth.js and src/index.js, with no centralizing config module.)
