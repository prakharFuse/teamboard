2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree directly: the pre-built repo map handed to this run (client/server TypeScript app with node:sqlite) does not match reality. The real repo is a single small Node.js ESM CLI under `src/` with one test file under `test/` — see `knowledge/overview.md` for the corrected shape.
- Confirmed via grep that `README.md`'s claim of a `src/config.ts` env-var module is stale — no such file, no `.ts` files, and no `process.env` reads exist anywhere in `src/`. Recorded as a divergence in `knowledge/overview.md`.
- No database/schema in the repo (settings store is an in-memory `Map`), so no `knowledge/data-model.md` was created.
- Captured the four intentional "rough edges" called out by in-source `FIXTURE NOTE` comments (README typo, magic numbers in `api-client.js`, global settings store, missing `--quiet` flag) so future work doesn't accidentally clean them up and defeat the fixtures they exist for.
