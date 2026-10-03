# Workspaces rollout plan (TEAM-8)

TeamBoard has to serve the parent company and three subsidiaries (Brightline,
Northstar Logistics, Helio Studios) from one codebase. Each one gets its own
isolated workspace. This document covers the phased plan, the order of
operations, the feature flag, the parallel run, cutover, rollback, and the
contracts that client and Compliance reviewers need.

## What this repository can and cannot deliver

This repository is the TeamBoard CLI and client library. It has no database,
no HTTP server, no React app, and no Okta or BambooHR integration code. The
work that lands here is the **client-side foundation** for phases 1, 2 and 6:

| Delivered here | File |
|---|---|
| Workspace registry (id, slug, name, BambooHR dept code list, Okta group) | `src/workspaces.js` |
| Okta group → workspace resolution, 403 access check | `src/workspaces.js` |
| Compliance-shaped audit log (in-memory) | `src/audit-log.js` |
| Per-workspace settings store with Parent Co default | `src/store.js` |
| `X-Workspace-Id` header on API requests | `src/api-client.js` |
| `--workspace=<slug>` flag and `workspaces` command | `src/index.js` |

Everything else is marked below as **blocked**, with the repository that owns
it.

## Phases and subtasks

Status key: **done here** (landed in this change) · **blocked: <repo>** (needs
a system that is not in this repository) · **follow-up** (can be done in this
repository later).

### Phase 1 — Data isolation

| # | Subtask | Status |
|---|---|---|
| 1.1 | Define the workspace model: `id`, `slug`, `name`, `bamboohr_dept_code_list`, `okta_group` | done here (`WORKSPACES` registry) |
| 1.2 | Migration A: create the `workspaces` table and seed Parent Co, Brightline, Northstar, Helio | blocked: DB repo |
| 1.3 | Migration B: add a **nullable** `workspace_id` to `members`, `departments`, `audit_log` | blocked: DB repo |
| 1.4 | Migration C: backfill every existing row with the Parent Co id (batched, idempotent) | blocked: DB repo |
| 1.5 | Migration D: `NOT NULL` + foreign key to `workspaces(id)` + composite indexes `(workspace_id, …)` | blocked: DB repo |
| 1.6 | Down-migrations for B–D, tested against a production-sized snapshot | blocked: DB repo |
| 1.7 | Scope the settings store by workspace, with legacy calls defaulting to Parent Co | done here (`src/store.js`) |
| 1.8 | Every repository/query layer function takes a `workspaceId` argument | blocked: server repo |

### Phase 2 — Workspace-aware authentication

| # | Subtask | Status |
|---|---|---|
| 2.1 | Okta group convention `tb-workspace-<slug>` → workspace | done here (`OKTA_GROUP_PREFIX`, `resolveUserWorkspaces`) |
| 2.2 | Access check that rejects a cross-workspace request with 403 | done here (`assertWorkspaceAccess`) |
| 2.3 | Client sends `X-Workspace-Id` when a workspace is selected | done here (`ApiClient`) |
| 2.4 | Request middleware: read `X-Workspace-Id`, fall back to Parent Co when it is missing, call the access check before any read or write | blocked: server repo |
| 2.5 | Okta SSO callback returns the user's workspaces (shape below) | blocked: server repo + Okta admin |
| 2.6 | Session stores the allowed workspace ids; they are refreshed on token renewal | blocked: server repo |

### Phase 3 — Per-workspace department catalogues

| # | Subtask | Status |
|---|---|---|
| 3.1 | Placeholder dept code list per workspace | done here (placeholders, see open questions) |
| 3.2 | Migrate seed department data into Parent Co; load each subsidiary's catalogue | blocked: DB repo + subsidiary HR |
| 3.3 | TM-103 `dept_code` validation looks codes up in the request's workspace catalogue | blocked: server repo |
| 3.4 | Regression tests: TM-103 cases run once per workspace | blocked: server repo |

### Phase 4 — Per-workspace BambooHR export

| # | Subtask | Status |
|---|---|---|
| 4.1 | `GET /api/members/export?workspace=X`, with an access check on `X` | blocked: server repo |
| 4.2 | TM-101 column order and deactivation (`deactivated-` email prefix) rules apply per workspace | blocked: server repo |
| 4.3 | Golden-file CSV test per workspace | blocked: server repo |
| 4.4 | Each subsidiary's HR is told which file to upload on Mondays | blocked: HR ops |

