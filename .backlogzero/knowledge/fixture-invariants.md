---
name: fixture-invariants
description: Intentional rough edges kept in place as journey-fixture subjects — do not "fix" these
type: knowledge
scope: global
updated: '2026-09-29'
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - README.md
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Every item below is deliberate, called out by an inline `FIXTURE NOTE` comment in the file itself, and exists to give a specific journey-suite tier something real to plan against. Do not clean these up as drive-by improvements.

- **`Teambaord` typo** in ../../README.md's H1. Subject of the `tiers.easy` fixture (correct "Teambaord" → "Teamboard"). Fixing it by hand makes that tier's plan vacuous.
- **Scattered magic numbers / env-dependent strings** in src/api-client.js — retry count (`3`), timeout (`15000`), backoff base (`250 * 2 ** attempt`), page size (`per_page=50`), `baseUrl`, and `region`. Subject of the `tiers.complex` "audit and centralize config" fixture. Do not consolidate these into a config module — that's the ticket, not a cleanup opportunity. This is also why src/index.js has no config.ts import despite what the README claims (see [[overview]]).
- **Global, tenant-less settings store** in src/store.js (`const settings = new Map()`, no tenant key anywhere). Subject of a `tiers.complex` "migrate legacy global settings store to per-tenant schema" fixture. Keep it global.
- **Hardcoded default log level** (`let currentLevel = 'info'`) in src/logger.js — flagged as one of the values the config-centralization fixture is expected to find; don't extract it preemptively.
- **No `--quiet` flag** on the CLI. src/index.js's arg parser and src/logger.js's level concept exist specifically so the `tiers.medium` "add `--quiet`" fixture is answerable. Only add the flag when actually implementing that ticket; test/logger.test.js is where its accompanying unit test is expected to land (see [[testing]]).
