---
name: architecture
description: Module call graph for the CLI — who imports/calls whom, and the one external dependency
type: knowledge
scope: global
updated: '2026-09-17'
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

Single-process CLI, no server component. `src/index.js` is the only entrypoint
and the only module that imports the other three.

```mermaid
flowchart TD
    CLI["src/index.js\n(parseArgs, printHelp, main)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    Store["src/store.js\n(getSetting, setSetting, allSettings)"]
    Client["src/api-client.js\n(ApiClient)"]
    API[("upstream task API\nhttps://api.teamboard.example.com/v1")]
    Test["test/logger.test.js"]

    CLI -->|"logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| Client
    Client -->|"logger.warn (retry)"| Logger
    Client -->|"fetch()"| API
    Test -->|"setLevel()"| Logger
```

Notes on edges that aren't obvious from file names:

- `store.js` is never imported by `api-client.js` or `logger.js` — settings
  flow one-way, from `index.js` down. `getSetting('retention.days')` is read
  in `index.js:58` only to log it; it isn't passed into `ApiClient`.
- `api-client.js` depends on `logger.js` for retry-warning output, so logger
  changes (e.g. adding a `--quiet` mode) affect both the CLI's own output and
  the client's retry logging.
- There is no inbound network side (no Express/HTTP server anywhere in the
  repo) — `ApiClient` is purely an outbound caller to a third-party-shaped
  URL that does not exist in this repo.
