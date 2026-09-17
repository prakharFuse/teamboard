---
name: architecture
description: Module import graph and the one external call this CLI makes
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

Single-process Node CLI, no services, no queue, no database. The only
cross-boundary call is `ApiClient.request` doing `fetch` against a
third-party (fixture) upstream URL.

```mermaid
flowchart LR
    CLI["src/index.js\n(entrypoint, parseArgs)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(getSetting, setSetting, allSettings)"]
    Client["src/api-client.js\n(ApiClient)"]
    Upstream[["Upstream task API\napi.teamboard.example.com/v1"]]

    CLI -->|imports| Logger
    CLI -->|imports| Store
    CLI -->|imports| Client
    Client -->|imports| Logger
    Client -->|fetch, retried 3x| Upstream
```

Notes:
- `Store` and `Client` do not import each other; `index.js` wires
  `getSetting('retention.days')` into a debug log line before calling
  `client.listTasks`, but that value isn't passed into the request — it's
  informational only (`src/index.js:58-59`).
- `test/logger.test.js` imports only `src/logger.js` directly; there is no
  test coverage for `index.js`, `api-client.js`, or `store.js` yet.
