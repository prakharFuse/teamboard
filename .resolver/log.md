2026-08-11 · first-run · created .resolver
f603b228-8c55-4c5d-8983-b1126609b55e: correct knowledge/gotchas.md — DELETE /api/members/:id now soft-deletes (is_active=0, email prefixed deactivated-) instead of hard-deleting; documented idempotency and email-reuse implications
f603b228-8c55-4c5d-8983-b1126609b55e: correct knowledge/data-model.md — is_active is now actually written on delete (soft-delete), no longer vestigial
