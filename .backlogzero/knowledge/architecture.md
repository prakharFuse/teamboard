---
name: architecture
description: Module call graph of the CLI and its data flow — read before adding a command or module
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

Single-process Node CLI, no network server, no database. `src/index.js` is
the only entrypoint and imports the other three modules directly; none of
the other modules import each other except `api-client.js`, which logs
through `logger.js`.

```mermaid
flowchart TD
  CLI["src/index.js (CLI entry)"]
  Logger["src/logger.js"]
  Store["src/store.js (in-memory settings)"]
  ApiClient["src/api-client.js (ApiClient)"]
  Upstream[["https://api.teamboard.example.com/v1 (fetch, external)"]]

  CLI -->|"setLevel(), logger.info/debug/error"| Logger
  CLI -->|"allSettings(), getSetting()"| Store
  CLI -->|"new ApiClient(); listTasks(page)"| ApiClient
  ApiClient -->|"logger.warn() on retry"| Logger
  ApiClient -->|"fetch(baseUrl + path)"| Upstream
```

Notes on edges that aren't obvious from the diagram:

- `ApiClient` is instantiated fresh per `tasks` command invocation in
  `index.js`; it is not a singleton and holds no state beyond `baseUrl` /
  `region`.
- `store.js`'s settings map is module-level (`const settings = new Map()`),
  so it's effectively a process-global singleton shared by whichever code
  imports it — there's exactly one instance for the CLI's lifetime.
- `logger.js` picks stdout vs stderr per call (`warn`/`error` → stderr,
  `debug`/`info` → stdout) based on level, not on any config.
