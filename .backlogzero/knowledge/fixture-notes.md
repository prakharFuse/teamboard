---
name: fixture-notes
description: Read this before "fixing" anything that looks like a code smell — most of them are the deliberate subject of a specific fixture ticket
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

This repo is small on purpose, and several of its rough edges are on purpose too —
each is wired up as the answerable subject of a specific fixture-tier ticket. The
source already carries `FIXTURE NOTE` comments marking these; this page collects them
in one place so a plan doesn't accidentally "clean up" a ticket's own subject.

## Do not fix without being asked

- **"Teambaord" in README.md heading** — misspelled on purpose. The `tiers.easy`
  fixture ticket is "correct Teambaord → Teamboard." Fixing it unprompted removes that
  ticket's entire reason to exist.
- **Hardcoded/scattered config in `src/api-client.js`** — `baseUrl`
  (`https://api.teamboard.example.com/v1`), `region` (`'us-east-1'`), retry count
  (`3`), request timeout (`15000`), backoff base (`250 * 2 ** attempt`), and page size
  (`per_page=50`) are deliberately magic numbers and env-dependent strings, deliberately
  spread across the file rather than centralised. The `tiers.complex` "audit + centralise
  config" ticket is about deciding what becomes a config module, an env override, or
  stays inline — the audit's answer only makes sense while these are still scattered.
- **`src/store.js` as a global, tenant-less settings store** — the `tiers.complex`
  "migrate legacy global settings store to per-tenant schema" ticket depends on this
  store being global (one `Map`, no tenant key). Don't add a tenant dimension
  speculatively.
- **No `--quiet` flag in `src/index.js` / `src/logger.js`** — `src/logger.js` already
  has the level concept and `src/index.js` already has an arg parser specifically so the
  `tiers.medium` "add `--quiet` flag that suppresses info-level output" ticket has
  somewhere to land. That ticket also expects exactly one unit test, landing in
  `test/logger.test.js` alongside the existing `setLevel` tests.

## What this means for planning

If a ticket you're asked to plan is literally one of the four above, implement it fully
— these notes describe what the *unrelated* tickets should leave alone, not a blanket
"don't touch this file" rule. If a ticket is something else entirely (e.g. a real
feature request unrelated to these four), it's safe to touch these files normally; just
don't drive-by "fix" the specific smells listed here as an unrequested side effect.
