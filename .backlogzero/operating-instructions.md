# Teamboard — Operating Instructions

## What this repo is
- Teamboard is the journey suite's **fixture repository**, not a real product — it exists so automated planning/agent journeys have a small real repo to clone, branch, and open PRs against.
- Runtime is a single Node.js CLI: no server, no database, no framework, and no network service of its own. The only outbound dependency is `ApiClient`, which calls a hardcoded external upstream URL.
- Plain ESM (`"type": "module"`) with no build step. Run commands with `npm start -- <command>` (equivalent to `node src/index.js <command>`).
- The README's "Configuration" section (claiming settings are read from `src/config.ts` via environment variables) is stale/aspirational — no such file exists and there is no `process.env` usage anywhere in `src/`. Don't trust that section; settings currently come only from hardcoded defaults in `src/store.js`.

## FIXTURE NOTE convention — read before "fixing" anything
- Source files carry `FIXTURE NOTE:` comments marking deliberately planted flaws that are the "answer key" for specific future tickets. Things that look like debt (magic numbers, a global non-tenant store, a misspelled README heading, a bare-bones arg parser) are intentional bait, not oversights.
- Known planted flaws: `ApiClient`'s hardcoded magic numbers/URL (subject of a future "centralize config" ticket), the logger level concept and CLI arg parser (scaffolding for a future `--quiet` flag ticket), the global non-tenant `Map` store in `src/store.js` (the "before" state for a future per-tenant migration), and the "Teambaord" typo in the README H1 (the easy-tier fixture).
- If an unrelated change would incidentally resolve one of these planted issues as a side effect, stop and reconsider scope — only make that specific change when a ticket explicitly asks for it.

## Code style and testing
- Imports always include the explicit `.js` extension (e.g. `import { logger } from './logger.js'`), even though there is no linter/formatter/CI to enforce it.
- Tests use Node's built-in `node:test` + `node:assert/strict`; run them with `npm test` (which runs `node --test`). Do not add Jest/Mocha/Vitest.
- Test files live under `test/` and mirror the source file name they cover (e.g. `test/logger.test.js` tests `src/logger.js`).
- Top-level CLI errors are caught in `main()` and reported via `logger.error(...)` plus `process.exitCode = 1` — don't let errors escape as raw stack traces.

## Non-obvious runtime behavior
- The `status` command reads settings via `store.js` and never touches `ApiClient`.
- The `tasks` command reads the `retention.days` setting only to log it — it is not passed into `ApiClient.listTasks`, so changing that default does not change request behavior.
- `ApiClient` logs its own retry attempts through the shared logger, so passing `--verbose` (which sets the log level to `debug`) also surfaces retry noise from `ApiClient`.
