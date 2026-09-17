---
name: architecture
description: Module graph of the CLI — what imports what, and what talks to the network
type: knowledge
scope: global
updated: '2026-09-17'
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

Despite the project name, this is not a client/server web app — it's a single
flat CLI package under `src/`, with no database and no network server of its
own.

```mermaid
flowchart TD
  CLI["src/index.js<br/>CLI entrypoint"] --> Logger["src/logger.js<br/>levelled logger"]
  CLI --> ApiClient["src/api-client.js<br/>ApiClient class"]
  CLI --> Store["src/store.js<br/>in-memory settings Map"]
  ApiClient --> Logger
  Test["test/logger.test.js"] --> Logger
  ApiClient -. "fetch() over HTTPS" .-> External["api.teamboard.example.com<br/>(external, hardcoded base URL)"]
```

- `src/index.js` is the only file with fan-out; it directly imports and calls
  all three peer modules.
- `src/api-client.js` is the sole module that reaches outside the process
  (via the global `fetch`), and it logs through `src/logger.js` on retry.
- `src/store.js` holds settings only in a module-level `Map` — nothing is
  persisted to disk or a database, so there is no data-model page for this
  repo.
- `test/logger.test.js` is the only test file and exercises `src/logger.js`
  exclusively.
