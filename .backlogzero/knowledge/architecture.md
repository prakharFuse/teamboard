---
name: architecture
description: Module-level call graph of the CLI — read to see how index/logger/api-client/store connect
type: knowledge
scope: global
updated: '2026-09-18'
captured_sha: 605e18e9f773ad15b3e0009302ccc07b31b620a0
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

Single-process CLI, no server, no database. Everything runs synchronously in
one `node` invocation.

```mermaid
flowchart LR
  CLI["src/index.js<br/>CLI entrypoint"] --> Logger["src/logger.js<br/>logger / setLevel"]
  CLI --> Store["src/store.js<br/>allSettings / getSetting"]
  CLI --> ApiClient["src/api-client.js<br/>ApiClient"]
  ApiClient --> Logger
  ApiClient -->|"fetch()"| Upstream[("upstream task API<br/>api.teamboard.example.com/v1")]
```

- `index.js` is the only file that imports the other three; `logger.js` and
  `store.js` never import each other.
- `ApiClient.request()` retries up to 3 times against the upstream URL with
  exponential backoff, logging each retry via `logger.warn`. The upstream host
  is a hardcoded placeholder (`api.teamboard.example.com`) — there is no real
  server behind it, and none is expected in this repo.
- No routing, no persistence layer, no client/server split. Treat any mention
  of `client/`, `server/`, SQLite, or Express as belonging to a different
  project — this repo has none of that.
