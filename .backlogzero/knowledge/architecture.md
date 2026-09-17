---
name: architecture
description: Module shape of the CLI — how src/index.js wires together logger, api-client, and store
type: knowledge
scope: global
updated: '2026-09-17'
captured_sha: 972029cfa19a16e34755d00407a08b3b0542cf5c
sources:
  - src/index.js
  - src/logger.js
  - src/api-client.js
  - src/store.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/index.js: 9241d38dbfa7785b542423031a6c0f2b9b5a1942304c1fcec2555f1272caf82f
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single-process Node CLI, no build step, no network services of its own. The only outbound
network call is `ApiClient.request` hitting an external (unimplemented/mock) task API.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint)"] -->|logger.info/debug/error| Logger["src/logger.js"]
    CLI -->|new ApiClient / listTasks| Client["src/api-client.js\n(ApiClient)"]
    CLI -->|allSettings / getSetting| Store["src/store.js\n(in-memory settings)"]
    Client -->|logger.warn on retry| Logger
    Client -->|fetch| ExternalAPI[("https://api.teamboard.example.com/v1\n(external, not part of this repo)")]
```

Notes:
- `ApiClient` depends on `logger` (to log retry warnings) but not on `store` — the CLI is what
  reads `store.getSetting('retention.days')` and passes nothing to the client from it (the
  setting is read but not actually threaded into the request today).
- `store.js` is read/written only from `index.js` in the current code; nothing else imports it.
- There is no persistence layer — `store.js`'s `Map` resets on every process start.
