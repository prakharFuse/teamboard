---
name: architecture
description: Module call graph of the CLI and its data flow — read before adding a command or module
type: knowledge
scope: global
updated: 2026-09-18 (IONE-959)
captured_sha: 88dd68751303506f969e7b6a8e78fe17799821e0
sources:
  - src/index.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
  - src/bamboohr-client.js
  - src/member-lifecycle.js
  - src/members.js
  - src/sso-client.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/bamboohr-client.js: 928e8c22df39838d0daf4d5e06a660cddb14987c4e7c360907d9d695dcaca0f4
  src/index.js: d0c79ded5c8cd2568f09e86c5b55f92b94b3b92628f1cf3b5607d88e30d77094
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/member-lifecycle.js: f13689c0cc4fba10783791e36abc48a809da296581ba37baa4747b116a553b0f
  src/members.js: 432cb7d63c9a4bc6d5268c12acd304f9df0201f49297d6c9546b592f8c2fe8d8
  src/sso-client.js: e460e4576528e65d9e59b5e41794ad36e70bd7c338f0a374c2d4863c83330cdf
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

Single-process Node CLI, no network server, no database. `src/index.js` is
the entrypoint and imports six other modules. Most of those don't import
each other — the one exception is `member-lifecycle.js`, which imports
`members.js` (the member store) and `mapEmployee` from `bamboohr-client.js`.

```mermaid
flowchart TD
  CLI["src/index.js (CLI entry)"]
  Logger["src/logger.js"]
  Store["src/store.js (in-memory settings)"]
  ApiClient["src/api-client.js (ApiClient)"]
  BambooClient["src/bamboohr-client.js (BambooHrClient, mapEmployee)"]
  SsoClient["src/sso-client.js (SsoClient)"]
  Lifecycle["src/member-lifecycle.js (importFromBambooHR, deactivateMember, reconcilePendingDeprovisions)"]
  Members["src/members.js (in-memory member store)"]
  Upstream[["https://api.teamboard.example.com/v1 (fetch, external)"]]
  Bamboo[["https://api.bamboohr.example.com/v1 (fetch, external)"]]
  Sso[["https://sso.teamboard.example.com/v1 (fetch, external)"]]

  CLI -->|"setLevel(), logger.info/debug/error"| Logger
  CLI -->|"allSettings(), getSetting()"| Store
  CLI -->|"new ApiClient(); listTasks(page)"| ApiClient
  CLI -->|"new BambooHrClient()"| BambooClient
  CLI -->|"new SsoClient()"| SsoClient
  CLI -->|"importFromBambooHR(), deactivateMember(), reconcilePendingDeprovisions()"| Lifecycle
  ApiClient -->|"logger.warn() on retry"| Logger
  ApiClient -->|"fetch(baseUrl + path)"| Upstream
  BambooClient -->|"logger.warn() on retry"| Logger
  BambooClient -->|"fetch(BASE_URL + path)"| Bamboo
  SsoClient -->|"logger.info() before POST"| Logger
  SsoClient -->|"fetch(BASE_URL + /members/:id/terminate)"| Sso
  Lifecycle -->|"logger.info/error"| Logger
  Lifecycle -->|"getMember, getMemberByExternalId, upsertMember, allMembers"| Members
  Lifecycle -->|"mapEmployee(raw)"| BambooClient
  Lifecycle -->|"client.fetchDirectory()"| BambooClient
  Lifecycle -->|"ssoClient.deprovision(id)"| SsoClient
```

Notes on edges that aren't obvious from the diagram:

- `ApiClient`, `BambooHrClient`, and `SsoClient` are all instantiated fresh in
  `index.js` per command invocation; none is a singleton and none holds
  state beyond its constructor args (`baseUrl`/`region`, `apiKey`, `token`).
- `store.js`'s settings map and `members.js`'s member map (`members` +
  `byExternalId`) are both module-level (`new Map()`), so each is a
  process-global singleton for the CLI's lifetime — same pattern, two
  independent stores that never reference each other.
- `member-lifecycle.js` never constructs `BambooHrClient`/`SsoClient`
  itself — `client` and `ssoClient` are always passed in by the caller
  (`index.js` in production, a fake object in tests). This is the only
  place in the app that uses constructor/param dependency injection instead
  of a module importing a concrete class directly.
- `logger.js` picks stdout vs stderr per call (`warn`/`error` → stderr,
  `debug`/`info` → stdout) based on level, not on any config.
- `deactivateMember` calls `ssoClient.deprovision` synchronously as part of
  deactivation; on failure it records `deprovisionPendingSince` on the
  member instead of throwing, and `reconcilePendingDeprovisions` is the only
  code path that retries those — it is not triggered automatically, only by
  the `members:reconcile-sso` CLI command.
