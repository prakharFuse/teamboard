---
name: architecture
description: Module dependency diagram for the CLI's four source files
type: knowledge
scope: global
updated: '2026-09-16'
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

Everything runs in a single Node process — there is no network boundary
between these modules, just plain ESM imports.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    ApiClient["src/api-client.js\n(ApiClient)"]
    Store["src/store.js\n(settings store)"]
    Upstream[["external HTTP API\napi.teamboard.example.com"]]

    CLI -->|imports logger, setLevel| Logger
    CLI -->|imports ApiClient| ApiClient
    CLI -->|imports allSettings, getSetting| Store
    ApiClient -->|imports logger| Logger
    ApiClient -->|fetch| Upstream
```

Notes on the edges:

- `tasks` command path: `index.js` → `ApiClient.listTasks()` → `ApiClient.request()`
  → `fetch()` against a hardcoded base URL (`src/api-client.js:15`). The retry
  loop in `request()` also calls back into `logger.warn` on each failed
  attempt.
- `status` command path: `index.js` → `store.allSettings()`, no network
  involved.
- `store.js` and `api-client.js` never import each other — the only shared
  dependency between the two "business logic" modules is `logger.js`.
