---
name: architecture
description: Module graph of the CLI — who imports/calls whom, and the one external dependency
type: knowledge
scope: global
updated: '2026-09-16'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

There is no client/server split, no database, and no web framework in this repo — it
is a single Node CLI process plus one outbound HTTP dependency.

```mermaid
flowchart TD
  CLI["src/index.js\n(CLI entrypoint, parseArgs/main)"]
  Logger["src/logger.js\n(leveled logger)"]
  ApiClient["src/api-client.js\n(ApiClient)"]
  Store["src/store.js\n(in-memory settings)"]
  Test["test/logger.test.js"]
  Upstream[("api.teamboard.example.com\n(external HTTP API)")]

  CLI --> Logger
  CLI --> ApiClient
  CLI --> Store
  ApiClient --> Logger
  ApiClient -->|fetch, retry x3| Upstream
  Test --> Logger
```

- `src/index.js` is the only module with fan-out — it imports and calls into all
  three others (src/index.js:9-11).
- `src/api-client.js` is the only module that talks to the network. `ApiClient.request`
  retries up to 3 times with exponential backoff and a 15s per-attempt timeout
  (src/api-client.js:19-39), logging each retry through `src/logger.js`.
- `src/store.js` is read-only from the CLI's perspective in current code — `getSetting`
  is called (src/index.js:58) but nothing in `src/` currently calls `setSetting`.
- `test/logger.test.js` is the only test file and only exercises `src/logger.js`.
