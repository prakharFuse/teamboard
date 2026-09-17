2026-09-17 · first-run · created .backlogzero

- Indexed the real working tree (`src/index.js`, `src/logger.js`, `src/store.js`,
  `src/api-client.js`, `test/logger.test.js`) — the task's pre-supplied repo
  map (React client + Express/SQLite server) did not match this repository at
  all and was discarded in favor of the actual files on disk.
- Captured that this repo is a deliberately-rough fixture: four `FIXTURE NOTE`
  comments in the source mark bait for specific ticket tiers (README typo,
  global settings store, missing `--quiet` flag, scattered hardcoded config).
  See `knowledge/gotchas.md`.
- Recorded a divergence: `README.md` claims env vars are read from
  `src/config.ts`; no such file exists and the repo has no TypeScript at all.
  See `knowledge/overview.md`.
