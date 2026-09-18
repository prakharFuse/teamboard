---
name: fixture-gotchas
description: Deliberate "issues" planted in this repo for fixture tickets — do not fix them incidentally
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
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

This repo plants specific, deliberate "problems" so that generated fixture
tickets have a real subject. Each one is marked in-code with a
`FIXTURE NOTE:` comment. If a task you're given is unrelated to one of these,
leave the planted issue alone — do not "clean it up" as a drive-by.

- **`README.md` title "Teambaord"** — misspelled on purpose; the easy-tier
  fixture ticket is "fix this typo." Fixing it outside that ticket makes that
  ticket vacuous.
- **`src/api-client.js` hardcoded config** — `baseUrl`, `region`, retry count
  (`3`), timeout (`15000`), backoff base (`250 * 2 ** attempt`), and page size
  (`per_page=50`) are scattered on purpose. A `complex`-tier fixture asks an
  agent to audit and centralize exactly this. Don't preemptively extract a
  config module.
- **`src/store.js` global settings map** — no tenant dimension by design. A
  `complex`-tier fixture asks an agent to migrate this "legacy global settings
  store" to per-tenant. Don't add tenancy speculatively.
- **`src/logger.js` + `src/index.js` `--quiet` gap** — the logger has levels
  and the CLI has an arg parser, but no `--quiet` flag exists yet. A
  `medium`-tier fixture asks an agent to add one (suppressing info-level
  output) plus one unit test in `test/logger.test.js`. This is the one
  planted gap that's an actual missing *feature*, not a "don't touch" trap —
  if your ticket is that fixture, implement it for real.

See `[[overview]]` for the broader fixture-repo framing and the README
divergence around `src/config.ts` (which does not exist).
