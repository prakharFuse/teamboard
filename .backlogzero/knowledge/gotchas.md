---
name: gotchas
description: Verified places where README.md and the current working tree disagree, or a fresh setup step will surprise you
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - package.json
  - src/index.js
  - src/api-client.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
---

## Divergences from README.md

Diverges from README.md: "Environment variables are read in `src/config.ts`. See that file for the current list." → `src/config.ts` does not exist anywhere in this repo, and no file under `src/` reads `process.env` at all. All current configuration (`ApiClient`'s base URL/region, retry/timeout/page-size constants, `store.js`'s `DEFAULTS`) is hardcoded, not env-driven — see [[fixture-design]] for why those hardcodes are intentional rather than an oversight. Treat this README line as a stale pointer to a config module that was never added to this checkout, not as a description of current behavior.

## Other setup traps

- `README.md` says `npm install` before `npm start -- --help`, but
  `package.json` has no `dependencies`/`devDependencies` and there is no
  lockfile — `npm install` is a no-op here. Nothing will break if it's
  skipped; don't assume the run failed if `node_modules/` never appears.
- `npm start -- --help` requires the `--` separator to pass `--help` through
  npm to `node src/index.js`; running `npm start --help` (no `--`) passes
  `--help` to npm itself instead, per `src/index.js:13-21`'s `parseArgs`
  which only inspects `process.argv.slice(2)` from the actual script args.
- `ApiClient.request` (`src/api-client.js:19-39`) swallows the original
  `AbortError`/HTTP error per attempt and only rethrows `lastError` after all
  3 attempts — a caller inspecting the thrown error only ever sees the final
  attempt's failure, not the first one.
