# TeamBoard Workspaces — Rollout, Migration & Cutover Plan

**Ticket:** TEAM-7
**Workspaces:** Parent Co · Brightline · Northstar Logistics · Helio Studios
**Status:** Pre-production

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Merge Gates](#pre-merge-gates)
3. [Phase Execution Order](#phase-execution-order)
   - [Phase 1 — Data Isolation](#phase-1--data-isolation)
   - [Phase 2 — Workspace-Aware Authentication](#phase-2--workspace-aware-authentication)
   - [Phase 3 — Per-Workspace Department Catalogues](#phase-3--per-workspace-department-catalogues)
   - [Phase 4 — Per-Workspace BambooHR Export](#phase-4--per-workspace-bamboohr-export)
   - [Phase 5 — UI Workspace Switcher](#phase-5--ui-workspace-switcher)
   - [Phase 6 — Audit Log](#phase-6--audit-log)
   - [Phase 7 — Cutover](#phase-7--cutover)
4. [FEATURE_WORKSPACE_SWITCHER Flag Lifecycle](#feature_workspace_switcher-flag-lifecycle)
5. [Backward-Compatibility Parallel-Run Window](#backward-compatibility-parallel-run-window)
6. [Rollback Procedures](#rollback-procedures)
7. [Dependency Notes](#dependency-notes)
8. [Post-Cutover Checklist](#post-cutover-checklist)

---

## Overview

This document describes the ordered sequence of changes required to retrofit TeamBoard from a single-tenant application into a multi-workspace platform serving Parent Co and its three subsidiaries (Brightline, Northstar Logistics, Helio Studios).

The rollout is broken into seven sequential phases that mirror the spec. No phase may be deployed until all phases before it have been verified in the staging environment and any required sign-offs have been recorded. Each phase section calls out: the changes shipped, the pre-merge gates that apply, the verification steps, and the rollback procedure.

A **one-quarter parallel-run window** begins when Phase 1 is deployed to production. During this window, legacy headerless consumers (Looker, BambooHR nightly sync) continue to receive Parent Co data without authentication. The window ends on the date that is exactly 13 weeks after Phase 1 is deployed. Consumers must migrate to service accounts and the `X-Workspace-Id` header before that deadline.

---

## Pre-Merge Gates

The following sign-off gates **block merging** the relevant PR. They must be recorded as PR comments by the named team before the PR is approved and merged.

| Gate | Applies To | Required Action |
|------|-----------|-----------------|
| **People Ops review** | `members` table schema PR (migration 004 + 005 in `db.ts`) | A member of the People Ops team must leave a PR comment explicitly approving the schema change before the PR is merged. |
| **Compliance sign-off** | `audit_log` migration PR (migration 003 in `db.ts`) | A member of the Compliance team must leave a PR comment explicitly approving the `audit_log` schema (columns, types, constraints) before the PR is merged. The comment text must include the word **"approved"** and the reviewer's name. |

These gates exist because:

- The `members` schema change adds `workspace_id`, alters the `UNIQUE` constraint, and backfills historical data — People Ops must confirm the data model matches employment records requirements.
- The `audit_log` table is SOC 2 evidence; Compliance must sign off on column coverage before any audit data is written.

---

## Phase Execution Order

### Phase 1 — Data Isolation

**Goal:** Introduce the `workspaces` table; add `workspace_id` to every existing table; backfill all existing rows into the "Parent Co" workspace.

**PRs in this phase (must merge in order):**

1. **PR: db migrations 001–003** — `workspaces` table seed, `departments` table creation, `audit_log` table creation.
   - 🔒 **Pre-merge gate:** Compliance sign-off required on the `audit_log` schema PR (recorded as a PR comment).
2. **PR: db migrations 004–005** — `members` table rebuild with `workspace_id`; backfill guard.
   - 🔒 **Pre-merge gate:** People Ops review required on this PR (recorded as a PR comment).

**What ships:**

- `schema_migrations` tracking table, `runMigrations()` called on every server start.
- `workspaces` table seeded with four rows: `parent-co`, `brightline`, `northstar-logistics`, `helio-studios`.
- `departments` table (`id`, `workspace_id FK`, `name`, `UNIQUE(workspace_id, name)`) seeded with Parent Co rows.
- `audit_log` table (`id`, `actor_email`, `workspace_id FK`, `action`, `entity_id`, `at`).
- `members` table gains `workspace_id INTEGER NOT NULL DEFAULT 1`; `UNIQUE(email)` replaced by `UNIQUE(email, workspace_id)`.
- All existing members backfilled to `workspace_id = (SELECT id FROM workspaces WHERE slug = 'parent-co')`.
- `writeAuditLog()` helper exported from `db.ts`.

**Verification (staging):**

```sql
SELECT COUNT(*) FROM members WHERE workspace_id IS NULL;   -- must be 0
SELECT COUNT(*) FROM workspaces;                           -- must be 4
PRAGMA table_info(members);                                -- workspace_id column present
```

**Deploy procedure:**

1. Take a full backup of `data/team.db` → `data/team.db.pre-phase1.<timestamp>`.
2. Deploy new server build. `runMigrations()` runs automatically on first request.
3. Confirm migration versions 001–005 are recorded in `schema_migrations`.

**Rollback:** See [Phase 1 rollback](#phase-1-rollback).

---

### Phase 2 — Workspace-Aware Authentication

**Goal:** Every request carries a workspace context; cross-workspace reads/writes are rejected with 403; Okta sign-in resolves allowed workspaces from `tb-workspace-*` groups.

**What ships:**

- `server/src/types/express.d.ts` — Request augmentation (`workspaceId`, `workspaceSlug`, `allowedWorkspaceSlugs`, `actorEmail`).
- `server/src/middleware/auth.ts` — Okta OIDC instance; `extractWorkspaceSlugs()`; `setActorEmail()`.
- `server/src/middleware/workspace.ts` — `resolveWorkspace` and `requireWorkspaceAccess` middleware.
- `server/src/routes/workspaces.ts` — `GET /api/workspaces` returning the caller's allowed workspaces.
- `server/src/index.ts` updated — `oidc.router`, session middleware, workspace middleware wired onto `/api/members` and `/api/workspaces`.
- New env vars required: `OKTA_ISSUER`, `OKTA_CLIENT_ID`, `OKTA_CLIENT_SECRET`, `APP_BASE_URL`, `SESSION_SECRET`.

**Backward-compatibility preservation:**

`resolveWorkspace` and `requireWorkspaceAccess` implement the parallel-run rule:

- Headerless requests with no Okta session → resolved to `parent-co`, `next()` called immediately. Looker/BambooHR continue to work.
- Requests with `X-Workspace-Id` header but no Okta session → 401.
- Authenticated requests → workspace validated against `allowedWorkspaceSlugs`; 403 if not allowed.

**Verification (staging):**

- `curl /api/members` (no header, no session) → 200, Parent Co members.
- `curl -H 'X-Workspace-Id: brightline' /api/members` (no session) → 401.
- Sign in as a `tb-workspace-brightline` group member → `/api/workspaces` returns `{ workspaces: [{ slug: "brightline" }] }`.

**Deploy procedure:**

1. Confirm all required Okta env vars are set in the production environment.
2. Deploy new server build (no DB changes in this phase — no backup needed, but keep Phase 1 backup in place).

**Rollback:** See [Phase 2 rollback](#phase-2-rollback).

---

### Phase 3 — Per-Workspace Department Catalogues

**Goal:** Department data is scoped per workspace. TM-103 `dept_code` validation applies per workspace using the workspace's `bamboohr_dept_code_list`.

**What ships:**

- `server/src/routes/departments.ts` — `GET /api/departments` returning departments for `req.workspaceId`.
- `server/src/index.ts` updated — `/api/departments` mounted with `resolveWorkspace`.
- `POST /api/members` and `PATCH /api/members/:id` validate `department` against the workspace's `bamboohr_dept_code_list` (400 if invalid).
- Seed data: `departments` rows for Brightline, Northstar Logistics, Helio Studios loaded into the DB (via a one-time migration script or seeded in migration 002 extension).

**Verification (staging):**

- `GET /api/departments` with `X-Workspace-Id: brightline` returns only Brightline departments.
- `POST /api/members` with an invalid `department` for the workspace returns 400.

**Deploy procedure:**

1. No schema changes — deploy new server build.
2. If department seed data is delivered via a migration, take a DB backup first.

**Rollback:** See [Phase 3 rollback](#phase-3-rollback).

---

### Phase 4 — Per-Workspace BambooHR Export

**Goal:** `GET /api/members/export` is workspace-scoped. Per-workspace BambooHR CSV upload flow works. TM-101 column-stability rules apply per workspace.

**What ships:**

- `GET /api/members/export?workspace=<slug>` — scoped to `req.workspaceId`; CSV column order `id,name,email,role,department,start_date,is_active` preserved (TM-101).
- `writeAuditLog` called on every export with `action: 'member.export'`.
- Each subsidiary's HR team can upload their BambooHR CSV on Mondays without affecting other workspaces.

**Verification (staging):**

- Export for `brightline` contains only Brightline members.
- CSV first line is exactly `id,name,email,role,department,start_date,is_active`.
- Audit log records the export event with the correct `workspace_id`.

**Deploy procedure:**

1. No schema changes — deploy new server build.

**Rollback:** See [Phase 4 rollback](#phase-4-rollback).

---

### Phase 5 — UI Workspace Switcher

**Goal:** The React client is workspace-aware. The workspace switcher dropdown appears in the top bar when `FEATURE_WORKSPACE_SWITCHER === '1'`. Switching reloads the directory, departments, stats, and export link in-place.

**What ships:**

- `client/src/App.tsx` — workspace/featureFlags/departments state; `buildHeaders()`; `loadDepartments()`; stale-workspace guard on `loadMembers`/`loadStats`; workspace switcher `<select>`; export link scoped to active workspace; "Contact your admin" message when no workspaces.
- `client/src/styles.css` — `.workspace-switcher` and `.form-row select` rules.
- `GET /api/config` endpoint — returns `{ featureFlags: { workspaceSwitcher: boolean } }` driven by `FEATURE_WORKSPACE_SWITCHER` env var.

**`FEATURE_WORKSPACE_SWITCHER` is introduced in this phase with value unset (switcher hidden).** See the [flag lifecycle](#feature_workspace_switcher-flag-lifecycle) section for the full promotion sequence.

**Verification (staging):**

- With flag unset: switcher is not rendered; app behaves as before for Parent Co users.
- With `FEATURE_WORKSPACE_SWITCHER=1`: switcher appears for users with multiple workspaces; selecting a workspace updates the member list, departments, stats, and export link.

**Deploy procedure:**

1. Deploy new client Vite build.
2. Deploy new server build (adds `/api/config`).
3. Leave `FEATURE_WORKSPACE_SWITCHER` **unset** in production initially.

**Rollback:** See [Phase 5 rollback](#phase-5-rollback).

---

### Phase 6 — Audit Log

**Goal:** Every member create/update/delete and every export download is logged with `actor_email`, `workspace_id`, `action`, `entity_id`, `at`. Compliance team can query `audit_log` for SOC 2 evidence.

> **Note:** The `audit_log` table was created in Phase 1 (migration 003). This phase ensures all write paths call `writeAuditLog()` and that Compliance has verified coverage.

**What ships:**

- Audit calls in `POST /api/members` (`member.create`), `PATCH /api/members/:id` (`member.update`), `DELETE /api/members/:id` (`member.delete`), `GET /api/members/export` (`member.export`).
- Compliance review of audit coverage completed (sign-off recorded as PR comment on the audit_log migration PR — see [Pre-Merge Gates](#pre-merge-gates)).

**Verification (staging):**

```sql
-- After creating a member:
SELECT * FROM audit_log ORDER BY at DESC LIMIT 5;
-- Rows for member.create, member.update, member.delete, member.export must all appear
-- workspace_id must match the workspace of the operation
```

**Deploy procedure:**

1. No schema changes — deploy new server build.

**Rollback:** See [Phase 6 rollback](#phase-6-rollback).

---

### Phase 7 — Cutover

**Goal:** All workspaces are live. The backward-compat window is closed. The feature flag is removed. Legacy consumer migration is confirmed.

**Prerequisites before cutover:**

- All six prior phases are deployed and verified in production.
- Looker and BambooHR nightly sync have been migrated to service accounts using `X-Workspace-Id` + Okta service-account sessions. *(See [Dependency Notes](#dependency-notes).)*
- The one-quarter parallel-run window has elapsed (≥ 13 weeks since Phase 1 production deploy date). *(See [Backward-Compatibility Parallel-Run Window](#backward-compatibility-parallel-run-window).)*
- `FEATURE_WORKSPACE_SWITCHER` has been enabled broadly (value `1`) and validated in production.
- Subsidiary HR admins have been onboarded to their respective workspaces.

**What ships in Phase 7:**

1. **Remove backward-compat fallback:** The `requireWorkspaceAccess` middleware no longer bypasses auth for headerless requests. All callers must supply `X-Workspace-Id` + a valid Okta session or service-account credential.
2. **Remove `FEATURE_WORKSPACE_SWITCHER` flag:** The env var check is replaced with an unconditional `true`; the dead `false` branch is deleted from `App.tsx` and `index.ts`.
3. **Final DB cleanup (optional):** Remove `DEFAULT 1` from `workspace_id` column definition if desired (requires a new migration — take a backup first).

**Cutover day runbook:**

1. Notify all affected teams (Looker, BambooHR, HR admins, IT) at least two weeks before the cutover date.
2. At the cutover window (low-traffic period, e.g. Sunday 02:00 local time):
   a. Take a full backup of `data/team.db` → `data/team.db.pre-cutover.<timestamp>`.
   b. Deploy new server build (backward-compat branch removed).
   c. Deploy new client Vite build (`FEATURE_WORKSPACE_SWITCHER` branch removed).
   d. Monitor error rates for 30 minutes. Confirm no 401/403 spike from Looker or BambooHR.
3. Send confirmation to all teams that cutover is complete.

**Rollback:** See [Phase 7 rollback](#phase-7-rollback).

---

## FEATURE_WORKSPACE_SWITCHER Flag Lifecycle

The workspace switcher UI is gated behind the `FEATURE_WORKSPACE_SWITCHER` environment variable throughout its lifecycle. The four lifecycle stages are:

### Stage 1 — Introduced (unset)

- **When:** Phase 5 ships to production.
- **Value:** env var is **not set** (treated as `false` by the server).
- **Effect:** `GET /api/config` returns `{ featureFlags: { workspaceSwitcher: false } }`. The `<select class="workspace-switcher">` is not rendered in the React app. The app is functionally identical to the pre-workspace UI for all end users.
- **Purpose:** Allows server-side and DB phases to stabilise in production before any user-facing change.

### Stage 2 — Enabled for internal users only

- **When:** After Phase 6 is verified; internal TeamBoard/IT users are ready to test.
- **Value:** `FEATURE_WORKSPACE_SWITCHER=1` set in production for a canary deployment slice (or toggled for internal accounts via a separate mechanism if available).
- **Effect:** Internal users (engineering, HR admins, IT) see the workspace switcher and can switch between workspaces. All workspace-scoped API calls, department dropdowns, stats, and export links are exercised by real users.
- **Verification:** At least one member of each subsidiary workspace (Brightline, Northstar Logistics, Helio Studios) must successfully switch workspaces and confirm correct data isolation.

### Stage 3 — Enabled broadly

- **When:** Internal validation passes; subsidiary HR admins are onboarded; communications sent to all end users.
- **Value:** `FEATURE_WORKSPACE_SWITCHER=1` set globally in production.
- **Effect:** All users with access to more than one workspace see the switcher. Single-workspace users see no change.
- **Prerequisites:** Okta `tb-workspace-*` group memberships are correct for all employees.

### Stage 4 — Flag removed

- **When:** Phase 7 cutover. The backward-compat window is closed and the feature is considered permanent.
- **Action:** Remove the `FEATURE_WORKSPACE_SWITCHER` env var from all deployment configs. Remove the `process.env.FEATURE_WORKSPACE_SWITCHER` check from `server/src/index.ts` and the `featureFlags.workspaceSwitcher` branch from `client/src/App.tsx`. The switcher renders unconditionally (controlled only by whether the user has multiple workspaces).
- **Value after removal:** N/A — the dead code path is deleted, not kept dormant.

---

## Backward-Compatibility Parallel-Run Window

### What the window is

Starting on the date Phase 1 is deployed to production, a **one-quarter (13-week) parallel-run window** is open. During this window:

- **Headerless `GET /api/members*` requests** (no `X-Workspace-Id` header, no Okta session cookie) are resolved to the `parent-co` workspace automatically and return HTTP 200.
- This preserves uninterrupted service for Looker dashboards and the BambooHR nightly sync, which currently make unauthenticated requests.
- No code change is required on the consumer side during the window; existing integrations continue to work.

### When the window ends

The window ends **exactly 13 weeks after the Phase 1 production deploy date**. The exact end date must be communicated to all consumers at the time Phase 1 ships (see the notification template below). After the window ends:

- Headerless requests without an Okta session or service-account credential will receive **401 Unauthorized**.
- Requests with `X-Workspace-Id` but without a valid credential will continue to receive 401 (this behaviour is in place from Phase 2 onwards).

### What consumers must do before the window closes

Every external consumer of `/api/members*` must complete **both** of the following actions before the end-of-window date:

1. **Obtain a service account.** Work with IT/Okta admin to create a service-account identity in Okta, added to the appropriate `tb-workspace-<slug>` group (e.g. `tb-workspace-parent-co` for Looker's Parent Co reports).
2. **Add the `X-Workspace-Id` header.** All requests must include `X-Workspace-Id: <slug>` (e.g. `X-Workspace-Id: parent-co`). The service-account credential (API key or OAuth token) must be included in each request.

**Affected consumers:**

| Consumer | Current behaviour | Required migration |
|----------|------------------|-------------------|
| Looker dashboards (3 reports, `GET /api/members?department=X`) | Headerless, unauthenticated | Add `X-Workspace-Id: parent-co` + service account credential |
| BambooHR nightly sync | Headerless, unauthenticated | Add `X-Workspace-Id: parent-co` (or per-subsidiary slug) + service account credential |
| Public directory page | Served by the React app which sends headers from Phase 5 | No action required — handled by the UI |

### End-of-window notification template

When Phase 1 ships, the following notice should be sent to the owners of each affected consumer:

> **Action required by [END_DATE]:** TeamBoard will stop accepting unauthenticated `/api/members` requests after this date. Please migrate to a service account and add the `X-Workspace-Id` header to all API calls. Contact the TeamBoard engineering team for onboarding assistance.

---

## Rollback Procedures

Each phase has a distinct rollback path depending on the type of change (schema, server, client, or flag).

> **General rule:** Always take a timestamped backup of `data/team.db` before any schema-altering phase is deployed to production. Rollback windows are within 1 hour of deploy; after that, a data-migration path forward is preferred over restore.

---

### Phase 1 Rollback

**Type:** Schema (SQLite)

**Trigger:** Backfill corrupted member rows, migration failures, or data integrity errors detected within 1 hour of deploy.

**Steps:**

1. Stop the server process.
2. Replace `data/team.db` with `data/team.db.pre-phase1.<timestamp>`.
3. Redeploy the previous server build (pre-Phase 1 `dist/server/`).
4. Verify `GET /api/members` returns the same data as before the migration.
5. Notify People Ops and Compliance that the rollback has occurred.

---

### Phase 2 Rollback

**Type:** Server (middleware/routes)

**Trigger:** Auth middleware causing unexpected 401/403 for legitimate users; session issues; Okta connectivity failures.

**Steps:**

1. Redeploy the previous server build (`dist/server/` pre-Phase 2 snapshot).
2. No DB restore required — Phase 2 ships no schema changes.
3. Verify headerless `GET /api/members` returns 200.
4. Investigate Okta configuration before re-attempting the deploy.

---

### Phase 3 Rollback

**Type:** Server (routes + validation logic)

**Trigger:** Department validation breaking existing member imports; incorrect department seed data.

**Steps:**

1. Redeploy the previous server build (pre-Phase 3 `dist/server/`).
2. If department seed data was delivered via a migration that altered `data/team.db`, restore from the pre-Phase 3 backup.
3. Verify `POST /api/members` with a valid department succeeds.

---

### Phase 4 Rollback

**Type:** Server (export route)

**Trigger:** CSV export producing wrong workspace data; column order broken; audit log not recording exports.

**Steps:**

1. Redeploy the previous server build (pre-Phase 4 `dist/server/`).
2. No DB restore required.
3. Verify `GET /api/members/export` returns correct CSV with `id,name,email,role,department,start_date,is_active` as the first line.

---

### Phase 5 Rollback

**Type:** Client (Vite build) + Server (config endpoint) + Flag

**Trigger:** Switcher causing UI regressions; workspace context leaking across requests; stale-data bugs in the directory.

**Steps — flag first:**

1. **Unset `FEATURE_WORKSPACE_SWITCHER`** in the production environment (fastest mitigation — hides the switcher immediately without a redeploy).
2. If the issue persists or is server-side, redeploy the previous Vite build (pre-Phase 5 `client/dist/` snapshot).
3. If the `/api/config` endpoint is causing issues, redeploy the previous server build (pre-Phase 5 `dist/server/`).
4. No DB restore required.

---

### Phase 6 Rollback

**Type:** Server (audit write paths)

**Trigger:** `writeAuditLog()` causing write errors that break member mutations; audit log rows missing required fields.

**Steps:**

1. Redeploy the previous server build (pre-Phase 6 `dist/server/`). Audit writes are removed from the hot path.
2. No DB restore required (partial audit rows in `audit_log` are non-critical and can remain).
3. Notify Compliance of the rollback so they are aware of the audit gap.

---

### Phase 7 Rollback

**Type:** Server + Client + Flag (backward-compat removal)

**Trigger:** Unexpected 401 spike from Looker or BambooHR after the backward-compat branch is removed, indicating a consumer was not migrated in time.

**Steps:**

1. Redeploy the previous server build (pre-Phase 7 `dist/server/` — still contains the backward-compat fallback).
2. Redeploy the previous Vite build (pre-Phase 7 `client/dist/` — still contains the `FEATURE_WORKSPACE_SWITCHER` branch).
3. Re-set `FEATURE_WORKSPACE_SWITCHER=1` in the environment.
4. Restore `data/team.db` from `data/team.db.pre-cutover.<timestamp>` **only if** the Phase 7 DB migration (optional `DEFAULT 1` removal) was applied and is causing issues.
5. Immediately contact the owner of the unmigrated consumer and set a hard deadline for service-account migration.
6. Re-schedule the cutover window once all consumers are confirmed migrated.

---

## Dependency Notes

The following external dependencies are on the critical path and must be resolved **before the backward-compat window closes.** Failure to meet these deadlines will force an extension of the parallel-run period (which carries security risk, since headerless unauthenticated access remains open).

### Looker Dashboards

- **Owner:** Looker dashboard team.
- **Dependency:** Three reports query `GET /api/members?department=X`. They currently send no `X-Workspace-Id` header and no credentials.
- **Required action:** Obtain a `parent-co` service account from IT; update all three reports to send `X-Workspace-Id: parent-co` plus the service-account bearer token.
- **Deadline:** Before the end of the 13-week parallel-run window.
- **Risk if missed:** After the window closes, all three Looker reports will return 401 and stop updating.

### BambooHR Nightly Sync

- **Owner:** HR / BambooHR integration team.
- **Dependency:** The BambooHR exporter currently calls `/api/members` and `/api/members/export` without headers or credentials.
- **Required action:** Obtain one service account per subsidiary workspace from IT; update the nightly sync job to pass `X-Workspace-Id: <slug>` + service-account credential for each workspace.
- **Deadline:** Before the end of the 13-week parallel-run window.
- **Risk if missed:** After the window closes, the BambooHR nightly sync will fail with 401 for all workspaces.

### Okta Group Provisioning

- **Owner:** IT / Okta admin.
- **Dependency:** `tb-workspace-<slug>` groups must exist in Okta and be populated with the correct users for each subsidiary before Phase 2 can be verified.
- **Required action:** Create groups `tb-workspace-parent-co`, `tb-workspace-brightline`, `tb-workspace-northstar-logistics`, `tb-workspace-helio-studios`; add employees to their respective groups; configure the Okta Admin console claim filter regex `^tb-workspace-` to include the groups claim in the OIDC token.
- **Deadline:** Before Phase 2 ships to staging.

### Subsidiary HR Admin Onboarding

- **Owner:** People Ops.
- **Dependency:** Brightline, Northstar Logistics, and Helio Studios HR admins need workspace access and training before Phase 5 (UI switcher) is enabled broadly.
- **Required action:** Add HR admins to their respective Okta workspace groups; conduct walkthrough of the workspace switcher and per-workspace BambooHR CSV upload flow.
- **Deadline:** Before Stage 3 of the `FEATURE_WORKSPACE_SWITCHER` lifecycle (broad enablement).

---

## Post-Cutover Checklist

After Phase 7 is deployed and the cutover window has passed, confirm the following:

- [ ] All members are assigned to a non-null `workspace_id` in the DB.
- [ ] `audit_log` contains rows for all recent member operations across all four workspaces.
- [ ] Looker dashboards are returning correct data using service-account credentials.
- [ ] BambooHR nightly sync is completing successfully for all subsidiary workspaces.
- [ ] `FEATURE_WORKSPACE_SWITCHER` env var has been removed from all deployment configs.
- [ ] The backward-compat fallback branch has been deleted from `server/src/middleware/workspace.ts`.
- [ ] The `featureFlags.workspaceSwitcher` branch has been deleted from `client/src/App.tsx`.
- [ ] Compliance has confirmed audit log coverage satisfies SOC 2 requirements.
- [ ] People Ops has confirmed member data isolation is correct for all subsidiaries.
- [ ] The pre-cutover DB backup (`data/team.db.pre-cutover.<timestamp>`) is archived to long-term storage and removed from the production host.
