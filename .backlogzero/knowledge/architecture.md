---
name: architecture
description: Module graph of the CLI — how index.js, logger.js, api-client.js, and store.js wire together
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
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

Single-process CLI, no network services, no database, no build step — the whole
"architecture" is four ESM modules imported directly by the entrypoint.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint)"]
    Logger["src/logger.js\n(logger, setLevel)"]
    ApiClient["src/api-client.js\n(ApiClient class)"]
    Store["src/store.js\n(settings Map)"]
    Test["test/logger.test.js"]
    Upstream[["https://api.teamboard.example.com/v1\n(external HTTP, hardcoded)"]]

    CLI -->|"logger.info/debug/error, setLevel"| Logger
    CLI -->|"new ApiClient(), listTasks(page)"| ApiClient
    CLI -->|"allSettings(), getSetting()"| Store
    ApiClient -->|"logger.warn on retry"| Logger
    ApiClient -->|"fetch()"| Upstream
    Test -->|"setLevel()"| Logger
```

Notes on the non-obvious edges:
- `ApiClient` imports `logger` only to log retry warnings — it never touches `store.js`, so `baseUrl`/`region` are constructor-time values, not settings-driven.
- `store.js` is read by `index.js` directly (`allSettings()`, `getSetting('retention.days')`); nothing else in `src/` touches it.
- The only test (`test/logger.test.js`) exercises `logger.js` in isolation; `api-client.js`, `store.js`, and `index.js` have no test coverage.
