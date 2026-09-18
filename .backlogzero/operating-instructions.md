# Repository Context

This is a **fixture repository** for a journey-test suite, not a real product — it is cloned, branched, and PR'd against by agents resolving synthetic tickets, then reconciled against a seed repo elsewhere. Several things that look like bugs or debt here are deliberately planted as the subject of a fixture ticket. IMPORTANT: do not "fix" a planted issue as a drive-by unless it is specifically the ticket you were given — doing so removes that ticket's reason to exist.

# Planted Issues — Leave Alone Unless That's the Ticket

- `README.md` title "Teambaord" is misspelled on purpose (subject of an easy-tier "fix this typo" ticket).
- `src/api-client.js` has intentionally scattered hardcoded config — `baseUrl`, `region`, retry count (`3`), timeout (`15000`), backoff base (`250 * 2 ** attempt`), and page size (`per_page=50`). This is the subject of a complex-tier "audit and centralize config" ticket — don't preemptively extract a config module.
- `src/store.js` is an in-memory global settings `Map` with no tenant dimension, by design. This is the subject of a complex-tier "migrate to per-tenant" ticket — don't add tenancy speculatively.
- `src/logger.js` has log levels and `src/index.js` has an arg parser, but no `--quiet` flag exists. This is the one planted gap that's a genuine missing feature (medium-tier ticket): if this is your ticket, implement `--quiet` to suppress info-level output for real, and add a unit test in `test/logger.test.js`.
- `README.md` claims env vars are read from `src/config.ts` — that file does not exist, the project has no TypeScript anywhere, and nothing calls `process.env`. Settings are hardcoded as `DEFAULTS` in `src/store.js`. Don't silently "fix" this divergence unless it's the assigned ticket.
- Files with a `FIXTURE NOTE:` comment mark other deliberate planted state — check for one before changing a file's behavior.

# Architecture Gotchas

- This is a single Node.js CLI process — there is no `server/`/`client/` split, no database, and no HTTP server, despite the repo name or README implying otherwise. `ApiClient` is an outbound client to an external task API, not something this repo serves.
- Run the CLI with `npm start -- <command> [--verbose]`; commands are `status`, `tasks`, `help`, with `status` as the default.

# Code Style

- Plain ESM JavaScript (`"type": "module"` in `package.json`). No TypeScript, no bundler, no transpile step — files run directly via `node src/index.js`.
- Stateful singletons are exported as plain functions/objects (e.g. `logger`, `setLevel`, `getSetting`), not classes. `ApiClient` is the one exception, exported as a `class` because it holds per-instance config (`baseUrl`, `region`) rather than shared module state.
- Every `src/*.js` file opens with a `/** ... */` block comment describing the module's purpose.
- Always log through `logger` from `src/logger.js` — never raw `console.log`/`console.error`. `warn`/`error` route to `process.stderr`, everything else to `process.stdout`, gated on the current log level.
- CLI argument parsing is hand-rolled in `parseArgs` (`src/index.js`) — there is no `yargs`/`commander` dependency. Add new flags as extra branches in that same function rather than introducing a parsing library.

# Testing

- Run tests with `npm test` (runs `node --test`, which auto-discovers `test/**/*.test.js`).
- Tests use Node's built-in `node:test` and `node:assert` — there is no Jest, Mocha, or Vitest installed.
- Add one `test/<module>.test.js` file per `src/<module>.js`, importing the source with a relative `../src/<module>.js` path (ESM requires the explicit `.js` extension).
- `src/logger.js` and `src/store.js` hold mutable module-level state (`currentLevel`, the settings `Map`); any test that mutates it must reset it to its default before returning.
- Assert on the exact thrown error message pattern (e.g. `/Unknown log level/`), not just that some error is thrown.