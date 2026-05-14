# TeamBoard Multi-Workspace Rollout & Cutover Plan

This document defines the explicit, ordered deployment sequence for rolling out workspace isolation
(TEAM-8) to production. Each step must be completed and verified before proceeding to the next.

---

## BambooHR Credential Naming Convention

Per-workspace BambooHR API keys are provided as environment variables using the following pattern:

```
BAMBOOHR_API_KEY_<SLUG_UPPERCASED>
```

Where `<SLUG_UPPERCASED>` is the workspace slug converted to uppercase, with hyphens replaced by
underscores. Examples:

| Workspace         | Slug                  | Environment Variable                    |
|-------------------|-----------------------|-----------------------------------------|
| Parent Co         | `parent-co`           | `BAMBOOHR_API_KEY_PARENT_CO`            |
| Brightline        | `brightline`          | `BAMBOOHR_API_KEY_BRIGHTLINE`           |
| Northstar Logistics | `northstar-logistics` | `BAMBOOHR_API_KEY_NORTHSTAR_LOGISTICS` |
| Helio Studios     | `helio-studios`       | `BAMBOOHR_API_KEY_HELIO_STUDIOS`        |

---

## Auth Callback Response Shape

The canonical response from `POST /api/auth/callback` on successful authentication:

```json
{
  "token": "<opaque JWT access token string>",
  "workspaces": [
    { "id": 1, "slug": "parent-co",           "name": "Parent Co" },
    { "id": 2, "slug": "brightline",           "name": "Brightline" },
    { "id": 3, "slug": "northstar-logistics",  "name": "Northstar Logistics" },
    { "id": 4, "slug": "helio-studios",        "name": "Helio Studios" }
  ]
}
```

TypeScript shape:

```typescript
{
  token: string;
  workspaces: Array<{ id: number; slug: string; name: string }>;
}
```

Only the workspaces the authenticated user belongs to are included. The list is ordered by name.

---

## Deployment Sequence

### Step 1 — Database Migration & Backfill

**Goal:** Introduce `workspace_id` on all core tables and backfill all existing rows to
`workspace_id = 1` (Parent Co).

#### Pre-migration backup

```bash
# Take a file-level snapshot of the database BEFORE any migration runs.
cp data/team.db data/team.db.pre-migration-$(date +%Y%m%d%H%M%S)
```

Store the backup file outside the application directory (e.g., in a separate S3 bucket or secure
volume) so it survives a container restart.

#### Run migration

```bash
# The migration runs automatically on server startup via applyMigrations() in db.ts.
# To run it manually / in CI:
node -e "require('./server/dist/db').getDb()"
```

The migration performs, in order:

1. Creates the `workspaces` table and seeds the four workspace rows if empty.
2. Renames `members` to `members_backup`.
3. Creates `members` with `workspace_id INTEGER NOT NULL DEFAULT 1` and
   `UNIQUE(email, workspace_id)`.
4. Copies all rows from `members_backup` into `members` (backfill: `workspace_id = 1`).
5. Records the migration in `schema_migrations`.

#### Verification

```sql
-- All members must belong to workspace 1 (Parent Co).
SELECT COUNT(*) FROM members WHERE workspace_id != 1;
-- Expected: 0

-- Backup table must be present and row counts must match.
SELECT COUNT(*) FROM members_backup;
SELECT COUNT(*) FROM members;
-- Both counts must be equal.

-- schema_migrations must record the migration.
SELECT * FROM schema_migrations;
```

#### Rollback

```bash
# Stop the API server first, then restore from the pre-migration backup.
cp data/team.db.pre-migration-<TIMESTAMP> data/team.db
# Restart the server on the OLD (pre-workspace) build.
```

No code changes are needed for rollback — the pre-migration binary does not reference
`workspace_id`.

---

### Step 2 — Deploy API (workspace switcher disabled, Parent Co fallback active)

**Goal:** Ship the workspace-aware API code while keeping all existing consumers working unchanged.
`FEATURE_WORKSPACE_SWITCHER` must remain **unset** (or empty) at this stage.

#### Deploy checklist

