2026-09-04 · first-run · created .backlogzero
dc4de567: regenerate knowledge/gotchas.md — TM-105 department validation landed in members.ts, CI-red claim is now stale
dc4de567: regenerate knowledge/data-model.md — department is now app-level enum-validated (VALID_DEPARTMENTS) though still no DB CHECK constraint; refreshed shifted line refs
2026-09-04 · dc4de567-b4f6-41d0-82f0-c65b06cea3aa · corrected knowledge/gotchas.md — server/src/routes/members.test.ts:4-11 is stale (POST /api/members and PATCH /api/members/:id now validate department against VALID_DEPARTMENTS and return 400 for invalid values (members.ts:16-24,42-45,107-110).)
2026-09-04 · dc4de567-b4f6-41d0-82f0-c65b06cea3aa · corrected knowledge/gotchas.md — .github/workflows/ci.yml:3-7 is stale (Department validation has landed in members.ts, so the previously-red test should now pass.)
