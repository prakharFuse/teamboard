---
name: overview
description: What this repository is and why it looks smaller/odder than a real product
type: knowledge
scope: global
updated: 2026-09-24 (IONE-959)
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - README.md
  - package.json
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
---

Teamboard is not a product — it is a **fixture repository** for a journey/agent test
suite (see README.md). It simulates a small task-tracking CLI service just well
enough to give agent-run tickets something real to plan against, branch from, and
open a PR on.

The whole repo is 4 source files (`src/index.js`, `src/api-client.js`,
`src/logger.js`, `src/store.js`) plus one test file. `package.json` declares
`"type": "module"` (native ESM, no bundler/TS build step) and only two scripts:
`npm start` (runs `src/index.js`) and `npm test` (Node's built-in `node --test`
runner). There is no lint config, no CI config, and no dependencies at all —
zero entries in `package-lock.json`.

Read [[gotchas]] before touching anything under `src/` — several pieces of code
that look like obvious cleanup targets (a typo, magic numbers, a global store)
are intentionally left broken because a fixture ticket's answerability depends
on them staying that way.
