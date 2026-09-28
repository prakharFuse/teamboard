---
name: architecture
description: Module dependency graph for the 4-file src/ tree
type: knowledge
scope: global
updated: 2026-09-28 (IONE-959)
captured_sha: b42191474b6525053cef5db9ec09a07df66fcef9
sources:
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
  - src/hr-export.js
  - package.json
sources_sha256:
  package.json: b0f12c6eb22b4bf7edee1f38c9fca901725565667b3754749d6c6cdf874f0b6c
  src/api-client.js: 7c1eab46f77cea85454e9bd6f821f2e803db8138ddf371a8e2c8265cf62b49e2
  src/hr-export.js: 3afa8c4e63ccad976bc6daab65c203a86c9d2dd6bf51d8d8cb082c42a51aaa2f
  src/index.js: caca8a6de6e4aa9c6403d8eca97c4fe3929ccfe053ac04d87f5204241ade6bea
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single process, no network services, no build step. `package.json` declares
`"type": "module"` and runs straight off `src/index.js` via `node` — there is
no bundler, no TypeScript compile step, no `dist/`.

```mermaid
flowchart TD
  CLI["src/index.js\n(parseArgs, main, printHelp)"]
  Logger["src/logger.js\n(logger, setLevel)"]
  Store["src/store.js\n(getSetting, setSetting, allSettings)"]
  ApiClient["src/api-client.js\n(class ApiClient)"]
  HrExport["src/hr-export.js\n(normalizeDepartment, buildExportRows)"]
  Upstream[["https://api.teamboard.example.com/v1\n(external, hardcoded)"]]

  CLI -->|"import"| Logger
  CLI -->|"import"| Store
  CLI -->|"import, new ApiClient()"| ApiClient
  CLI -->|"import, buildExportRows()"| HrExport
  ApiClient -->|"import"| Logger
  ApiClient -->|"fetch()"| Upstream
```

Notes on the non-obvious edges:

- `ApiClient` is only constructed inside `main()`'s `tasks` and `hr-export`
  command branches (`src/index.js:59`, `src/index.js:67`) — `status` and
  `help` never touch the network.
- The `hr-export` command paginates `client.listMembers(page)` itself
  (`src/index.js:69-76`), looping until a batch comes back shorter than 50 —
  unlike the `tasks` command, which only ever fetches page 1.
- `src/hr-export.js` is a leaf module with no imports at all (not even
  `logger`) — it's pure data transformation (`normalizeDepartment`,
  `buildExportRows`) and is exercised entirely through its own unit tests, not
  through logging output.
- `ApiClient` imports `logger` directly (`src/api-client.js:11`) rather than
  receiving it injected, so retry/backoff logging (`request()`,
  `src/api-client.js:19-39`) always goes through the same global logger
  instance the CLI configures via `setLevel`.
- There is no reverse edge: `logger.js`, `store.js`, and `hr-export.js` have
  no knowledge of each other or of `index.js` — all three are leaf modules.
