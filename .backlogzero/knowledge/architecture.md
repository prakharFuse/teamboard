---
name: architecture
description: Module graph of the teamboard CLI — how index.js, logger, store, and api-client connect
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - src/index.js
  - src/api-client.js
  - src/logger.js
  - src/store.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single-process Node.js CLI, no network server of its own. `src/api-client.js` is the only piece that talks to anything external, and that external thing (`api.teamboard.example.com`) is outside this repo — there is nothing here to run locally to serve it.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entry, arg parsing)"]
    Logger["src/logger.js\n(leveled logger)"]
    Store["src/store.js\n(in-memory settings Map)"]
    Client["src/api-client.js\nApiClient"]
    Upstream[["external:\napi.teamboard.example.com\n(not in this repo)"]]
    Test["test/logger.test.js"]

    CLI -->|"setLevel(), logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| Client
    Client -->|"logger.warn() on retry"| Logger
    Client -->|"fetch()"| Upstream
    Test -->|"imports setLevel"| Logger
```

Notes:
- `package.json` has `"main": "src/index.js"` and `"type": "module"` — all imports are native ESM with explicit `.js` extensions (e.g. `import { logger } from './logger.js'`), not CommonJS `require`.
- There's no dependency-injection or config layer between these modules; `index.js` imports the other three directly and wires them by hand in `main()`.
