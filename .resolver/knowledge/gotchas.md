---
name: gotchas
description: Non-obvious behaviors in the members API — read before modifying DELETE, PATCH, export, or department handling
type: knowledge
scope: global
updated: 2026-08-11 (IONE-959)
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/src/routes/members.ts
  - server/src/routes/members.test.ts
  - .github/workflows/ci.yml
---

- **`DELETE /api/members/:id` is a permanent hard delete, not a soft delete.** The `members` table has an `is_active` flag and the list/stats queries filter on `is_active = 1`, which looks like the schema was designed for soft deletes — but the DELETE handler runs `DELETE FROM members WHERE id = ?` (`server/src/routes/members.ts:115`) and no route anywhere sets `is_active = 0`. If a change is meant to make removal reversible, it needs to switch this to an `UPDATE ... SET is_active = 0`, not just rely on the existing column.
- **`PATCH /api/members/:id` can't update `start_date` or `is_active`.** Only `name`, `email`, `role`, `department` are destructured from the body and written (`server/src/routes/members.ts:92-101`); any other field silently no-ops. Diverges from `../../CLAUDE.md`, which describes the endpoint generically as "update member fields" without this restriction.
- **CSV export doesn't escape field values.** `GET /api/members/export` builds rows with plain template-string interpolation (`server/src/routes/members.ts:52-54`) — a `name` or `department` containing a comma, quote, or newline will corrupt the CSV structure for the "HR integration" this endpoint exists for.
- **Department has no server-side validation** — `POST /api/members` accepts any non-empty string as `department` (`server/src/routes/members.ts:26-31`). `server/src/routes/members.test.ts:70-85` has a test asserting invalid departments get `400`, and it is *intentionally* failing on `main` (see the test file's own header comment and `.github/workflows/ci.yml`'s comment) to track ticket TM-105. Don't treat this red test as an accidental regression — it's the expected baseline until department validation is implemented.
- **No request-body validation beyond presence checks** — `POST /api/members` only checks the five required fields are truthy (`server/src/routes/members.ts:28`); there's no email-format or date-format validation server-side (the client's `<input type="email">` / `type="date"` are the only guardrails, and those are trivially bypassed by calling the API directly).
