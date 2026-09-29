---
name: architecture
description: Module graph of the CLI (entry point, logger, API client, settings store)
type: knowledge
scope: global
updated: '2026-09-29'
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Four files, no external runtime dependencies, all imported via relative ESM paths.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint)"]
    Logger["src/logger.js\n(levelled console logger)"]
    ApiClient["src/api-client.js\n(ApiClient class)"]
    Store["src/store.js\n(in-memory settings map)"]
    Upstream[["https://api.teamboard.example.com/v1\n(external HTTP, hardcoded)"]]

    CLI -->|logger.info/debug/error| Logger
    CLI -->|new ApiClient / listTasks| ApiClient
    CLI -->|allSettings / getSetting| Store
    ApiClient -->|logger.warn on retry| Logger
    ApiClient -->|fetch| Upstream
```

Notes:
- `store.js` and `api-client.js` never import each other — the only shared dependency between them is `logger.js`. `index.js` is the sole point wiring all three together.
- `ApiClient` takes an optional `baseUrl` constructor arg but `index.js` always constructs it with no argument, so the hardcoded default (`https://api.teamboard.example.com/v1`) is what actually runs.
- No config/env layer sits between these modules and their hardcoded values — see [[overview]] for the README divergence on this point, and [[fixture-invariants]] for why that's intentional.
