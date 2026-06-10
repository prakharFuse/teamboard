# TEAM-6 Data Model Gap Recommendations

**Ticket:** TEAM-6 — Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Document type:** Follow-on Recommendations — Data Model  
**Status:** Draft  
**Author:** _(assign)_  
**Peer Reviewer:** _(assign)_  
**Last Updated:** 2026-06-10  
**Canonical copy:** Confluence — TEAM-6 RCA (link in [`TEAM-6-README.md`](./TEAM-6-README.md))

> ⚠️ **Scope notice:** The fields and schema changes described in this document are **NOT implemented as part of TEAM-6**. This ticket is scoped to investigation and runbook/script scaffolding only. Each recommendation below must be tracked as a separate follow-on ticket before any schema migration is executed against production.

---

## Table of Contents

1. [Background](#1-background)
2. [Current Audit-Table Schema](#2-current-audit-table-schema)
3. [Recommended Missing Fields](#3-recommended-missing-fields)
   - 3.1 [`event_type`](#31-event_type)
   - 3.2 [Transition Timestamps](#32-transition-timestamps)
   - 3.3 [`idp_provider`](#33-idp_provider)
   - 3.4 [`offboarding_method`](#34-offboarding_method)
   - 3.5 [`bamboohr_sync_status`](#35-bamboohr_sync_status)
4. [Suggested Follow-on Tickets](#4-suggested-follow-on-tickets)

---

## 1. Background

During the TEAM-6 investigation two structural gaps in TeamBoard's audit and event-logging tables were identified that directly contributed to both the BambooHR pipeline failures and the SSO revocation gap:

1. **Observability gap** — there is no durable, queryable log of which lifecycle event triggered a given state change. Diagnosing incidents requires replaying application logs, which are not retained past 30 days.
2. **Forensic gap** — when an SSO revocation fails silently there is no field that captures *how* the offboarding was initiated or *which* IdP was targeted, making post-incident forensics depend entirely on engineer memory.

The recommended additions below are minimal — each field serves a concrete diagnostic or compliance purpose identified during this investigation. They are intentionally listed as discrete items so that each can be scoped, reviewed, and migrated independently.

---

## 2. Current Audit-Table Schema

The existing `members` table (see `server/src/db.ts`) tracks only the bare minimum:

| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER | Primary key |
| `name` | TEXT | Member display name |
| `email` | TEXT | Identity anchor |
| `status` | TEXT | Coarse lifecycle state (`active` / `departed` / …) |
| `created_at` | DATETIME | Row creation only |

There is currently **no** dedicated audit or lifecycle-event table. State transitions are inferred from `status` diffs in application logs rather than recorded as first-class rows.

---

## 3. Recommended Missing Fields

### 3.1 `event_type`

**Proposed table:** `member_lifecycle_events` (new table)  
**Column:** `event_type TEXT NOT NULL`

**Rationale:** Without a typed event log, distinguishing a BambooHR-initiated departure from a manual admin action requires log parsing. Recommended values form a closed enum:

| Value | Meaning |
|-------|---------|
| `BAMBOOHR_SYNC` | State change driven by BambooHR webhook or poll |
| `MANUAL_ADMIN` | Admin triggered via TeamBoard UI |
| `API_BULK_IMPORT` | Triggered via bulk-import API endpoint |
| `SSO_REVOCATION` | Dedicated SSO revocation action (may follow a departure event) |
| `SYSTEM_RECONCILE` | Background idempotency reconciliation pass |

**Dependency:** Requires the `member_lifecycle_events` table to exist before this field can be added.

---

### 3.2 Transition Timestamps

**Proposed table:** `member_lifecycle_events`  
**Columns:** `transitioned_at DATETIME NOT NULL`, `previous_status TEXT`, `new_status TEXT NOT NULL`

**Rationale:** The current schema records `created_at` on the member row but does not record when a state transition occurred. The TEAM-6 SSO gap (3-week window) could not be bounded precisely because `departed_at` was never stored. These three columns collectively answer: *when did the transition happen, where did it come from, and where did it go?*

**Notes:**
- `transitioned_at` should be stored as UTC ISO-8601.
- `previous_status` may be NULL for the initial `CREATED` event.
- Index on `(member_id, transitioned_at DESC)` recommended for the backfill query in `scripts/audit-backfill-query.sql`.

---

### 3.3 `idp_provider`

**Proposed table:** `member_lifecycle_events`  
**Column:** `idp_provider TEXT` (nullable — only populated for `SSO_REVOCATION` events)

**Rationale:** TeamBoard supports multiple IdP integrations (Okta, Azure AD, Google Workspace). When an SSO revocation silently fails, the current schema provides no way to determine which IdP call was attempted. Capturing this at event time enables per-IdP failure-rate alerting (see `ops/monitoring/stale-active-session-alert.yaml`).

**Recommended values:** `okta` | `azure_ad` | `google_workspace` | `saml_generic`

---

### 3.4 `offboarding_method`

**Proposed table:** `member_lifecycle_events`  
**Column:** `offboarding_method TEXT` (nullable — populated for `BAMBOOHR_SYNC`, `MANUAL_ADMIN`, `API_BULK_IMPORT` events)

**Rationale:** The per-offboarding-mode audit in `TEAM-6-sso-revocation-gap.md` §7 found that failure rates differ significantly between manual UI departures, API bulk imports, and BambooHR-triggered departures. Without this field, aggregate success/failure metrics cannot be broken down by initiation method.

**Recommended values:** `manual_ui` | `api_single` | `api_bulk` | `bamboohr_webhook` | `bamboohr_poll`

---

### 3.5 `bamboohr_sync_status`

**Proposed table:** `bamboohr_sync_runs` (new table) or as a column on `member_lifecycle_events`  
**Column:** `bamboohr_sync_status TEXT` (populated only when `event_type = 'BAMBOOHR_SYNC'`)

**Rationale:** The BambooHR deep-dive (`TEAM-6-bamboohr-pipeline-failures.md` §3) identified that sync errors are currently swallowed after logging. A structured status field enables the Datadog canary alert and the backfill SQL query to identify members whose last sync ended in a non-success state.

**Recommended values:**

| Value | Meaning |
|-------|---------|
| `success` | Sync applied cleanly |
| `partial` | Some fields updated; one or more fields failed validation |
| `skipped_no_change` | Payload identical to current state; no-op |
| `failed_validation` | Payload rejected before DB write |
| `failed_remote` | BambooHR API returned an error upstream |
| `failed_unknown` | Unclassified error; see `error_detail` column |

A companion `error_detail TEXT` column (nullable) should store the raw error message or exception class when status is `failed_*`.

---

## 4. Suggested Follow-on Tickets

Each row below represents a recommended, independent follow-on ticket. None of these are in scope for TEAM-6.

| Suggested Ticket | Scope | Blocking? |
|------------------|-------|-----------|
| Create `member_lifecycle_events` table + migration | Schema + migration script; backfill from existing logs where possible | Yes — prerequisite for all field additions below |
| Add `event_type`, `transitioned_at`, `previous_status`, `new_status` | First phase of event-table population | Depends on table creation |
| Add `idp_provider` + per-IdP alert wiring | SSO forensics + Datadog alert activation | Depends on event table; unblocks canary alert |
| Add `offboarding_method` | Failure-rate breakdown by initiation method | Depends on event table |
| Create `bamboohr_sync_runs` table + `bamboohr_sync_status` | BambooHR observability; activates backfill SQL | Depends on event table |
| Backfill historical events from application logs | Data quality; sets baseline for future anomaly detection | Depends on all field additions |

---

_This document was produced as part of the TEAM-6 investigation. It is a recommendations artefact only — no production schema changes are authorised under TEAM-6._
