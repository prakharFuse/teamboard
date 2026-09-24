---
name: architecture
description: Module graph of the CLI — entrypoint, logger, API client, settings store
type: knowledge
scope: global
updated: 2026-09-24 (IONE-959)
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
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

Four modules, no layering beyond "the entrypoint wires the other three together."
`api-client.js` is the only module with an external dependency (the upstream
task API, called via the global `fetch`).

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint: parseArgs/main)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(getSetting/setSetting/allSettings)"]
    Api["src/api-client.js\n(ApiClient)"]
    Upstream[["https://api.teamboard.example.com/v1\n(hardcoded default baseUrl)"]]

    CLI -->|imports| Logger
    CLI -->|imports| Store
    CLI -->|imports, constructs| Api
    Api -->|imports| Logger
    Api -->|fetch, 3 retries, 15s timeout| Upstream
```

Notes:
- `ApiClient` takes an optional `baseUrl` constructor arg but `index.js` always
  constructs it with no argument (`new ApiClient()`), so in practice the
  hardcoded default in `src/api-client.js:15` is always what's used.
- `store.js` holds settings in a module-level `Map` — state is process-global
  and lost on restart; there is no persistence layer.
- No module reaches into another's internals; all cross-module calls go
  through the named exports shown above.
