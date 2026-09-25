---
name: overview
description: What teamboard is, why it exists, and where the real docs live
type: knowledge
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
---

Teamboard is a fixture repository, not a product under active development —
see ../../README.md for the full explanation (it is deliberately small,
deliberately has rough edges like hardcoded config and no `--quiet` flag, and
its misspelled heading is intentional). Read that file first; this page only
adds what it omits or gets wrong.

## Divergences

Diverges from README.md: the "Configuration" section says environment
variables are read in `src/config.ts`. No such file exists in this repo (there
is no TypeScript anywhere — no `tsconfig.json`, no `.ts` files) and no source
file reads `process.env` at all. Runtime configuration in the current tree is
the hardcoded defaults in `src/store.js` (`DEFAULTS`) and the literals in
`src/api-client.js` (base URL, region, timeouts, retry count, page size) —
there is no env-var override path yet.

## Runtime shape

Single CLI, no server, no persistence beyond an in-memory `Map`. `npm start`
runs `src/index.js` directly via `node` (ESM, `"type": "module"` in
package.json) — there is no build step and nothing to compile.
