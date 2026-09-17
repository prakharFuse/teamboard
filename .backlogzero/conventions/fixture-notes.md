---
name: fixture-notes
description: The FIXTURE NOTE comment convention — read before "fixing" anything that looks like a bug or code smell
type: convention
scope: global
updated: 2026-09-17 (IONE-959)
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

Every source file in `src/` opens with a block comment tagged
`FIXTURE NOTE:` that explains which planned ticket/journey tier the file's
"flaw" is the answer key for (see [[overview]]). This is the repo's one load-bearing
convention:

- `src/api-client.js` — hardcoded/scattered magic numbers (timeout, retry
  count, page size) and hardcoded URL/region are intentional; they are the
  subject of a "centralize config" fixture ticket.
- `src/logger.js` + `src/index.js` — the level concept and arg parser exist
  specifically so a "`--quiet` flag" ticket has somewhere to land.
- `src/store.js` — the global, non-tenant `Map` store is intentional; it is
  the "before" state for a "migrate to per-tenant schema" ticket.
- README.md's "Teambaord" misspelling in the H1 is intentional; it is the
  subject of the easy-tier fixture.

**When touching this repo:** if a change would incidentally resolve one of
these planted issues (e.g. extracting `ApiClient`'s constants into a config
object, or fixing the README typo) as a side effect of unrelated work, treat
that as a sign to stop and reconsider scope — it likely defeats a fixture's
purpose. Only make that specific change when a ticket explicitly asks for it.
