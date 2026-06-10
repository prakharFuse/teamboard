# Shared Root Cause Assessment (TEAM-6)

| Field           | Value                             |
|-----------------|-----------------------------------|
| **Parent RCA**  | [TEAM-6-rca.md](TEAM-6-rca.md)   |
| **Owner**       | `[TBC]`                           |
| **Status**      | Draft — determination pending final evidence |
| **Last updated**| 2026-06-10                        |

---

## Purpose

This document answers three specific questions about whether the two TEAM-6 incidents — **BambooHR import failures** and the **SSO 3-week deprovisioning gap** — share infrastructure, code paths, or data that would make them manifestations of a single root cause rather than two independent failures.

---

## Table of Contents

1. [Question 1 — Same Lifecycle Service?](#1-question-1--same-lifecycle-service)
2. [Question 2 — Shared Event Bus?](#2-question-2--shared-event-bus)
3. [Question 3 — Shared DB Transaction?](#3-question-3--shared-db-transaction)
4. [Comparative Symptom Mapping](#4-comparative-symptom-mapping)
5. [Final Determination](#5-final-determination)

---

## 1. Question 1 — Same Lifecycle Service?

**Question:** Do the BambooHR import pipeline and the SSO deprovisioning path share the same application service or process?

### Analysis

The TeamBoard codebase (as of 2026-06-10) is a monolithic Express application (`server/src/index.ts`) that registers a single router for member CRUD operations (`server/src/routes/members.ts`). There is no separate lifecycle service, worker process, or microservice.

| Path                          | Handler                         | Shares process with…              |
|-------------------------------|---------------------------------|-----------------------------------|
| `POST /api/members`           | `members.ts` router             | Same Node.js process              |
| `PATCH /api/members/:id`      | `members.ts` router             | Same Node.js process              |
| `DELETE /api/members/:id`     | `members.ts` router             | Same Node.js process              |
| BambooHR import job           | External scheduled job (`[TBC]`)| **Unknown** — may be same process or separate |
| IdP deprovisioning hook       | **Not implemented**             | N/A                               |

**Finding:** Both incidents converge on the `members.ts` route handler and the `members` SQLite table. However, the BambooHR import job's hosting context is unconfirmed (see [TEAM-6-bamboohr-deep-dive.md § 8](TEAM-6-bamboohr-deep-dive.md#8-open-questions), Q1). If the import job is in-process, they share the same lifecycle service. If out-of-process, they share only the database and API surface.

**Answer:** **Partially yes** — both incidents touch the same Express route layer and SQLite database. Whether they share the same OS process depends on the import job architecture (to be confirmed). The structural weakness — a member lifecycle with no observable side-effects — is common to both.

---

## 2. Question 2 — Shared Event Bus?

**Question:** Is there a shared event bus, message queue, or pub/sub mechanism through which both the BambooHR import and the SSO deprovisioning path operate?

### Analysis

Inspection of the codebase reveals:

- No message queue client is imported or referenced in any server-side file (`Bull`, `BullMQ`, `RabbitMQ`, `Kafka`, `SQS`, `SNS`, `EventEmitter`-based bus, etc.).
- No webhook dispatcher or outbound HTTP event emitter is wired to the `members.ts` router.
- The only persistence layer is `node:sqlite` (`DatabaseSync`) — a synchronous, in-process SQLite driver with no streaming or trigger mechanism exposed to external consumers.

**Finding:** There is **no event bus** of any kind — shared or otherwise. This is both the answer to this question and itself a root cause:

- The BambooHR import fails silently because there is no event to subscribe to or audit trail to write to.
- The SSO gap persists because `DELETE /api/members/:id` has no side-effect notification; no hook exists to listen for a "member deleted" event and trigger IdP deprovisioning.

**Answer:** **No** — there is no shared event bus. The absence of any event bus is a shared structural root cause for both failures. Both incidents would be resolved (or made detectable) by introducing a reliable side-effect mechanism on member lifecycle transitions.

---

## 3. Question 3 — Shared DB Transaction?

**Question:** Do the BambooHR import pipeline and the SSO deprovisioning path share a database transaction, such that a failure in one could roll back or corrupt the other?

### Analysis

The `members.ts` router uses `DatabaseSync` from `node:sqlite`. Review of the DB layer (`server/src/db.ts`) and the route handlers indicates:

- Each API request executes its SQL statement synchronously within the request/response cycle.
- There is no explicit `BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK` wrapping multiple operations across the two paths.
- The BambooHR import job (if external) calls the TeamBoard REST API; it does not have direct DB access and therefore cannot participate in the same SQLite transaction.
- If the import job is in-process, it still calls through the route layer, which executes independent statements per record.

**Finding:** The two incidents do **not** share a DB transaction. Each operation (BambooHR upsert call, member DELETE) executes as an independent SQL statement. A failure in one cannot roll back the other at the DB level.

However, a related concern exists: the `members` table is the **single shared state** for both paths. If BambooHR import creates a member record that is then deleted via the offboarding path, but the BambooHR job has no awareness of this (no `updated_at` / `deleted_at` tracking), the next import run may **recreate the deleted member** — effectively undoing the offboarding. This is a shared-state race condition, not a shared transaction, but it has security implications analogous to the SSO gap.

**Answer:** **No** — the two paths do not share a DB transaction. However, they share mutable state in the `members` table with no coordination mechanism, creating a potential race condition where BambooHR re-imports a deleted (offboarded) member.

---

## 4. Comparative Symptom Mapping

| Dimension                        | BambooHR Failures                              | SSO Gap                                       | Shared?         |
|----------------------------------|------------------------------------------------|-----------------------------------------------|-----------------|
| Code layer                       | `members.ts` router (POST/PATCH) + import job  | `members.ts` router (DELETE) + IdP (manual)   | Partially       |
| Database table                   | `members`                                      | `members`                                     | **Yes**         |
| Event bus                        | None                                           | None                                          | **Yes (absent)**|
| Audit logging                    | No per-record audit                            | No `idp_provider` / `offboarding_trigger_type`| **Yes (absent)**|
| Error visibility                 | Silent failures — swallowed exceptions         | Silent gap — no alert on stale SSO session    | **Yes**         |
| Downstream system notification   | None (import is inbound; no outbound notif)    | None (DELETE has no outbound hook)            | **Yes (absent)**|
| Human process dependency         | Import job config/credentials (operational)   | Manual IdP step (offboarding checklist)        | **Yes**         |
| Observable state mismatch        | BambooHR ≠ TeamBoard member list               | TeamBoard deleted ≠ IdP active                | **Yes (pattern)**|

---

## 5. Final Determination

### Determination

The two incidents are **not caused by the same code defect** (no shared transaction, no shared hook, no shared service that is broken in one place). They are, however, manifestations of the **same architectural pattern deficit** in the TeamBoard member lifecycle:

> **Root cause (shared):** The TeamBoard member lifecycle has no reliable, observable side-effect mechanism. Member creates, updates, and deletes succeed in SQLite but produce no durable event, no audit record, and no downstream notification. Both the BambooHR import failures and the SSO deprovisioning gap are exploitable consequences of this gap.

Specifically:

1. **BambooHR failures** are caused by: (a) the absence of per-record audit logging (Stage 5 gap); and (b) likely error-handling defects in the import job (F-1 / F-3 hypotheses). The structural enabler is the same lifecycle with no event emission.

2. **SSO gap** is caused by: (a) the absence of a post-DELETE IdP deprovisioning hook (S-1 — confirmed); and (b) no runbook or audit column to enforce or detect the gap (S-3, S-4 — confirmed). The structural enabler is the same lifecycle with no event emission.

### Classification

| Aspect                         | Assessment                                      |
|--------------------------------|-------------------------------------------------|
| Same root-cause code defect?   | **No** — distinct failure points per incident   |
| Same root-cause architecture?  | **Yes** — no side-effect bus on member lifecycle|
| Fix one to fix both?           | **No** — separate fixes required (TEAM-7 through TEAM-11) |
| Shared fix reduces both risks? | **Yes** — adding lifecycle event emission (e.g. a post-write hook / outbox table) would directly address both incidents and is the recommended long-term architectural direction |

### Recommended architectural direction

Introduce a **member lifecycle event outbox** (a simple DB table or in-process `EventEmitter` with guaranteed delivery semantics) that fires on every `CREATE`, `UPDATE`, and `DELETE` to the `members` table. Consumers register handlers for each event type:

- BambooHR audit handler: writes a per-record import audit log entry.
- SSO deprovisioning handler: calls the appropriate IdP API on `DELETE`.
- Future handlers: Slack notification, calendar deprovisioning, etc.

This architectural change is **out of scope for the current investigation sprint** (no production handler changes). It should be the P0 item in the next planning cycle following sign-off of this RCA.