### Phase 5 — UI workspace switcher

| # | Subtask | Status |
|---|---|---|
| 5.1 | Top-bar dropdown fed by the sign-in workspace list, behind `workspaces.switcher` | blocked: UI repo |
| 5.2 | Switching refetches the directory, department filter, stats panel and export link without a full reload | blocked: UI repo |
| 5.3 | Add-member form and stats page send `X-Workspace-Id` | blocked: UI repo |
| 5.4 | CLI equivalent: `--workspace=<slug>` and `teamboard workspaces` | done here |

### Phase 6 — Audit log

| # | Subtask | Status |
|---|---|---|
| 6.1 | Row schema `actor_email, workspace_id, action, entity_id, at` (below) | done here (`src/audit-log.js`), pending Compliance review |
| 6.2 | Settings writes are audited (`settings.update`) | done here |
| 6.3 | Member create/update/delete and export downloads are audited | blocked: server repo, **after** the Compliance gate |
| 6.4 | Persistent `audit_log` table, append-only grants | blocked: DB repo |
| 6.5 | Decide whether reads are audited too (the ticket says "every read and write"; the ACs list only writes and exports) | follow-up: open question |

### Phase 7 — Rollout and cutover

| # | Subtask | Status |
|---|---|---|
| 7.1 | `workspaces.switcher` feature flag, default **off** | blocked: UI/server repo |
| 7.2 | One-quarter parallel run for legacy consumers | blocked: server repo |
| 7.3 | Cutover checklist and the removal of the fallback | follow-up |
| 7.4 | This document | done here |

## Order of operations

Each step must be live and verified before the next one starts.

1. **Nullable column.** Create `workspaces`, seed four rows, and add a nullable
   `workspace_id` to `members`, `departments`, `audit_log`. No code reads it
   yet.
2. **Backfill Parent Co.** Set `workspace_id` to the Parent Co id on every
   existing row, in batches. Re-runnable.
3. **NOT NULL / FK.** Add the `NOT NULL` constraint, the foreign key and the
   indexes. Writers now have to set `workspace_id`. Until the header lands,
   they set Parent Co.
4. **Header with fallback.** Ship the middleware: `X-Workspace-Id` when it is
   present, Parent Co when it is missing. Every query filters by workspace and
   cross-workspace access returns 403.
5. **Okta.** Turn on group resolution at sign-in. The groups must already exist.
   Users with no `tb-workspace-*` group keep Parent Co access through the
   fallback.
6. **Department catalogues.** Load each subsidiary's dept codes and scope TM-103
   validation per workspace.
7. **Export.** Ship `GET /api/members/export?workspace=X`. The legacy export
   with no parameter keeps serving Parent Co.
8. **Audit, after the Compliance gate.** Once Compliance signs off on the schema
   below, enable audit writes for member create/update/delete and export.
9. **Flagged switcher.** Ship the UI switcher behind `workspaces.switcher`
   (off). Enable it for internal cross-workspace operators first, then for all
   users.

Subsidiary member data is only loaded after step 8, so nothing from a
subsidiary is ever stored without workspace isolation and auditing.

## Feature flag: `workspaces.switcher`

- Default **off** in every environment.
- When off, the UI behaves as it does today (Parent Co only), and the server
  still enforces workspace scoping through the fallback.
- Turn it on for the internal operators group first, then for each subsidiary's
  users as their data is loaded.
- Turning it off hides the switcher and nothing else. No data changes, so it is
  the first rollback lever for any UI problem.

## Parallel run (one quarter)

These consumers send no workspace context. They keep getting Parent Co data,
with the response shape unchanged (TM-102), for one quarter after step 4:

- **Looker:** three reports on `GET /api/members?department=X`.
- **BambooHR weekly exporter:** the legacy export with no `workspace` parameter.
- **Public directory page:** `GET /api/members`.

During the parallel run, the server logs (by client id, never by user data)
each request that used the fallback, so the remaining callers can be found and
migrated.

## Cutover criteria

The Parent Co fallback is removed (missing header → 400) only when all of these
hold:

- Two consecutive weeks with zero fallback hits from Looker, the BambooHR
  exporter and the public directory.
- Every subsidiary's HR has uploaded at least two Monday exports from the
  workspace-scoped endpoint without manual fixes.
- Compliance has signed off on the audit log and has run at least one evidence
  query against it.
