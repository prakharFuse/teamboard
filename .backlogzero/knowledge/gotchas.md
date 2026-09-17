---
name: gotchas
description: Intentional rough edges that must stay unfixed unless the ticket asks for them
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

This repo is a fixture: several files carry `FIXTURE NOTE` comments marking
deliberate imperfections that later "journey" tickets are designed to fix.
Correcting them speculatively (as part of an unrelated task) makes the ticket
they belong to vacuous. Only touch these when the current ticket explicitly
asks for that specific change.

- **README.md heading "Teambaord"** — misspelled on purpose. Fixing it is the
  entire subject of the `tiers.easy` fixture ticket. Do not correct it as a
  drive-by typo fix.
- **`src/api-client.js` hardcoded/scattered values** — `baseUrl`, `region`,
  the retry count (`3`), the abort timeout (`15000`), the backoff base
  (`250 * 2 ** attempt`), and the page size (`50`) are deliberately magic
  numbers spread across the file, not centralized. Centralizing them into a
  config module is the `tiers.complex` "audit hardcoded config" ticket's job.
- **`src/logger.js` level concept + `src/index.js` arg parser** — both exist
  specifically so a `--quiet` flag (the `tiers.medium` ticket) has somewhere
  to land: a flag to parse and a level to suppress at. Don't remove or
  collapse either piece as unused/simplification.
- **`src/store.js` global settings store** — intentionally has no tenant
  dimension. Migrating it to a per-tenant schema is the `tiers.complex`
  "legacy global settings store" ticket. Don't add a tenant key speculatively.
- **Content is reconciled upstream** — per README.md, this repo's content is
  reseeded from `tests/journeys/seed/journey-repo/` in a separate repository.
  Edits here only matter for the current task; they are not the place to fix
  the fixture pack long-term.

See [[overview]] for the module layout these notes refer to.
