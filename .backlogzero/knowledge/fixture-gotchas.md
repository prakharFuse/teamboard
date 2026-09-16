---
name: fixture-gotchas
description: Code that looks unfinished, messy, or wrong on purpose — read before "cleaning up" anything
type: knowledge
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

This repo's rough edges are deliberate fixture content for a separate journey
suite that plans tickets against it. Every item below is called out by an
in-file `FIXTURE NOTE` comment or by `README.md` — read those comments in
place before touching the surrounding code. If you are working an unrelated
task, leave these as-is even if they look like obvious cleanup:

- **`README.md` heading spells "Teambaord."** This is the subject of the
  `tiers.easy` fixture ticket. Fixing it opportunistically removes that
  ticket's reason to exist.
- **`src/api-client.js` hardcodes a base URL, region, retry count (3), request
  timeout (15000 ms), backoff base (250 ms), and page size (50)**, scattered
  across the file instead of centralized. This is the subject of the
  `tiers.complex` "centralize hardcoded config" fixture ticket — do not
  refactor these into a config module unless that is the task at hand.
- **`src/store.js` is an intentionally global, non-tenant-aware settings
  store** (`Map` + flat string defaults). This is the subject of a
  `tiers.complex` "migrate to per-tenant schema" fixture ticket. Keep it
  global unless that migration is the task at hand.
- **`src/logger.js` + `src/index.js`'s arg parser exist specifically so a
  `--quiet` flag is easy to add** (the `tiers.medium` fixture ticket). If
  asked to add `--quiet`, the expected shape is: a new flag in
  `parseArgs()` (`src/index.js:13`) that suppresses info-level output via
  `setLevel()`, plus one unit test alongside the existing two in
  `test/logger.test.js`.

## Reseeding

Per `README.md`, this repo's content is reconciled against a
`tests/journeys/seed/journey-repo/` pack in a separate suite repo and can be
re-seeded by that suite's `pnpm test:journey provision-repo`. That tooling
does not live in this repository — there is no `tests/` directory here, only
`test/logger.test.js`. Edit this repo directly for fixture work; there is
nothing else in this checkout to reconcile against.
