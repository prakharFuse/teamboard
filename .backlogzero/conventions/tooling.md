---
name: tooling
description: Package manager, module system, and test runner conventions — no external deps or frameworks
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: a22cf770a237002cf84ea8aa9b3727e5cba8abc9
sources:
  - test/auth.test.js
  - test/server.test.js
  - test/members-store.test.js
sources_sha256:
  test/auth.test.js: 1795894d77d6ebcba79a5911a69a674a13deff7df734a0ec5cfc149ea4f449f4
  test/members-store.test.js: fba89711528f8fb5131bbf40b049fe396564a8eb8ea2a7c92f358790607f4fd5
  test/server.test.js: bf8a2b6df5bde4e66a87c8c9f3525ee7d8f101fff91090e6c5eeeb426fcf0f3f
---

- **Tests that mutate module-level shared state restore it afterward.**
  `test/auth.test.js` and `test/server.test.js` snapshot
  `process.env.TEAMBOARD_API_TOKEN` before mutating it and restore the
  original value in `afterEach`/`after`; `test/members-store.test.js` snapshots
  the seeded members array and restores it via `setMembers` in `afterEach`.
  Follow this snapshot/restore pattern for any new test that touches env vars
  or a module-level store, to avoid leaking state into later tests in the same
  file.
