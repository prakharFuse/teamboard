---
name: architecture
description: Module dependency shape of the teamboard CLI
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

Single-process Node CLI, four modules, no services, no database. All edges
below are plain ESM `import`s verified in the source.

```mermaid
flowchart TD
  CLI["src/index.js<br/>CLI entrypoint"]
  Logger["src/logger.js<br/>levelled logger"]
  Store["src/store.js<br/>in-memory settings"]
  ApiClient["src/api-client.js<br/>ApiClient"]
  Upstream[("api.teamboard.example.com<br/>(hardcoded baseUrl)")]

  CLI --> Logger
  CLI --> Store
  CLI --> ApiClient
  ApiClient --> Logger
  ApiClient -->|fetch, retried 3x| Upstream
```

Notes on the non-obvious edges:

- `ApiClient` logs its own retries through `src/logger.js` (`logger.warn`
  on each failed attempt) — the CLI never sees intermediate retry state,
  only the final result or thrown error.
- `src/store.js` has no consumers besides `src/index.js`; it is not read by
  `ApiClient`, so settings like `retention.days` are looked up in `index.js`
  and passed into `logger.debug` calls, not into the client itself.
- There is no persistence layer — `Store`'s `settings` Map resets on every
  process start; only `DEFAULTS` survives across runs.
