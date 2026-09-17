---
name: architecture
description: Module call graph of the teamboard CLI
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single-process CLI, no server, no database, no network boundary other than
the outbound fetch in `ApiClient`.

```mermaid
flowchart TD
    CLI["src/index.js\n(parseArgs, main)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(getSetting/setSetting/allSettings)"]
    Api["src/api-client.js\n(ApiClient)"]
    Remote[["api.teamboard.example.com/v1\n(external, hardcoded)"]]
    Test["test/logger.test.js"]

    CLI -->|"setLevel(), logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| Api
    Api -->|"logger.warn() on retry"| Logger
    Api -->|"fetch()"| Remote
    Test -->|"imports setLevel"| Logger
```

Notes:
- `ApiClient` is the only module with an external dependency (`fetch` to a
  hardcoded base URL); everything else is in-process.
- `src/store.js` has no persistence — state resets on every process start.
- There is no `src/config.ts` and no env-var reads anywhere in `src/` (see the
  divergence note in [[overview]]).
