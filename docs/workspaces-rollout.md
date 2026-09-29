# Workspaces rollout (TEAM-8)

TeamBoard is being split into one workspace per legal entity: Parent Co plus
the three subsidiaries (Brightline, Northstar Logistics, Helio Studios). This
document is the rollout, migration and cutover plan for that work.

## Scope of this repository

This repository only holds the TeamBoard CLI. It contains the client side of
the workspace model:

- `src/workspaces.js` — workspace registry. Parent Co (`parent-co`) is always
  registered and is the default. It also maps Okta `tb-workspace-<slug>`
  groups to workspaces.
- `src/store.js` — settings are stored per workspace. Calls that name no
  workspace fall back to Parent Co.
- `src/api-client.js` — sends `X-Workspace-Id` only when a workspace is
  configured. A `403` fails immediately and is not retried.
- `src/index.js` — `--workspace <slug>` / `--workspace=<slug>` flag.

The database, server routes, React app, BambooHR integration and Okta
integration are **not** in this repository. Phases 1–6 below describe work that
lands in those codebases. Each phase says which repo owns it; where that is not
yet known it is marked **TBD** and must be assigned before the phase starts.

All names, emails and IDs in this document are fake placeholders.

## Phases

### Phase 1 — Data isolation (owning repo: TBD, database / server)

1. Create the `workspaces` table: `id`, `slug` (unique), `name`,
   `bamboohr_dept_code_list`, `okta_group` (unique).
