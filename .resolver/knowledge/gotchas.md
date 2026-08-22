---
name: gotchas
description: Route-order and CSV-export traps in members.ts that are easy to break silently
type: knowledge
scope:
  - server/src/routes/**
updated: 2026-08-12 (IONE-959)
captured_sha: 1200413d009895f880bb480e9b74194c0f6b3934
sources:
  - server/src/routes/members.ts
---

## Route order is load-bearing

`GET /export` and `GET /stats` (`members.ts:48`, `members.ts:60`) are declared
*before* `GET /:id` (`members.ts:71`). Express matches routes in declaration
order, so if `/:id` moved above them, requests to `/api/members/export` and
`/api/members/stats` would instead hit the `:id` handler with `id = "export"`
/ `"stats"` — `Number("export")` is `NaN`, the `SELECT ... WHERE id = ?` finds
nothing, and the client would get a `404 Member not found` instead of the CSV
or stats payload. Any new static sub-path under `/api/members/*` must be added
above `/:id`, not below.

## CSV export has no field escaping

`GET /export` (`members.ts:52`) builds CSV by straight template-string joining:
`` `${r.id},${r.name},${r.email},...` ``. `department` is now constrained to
the `VALID_DEPARTMENTS` allowlist (TM-105, see `[[api-style]]`) so it can't
carry a stray comma/quote, but `name` and `email` are still free text and
unvalidated — a member whose `name` contains a comma, quote, or newline will
still silently shift columns in the downloaded file rather than error. There's
no test covering this today; if you add name validation, consider whether it
should also constrain these characters, or add proper CSV quoting in the
export handler.
