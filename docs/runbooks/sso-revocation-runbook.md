# SSO Revocation Runbook

**Ticket:** TEAM-6 — Investigate: HR data pipeline failures and SSO security gap in member lifecycle  
**Runbook type:** Operational — manual SSO revocation  
**Status:** Draft  
**Owner:** Security On-call / L3 Engineering  
**Last Updated:** 2026-06-10  
**RCA reference:** [`docs/rca/TEAM-6-sso-revocation-gap.md`](../rca/TEAM-6-sso-revocation-gap.md)  
**Script:** [`scripts/sso-revoke.ts`](../../scripts/sso-revoke.ts)

> **⚠️ Coordination notice:** If multiple engineers are working the same incident, only one person should hold the "runner" role at a time. Fill in the Tracking Sheet (§7) before executing any `--apply` run to prevent double-revocation or patchwork application across accounts.

---

## Table of Contents

1. [When to Run This Runbook](#1-when-to-run-this-runbook)
2. [Pre-conditions](#2-pre-conditions)
3. [Step-by-Step Procedure](#3-step-by-step-procedure)
4. [Rollback](#4-rollback)
5. [Post-conditions and Verification](#5-post-conditions-and-verification)
6. [Escalation Path](#6-escalation-path)
7. [Per-Account Tracking Sheet](#7-per-account-tracking-sheet)

---

## 1. When to Run This Runbook

Run this runbook when **any** of the following conditions is met:

| Trigger | Signal source | SLA to complete |
|---------|---------------|-----------------|
| Automated lifecycle event missed — member shows `departed` status in TeamBoard but SSO session is still `active` | Datadog alert `stale-active-session` (see `ops/monitoring/stale-active-session-alert.yaml`) | 4 h from alert fire |
| BambooHR termination webhook acknowledged (HTTP 200) but no subsequent `revoked` state transition observed in audit log | BambooHR delivery log / ops dashboard | 4 h from detection |
| Customer-reported security concern: former employee may still have SSO access | Support ticket / customer escalation | 2 h from escalation |
| Periodic backfill sweep for members departed > 24 h with no revocation record | `scripts/audit-backfill-query.sql` output reviewed by on-call | Next business-hours window |

**Do not** run this runbook for members whose status is already `revoked` or `archived` — the script is idempotent but the tracking overhead is not needed.

---

## 2. Pre-conditions

Confirm **all** items below before proceeding to §3.

### 2.1 Access
- [ ] You have read access to the TeamBoard production database (or a read replica).
- [ ] You have valid IdP admin credentials (or a service account token) for the relevant provider:
  - **Okta** — SSWS token or OAuth 2.0 client credentials with `okta.users.manage` scope.
  - **Azure AD** — App registration with `User.ReadWrite.All` permission (delegated or application).
  - **Google Workspace** — Service-account key with domain-wide delegation and `https://www.googleapis.com/auth/admin.directory.user` scope.
- [ ] `TEAMBOARD_DB_PATH` is set (or the default `data/teamboard.db` is reachable from your working directory).

### 2.2 Environment
- [ ] Node.js ≥ 20 and `tsx` are available (`npx tsx --version` returns without error).
- [ ] The repository is checked out and dependencies are installed (`npm install` at repo root).
- [ ] `data/sso-revoke-cache.json` exists or the `data/` directory is writable (the script creates the cache on first run).

### 2.3 Co-ordination
- [ ] You have claimed the "runner" role in the Tracking Sheet (§7) for all accounts you are about to process.
- [ ] A second engineer is aware you are starting an `--apply` run (buddy-check for high-severity incidents).

---

## 3. Step-by-Step Procedure

### Step 1 — Identify affected member(s)

Run the backfill audit query to find departed members without a revocation record:

```bash
# Substitute :threshold_hours with your desired lookback window (e.g. 48)
sqlite3 data/teamboard.db < scripts/audit-backfill-query.sql
```

Note the `member_id` and `idp_provider` for each row returned.

---

### Step 2 — Dry-run a single member (default behaviour)

`--dry-run` is the **default**. No IdP calls are made; the script only validates inputs and prints the audit line it *would* emit.

```bash
npx tsx scripts/sso-revoke.ts \
  --member-id <MEMBER_ID> \
  --idp-provider <okta|azure|google>
```

Review the JSON output. Confirm `"action": "would_revoke"` and that the member details look correct.

---

### Step 3 — Apply revocation for a single member

```bash
npx tsx scripts/sso-revoke.ts \
  --member-id <MEMBER_ID> \
  --idp-provider <okta|azure|google> \
  --apply
```

Expected output includes `"action": "revoked"` and `"idp_response": { "status": "ok" }`.  
The script writes a cache entry to `data/sso-revoke-cache.json`; a second invocation with the same `--member-id` will emit `"action": "no_op"` and exit 0.

---

### Step 4 — Handle members with unconfirmed departure status

If the member's TeamBoard status is *not yet* `departed` but you have out-of-band confirmation (e.g., HR email, BambooHR record) that they have left:

```bash
npx tsx scripts/sso-revoke.ts \
  --member-id <MEMBER_ID> \
  --idp-provider <okta|azure|google> \
  --force-departed \
  --apply
```

> **Caution:** `--force-departed` bypasses the state-machine guard. Use only when you have documented evidence of departure. Record the justification in the Tracking Sheet (§7, column *Notes*).

---

### Step 5 — Bulk sweep (multiple members)

For backfill runs covering many members, loop over the query output:

```bash
while IFS='|' read -r member_id idp_provider; do
  echo "Processing member_id=${member_id} idp_provider=${idp_provider}"
  npx tsx scripts/sso-revoke.ts \
    --member-id "${member_id}" \
    --idp-provider "${idp_provider}" \
    --apply
done < <(sqlite3 -separator '|' data/teamboard.db \
  "SELECT id, NULL AS idp_provider FROM members WHERE is_active = 0
   -- Placeholder: no sso_revoke_log table yet.
   -- Add: AND id NOT IN (SELECT member_id FROM sso_revoke_log)
   -- once ADAPTATION §3 of scripts/audit-backfill-query.sql is implemented.")
```

Redirect stdout to a log file for the post-run audit trail:

```bash
... | tee -a logs/sso-revoke-$(date +%Y%m%dT%H%M%S).jsonl
```

---

### Step 6 — Verify IdP directly

After each `--apply` run, confirm revocation in the IdP admin console:

| IdP | Where to check |
|-----|---------------|
| Okta | Admin Console → Directory → People → *user* → Deactivate status shows `DEPROVISIONED` |
| Azure AD | Azure Portal → Azure AD → Users → *user* → Account enabled = **No** |
| Google Workspace | Admin Console → Directory → Users → *user* → User suspended = **Yes** |

---

## 4. Rollback

> **Note:** SSO revocation is intentionally difficult to undo — that is its security purpose.  
> Re-provisioning a former employee is almost never the right response. Escalate to the Security team lead before performing any rollback.

### When rollback is appropriate
- Wrong member revoked (data-entry error in `--member-id`).
- Employee departure was entered in error (HR correction confirmed in writing).

### Rollback steps

1. Restore IdP access manually via the IdP admin console (do **not** use the script — no `--undo` flag exists by design).
2. Remove the member's entry from `data/sso-revoke-cache.json` so the script's idempotency guard is reset.
3. Update the member's `status` back to `active` in the TeamBoard database (requires DB write access; use a DBA-approved migration, not ad-hoc SQL in production).
4. Document the rollback with timestamp and justification in the Tracking Sheet (§7) and file a follow-up support note on the originating ticket.

---

## 5. Post-conditions and Verification

Confirm **all** items below after every `--apply` run before closing the incident.

- [ ] Script exit code was `0` for every member processed.
- [ ] All JSON audit lines contain `"action": "revoked"` (or `"no_op"` for already-revoked members).
- [ ] IdP admin console shows the expected deactivated/suspended state (§3 Step 6).
- [ ] `data/sso-revoke-cache.json` has a new entry for each processed member.
- [ ] JSONL log file archived to `logs/` and path recorded in the Tracking Sheet.
- [ ] Tracking Sheet status column updated to `Done` for each account row.
- [ ] Incident ticket (TEAM-6 or child ticket) updated with the summary of accounts remediated and the log path.

---

## 6. Escalation Path

| Situation | Escalate to |
|-----------|-------------|
| Script returns `NOT_IMPLEMENTED` for an IdP call | L3 Engineering on-call — the IdP integration stub needs to be wired up before this runbook can complete end-to-end |
| IdP admin credentials are unavailable or expired | IdP admin / IT Security lead |
| Member records missing or `idp_provider` is null | Database owner / platform engineering |
| Customer requests formal confirmation of revocation for compliance purposes | Customer Success + Legal |

---

## 7. Per-Account Tracking Sheet

**Purpose:** Prevent patchwork execution — multiple engineers or automated agents working the same incident must check this sheet before running `--apply`. Copy this template into the incident's Confluence page or Slack incident channel.

> Replace `<INCIDENT_ID>` with the ticket or alert ID (e.g. `TEAM-6`, `INC-20260610-001`).

```
# SSO Revocation Tracking — <INCIDENT_ID>
# Updated: <YYYY-MM-DD HH:MM UTC>
# Runner lock: <name/handle of engineer currently executing — set BEFORE running --apply>

| # | member_id | idp_provider | Status        | Runner     | apply_timestamp (UTC)   | Log file path                              | Notes                          |
|---|-----------|--------------|---------------|------------|-------------------------|--------------------------------------------|--------------------------------|
| 1 | 1042      | okta         | TODO          |            |                         |                                            |                                |
| 2 | 1078      | azure        | TODO          |            |                         |                                            |                                |
| 3 | 1091      | google       | In Progress   | @alice     | —                       |                                            | force-departed flag needed     |
| 4 | 1103      | okta         | Done          | @bob       | 2026-06-10 14:32 UTC    | logs/sso-revoke-20260610T143200.jsonl      |                                |
| 5 | 1117      | okta         | Skipped       | @alice     | —                       |                                            | Already revoked in IdP; no_op  |

# Status values:
#   TODO        — not yet assigned to a runner
#   In Progress — runner has claimed this row; --apply run in flight
#   Done        — --apply completed; IdP verified; log archived
#   Skipped     — member already revoked or excluded with documented reason
#   Rolled Back — revocation undone; see Notes for justification
```

### Field definitions

| Field | Required | Description |
|-------|----------|-------------|
| `member_id` | Yes | TeamBoard internal member ID passed to `--member-id` |
| `idp_provider` | Yes | One of `okta`, `azure`, `google` |
| `Status` | Yes | See status values above |
| `Runner` | Yes (before `--apply`) | Handle of the engineer executing this row |
| `apply_timestamp` | Yes (after `--apply`) | UTC timestamp when `--apply` run completed |
| `Log file path` | Yes (after `--apply`) | Path to the `.jsonl` log file saved in `logs/` |
| `Notes` | If applicable | `--force-departed` usage, rollback justification, skip reason |

---

_This runbook is a TEAM-6 deliverable. Review and update after each use; file improvements as follow-on tickets referencing TEAM-6._
