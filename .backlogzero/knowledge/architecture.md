---
name: architecture
description: Real module/call shape of the CLI — one process, no server/client split
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint, parseArgs)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(getSetting, setSetting, allSettings)"]
    ApiClient["src/api-client.js\n(class ApiClient)"]
    Upstream[["external task API\nhttps://api.teamboard.example.com/v1"]]

    CLI -->|"logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| ApiClient
    ApiClient -->|"logger.warn on retry"| Logger
    ApiClient -->|"fetch()"| Upstream
```

Everything runs in one process. `src/index.js` is the only file that imports
from all three modules; `logger.js` and `store.js` never import each other or
`api-client.js`. `api-client.js` imports only `logger.js` (to log retries) —
it has no dependency on `store.js`, even though `index.js` reads
`retention.days` from the store and passes nothing from it into the client
call (`listTasks(1)` ignores that setting today).

No database, no HTTP server, no `client/`+`server/` split — despite the repo
name and any external index that suggests otherwise, this is a single CLI
package. There is no `knowledge/data-model.md` page because there is no
schema, migration, or ORM model anywhere in the repo.
