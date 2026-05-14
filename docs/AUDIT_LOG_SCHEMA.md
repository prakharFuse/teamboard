# TeamBoard — Audit Log Schema

> **Audience:** Compliance team (SOC 2 review), Engineering leads
> **Ticket:** TEAM-8
> **Status:** Pending Compliance sign-off — see [Sign-off section](#compliance-sign-off)

This document describes the `audit_log` table that records every authenticated read and write
performed against TeamBoard's `/api/members*` routes. Every row is written by the
`auditLogMiddleware` (`server/src/middleware/auditLog.ts`) on the `res.finish` event, after the
HTTP response has been sent. Audit failures are logged to `console.error` and **never** affect the
HTTP response.

---

## DDL

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_email  TEXT    NOT NULL,
  workspace_id INTEGER NOT NULL,
  action       TEXT    NOT NULL,
  entity_id    INTEGER,
  at           TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

---

## Column Descriptions

| Column         | Type      | Nullable | Description |
|----------------|-----------|----------|-------------|
| `id`           | `INTEGER` | No       | Auto-incrementing primary key. Monotonically increasing; can be used as a stable cursor for log exports. |
| `actor_email`  | `TEXT`    | No       | Email address of the authenticated user who made the request, sourced from the verified Okta JWT `email` claim (`req.workspace.userEmail`). |
| `workspace_id` | `INTEGER` | No       | Foreign key to `workspaces.id`. Identifies which workspace the action was performed against. Populated from `req.workspace.id`, which is resolved and validated by `workspaceContextMiddleware` before the route handler runs. |
| `action`       | `TEXT`    | No       | HTTP method concatenated with the normalised Express route path, separated by a single space. Examples: `GET /api/members`, `POST /api/members`, `PATCH /api/members/:id`, `DELETE /api/members/:id`, `GET /api/members/export`. The path is taken from `req.path` (the router-relative path), not the raw URL, so query-string parameters are **not** included. |
| `entity_id`    | `INTEGER` | Yes      | Integer primary key (`members.id`) of the specific member row affected by the action. Set to `NULL` for collection-level or non-row operations: list (`GET /api/members`), stats (`GET /api/members/stats`), and export (`GET /api/members/export`). For `POST /api/members`, the value is the `lastInsertRowid` captured in `res.locals.entityId`. For `PATCH` and `DELETE`, the value is the `:id` route parameter. |
| `at`           | `TEXT`    | No       | UTC datetime stored as an ISO 8601-like string produced by SQLite's `datetime('now')` function (format: `YYYY-MM-DD HH:MM:SS`). Always UTC; no timezone offset is stored. |

---

## `action` Value Reference

The table below lists every action value currently written to `audit_log` and its meaning.

| `action` value                  | Trigger                                    | `entity_id` |
|---------------------------------|--------------------------------------------|-------------|
| `GET /api/members`              | List members (directory page, Looker)      | `NULL`      |
| `POST /api/members`             | Create a new member                        | New row ID  |
| `GET /api/members/:id`          | Fetch a single member record               | Member ID   |
| `PATCH /api/members/:id`        | Update a member's fields                   | Member ID   |
| `DELETE /api/members/:id`       | Soft-delete a member (sets `is_active=0`)  | Member ID   |
| `GET /api/members/stats`        | Retrieve workspace member statistics       | `NULL`      |
| `GET /api/members/export`       | Download workspace CSV export              | `NULL`      |

> **Note:** `GET /api/config` and `POST /api/auth/callback` are public routes that run before
> `authMiddleware` and `workspaceContextMiddleware`. They are **not** logged to `audit_log`.
> `GET /api/workspaces` is logged (`entity_id = NULL`).

---

## Sample SOC 2 Queries

The following queries are written for SQLite and can be run directly against `data/team.db`.
For larger environments, the same logic applies to any SQL engine.

### Query 1 — All actions by a specific actor in the last 30 days

Use this query to produce an evidence artifact showing every operation a named user performed
within the audit window (e.g. in response to a SOC 2 auditor request for a specific employee or
during an access-review cycle).

```sql
-- Replace 'alice@example.com' with the target actor's email.
SELECT
    id,
    actor_email,
    workspace_id,
    action,
    entity_id,
    at
FROM audit_log
WHERE actor_email   = 'alice@example.com'
  AND at            >= datetime('now', '-30 days')
ORDER BY at DESC;
```

**Columns returned:**

| Column         | Meaning in context |
|----------------|--------------------|
| `id`           | Immutable event identifier for cross-referencing |
| `actor_email`  | Confirms the request was made by the named user |
| `workspace_id` | Identifies which workspace data was accessed |
| `action`       | Exact operation performed |
| `entity_id`    | Specific member record affected, or `NULL` for bulk reads |
| `at`           | UTC timestamp of the event |

---

### Query 2 — All reads and writes touching a specific workspace in a date range

Use this query to enumerate every data-access event for a given workspace within a calendar
window — for example, to satisfy a subsidiary's data-access audit or to confirm no cross-workspace
data leakage occurred.

```sql
-- Replace 1 with the target workspace_id (see workspaces table).
-- Replace the dates with the inclusive start and exclusive end of your audit window.
SELECT
    al.id,
    al.actor_email,
    w.slug          AS workspace_slug,
    w.name          AS workspace_name,
    al.action,
    al.entity_id,
    al.at
FROM audit_log  AS al
JOIN workspaces AS w ON w.id = al.workspace_id
WHERE al.workspace_id = 1
  AND al.at >= '2025-01-01 00:00:00'
  AND al.at <  '2025-04-01 00:00:00'
ORDER BY al.at ASC;
```

To look up a workspace's numeric ID by its human-readable slug:

```sql
SELECT id, slug, name FROM workspaces ORDER BY id;
```

Example output:

| id | slug                  | name                 |
|----|-----------------------|----------------------|
| 1  | `parent-co`           | Parent Co            |
| 2  | `brightline`          | Brightline           |
| 3  | `northstar-logistics` | Northstar Logistics  |
| 4  | `helio-studios`       | Helio Studios        |

---

## Design Notes

* **Append-only:** Rows are never updated or deleted. The table has no `UPDATE` or `DELETE`
  triggers. Physical deletion requires direct database access, which is out-of-band and auditable
  at the infrastructure level.
* **Failure isolation:** The middleware wraps the `INSERT` in `try/catch`. A failure to write an
  audit row will produce a `console.error` message but will **not** cause the HTTP request to fail.
  Operators should monitor for `audit_log INSERT` errors in application logs.
* **Timezone:** All timestamps are UTC (`datetime('now')` in SQLite). Consumers must not assume
  local time.
* **Query strings excluded from `action`:** The `action` column stores the normalised route path
  (`req.path`), not the full URL. This prevents high-cardinality values from search or filter
  parameters (e.g. `?department=Engineering&search=foo`) polluting the log. When the export
  endpoint is called with `?workspace=brightline`, the logged action is still
  `GET /api/members/export`.

---

## Compliance Sign-off

> ⚠️ **This sign-off must be completed before any code that writes to `audit_log` is merged to
> the main branch.**  Engineering will not merge the `auditLogMiddleware` or any route that
> populates `audit_log` rows until the box below is checked and attributed.

- [ ] **Compliance team approves the `audit_log` schema and the two SOC 2 sample queries
      documented above.**
      Signed by: _________________________ (name, title)
      Date: _________________________

Once signed, attach this document (or a link to the signed version) to the TEAM-8 Jira ticket and
add the reviewer's name to the PR description before requesting final merge approval.
