---
name: fixture-conventions
description: Read before "fixing" anything in src/ or README.md — several defects are intentional subjects of other fixture tickets
type: convention
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

Every file under `src/` carries a `FIXTURE NOTE` comment explaining which journey
ticket it exists to support. Do not "clean up" the thing a note describes unless that
is literally the assigned task — doing so silently removes that ticket's only work
item.

- **README.md:1,5-8** — the "Teambaord" heading typo is intentional; it's the subject
  of the `tiers.easy` fixture ticket. Leave it misspelled unless the task is exactly
  "fix this typo".
- **src/api-client.js:1-10,21-43** — the hardcoded `baseUrl`, `region`, retry count
  (`3`), per-attempt timeout (`15000`ms), backoff base (`250 * 2 ** attempt`), and page
  size (`50`) are intentional scattered magic numbers/strings for the `tiers.complex`
  config-centralization ticket. Only consolidate them into a config module when that
  audit/refactor is the assigned task.
- **src/logger.js:1-13** — the level concept (`LEVELS`, `currentLevel`, default
  `'info'`) exists so the `tiers.medium` ticket (add a `--quiet` flag that suppresses
  info-level output) has something to plumb into. The other half is `parseArgs` in
  `src/index.js:13-21`, which already supports `--verbose` but not `--quiet`.
- **src/store.js:1-9** — the global, non-tenant-scoped `Map` is intentional; it is the
  "legacy settings store" that the `tiers.complex` per-tenant migration ticket targets.
  Don't add a tenant dimension to it unless that migration is the assigned task.

When scoping a ticket against this repo, check the `FIXTURE NOTE` in the file(s) it
touches first — it typically states the acceptance shape directly, and touching it
without an explicit ticket collapses another ticket's scope to nothing.