2. Seed the `parent-co` row (`okta_group = 'tb-workspace-parent-co'`).
3. Add `workspace_id` to `members`, `departments` and `audit_log` using
   expand → backfill → contract (see [Migration](#migration)).
4. Scope every repository/query helper by `workspace_id`, using bound
   parameters only — never build SQL by string interpolation.
5. Write a migration test that runs up, down and up again against a copy of
   production-shaped fixture data.

### Phase 2 — Workspace-aware authentication (owning repo: TBD, server / Okta)

1. On sign-in, read the user's Okta groups and resolve their workspaces. Only
   exact `tb-workspace-<slug>` matches for registered workspaces count, which
   is the same rule as `resolveWorkspacesFromGroups` in this repo.
2. Return the resolved list in the sign-in response. Document the shape for
   the client:
   `{ "workspaces": [{ "id": "parent-co", "slug": "parent-co", "name": "Parent Co" }] }`.
3. Add request middleware that reads `X-Workspace-Id`, checks it against the
   user's allowed workspaces, and attaches the workspace context.
4. Reject cross-workspace reads and writes with `403`. When the header is
   missing, fall back to Parent Co, but only during the parallel run.

### Phase 3 — Per-workspace department catalogues (owning repo: TBD, server)

1. Move the BambooHR `dept_code` list into
   `workspaces.bamboohr_dept_code_list`.
2. Migrate the current seed list into the `parent-co` row. Subsidiary lists
   are loaded from placeholder fixtures until HR sends the real ones.
3. Apply the TM-103 `dept_code` validation against the list for the request's
   workspace. The same code must not be accepted in a workspace whose
   catalogue does not contain it.

### Phase 4 — Per-workspace BambooHR export (owning repo: TBD, server / BambooHR)

1. `GET /api/members/export?workspace=<slug>` returns that workspace's CSV. It
   uses the same authorization as `/api/members`, so the caller must have
   access to `<slug>`.
2. Keep the TM-101 column set and order identical in every workspace, and keep
   the Okta `deactivated-` email-prefix handling.
3. Each subsidiary's HR uploads its own file on Mondays. Parent Co's weekly
   exporter keeps working unchanged during the parallel run.

### Phase 5 — UI workspace switcher (owning repo: TBD, React app)

1. Add a top-bar dropdown populated from the sign-in `workspaces` list, behind
   the feature flag `workspaces.switcher.enabled`.
2. Switching workspace updates the directory, department filter, stats panel
   and export link in place, with no full page reload.
3. Make the add-member form and the stats page send `X-Workspace-Id`.

### Phase 6 — Audit log (owning repo: TBD, server)

1. Write one `audit_log` row for every member create, update and delete, and
   for every export download.
2. Use the proposed schema below. The schema is **pending Compliance review**
   and does not merge until Compliance signs off.

### Phase 7 — Rollout & cutover (owning repo: this repo + TBD)

1. CLI support for `--workspace` and `X-Workspace-Id`. This is done in this
   repository.
2. Run the order of operations below: flag rollout, parallel run, cutover,
   rollback.

## Order of operations

1. **Prerequisite:** Okta admins provision `tb-workspace-parent-co` and add
   every current TeamBoard user to it. Also provision
   `tb-workspace-brightline`, `tb-workspace-northstar-logistics` and
   `tb-workspace-helio-studios`. Nothing below starts until this is confirmed.
2. Send the audit log schema to Compliance for review. This runs in parallel
   with steps 3–5 but blocks step 8.
3. Phase 1 expand: create `workspaces`, seed `parent-co`, and add nullable
   `workspace_id` columns.
4. Phase 1 backfill: set every existing row to `parent-co`.
5. Deploy the Phase 2 middleware with the header-less Parent Co fallback on.
6. Phase 3: per-workspace department catalogues and TM-103 validation.
7. Phase 4: per-workspace export and TM-101 column checks.
8. Phase 6: audit log writes, once Compliance has approved the schema.
9. Phase 1 contract: make `workspace_id` `NOT NULL` and add the foreign key.
10. Register the subsidiary workspaces and load their catalogues and members.
11. Phase 5: ship the switcher with `workspaces.switcher.enabled` off, then
    turn it on for internal users, then for everyone.
12. Parallel run for one quarter (see below).
13. Cutover: remove the header-less fallback.

## Migration

Each step is its own deploy, so any step can be reversed on its own.

| Step     | Forward                                                                  | Reverse                                                  |
|----------|--------------------------------------------------------------------------|----------------------------------------------------------|
| Expand   | Create `workspaces`, insert `parent-co`, add nullable `workspace_id`     | Drop the `workspace_id` columns, drop `workspaces`       |
| Backfill | Set `workspace_id = 'parent-co'` where null, in batches                  | Set `workspace_id = NULL` (data stays single-tenant)     |
| Contract | `NOT NULL` + foreign key to `workspaces(id)` on all three tables         | Drop the foreign key and `NOT NULL` constraints          |

- Backfill runs in batches using bound parameters, and it is idempotent, so a
  re-run only touches rows that are still null.
- Once subsidiary rows exist, the reverse of the backfill and expand steps must
  not run. Doing so would commingle entities. Before that point, export and
  remove the subsidiary rows first; Legal must approve any such rollback.
- The migration test (Phase 1, subtask 5) checks that row counts and every
  TM-102 `/api/members` response match before and after up → down → up.

## Feature flag

- Name: `workspaces.switcher.enabled`
- Default: **off**
- When off, the UI shows no switcher and sends no `X-Workspace-Id`, so the
  server falls back to Parent Co. This is exactly today's behaviour.
- The flag only controls the UI. Server-side workspace isolation is always on,
  regardless of the flag.

## Parallel run (one quarter)

For one quarter after step 5, requests that send no `X-Workspace-Id` are
served as Parent Co. This keeps these consumers working without any change:

- **Looker dashboards:** the three reports on
  `GET /api/members?department=X`. The response shape stays exactly as TM-102
  defines it; no fields are added, removed or renamed.
- **BambooHR weekly exporter:** keeps producing the Parent Co file. TM-101
  column stability and TM-103 `dept_code` validation still apply.
- **Public directory page:** shows Parent Co members only.

Within each workspace, the TM-101 deactivation flow and TM-103 validation
apply unchanged. Subsidiary data is never returned to a request that sends no
header. During the quarter, count how many requests arrive without a header,
per consumer, so each owner can be told to add `X-Workspace-Id: parent-co`
before cutover.

## Cutover

1. Confirm each header-less consumer (Looker, BambooHR exporter, public
   directory) now sends `X-Workspace-Id`, and that the header-less request
   count has been zero for two weeks.
2. Switch the header-less fallback off. A request without the header now gets
   `400` with a message naming the missing header.
3. Set `workspaces.switcher.enabled` to on by default and remove the flag in a
   later release.

## Rollback

- **Switcher problems:** turn `workspaces.switcher.enabled` off. No deploy is
  needed.
- **Consumer broken after cutover:** turn the header-less Parent Co fallback
  back on and extend the parallel run.
- **Authorization bug (wrong 403s):** redeploy the previous middleware release.
  Data is not affected.
- **Migration problem:** reverse the most recent step using the migration
  table. The expand and backfill reversals are only allowed before subsidiary
  data is loaded.
- **CLI:** omit `--workspace`. The CLI then behaves exactly as before
  (Parent Co, no header).

## Proposed `audit_log` schema — pending Compliance review

**Status: pending Compliance review. Do not merge Phase 6 until Compliance
approves.**

| Column         | Type          | Notes                                                        |
|----------------|---------------|--------------------------------------------------------------|
| `id`           | bigint, PK    | Generated                                                    |
| `workspace_id` | text, FK      | `NOT NULL`, references `workspaces(id)`                      |
| `actor_email`  | text          | `NOT NULL`; e.g. `actor@example.com` (placeholder)           |
| `action`       | text          | One of `member.create`, `member.update`, `member.delete`, `export.download` |
| `entity_id`    | text          | Member id; for exports, the workspace slug                   |
| `at`           | timestamptz   | `NOT NULL`, server time in UTC                               |

Questions for Compliance:

- Should reads be logged as well as writes and exports? The ticket asks for
  "every read and write"; the acceptance criteria only list writes and exports.
- Retention period, and whether `actor_email` must be pseudonymised after it.
- Whether rows must be append-only (no update or delete grants on the table).
- Whether an index on `(workspace_id, at)` is enough for the SOC 2 queries they
  plan to run.
