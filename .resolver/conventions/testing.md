---
name: testing
description: How tests are written and run in TeamBoard — read before adding or modifying tests
type: convention
scope: global
updated: 2026-08-26 (IONE-959)
captured_sha: 40c1af055214b8aac31e85217138b2f00e468ff5
sources:
  - server/src/config.test.ts
  - server/src/config.ts
sources_sha256:
  server/src/config.test.ts: 6c5640ffa860c568607c312c7845926ed6939f1bb4f770b9b56e6f4fea2b5cd5
  server/src/config.ts: 361319784de0ec3fc5b293e6c42a05ed698a2d9f00a1856350b755ca385218be
---

- `server/src/config.test.ts` tests `loadConfig` as a pure function by passing an
  explicit env object (e.g. `loadConfig({ TEAMBOARD_PORT: '5000' })`) rather than
  mutating `process.env` — a different pattern from the route tests above, which must
  mutate `process.env.TEAMBOARD_DB_PATH` before the lazy `getDb()` singleton binds.
  Use the direct-argument style for any future tests of `server/src/config.ts`.
