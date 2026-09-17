---
name: architecture
description: Module shape of the CLI and how the four src/ files talk to each other and the outside world
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
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

Single-process Node CLI, no server and no persistence layer. `src/index.js`
is the only entrypoint (`package.json` `main`/`start`) and is the sole
importer of the other three modules.

```mermaid
flowchart TD
    CLI["src/index.js<br/>(entrypoint, arg parser)"]
    Logger["src/logger.js<br/>(levelled logger)"]
    Store["src/store.js<br/>(in-memory settings Map)"]
    ApiClient["src/api-client.js<br/>(ApiClient class)"]
    Ext[["External task API<br/>api.teamboard.example.com"]]

    CLI -->|"logger.info / .debug / .error"| Logger
    CLI -->|"allSettings() / getSetting()"| Store
    CLI -->|"new ApiClient() / listTasks(page)"| ApiClient
    ApiClient -->|"logger.warn (retry)"| Logger
    ApiClient -->|"fetch()"| Ext
```

## Non-obvious edges

- `ApiClient` depends on `logger` (to log retry warnings) but not on `store`
  — the retention setting `retention.days` is read in `src/index.js` and
  merely logged for the `tasks` command; it is never passed into
  `ApiClient.listTasks`, which always requests `page=1&per_page=50`
  regardless of that setting.
- `store.js` has no consumers other than `src/index.js` (`allSettings()` for
  `status`, `getSetting('retention.days')` for `tasks`). Nothing writes to it
  at runtime today — `setSetting` is exported but currently unused.
