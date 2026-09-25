---
name: architecture
description: Module graph of the CLI — who imports whom, and the one external call
type: knowledge
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: b65d06820f71aa799052ce41d784d5b4cf052d83
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single-process Node CLI, no framework, no build step. Four modules total.

```mermaid
flowchart LR
    CLI["src/index.js\n(CLI entrypoint / arg parser)"]
    Logger["src/logger.js\n(levelled console logger)"]
    Store["src/store.js\n(in-memory settings Map)"]
    Client["src/api-client.js\n(ApiClient)"]
    Upstream[["api.teamboard.example.com/v1\n(external, fetch)"]]

    CLI --> Logger
    CLI --> Store
    CLI --> Client
    Client --> Logger
    Client -- "fetch, retried x3" --> Upstream
```

`src/index.js` is the only module that touches `process.argv`; it wires the
other three together per-command (`status` reads `src/store.js`, `tasks`
drives `src/api-client.js`). `src/store.js` has no persistence and no
tenant/namespace dimension — every process boots with the same three
defaults (`notifications.enabled`, `board.columns`, `retention.days`).
`src/api-client.js` is the only module that leaves the process (via
`fetch`); it retries up to 3 times with exponential backoff before throwing.
