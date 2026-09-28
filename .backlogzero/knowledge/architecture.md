---
name: architecture
description: Module dependency graph for the 4-file src/ tree
type: knowledge
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
sources:
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single process, no network services, no build step. `package.json` declares
`"type": "module"` and runs straight off `src/index.js` via `node` — there is
no bundler, no TypeScript compile step, no `dist/`.

```mermaid
flowchart TD
  CLI["src/index.js\n(parseArgs, main, printHelp)"]
  Logger["src/logger.js\n(logger, setLevel)"]
  Store["src/store.js\n(getSetting, setSetting, allSettings)"]
  ApiClient["src/api-client.js\n(class ApiClient)"]
  Upstream[["https://api.teamboard.example.com/v1\n(external, hardcoded)"]]

  CLI -->|"import"| Logger
  CLI -->|"import"| Store
  CLI -->|"import, new ApiClient()"| ApiClient
  ApiClient -->|"import"| Logger
  ApiClient -->|"fetch()"| Upstream
```

Notes on the non-obvious edges:

- `ApiClient` is only constructed inside `main()`'s `tasks` command branch
  (`src/index.js:57`) — `status` and `help` never touch the network.
- `ApiClient` imports `logger` directly (`src/api-client.js:11`) rather than
  receiving it injected, so retry/backoff logging (`request()`,
  `src/api-client.js:19-39`) always goes through the same global logger
  instance the CLI configures via `setLevel`.
- There is no reverse edge: `logger.js` and `store.js` have no knowledge of
  each other or of `index.js` — both are leaf modules.
