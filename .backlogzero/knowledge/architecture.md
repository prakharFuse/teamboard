---
name: architecture
description: Module wiring for the CLI — who imports/calls whom
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

Everything runs in one Node process; there is no client/server split and no
network service of teamboard's own. `ApiClient` talks to one external,
hardcoded upstream (`https://api.teamboard.example.com/v1`) — the only
outbound dependency.

```mermaid
flowchart TD
    CLI["src/index.js\n(parseArgs, main)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(allSettings, getSetting)"]
    ApiClient["src/api-client.js\n(ApiClient.listTasks)"]
    Upstream[["https://api.teamboard.example.com/v1\n(external, hardcoded)"]]

    CLI -->|status command| Store
    CLI -->|tasks command| ApiClient
    CLI --> Logger
    ApiClient --> Logger
    ApiClient -->|fetch, retry x3| Upstream
```

Notes on edges that aren't obvious from the code alone:
- `status` reads settings via `store.js` and never touches `ApiClient`.
- `tasks` reads one setting (`retention.days`) purely to log it — it is not
  passed to `ApiClient.listTasks`, so changing that default does not change
  request behavior today.
- `ApiClient` logs its own retry attempts through the shared `logger`, so
  `--verbose` (which calls `setLevel('debug')`) also surfaces retry noise.
