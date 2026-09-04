---
name: gotchas
description: Known-red CI test and other non-obvious behavior that looks broken but is either intentional or unvalidated — check before touching members.ts or CI
type: knowledge
scope: global
updated: 2026-09-04 (IONE-959)
captured_sha: 75706bc42081782421d5e7c783f52bc2ae0b0931
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
sources_sha256:
  .github/workflows/ci.yml: acffa74f2e2aae2392bbea0dd1634a68d7c481e0f4cad5a4917de1fb084e1c9e
  server/src/routes/members.test.ts: bee34fee976eede5a69b4a7b8423a5c9aa29bd49b21bd5001f427e7ff7c59efa
  server/src/routes/members.ts: 5ad470f2eac50a7fec73d2ddf95842dd87f2d33de9a8d4d1c4e55ba242d2a3a2
diverges_from:
  - source: server/src/routes/members.test.ts:4-11
    claim: The 'rejects an invalid department' test is intentionally RED on main because POST /api/members performs no department validation, pending TM-105.
    reality: POST /api/members and PATCH /api/members/:id now validate department against VALID_DEPARTMENTS and return 400 for invalid values (members.ts:16-24,42-45,107-110).
    authority: code
    detected: '2026-09-04'
    run: dc4de567-b4f6-41d0-82f0-c65b06cea3aa
  - source: .github/workflows/ci.yml:3-7
    claim: CI comment states the members API contract test is RED until department validation lands (TM-105).
    reality: Department validation has landed in members.ts, so the previously-red test should now pass.
    authority: code
    detected: '2026-09-04'
    run: dc4de567-b4f6-41d0-82f0-c65b06cea3aa
---

- **TM-105 has landed: department validation now exists.** `server/src/routes/members.ts:16-24` defines `VALID_DEPARTMENTS`, and both `POST /api/members` (`:42-45`) and `PATCH /api/members/:id` (`:107-110`) reject any `department` not in that set with a `400`. This resolves the previously-red CI check — the docblock in `server/src/routes/members.test.ts:1-15` and the comment in `.github/workflows/ci.yml:1-7` still describe the 'rejects an invalid department' test as intentionally RED pending TM-105, but that's now stale since the fix landed.
- `POST /api/members` still does no format validation beyond presence checks (`server/src/routes/members.ts:37-38`) — `email` only has to be a non-empty string; the only email-format-adjacent guard is the DB-level `UNIQUE` constraint (409 on collision), not shape validation.
- `PATCH /api/members/:id` accepts a new `email` with no uniqueness handling — unlike `POST`, it doesn't catch the `UNIQUE` constraint violation, so patching to a duplicate email will throw an unhandled DB error instead of returning a clean `409`.
- See [[data-model]] for the related `is_active`/hard-delete divergence.
