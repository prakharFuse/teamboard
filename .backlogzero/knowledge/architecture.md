---
name: architecture
description: Real module shape of the CLI and how the four source files call each other
type: knowledge
scope: global
updated: 2026-09-17 (IONE-959)
captured_sha: a22cf770a237002cf84ea8aa9b3727e5cba8abc9
sources:
  - src/index.js
  - src/server.js
  - src/members-router.js
  - src/members-store.js
  - src/auth.js
  - src/logger.js
  - src/store.js
  - src/api-client.js
sources_sha256:
  src/api-client.js: c44bb95a43cdf4ed0873db16cb31b8a3c2f39528ca13e0ed72dc9cd39b3dd01c
  src/auth.js: c8938490036a55911f2be42edd1a6a6b39e44b78ae71c031b6b155a00253df7a
  src/index.js: b7aefa54197edbf1f8b2cde8b14dee528b392e0dcc3beb6d8361ba8ca00931c6
  src/logger.js: a29b88a18c23737f5f9215512159f9cbfe4476eca88c6e5dfd895dc5cfc5920b
  src/members-router.js: 40d168abbaffba79a920cc457b7277e1c6b21f78c6f556226c72b393e862210f
  src/members-store.js: 4bd22c3c27ae6bfce5f10f53f1f31b94e8c3978714013d1ee1f34829cd60796d
  src/server.js: 2cca4b7749fe550814e752a0fa766f8b4665ec5ffd3dadda7569131a8b59557c
  src/store.js: 8f8528bccd22f7a8989e9df6bb7368e04f8678a5ecd44480ba3a0100189db4bc
---

CLI + HTTP server split, eight modules, still no database — everything is in-memory.

```mermaid
flowchart TD
    CLI["src/index.js\n(CLI entrypoint, arg parsing)"]
    Logger["src/logger.js\n(levelled logger)"]
    Store["src/store.js\n(in-memory settings Map)"]
    ApiClient["src/api-client.js\n(ApiClient class)"]
    Upstream[["https://api.teamboard.example.com/v1\n(external, hardcoded)"]]
    Server["src/server.js\n(node:http listener)"]
    Router["src/members-router.js\n(route matching + JSON responses)"]
    MembersStore["src/members-store.js\n(in-memory members array)"]
    Auth["src/auth.js\n(bearer-token check)"]

    CLI -->|"setLevel(), logger.info/debug/error"| Logger
    CLI -->|"allSettings(), getSetting()"| Store
    CLI -->|"new ApiClient(); listTasks()"| ApiClient
    CLI -->|"serve command: startServer()"| Server
    ApiClient -->|"logger.warn() on retry"| Logger
    ApiClient -->|"fetch()"| Upstream
    Server -->|"handleMembersRequest()"| Router
    Router -->|"countActiveMembers()"| MembersStore
    Router -->|"isAuthorized()"| Auth
    Router -->|"logger.debug() per request"| Logger
```

Notes on edges that aren't obvious from file names:

- `src/index.js`'s `tasks` command is the only path that touches `ApiClient`; the `serve` command is the only path that touches `src/server.js`. `status` and `help` touch neither.
- `ApiClient.request()` calls back into `logger.warn` on every retry attempt, so `logger.js` now has three callers (`index.js`, `api-client.js`, `members-router.js`), not one.
- `src/server.js` has no route-matching logic of its own — it builds a `URL` from the request and delegates entirely to `members-router.js#handleMembersRequest`, falling back to a bare 404 if that returns false.
- `src/members-store.js` is a second, independent in-memory store from `src/store.js` — don't conflate them. `store.js` holds CLI settings (a `Map`); `members-store.js` holds the members array backing the HTTP API.
- `process.env.TEAMBOARD_API_TOKEN` is read in two places that don't share code: `src/auth.js#isAuthorized` (the actual check, via `timingSafeEqual`) and `src/index.js`'s `serve` command (a startup warning only, if unset). There is still no `src/config.ts` centralizing this — see the divergence note in [[overview]].
