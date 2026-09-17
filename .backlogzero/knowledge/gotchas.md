---
name: gotchas
description: Deliberate "issues" in this repo that must NOT be fixed proactively — each is bait for a specific fixture ticket
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

This repo is a test fixture: things that look like bugs or smells are usually
load-bearing for a specific ticket tier. Do not "clean these up" as a side
effect of an unrelated change — doing so removes the subject of that ticket
and makes its plan vacuous. See [[overview]] for the general framing.

## Do not touch these

- **`README.md` title "Teambaord"** — misspelled on purpose. It's the subject
  of the `tiers.easy` fixture issue (fix "Teambaord" → "Teamboard"). Fixing it
  ahead of time empties that ticket.
- **`src/store.js`: global, tenant-less settings `Map`** — the subject of the
  `tiers.complex` fixture issue (migrate the "legacy global settings store" to
  a per-tenant schema). Keep it global and keep reads/writes centralized in
  this one file; don't add a tenant dimension speculatively.
- **`src/logger.js`: no `--quiet` support yet, but has a level concept** —
  the subject of the `tiers.medium` fixture issue (add a `--quiet` flag that
  suppresses info-level output, wired through `src/index.js`'s arg parser,
  plus one unit test in `test/logger.test.js`). Don't add `--quiet` unless
  that's the actual task at hand.
- **`src/api-client.js`: hardcoded, scattered magic values** — base URL
  (`https://api.teamboard.example.com/v1`), `region`, retry count (`3`),
  timeout (`15000`ms), backoff base (`250 * 2 ** attempt`), and page size
  (`50`) are intentionally inline and spread across `src/logger.js` (default
  log level `'info'`) and `src/api-client.js` rather than centralized. This is
  the subject of the `tiers.complex` "audit for hardcoded config" fixture
  issue. Don't consolidate them into a config module unless that's the ask.

## Practical implication for any task in this repo

Before changing `src/index.js`, `src/logger.js`, `src/store.js`, or
`src/api-client.js`, check whether the requested change *is* one of the four
items above. If it is, implement exactly that ticket's scope. If it's an
unrelated change (e.g. touching `src/api-client.js`'s retry logic for a
different reason), leave the other three fixtures' bait completely intact.
