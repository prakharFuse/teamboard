# ROLLOUT.md — TeamBoard Multi-Workspace Cutover Plan

This document is the authoritative runbook for the TEAM-8 workspace rollout.
Follow each phase in order. Do **not** skip ahead.

---

## Table of Contents

1. [Migration Steps (All 7 Phases)](#1-migration-steps-all-7-phases)
2. [Feature-Flag Enable Procedure](#2-feature-flag-enable-procedure)
3. [Feature-Flag Disable Procedure](#3-feature-flag-disable-procedure)
4. [Per-Phase Rollback](#4-per-phase-rollback)
5. [X-Workspace-Id Backward-Compatibility Window](#5-x-workspace-id-backward-compatibility-window)
6. [Global Email UNIQUE Constraint Assumption](#6-global-email-unique-constraint-assumption)

---

## 1. Migration Steps (All 7 Phases)

### Prerequisites (all phases)

```bash
# Confirm Node.js >= 22.5.0 (required for node:sqlite)
node --version

# Confirm pnpm is available
pnpm --version

# Install dependencies (idempotent)
pnpm install

# Type-check the full monorepo
pnpm typecheck
```

---

### Phase 1 — Data Isolation

**Goal:** Introduce the `workspaces`, `departments`, and `audit_log` tables; add
`workspace_id` to `members`; backfill all existing members into the "Parent Co"
workspace (id = 1).

**Timing:** Run during a maintenance window. The migration is applied automatically
when the server starts via `runMigrations()` in `db.ts`.

#### Step-by-step

```bash
# 1. Build the TypeScript (compiles migrations into dist/)
pnpm build

# 2. Run the migration test suite to verify 001 and 002 up/down pass
pnpm test

# 3. Back up the production database before starting the server
cp data/team.db data/team.db.pre-phase1-$(date +%Y%m%d%H%M%S)

# 4. Start the server — runMigrations() applies 001 and 002 automatically
pnpm start
```

#### Verification checkpoints

```bash
# Confirm schema_migrations table records both migrations
sqlite3 data/team.db "SELECT * FROM schema_migrations ORDER BY name;"
# Expected: 001_add_workspaces, 002_add_feature_flags

# Confirm workspaces table has the four workspace rows
sqlite3 data/team.db "SELECT id, slug, name FROM workspaces;"
# Expected:
#   1 | parent             | Parent Co
#   2 | brightline         | Brightline
#   3 | northstar-logistics | Northstar Logistics
#   4 | helio-studios      | Helio Studios

# Confirm members all have workspace_id = 1
sqlite3 data/team.db "SELECT COUNT(*) FROM members WHERE workspace_id != 1;"
# Expected: 0

# Confirm departments seeded for workspace 1
sqlite3 data/team.db "SELECT COUNT(*) FROM departments WHERE workspace_id = 1;"
# Expected: 9

# Confirm feature_flags default
sqlite3 data/team.db "SELECT * FROM feature_flags;"
# Expected: workspace_switcher_enabled | false
```

---

### Phase 2 — Workspace-Aware Authentication

**Goal:** Every API request now resolves a workspace from the `X-Workspace-Id`
header (defaults to `parent` for backward compat). Okta JWT verification is
enabled on protected routes. Cross-workspace requests are rejected with 403.

#### Step-by-step

```bash
# 1. Set Okta environment variables before starting the server
export OKTA_ISSUER="https://<your-okta-domain>/oauth2/default"
export OKTA_CLIENT_ID="<your-okta-client-id>"

# 2. Build and start
pnpm build
pnpm start
```

#### Verification checkpoints

```bash
# No Authorization header → anonymous user, defaults to parent workspace
curl -s http://localhost:4060/api/members | jq '.[0].workspace_id'
# Expected: 1

# Valid Bearer token for a parent workspace member → 200
curl -s -H "Authorization: Bearer <valid-token>" \
     -H "X-Workspace-Id: parent" \
     http://localhost:4060/api/members | jq 'length'
# Expected: non-zero list

# Valid token but workspace the user does NOT belong to → 403
curl -s -H "Authorization: Bearer <valid-token>" \
     -H "X-Workspace-Id: brightline" \
     http://localhost:4060/api/members
# Expected: {"error":"Forbidden"}

# Invalid / expired token → 401
curl -s -H "Authorization: Bearer bad-token" \
     http://localhost:4060/api/members
# Expected: {"error":"Unauthorized"}

# Okta sign-in endpoint returns workspace list
curl -s -X POST http://localhost:4060/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"idToken":"<valid-id-token>"}' | jq '.workspaces'
# Expected: array of WorkspaceRow objects the user belongs to
```

---

### Phase 3 — Per-Workspace Department Catalogues

**Goal:** Each workspace has its own department code list
(`bamboohr_dept_code_list` column in `workspaces`). POST /api/members validates
the submitted `department` against the workspace's list. The TM-103 validation
continues to apply, now scoped per workspace.

#### Step-by-step

```bash
# 1. Populate bamboohr_dept_code_list for each subsidiary workspace.
#    Example: set Brightline's department codes via sqlite or a one-off script.
sqlite3 data/team.db "UPDATE workspaces
  SET bamboohr_dept_code_list = '[\"Operations\",\"Logistics\",\"Finance\"]'
  WHERE slug = 'brightline';"

# Repeat for northstar-logistics and helio-studios as their HR teams provide codes.

# 2. Rebuild and restart to pick up any server changes
pnpm build && pnpm start
```

#### Verification checkpoints

```bash
# Valid dept code for brightline → 201
curl -s -X POST http://localhost:4060/api/members \
     -H "Content-Type: application/json" \
     -H "X-Workspace-Id: brightline" \
     -d '{"name":"Alice","email":"alice@brightline.example","role":"Manager",
          "department":"Logistics","start_date":"2026-01-01"}' | jq '.id'
# Expected: numeric ID

# Invalid dept code for brightline → 400
curl -s -X POST http://localhost:4060/api/members \
     -H "Content-Type: application/json" \
     -H "X-Workspace-Id: brightline" \
     -d '{"name":"Bob","email":"bob@brightline.example","role":"Engineer",
          "department":"Engineering","start_date":"2026-01-01"}' | jq '.error'
# Expected: error message about invalid department code

# Parent Co (empty list = no restriction) → 201
curl -s -X POST http://localhost:4060/api/members \
     -H "Content-Type: application/json" \
     -H "X-Workspace-Id: parent" \
     -d '{"name":"Carol","email":"carol@parent.example","role":"Designer",
          "department":"Design","start_date":"2026-01-01"}' | jq '.id'
# Expected: numeric ID (parent has 9 dept codes in its list)
```

---

### Phase 4 — Per-Workspace BambooHR Export

**Goal:** `GET /api/members/export?workspace=<slug>` produces a workspace-scoped
CSV. The column order (`id,name,email,role,department,start_date,is_active`) and
TM-101 deactivation rules (Okta `deactivated-` email prefix, column stability)
continue to apply inside every workspace.

#### Step-by-step

```bash
# No schema changes in this phase — server code changes only.
pnpm build && pnpm start
```

#### Verification checkpoints

```bash
# Export for parent workspace
curl -s "http://localhost:4060/api/members/export?workspace=parent" \
     -H "X-Workspace-Id: parent" -o /tmp/parent.csv
head -2 /tmp/parent.csv
# Expected first line: id,name,email,role,department,start_date,is_active
# (no workspace_id column — TM-101 column-stability guarantee)

# Export for brightline
curl -s "http://localhost:4060/api/members/export?workspace=brightline" \
     -H "X-Workspace-Id: brightline" -o /tmp/brightline.csv
# Expected: only brightline workspace members

# Deactivated member email must carry 'deactivated-' prefix (TM-101)
sqlite3 data/team.db \
  "SELECT email FROM members WHERE workspace_id=2 AND is_active=0 LIMIT 1;"
# Expected: deactivated-<original-email>

# Audit log entry for export_download action
sqlite3 data/team.db \
  "SELECT action, workspace_id FROM audit_log WHERE action='export_download' LIMIT 1;"
# Expected: export_download | <workspace_id>
```

---

### Phase 5 — UI Workspace Switcher

**Goal:** A `<select class="workspace-switcher">` appears in the app header —
but **only** when the `workspace_switcher_enabled` feature flag is `'true'`.
Switching workspaces reloads the directory, department filter, stats panel, and
export link in-place without a full page reload.

**Note:** The workspace switcher is deployed but hidden behind the feature flag.
Enable it via the procedure in [Section 2](#2-feature-flag-enable-procedure) only
after Phase 1–4 have been fully validated in production.

#### Step-by-step

```bash
# Deploy the updated client and server builds
pnpm build

# Restart server (migrations already applied in Phase 1)
pnpm start

# The switcher is NOT yet visible — flag is still 'false' (migration default)
```

#### Verification checkpoints

```bash
# Confirm flag is still false
curl -s http://localhost:4060/api/feature-flags | jq '.flags.workspace_switcher_enabled'
# Expected: "false"

# Open http://localhost:5173 in a browser
# The workspace switcher <select> must NOT appear in the header yet.

# (Optional) Enable for a staging environment only:
curl -s -X PATCH http://localhost:4060/api/feature-flags/workspace_switcher_enabled \
     -H "Content-Type: application/json" \
     -d '{"value":"true"}' | jq '.value'
# Expected: "true"

# Refresh the browser → workspace-switcher dropdown now visible in header.
# Switching to a different workspace must update members list, stats, and export link.
```

---

### Phase 6 — Audit Log

**Goal:** Every member create / update / delete and every export download writes
a row to `audit_log` with `actor_email`, `workspace_id`, `action`, `entity_id`,
and `at`. The Compliance team must review the schema before this code is merged
(see `TODO` comment in `server/src/audit.ts`).

> ⚠️ **Compliance gate:** Do not merge the `audit.ts` integration until the
> Compliance team has signed off on the schema (TEAM-8 constraint). Schedule a
> spec-review session with Compliance before enabling Phase 6 in production.

#### Step-by-step

```bash
# No new migration — audit_log was created in Phase 1 (migration 001).
# Server code changes only.
pnpm build && pnpm start
```

#### Verification checkpoints

```bash
# Create a member and verify audit row
curl -s -X POST http://localhost:4060/api/members \
     -H "Content-Type: application/json" \
     -H "X-Workspace-Id: parent" \
     -d '{"name":"Dana","email":"dana@parent.example","role":"Analyst",
          "department":"Finance","start_date":"2026-01-01"}'

sqlite3 data/team.db \
  "SELECT actor_email, workspace_id, action, entity_id FROM audit_log
   ORDER BY id DESC LIMIT 1;"
# Expected: anonymous | 1 | member_create | <new-member-id>

# Update a member and verify audit row (action = member_update)
# Delete a member and verify audit row (action = member_delete, is_active = 0)
# Export and verify audit row (action = export_download)

# Confirm no raw PII outside of actor_email / entity_id in audit_log
sqlite3 data/team.db ".schema audit_log"
# Expected columns: id, actor_email, workspace_id, action, entity_id, at
```

---

### Phase 7 — Rollout & Cutover

**Goal:** Confirm all phases are healthy in production, enable the workspace
switcher feature flag for users, and retire the parallel single-tenant path after
the backward-compatibility window closes.

#### Step-by-step

```bash
# 1. Run the full regression test suite one final time
pnpm test

# 2. Confirm all six prior phases are green in production
#    (use the verification checkpoints above)

# 3. Enable the workspace switcher for production users
#    (see Section 2 below for the full enable procedure)

# 4. Notify the Looker dashboard team and BambooHR weekly exporter teams that
#    X-Workspace-Id support is live; begin the one-quarter countdown
#    (see Section 5 for the compatibility window details)

# 5. Schedule the X-Workspace-Id sunset date (one quarter from go-live)
#    and create a follow-up ticket to remove the default-to-parent fallback.
```

#### Verification checkpoints

```bash
# All feature flags reported
curl -s http://localhost:4060/api/feature-flags | jq .
# Expected: {"flags":{"workspace_switcher_enabled":"true"}}

# Looker dashboard still works without any workspace header (backward compat)
curl -s "http://localhost:4060/api/members?department=Engineering" | jq 'length'
# Expected: non-zero (defaults to parent workspace)

# BambooHR weekly export still works without workspace header
curl -s "http://localhost:4060/api/members/export" -o /dev/null -w "%{http_code}"
# Expected: 200
```

---

## 2. Feature-Flag Enable Procedure

Use this procedure to turn on the workspace switcher for all users in a given
environment.

### Enable command

```bash
curl -X PATCH http://localhost:4060/api/feature-flags/workspace_switcher_enabled \
     -H "Content-Type: application/json" \
     -d '{"value": "true"}'
```

**Expected response:**

```json
{"key": "workspace_switcher_enabled", "value": "true"}
```

### Confirm in the UI

1. Open the TeamBoard app in a browser (`http://localhost:5173` in dev,
   production URL in prod).
2. Perform a hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) to force the client
   to re-fetch `/api/feature-flags`.
3. A `<select>` dropdown labelled with workspace names must appear in the
   top-bar header.
4. Switch to a subsidiary workspace — the member list, department filter, stats
   panel, and export link must all update to reflect the selected workspace
   **without** a full page reload.

### Confirm via API

```bash
curl -s http://localhost:4060/api/feature-flags | jq '.flags.workspace_switcher_enabled'
# Expected: "true"
```

---

## 3. Feature-Flag Disable Procedure

Use this procedure to immediately hide the workspace switcher from the UI,
for example during an incident or a partial rollout rollback.

### Disable command

```bash
curl -X PATCH http://localhost:4060/api/feature-flags/workspace_switcher_enabled \
     -H "Content-Type: application/json" \
     -d '{"value": "false"}'
```

**Expected response:**

```json
{"key": "workspace_switcher_enabled", "value": "false"}
```

### Rollback expectations after disabling

| Concern | Outcome |
|---|---|
| Workspace switcher visibility | Disappears from the header on next page load / flag re-fetch |
| In-flight requests with `X-Workspace-Id` header | Continue to work — middleware is independent of the flag |
| Legacy consumers without `X-Workspace-Id` header | Unaffected — they continue to default to `parent` workspace |
| Data isolation | Unchanged — `workspace_id` columns and FK constraints remain |
| Audit log | Continues to write rows regardless of the flag state |
| Existing workspace data | No data is altered by toggling the flag |

> Disabling the flag does **not** roll back any database migrations. If a full
> data-layer rollback is needed, follow the per-phase rollback procedure in
> [Section 4](#4-per-phase-rollback).

---

## 4. Per-Phase Rollback

Phases must be rolled back in **reverse order** (7 → 1). Never roll back an
earlier phase while a later phase is still active.

---

### Phase 7 Rollback — Disable Cutover

**What to undo:** Disable the feature flag and revert any cutover communication.

```bash
# 1. Disable workspace switcher immediately
curl -X PATCH http://localhost:4060/api/feature-flags/workspace_switcher_enabled \
     -H "Content-Type: application/json" \
     -d '{"value": "false"}'

# 2. Notify Looker and BambooHR teams that the cutover is paused;
#    the X-Workspace-Id sunset clock is stopped.

# 3. No code revert needed — the flag alone gates the UI.
```

---

### Phase 6 Rollback — Audit Log

**What to undo:** Stop writing audit rows. The `audit_log` table is preserved
(data must not be deleted; Compliance may need it for SOC 2 evidence).

```bash
# 1. Revert server/src/routes/members.ts to remove writeAuditLog() call sites.
# 2. Revert server/src/audit.ts import from server/src/index.ts if present.
# 3. Rebuild and restart.
pnpm build && pnpm start

# Verify: new member operations no longer produce audit rows
sqlite3 data/team.db "SELECT COUNT(*) FROM audit_log;" # count should not grow
```

> The `audit_log` table itself (created in migration 001) is only removed as
> part of Phase 1 rollback. Do not drop it during a Phase 6 partial rollback.

---

### Phase 5 Rollback — UI Workspace Switcher

**What to undo:** Hide the switcher (flag disable is sufficient; code revert is
optional).

```bash
# 1. Disable the feature flag (see Section 3)
curl -X PATCH http://localhost:4060/api/feature-flags/workspace_switcher_enabled \
     -H "Content-Type: application/json" \
     -d '{"value": "false"}'

# 2. (Optional) Revert client/src/App.tsx workspace-switcher additions,
#    rebuild the client, and redeploy.
pnpm build && pnpm start
```

---

### Phase 4 Rollback — Per-Workspace BambooHR Export

**What to undo:** Restore the export endpoint to return all-members CSV without
workspace filtering.

```bash
# 1. Revert the workspace-scoping changes in server/src/routes/members.ts
#    (GET /export: remove ?workspace= query-param logic and req.workspace.id filter).
# 2. Rebuild and restart.
pnpm build && pnpm start

# Verify: export returns all members regardless of X-Workspace-Id
curl -s "http://localhost:4060/api/members/export" -o /tmp/all.csv
wc -l /tmp/all.csv  # should equal total member count + 1 (header)
```

---

### Phase 3 Rollback — Per-Workspace Department Catalogues

**What to undo:** Remove per-workspace dept-code validation from POST /api/members.

```bash
# 1. Revert the bamboohr_dept_code_list validation block in
#    server/src/routes/members.ts (POST handler).
# 2. Rebuild and restart.
pnpm build && pnpm start

# Verify: POST /api/members accepts any department value again
curl -s -X POST http://localhost:4060/api/members \
     -H "Content-Type: application/json" \
     -H "X-Workspace-Id: brightline" \
     -d '{"name":"Test","email":"test-rollback@example.com","role":"Tester",
          "department":"AnyDept","start_date":"2026-01-01"}' | jq '.id'
# Expected: numeric ID (no 400)
```

---

### Phase 2 Rollback — Workspace-Aware Authentication

**What to undo:** Remove the `requireAuth` and `resolveWorkspace` middleware from
all `/api/members*` routes. Remove the `/api/auth` and `/api/feature-flags`
route mounts from `server/src/index.ts`.

```bash
# 1. Revert server/src/index.ts to remove middleware mounts.
# 2. Rebuild and restart.
pnpm build && pnpm start

# Verify: /api/members responds without any Authorization or X-Workspace-Id header
curl -s http://localhost:4060/api/members | jq 'length'
# Expected: non-zero list
```

> **Warning:** After this rollback the API no longer enforces workspace
> isolation. Any cross-workspace data access is possible until Phase 1 is also
> rolled back. Communicate this risk to the security team.

---

### Phase 1 Rollback — Data Isolation (migration down)

> ⚠️ **This is destructive.** Running `down()` for migration 001 drops the
> `audit_log`, `departments`, and `workspaces` tables and removes the
> `workspace_id` column from `members`. All audit and department seed data is
> permanently lost. Run only after confirming with Compliance and Engineering
> leadership.

```bash
# 1. Back up the current database FIRST
cp data/team.db data/team.db.pre-rollback-$(date +%Y%m%d%H%M%S)

# 2. Run the migration down() for 001 via a one-off Node script
node -e "
const { DatabaseSync } = require('node:sqlite');
const { down } = require('./dist/server/src/migrations/001_add_workspaces.js');
const db = new DatabaseSync('data/team.db');
down(db);
db.close();
console.log('001 down() complete');
"

# 3. Remove the schema_migrations record so the migration won't be re-applied
sqlite3 data/team.db \
  "DELETE FROM schema_migrations WHERE name = '001_add_workspaces';"

# 4. Run migration 002 down() if needed (feature_flags table)
node -e "
const { DatabaseSync } = require('node:sqlite');
const { down } = require('./dist/server/src/migrations/002_add_feature_flags.js');
const db = new DatabaseSync('data/team.db');
down(db);
db.close();
console.log('002 down() complete');
"
sqlite3 data/team.db \
  "DELETE FROM schema_migrations WHERE name = '002_add_feature_flags';"

# 5. Revert server/src/db.ts, server/src/index.ts, and all routes to their
#    pre-TEAM-8 state, then rebuild.
pnpm build && pnpm start

# Verify: members table no longer has workspace_id column
sqlite3 data/team.db ".schema members"
# Expected: no workspace_id column

# Verify: workspaces / departments / audit_log tables are gone
sqlite3 data/team.db ".tables"
# Expected: members (and schema_migrations if runner table was kept)
```

---

## 5. X-Workspace-Id Backward-Compatibility Window

### What the window covers

For **one quarter** from the Phase 7 go-live date, every `/api/members*` route
treats a **missing `X-Workspace-Id` header** as an implicit request for the
`parent` workspace. No error is returned; the response is identical to sending
`X-Workspace-Id: parent` explicitly.

This ensures the following existing consumers continue to work without
modification during the transition:

| Consumer | Current behaviour | Required change |
|---|---|---|
| Looker dashboards (`GET /api/members?department=X`) | No workspace header sent | None during the window |
| BambooHR weekly exporter (`GET /api/members/export`) | No workspace header sent | None during the window |
| Public directory page | No workspace header sent | None during the window |

### Response-shape guarantee

The TM-102 response shape (`GET /api/members`) and TM-101 CSV column order
(`id,name,email,role,department,start_date,is_active`) are preserved. The
`workspace_id` field is **not** added to the export CSV.

### Sunset date

At the end of the one-quarter window:

1. Remove the `default to 'parent'` fallback in
   `server/src/middleware/workspace.ts` (the line that reads
   `'x-workspace-id'` and defaults to `'parent'` when absent).
2. Return `400 { "error": "X-Workspace-Id header is required" }` for requests
   without the header.
3. Co-ordinate the change with the Looker team and the BambooHR integration team
   so they can add the header before the sunset date.

> Create a follow-up ticket at the start of the window with the sunset date as
> the due date so this does not get forgotten.

---

## 6. Global Email UNIQUE Constraint Assumption

### Current state

The `members` table was created with:

```sql
email TEXT NOT NULL UNIQUE
```

This constraint is **global** — it applies across **all workspaces**. If two
subsidiaries each have an employee with the same email address (e.g., a shared
services employee who exists in both `parent` and `brightline`), the second
`INSERT` will fail with a `UNIQUE constraint failed: members.email` error.

### Implication

TeamBoard currently assumes that **email addresses are globally unique across
all workspaces**. This is a valid assumption when each subsidiary's employees are
distinct legal entities with separate email domains, as described in the TEAM-8
ticket.

### If the assumption breaks

If a future requirement allows the same email to appear in multiple workspaces,
the following schema change is needed:

```sql
-- Remove the global UNIQUE constraint on email
-- and replace it with a per-workspace unique constraint
ALTER TABLE members DROP COLUMN email; -- not supported in SQLite; requires table rebuild
-- New constraint:
UNIQUE(workspace_id, email)
```

This would be a **breaking migration** that requires a new migration file, a
maintenance window, and updates to any code that relies on email as a
globally-unique identifier (e.g., the Okta deactivation email-prefix check in
TM-101).

> **Action required before onboarding a new subsidiary:** Verify with HR that
> no employee email address in the new workspace already exists in the `members`
> table of any other workspace. Run the following query before importing:
>
> ```sql
> SELECT m.email, w.slug
> FROM members m
> JOIN workspaces w ON w.id = m.workspace_id
> WHERE m.email IN (<list of incoming employee emails>);
> ```
>
> If any rows are returned, resolve the conflict with HR before proceeding.
