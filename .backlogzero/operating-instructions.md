# Repository Overview

- Teamboard is a deliberately small fixture repository used by a journey-test suite to give agents a real repo to plan against, clone, branch, and open PRs on — it is not a real product.
- Several files contain `FIXTURE NOTE` comments marking issues that are intentionally planted for specific tickets. Don't "fix" these as drive-by cleanups unless the task explicitly asks for it — doing so removes the subject a planned ticket needs.

# Fixture Issues — Do Not Fix Incidentally

- The `# Teambaord` typo on README.md line 1 is intentional (subject of an easy-tier ticket).
- The hardcoded/scattered config in `src/api-client.js` (`baseUrl`, `region`, retry count, request timeout, backoff base, page size) is intentional — it's the subject of a complex-tier ticket about auditing and centralizing config.
- `currentLevel` hardcoded to `'info'` in `src/logger.js` is intentional and part of that same config-centralization fixture; don't move it into a config module unless that's the task.
- The absence of a `--quiet` CLI flag in `src/index.js` is intentional — it's the subject of a medium-tier ticket expecting it wired to `src/logger.js`'s level concept plus a unit test in `test/logger.test.js`.
- The global (non-per-tenant) settings `Map` in `src/store.js` is intentional — it's the subject of a complex-tier ticket to migrate it to a per-tenant schema.
- README.md's reference to `src/config.ts` is stale — no such file exists anywhere in the tree. Don't restore it or assume it exists unless a task asks you to; env vars (e.g. `TEAMBOARD_API_TOKEN`) are read directly in `src/auth.js` and `src/index.js` with no centralizing config module.
- Prefer the smallest possible diff for whatever ticket you're given, and treat any other rough edge you notice as intentional unless told otherwise.

# Running & Testing

- `npm install` — no external dependencies.
- `npm start -- --help` / `npm start -- serve` (serve starts the members API on `127.0.0.1:3000`).
- `npm test` runs `node --test` — this repo uses Node's built-in `node:test` + `node:assert`, not Jest/Mocha/Vitest.
- `package.json` declares `"type": "module"` — all source is ESM; relative imports must include the `.js` extension.
- The `serve` command requires `TEAMBOARD_API_TOKEN` in the environment. Without it, every request to `GET /api/members/count` gets a `401`; startup only logs a warning (not an error) when it's unset, and the server still starts.
- Tests that mutate module-level shared state (env vars, in-memory stores) must snapshot the original value before mutating and restore it in `afterEach`/`after`, following the existing pattern used for env vars and store contents. Do this for any new test touching shared state to avoid leaking it into later tests in the same file.

# Code Style

- No TypeScript: despite README's mention of `src/config.ts`, every source file is plain `.js`. Don't introduce `.ts` files without also adding a build/type-check step — none exists (no `tsconfig.json`, no `typescript` dependency).
- Prefer plain functions over classes. Use a class only for a component that holds instance state and does networking (as `ApiClient` does); stateless helpers and simple stores should be plain functions/objects.
- New files under `src/` should open with a short `/** ... */` purpose comment; only add a `FIXTURE NOTE` paragraph if you are deliberately planting or documenting fixture behavior.
- Don't add try/catch inside `store.js` or `logger.js` — by design they have none, and let errors propagate to the caller. The only global error handling is the top-level `main().catch(...)` in `src/index.js` (`logger.error('fatal', ...)`).

# Architecture Notes

- `src/store.js` (CLI settings, a `Map`) and `src/members-store.js` (the HTTP members API's array) are two independent in-memory stores — don't conflate them.
- `TEAMBOARD_API_TOKEN` is read in two places with no shared code: `src/auth.js#isAuthorized` (the actual check, via `timingSafeEqual`) and `src/index.js`'s `serve` command (a startup warning only).
