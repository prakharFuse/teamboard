---
name: fixture-notes
description: Inventory of intentionally-rough code left for external test tickets — do not "clean up" without a ticket asking for it
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - README.md
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  README.md: f904a61e1f2a6dc9b4f30ea4f883e1cddafcb46de99ddc54f340652fe45f1068
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

Each item below is a real piece of code, verified in the working tree, that
a `FIXTURE NOTE` comment explicitly asks agents to leave alone unless a
ticket is asking for exactly that change.

| Location | What looks "wrong" | Why it's there |
|---|---|---|
| README.md:1 | Heading "Teambaord" is misspelled | Subject of the `tiers.easy` fixture ticket (fix the spelling). Fixing it unprompted removes that ticket's reason to exist. |
| src/api-client.js:15-43 | Hardcoded base URL, region string, retry count (`3`), timeout (`15000`), backoff base (`250`), page size (`50`) | Subject of the `tiers.complex` "audit and centralize config" ticket. |
| src/logger.js:13 | `currentLevel` defaults to a hardcoded `'info'` string | Same config-centralization fixture as above. |
| src/store.js (whole file) | Global `Map`-backed settings store with no tenant dimension | Subject of a `tiers.complex` "migrate legacy global settings to per-tenant schema" ticket. |
| src/logger.js + src/index.js arg parser | No `--quiet` flag exists yet | Subject of the `tiers.medium` ticket: add `--quiet` to suppress info-level output, backed by one unit test in test/logger.test.js. |

## Divergence: README.md points at a file that doesn't exist

README.md:32 says "Environment variables are read in `src/config.ts`." There
is no `src/config.ts` (or `.js`) in the repository, and no file under `src/`
reads `process.env` anywhere — `getSetting`/`setSetting`/`allSettings` in
src/store.js are the only settings surface, and they are populated from the
hardcoded `DEFAULTS` map, not the environment. Treat the store/env-var
config surface as not-yet-implemented rather than assuming a config module
exists.

## What NOT to do here

- Don't "fix" the README typo, the magic numbers, or the global store as a
  drive-by improvement — each is the deliberate subject of a specific
  fixture ticket tier (easy/medium/complex) and removing it makes that
  ticket's plan vacuous.
- Don't invent a `src/config.ts` to match the README — if a ticket asks you
  to centralize config, that's the point where such a module would be
  created; do not pre-empt it.
