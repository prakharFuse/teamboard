# Project Overview

- Single-process Node CLI (`teamboard`), entry point `src/index.js`. No server, no database, no build step, no third-party dependencies.
- Plain ESM JavaScript throughout — don't introduce TypeScript or a build step.

# Environment & Config

- There is no centralized config file. The README's claim that env vars are read in `src/config.ts` is stale — that file does not exist. Grep `process.env` under `src/` to find the current set of env vars.
- `src/bamboohr-client.js` reads `BAMBOOHR_API_KEY` and `src/sso-client.js` reads `SSO_API_TOKEN`, each directly in its own constructor.

# Testing

- Run tests with `node --test`. There is no external test framework — don't add one (e.g. Jest/Mocha) or its config.
- `store.js` and `members.js` are process-global singletons (module-level `Map`s). Tests that touch `members.js` must call `resetMembers()` at the start of every `test(...)` block, or state leaks between tests.
- Test new HTTP clients by injecting a fake `fetchImpl` into the constructor (e.g. `new BambooHrClient({ fetchImpl, apiKey })`) rather than mocking the global `fetch`.
- `store.js`, `api-client.js`, and `index.js` currently have no tests — that's a known, accepted gap, not something to silently "complete" as part of an unrelated task.

# Coding Style

- New HTTP clients should accept an injectable `fetchImpl` (default: global `fetch`) and read their credential from `process.env` in the constructor, following `bamboohr-client.js`/`sso-client.js` — not `api-client.js`, which hardcodes a direct global `fetch` call and is intentionally untestable that way.
- Code that orchestrates multiple clients (like `member-lifecycle.js`) should receive its collaborators (e.g. `client`, `ssoClient`) via constructor/function params from the caller, rather than importing and instantiating concrete classes directly.

# Known Gotchas

- `logger.js` routes `warn`/`error` to stderr and `debug`/`info` to stdout based on level, not config — don't assume all log output goes to stdout.
- `BambooHrClient` fails fast (no retry) on 401/403 responses, unlike `ApiClient`, which retries with backoff.
- `SsoClient` treats any 204/empty-body `res.ok` response as success and does not call `res.json()` on it.
- `deactivateMember` calls `ssoClient.deprovision` synchronously but does not throw on failure — it records `deprovisionPendingSince` on the member instead. Nothing retries that automatically; only the `members:reconcile-sso` CLI command does.

# Fixture Notes

- IMPORTANT: Some files in this repo carry an intentionally preserved flaw — but only when the file literally has a `FIXTURE NOTE` comment. Never assume a file is off-limits for fixes just because a neighboring or similar file is; check for the actual `FIXTURE NOTE` label before treating something as a deliberate imperfection to leave alone.
