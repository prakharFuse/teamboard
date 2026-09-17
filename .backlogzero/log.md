2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (plain-JS CLI fixture: src/index.js, src/logger.js,
  src/api-client.js, src/store.js, test/logger.test.js) — the pre-built repository map
  supplied for this task described a different, non-existent React/Express/SQLite
  layout (client/src/App.tsx, server/src/routes/members.ts, server/src/db.ts) and was
  disregarded in favor of what's actually on disk.
- Captured the repo's own README framing (fixture repo for BacklogZero's journey
  suite) plus the `FIXTURE NOTE` comments embedded in source, which mark several
  apparent code smells (README typo, hardcoded config in api-client.js, global
  settings store, missing --quiet flag) as intentional subjects of other fixture
  tickets — see knowledge/fixture-notes.md.
- Recorded one divergence: README.md's Configuration section points at
  `src/config.ts`, which does not exist anywhere in the repo (no TypeScript at all) —
  see knowledge/overview.md.
