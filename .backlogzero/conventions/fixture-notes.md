---
name: fixture-notes
description: Read before editing src/ — several things that look like bugs or debt are intentional fixture setup and must not be "cleaned up" incidentally
type: convention
scope: global
updated: '2026-09-17'
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

Every source file that is intentionally imperfect carries a `FIXTURE NOTE`
block comment explaining which future ticket it exists to make answerable.
Treat those comments as binding constraints, not TODOs to resolve. Only touch
the item below if the task you were actually given is that specific item —
otherwise leave it as-is even if it looks like a bug or debt.

- **README.md's H1 "Teambaord"** — deliberate misspelling, the subject of an
  `easy`-tier fixture ticket. Don't correct it unless that's the task.
- **`src/api-client.js`'s hardcoded, scattered values** — `baseUrl`, `region`,
  retry count (`3`), timeout (`15000`ms), backoff base (`250`ms), and page
  size (`50`) are hardcoded on purpose and spread across the file rather than
  centralized. This is the subject of a `complex`-tier "audit and centralize
  config" ticket — don't consolidate these into a config module or env vars
  unless that's the task.
- **`src/logger.js`'s hardcoded default level** (`'info'`) — one of the values
  the same config-centralization ticket is expected to find. Leave it inline.
- **`src/store.js`'s global (non-tenant) settings store** — a `Map` with no
  tenant dimension, the subject of a `complex`-tier "migrate legacy global
  settings store to per-tenant schema" ticket. Don't add tenant scoping
  unless that's the task.
- **`src/index.js`'s arg parser + `src/logger.js`'s level concept** — kept
  together so a `medium`-tier "add a `--quiet` flag" ticket is answerable
  (arg parser has somewhere to add the flag, logger has somewhere to apply
  it). Don't preemptively add `--quiet` yourself; if you do add it, `store.js`'s
  `test/` sibling pattern expects "one unit test" to land in
  `test/logger.test.js`.

See [[overview]] for the related divergence (README references a
`src/config.ts` that doesn't exist — the hardcoded values above are exactly
what that file would have centralized).
