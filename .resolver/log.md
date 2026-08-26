2026-08-26 · first-run · created .resolver

- Added knowledge pages: overview, architecture, data-model.
- Added convention pages: testing, api-routes.
- Key finding surfaced across pages: `server/src/routes/members.test.ts`'s department-validation test is intentionally RED pending TM-105 — documented so it isn't mistaken for a regression or "fixed" by weakening the test.
- Key finding: `is_active` column implies soft delete but `DELETE /api/members/:id` hard-deletes rows; no code path ever deactivates a member.
