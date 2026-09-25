---
name: architecture
description: Module call graph for the CLI — read before touching src/index.js wiring
type: knowledge
scope: global
updated: 2026-09-25 (IONE-959)
captured_sha: 18ba83de44f5251f500db381b15a7b931b7a0c52
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

Four modules, no external network in tests, no database. `src/index.js` is
the only entrypoint; the other three are leaf-ish modules it wires together.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint, arg parsing)"]
    LOGGER["src/logger.js\n(levelled console logger)"]
    STORE["src/store.js\n(in-memory settings Map)"]
    API["src/api-client.js\n(HTTP client, fetch + retry)"]
    UPSTREAM[["upstream task API\n(https://api.teamboard.example.com/v1)"]]

    CLI -->|logger.info/debug/error| LOGGER
    CLI -->|allSettings, getSetting| STORE
    CLI -->|new ApiClient, listTasks| API
    API -->|logger.warn on retry| LOGGER
    API -->|fetch| UPSTREAM
```

Notes on edges that aren't obvious from the diagram alone:

- `api-client.js` depends on `logger.js` (it logs a warning on every retry),
  but `store.js` and `api-client.js` never import each other — the `tasks`
  command in `index.js` reads `retention.days` from the store purely to log
  it, it doesn't pass it into the `ApiClient` request.
- There's no route from `store.js` to `api-client.js` or vice versa — the
  settings store and the HTTP client are independent; only `index.js` touches
  both.
- No test file exercises `api-client.js` or `store.js` — see
  [[conventions-testing]].
