2026-09-17 · first-run · created .backlogzero

- Indexed the actual working tree (`src/index.js`, `src/api-client.js`,
  `src/logger.js`, `src/store.js`, `test/logger.test.js`, `README.md`,
  `package.json`) and found it does **not** match the pre-built repository
  map handed to this run (which described a `client/`+`server/` TS app with
  Express, React, and `node:sqlite` — none of that exists in this checkout).
  All pages below are written from the verified current tree, not the stale
  map.
- Wrote `knowledge/overview.md`, `knowledge/architecture.md` (module call
  graph, no DB in repo so no `data-model.md`), `knowledge/fixture-design.md`
  (consolidates the per-file `FIXTURE NOTE` comments into one table of
  planted issues not to casually "fix"), `knowledge/gotchas.md` (README's
  `src/config.ts` reference is stale — no such file, no `process.env` reads
  anywhere), and `conventions/coding-style.md` (inferred from the four
  source files; no lint/format config exists to cite instead).