- [ ] `FEATURE_WORKSPACE_SWITCHER` is **not set** in the environment (or set to `false`).
- [ ] `OKTA_DOMAIN`, `OKTA_AUTH_SERVER_ID`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`,
      `OKTA_AUDIENCE` are configured.
- [ ] `PORT` is set.
- [ ] Deploy the new server build.

#### Verification — Looker backward compatibility

The Looker dashboard team's unauthenticated (or token-less) calls must still succeed via the
Parent Co header fallback coded in `workspaceContext.ts`:

```bash
# Must return HTTP 200 with shape { members: [...] }
curl -s https://<host>/api/members | jq '{members: .members | length}'
```

Expected response shape (TM-102 contract preserved):

```json
{ "members": [ /* existing member objects */ ] }
```

- The fallback resolves the target workspace to `parent-co` when no `X-Workspace-Id` header or
  `?workspace=` query param is supplied.
- No changes to Looker query configuration are required.

#### Rollback

Redeploy the previous server build. The database schema is fully backward-compatible at this point
(workspace_id column has a default, so old queries still work).

---

### Step 3 — Configure Okta Custom Auth Server

**Goal:** Ensure every issued access token carries the `groups` claim filtered to
`tb-workspace-*` groups, and create the four workspace Okta groups.

#### Okta configuration steps

1. In the Okta Admin Console, open the custom auth server used by TeamBoard
   (`OKTA_AUTH_SERVER_ID`).
2. Navigate to **Claims** → **Add Claim**.
3. Add a claim named `groups`:
   - **Include in token type:** Access Token.
   - **Value type:** Groups.
   - **Filter:** Starts with `tb-workspace-`.
4. Save the claim.

#### Provision the four Okta groups

| Group name                       | Maps to workspace   |
|----------------------------------|---------------------|
| `tb-workspace-parent-co`         | Parent Co           |
| `tb-workspace-brightline`        | Brightline          |
| `tb-workspace-northstar-logistics` | Northstar Logistics |
| `tb-workspace-helio-studios`     | Helio Studios       |

Assign users to the appropriate group(s) to grant workspace access. A user in multiple groups will
see all their workspaces in the switcher.

#### Verification

```bash
# Obtain a test access token and inspect the payload (middle base64 segment).
echo "<ACCESS_TOKEN>" | cut -d. -f2 | base64 -d 2>/dev/null | jq '.groups'
# Expected: ["tb-workspace-parent-co", ...] — only tb-workspace-* entries, no others.
```

#### Rollback

Remove the `groups` claim from the auth server. Existing sessions remain valid; new logins will
receive a 403 from `workspaceContextMiddleware` until the claim is restored, which is tolerable
since the switcher is still disabled.

---

### Step 4 — Provision BambooHR API Keys

**Goal:** Add per-workspace BambooHR credentials to the server environment and validate that each
workspace's CSV export works end-to-end.

#### Environment variables to set

```
BAMBOOHR_API_KEY_PARENT_CO=<key>
BAMBOOHR_API_KEY_BRIGHTLINE=<key>
BAMBOOHR_API_KEY_NORTHSTAR_LOGISTICS=<key>
BAMBOOHR_API_KEY_HELIO_STUDIOS=<key>
```

Set these in the secrets manager / deployment config (e.g., AWS Secrets Manager, Kubernetes
Secret, Doppler). Do **not** commit them to source control.

#### Smoke-test export per workspace

```bash
TOKEN="<valid JWT for a user in all four groups>"

for SLUG in parent-co brightline northstar-logistics helio-studios; do
  echo "=== $SLUG ==="
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "https://<host>/api/members/export?workspace=$SLUG"
  echo ""
