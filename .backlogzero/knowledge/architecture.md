---
name: architecture
description: Module graph of the CLI — what imports what, and what does NOT exist
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
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

Everything is one process. There is no HTTP server, no database, no
client/server split — `src/index.js` is the whole CLI, and `ApiClient`
makes outbound requests to an external (unimplemented, hardcoded) task API.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint, arg parsing)"]
    Logger["src/logger.js\n(levelled console logger)"]
    Store["src/store.js\n(in-memory global settings)"]
    Client["src/api-client.js\n(ApiClient: fetch wrapper)"]
    Remote["https://api.teamboard.example.com/v1\n(external, hardcoded, not in this repo)"]

    CLI -->|"logger.info / .debug / .error"| Logger
    CLI -->|"allSettings() / getSetting()"| Store
    CLI -->|"new ApiClient(); .listTasks()"| Client
    Client -->|"logger.warn on retry"| Logger
    Client -->|"fetch()"| Remote
```

Notes:
- `ApiClient` is the only module that talks to the network; it retries 3
  times with exponential backoff (`250 * 2 ** attempt` ms) and a 15s
  per-attempt timeout — all hardcoded, see [fixture-notes](fixture-notes.md).
- `store.js` is a module-level `Map`, so state is process-lifetime only and
  shared globally — there is no per-tenant or per-request scoping.
- No `config.ts`/`config.js` module exists despite README.md pointing to one
  — see the divergence note in [fixture-notes](fixture-notes.md).
