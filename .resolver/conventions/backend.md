---
name: backend
description: Express/SQLite route conventions not spelled out in CLAUDE.md — sync handlers, route ordering, error handling
type: convention
scope:
  - server/src/**
updated: '2026-08-14'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/index.ts
---

CLAUDE.md already states the two hard rules (JSON `{ "error": string }` responses, parameterized SQL over string concatenation) — follow those. This page adds what isn't written down.

- **Handlers are synchronous, not async.** `node:sqlite`'s `DatabaseSync` API (`db.prepare(...).run/get/all`) is fully synchronous — every route in `members.ts` returns `void`, not `Promise<void>`, and none use `await`. Don't introduce `async`/`await` around DB calls; there's nothing to await, and a query still blocks the event loop either way.
- **No centralized error-handling middleware.** `server/src/index.ts` registers no error-handling middleware after the router. Any handler that can throw (e.g. a `UNIQUE` constraint violation, as in `POST /`) must catch it locally and translate it into a JSON `{ "error": ... }` response itself — otherwise the request falls through to Express's default HTML error page. See [[gotchas]] for the one route (`PATCH /:id`) that currently misses this.
- **Route ordering matters.** `router.get('/export')` and `router.get('/stats')` are declared before `router.get('/:id')` so literal paths aren't swallowed by the `:id` param route. Any new fixed-path route on `members` must be added above `/:id`, not below it.