done
# All four must return HTTP 200.
```

Also verify the CSV column order matches the TM-101 contract:

```
id,name,email,role,department,start_date,is_active
```

#### Rollback

Unset the `BAMBOOHR_API_KEY_*` variables and redeploy. Export endpoints will return errors for
workspaces without a key, but the rest of the API is unaffected.

---

### Step 5 — Enable Workspace Switcher Feature Flag

**Goal:** Activate the UI workspace switcher, first in staging and then in production.

#### Staging

1. Set `FEATURE_WORKSPACE_SWITCHER=true` in the **staging** environment.
2. Redeploy (or trigger a rolling restart — no code change required).

#### Staging smoke-test

- [ ] Log in as a user who belongs to `tb-workspace-parent-co` **and** one other group.
- [ ] Confirm the workspace switcher `<select>` appears in the top bar.
- [ ] Switch workspaces and confirm: member list reloads, department filter updates, stats panel
      updates, export link URL changes to `?workspace=<slug>`.
- [ ] Confirm `POST /api/auth/callback` returns `{token, workspaces:[...]}` with the correct
      workspace list for that user.
- [ ] Confirm a user with only one group sees no switcher (single workspace).

#### Production

Once staging is green:

1. Set `FEATURE_WORKSPACE_SWITCHER=true` in the **production** environment.
2. Redeploy / rolling restart.
3. Repeat the smoke-test checklist above against production.

#### Rollback

Set `FEATURE_WORKSPACE_SWITCHER=` (empty or unset) and redeploy. The switcher disappears from the
UI immediately. All API calls continue to work via the Parent Co fallback.

---

### Step 6 — Drop `members_backup` Table

**Goal:** Remove the migration safety net after the migration has been stable in production.

**Prerequisite:** Step 1 has been in production for at least **two weeks** with no rollback events
and all row counts verified correct.

```sql
DROP TABLE IF EXISTS members_backup;
```

Run this against the production SQLite database with the server **running** (SQLite WAL mode
supports concurrent reads during DDL on non-locked tables). Take a fresh file-level backup
immediately before running the DROP.

#### Rollback

The `members_backup` table contained the pre-migration data. Once dropped it cannot be restored
from the table alone — restore from the pre-migration file backup taken in Step 1 if needed.
This is why the two-week stabilisation window is mandatory.

---

### Step 7 — Remove Parent Co Header Fallback

**Goal:** Delete the hardcoded `parent-co` default from `workspaceContext.ts`, ending the
one-quarter backward-compatibility window.

**Exact date:** `deploy date + 90 days`

> ⚠️ Do **not** perform this step before the 90-day window has elapsed. The Looker dashboard team,
> the BambooHR weekly exporter, and any other unauthenticated/header-less consumers of
> `/api/members` will begin receiving `403` errors once the fallback is removed.

#### Pre-removal checklist

- [ ] Confirm with Looker dashboard team that all three reports now send `X-Workspace-Id: parent-co`
      (or `?workspace=parent-co`) in every request.
- [ ] Confirm the BambooHR weekly exporter has been updated to pass `?workspace=parent-co`.
- [ ] Confirm the public directory page passes the workspace context.
- [ ] No other consumers rely on the implicit fallback (audit log review of requests without
      workspace context over the past 30 days should show zero hits).

#### Code change

In `server/src/middleware/workspaceContext.ts`, remove the third branch of the target-slug
resolution:

```diff
-  // TODO: remove on deploy date + 90 days — Parent Co fallback for backward compatibility
-  ?? 'parent-co'
```

After this change, requests without an explicit workspace context will receive:

```json
{ "error": "No workspace access assigned to this account" }
```

(or `403 No access to workspace ''` depending on auth state).

#### Rollback

Revert the code change and redeploy.

---

## Summary Timeline

| Step | Action                                     | Owner       | Gate before next step                        |
|------|--------------------------------------------|-------------|----------------------------------------------|
| 1    | DB migration + backfill                    | Engineering | `SELECT COUNT(*) FROM members WHERE workspace_id != 1` = 0 |
| 2    | Deploy API, switcher off, fallback on      | Engineering | Looker `GET /api/members` returns `{members:[...]}` |
| 3    | Configure Okta groups claim                | Platform    | Access token `groups` claim contains only `tb-workspace-*` entries |
| 4    | Provision BambooHR API keys, smoke-test    | Engineering | All four `GET /api/members/export?workspace=X` return HTTP 200 |
| 5    | Enable `FEATURE_WORKSPACE_SWITCHER=true`   | Engineering | Switcher smoke-test passes in staging + production |
| 6    | Drop `members_backup`                      | Engineering | ≥ 14 days since Step 1 with no rollback      |
| 7    | Remove Parent Co fallback                  | Engineering | Deploy date + 90 days; all consumers migrated |
