---
name: architecture
description: Real module shape of the CLI and how the four source files call each other
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - test/logger.test.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
  test/logger.test.js: c4eed64e2022370b3212b33c64de4cb744bdacb15b12e8900bcc172a045408fa
---

Single-process Node CLI, four modules, no server/client split, no database.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint, arg parsing)"]
    Logger["src/logger.js\n(levelled logger)"]
    Store["src/store.js\n(in-memory settings Map)"]
    ApiClient["src/api-client.js\n(ApiClient class)"]
    Upstream[["https://api.teamboard.example.com/v1\n(external, hardcoded)"]]
    Test["test/logger.test.js\n(node:test)"]

    CLI -->|"setLevel(), logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| ApiClient
    ApiClient -->|"logger.warn() on retry"| Logger
    ApiClient -->|"fetch()"| Upstream
    Test -->|"imports setLevel"| Logger
```

Notes on edges that aren't obvious from file names:

- `src/index.js`'s `tasks` command is the only path that touches `ApiClient`;
  `status` and `help` never make network calls.
- `ApiClient.request()` calls back into `logger.warn` on every retry attempt,
  so `logger.js` has two callers, not one.
- There is no `src/config.ts` and no env-var reads anywhere in `src/` — see
  the divergence note in [[overview]].
