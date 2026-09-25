---
name: code-style
description: ESM/no-dependency conventions and what the FIXTURE NOTE comments mean
type: convention
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - package.json
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - src/index.js
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Plain ESM (`"type": "module"` in `../../package.json`), no TypeScript, no
bundler, no lint config, no runtime dependencies — every file imports only
Node built-ins or sibling `src/*.js` modules via relative `./x.js` paths.

Every `src/*.js` file opens with a block comment; in three of the four
(`api-client.js`, `logger.js`, `store.js`) that comment is or contains a
`FIXTURE NOTE` explaining a deliberate design gap (hardcoded/scattered
config, a global-only settings store, a level concept with no `--quiet`
flag). These read like TODOs but are not — each is the intended target of a
specific, separate ticket. Preserve the gap they describe rather than fixing
it inline; if a task asks you to address one of these directly, that's the
signal you're on the right ticket.