- TM-101 and TM-103 regression suites pass for all four workspaces.
- The switcher flag has been fully on for two weeks with no rollback.

## Rollback per phase

| Phase | Rollback |
|---|---|
| 1 — nullable column / backfill | Down-migration drops the column. No reader depends on it yet. |
| 1 — NOT NULL / FK | Down-migration drops the constraint and FK. The column and backfilled data stay. |
| 2 — header middleware | Redeploy the previous server build. The fallback means clients that send the header still get Parent Co behaviour. |
| 2 — Okta resolution | Turn off group resolution. Everyone gets Parent Co through the fallback. |
| 3 — dept catalogues | Revert to the single global catalogue. Subsidiary member writes are paused until it is restored. |
| 4 — export | Remove the `workspace` parameter route. The legacy export is untouched. |
| 5 — switcher | Turn off `workspaces.switcher`. |
| 6 — audit | Turn off audit writes. Rows already written are kept (append-only). |
| 7 — cutover | Restore the Parent Co fallback. |

## Sign-in response shape: `resolveUserWorkspaces`

The Okta SSO sign-in response includes the user's workspaces, resolved from
their Okta groups. Matching is exact and case-sensitive on
`tb-workspace-<slug>`. Duplicates are removed and the list is in registry
order.

```json
{
  "user": { "email": "operator@example.test" },
  "workspaces": [
    {
      "id": "ws_brightline",
      "slug": "brightline",
      "name": "Brightline",
      "bamboohrDeptCodeList": ["BL-ENG", "BL-OPS"],
      "oktaGroup": "tb-workspace-brightline"
    }
  ]
}
```

- An empty `workspaces` list means the user has no explicit access. During the
  parallel run the server still serves Parent Co through the fallback. After
  cutover the user gets 403.
- The client shows the switcher only when `workspaces.length > 1` and the flag
  is on.

## Audit row schema (for Compliance review)

| Column | Type | Notes |
|---|---|---|
| `actor_email` | string, required | Okta email of the user. `system` for automated writes. |
| `workspace_id` | string, required | FK to `workspaces.id`. |
| `action` | string, required | Dotted verb, e.g. `member.create`, `member.update`, `member.delete`, `member.export`, `settings.update`. |
| `entity_id` | string, required | Id of the affected member, export or setting key. |
| `at` | ISO-8601 UTC timestamp | Set by the server, never by the caller. |

Example row:

```json
{
  "actor_email": "operator@example.test",
  "workspace_id": "ws_brightline",
  "action": "settings.update",
  "entity_id": "retention.days",
  "at": "2026-10-03T12:00:00.000Z"
}
```

Rows are append-only and immutable. Empty fields are rejected. Row contents
are never written to application logs.

## Acceptance criteria this repository cannot meet

| Acceptance criterion | Why not here |
|---|---|
| `workspaces` table; `workspace_id` FK on `members`, `departments`, `audit_log`; reversible tested migration | There is no database or migration tooling in this repository. |
| `/api/members*` resolve `X-Workspace-Id` and return 403 cross-workspace | There is no HTTP server here. The client header and the access check are ready for it. |
| `GET /api/members/export?workspace=X` CSV with TM-101/TM-103 rules | No server, no CSV export, and no TM-101/TM-103 code in this repository. |
| Okta SSO returns workspaces | No Okta integration here. The resolution logic and response shape are defined above. |
| UI workspace switcher | No React app in this repository. The CLI equivalent is `--workspace=<slug>`. |
| Audit row on member create/update/delete and export | No member or export code here. The schema and writer exist and are used for settings writes. |
| TM-101 deactivation and TM-103 validation per workspace | That code lives in the server repository. |

## Open questions

1. Real BambooHR `dept_code` lists for Brightline, Northstar and Helio. The
   current lists are placeholders.
2. Should reads be audited, as the ticket summary says, or only writes and
   exports, as the acceptance criteria say? This affects audit volume and
   Compliance's retention cost.
3. Audit retention period and storage region for each legal entity, given the
   different countries.
4. Do cross-workspace operators need a combined "all workspaces" view, or is
   switching enough?
5. Who owns adding users to the `tb-workspace-*` Okta groups for each
   subsidiary, and what is the SLA?
6. After cutover, should a missing `X-Workspace-Id` return 400 or keep
   defaulting to the user's only workspace when they have exactly one?
