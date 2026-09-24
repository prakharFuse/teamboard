---
name: gotchas
description: Intentional rough edges and one README/code divergence — read before "cleaning up" src/
type: knowledge
scope: global
updated: 2026-09-24 (IONE-959)
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

This repo bakes several rough edges into the code on purpose, each annotated
in-place with a `FIXTURE NOTE` comment. They exist because a specific test
ticket asks an agent to fix exactly that thing — if you "helpfully" fix it
while working on something unrelated, that ticket's plan becomes vacuous.
Don't fix these unless the task at hand is literally that fix:

- **"Teambaord" misspelling in `README.md:1`** — intentional; a fixture ticket's
  whole job is to correct it. Leave the typo.
- **Hardcoded/scattered config in `src/api-client.js`** — `baseUrl`
  (`https://api.teamboard.example.com/v1`), `region` (`'us-east-1'`), retry
  count (`3`), timeout (`15000`ms), backoff base (`250`ms), and page size
  (`50`) are deliberately magic numbers/strings instead of being centralized.
  A fixture ticket asks an agent to audit and centralize exactly these.
- **Global settings store in `src/store.js`** — a single process-wide `Map`
  with no tenant dimension, described in its own comment as "legacy." A
  fixture ticket asks an agent to migrate this to a per-tenant schema.
- **`--quiet` flag is deliberately absent** — `src/index.js`'s `parseArgs` only
  understands `--verbose`/`--help`/positional command, and `src/logger.js`
  only exposes `setLevel`. Both exist specifically so a fixture ticket asking
  for a `--quiet` flag (suppress info-level output) has somewhere to land the
  change, plus `test/logger.test.js` already covers `setLevel`'s validation
  path as the "one unit test" that ticket expects to extend.

## Divergence from README.md

`README.md`'s Configuration section says: "Environment variables are read in
`src/config.ts`. See that file for the current list." Neither is true in the
current tree: there is no `src/config.ts` (all source files are `.js`,
consistent with `package.json`'s plain `"type": "module"` setup and no
TypeScript toolchain), and no file in the repo reads `process.env` at all —
`grep -r "process.env" .` in `src/` returns nothing. Treat the code as the
source of truth: there is currently no environment-variable configuration
surface in this repo.
