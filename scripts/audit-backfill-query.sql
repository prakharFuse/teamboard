-- scripts/audit-backfill-query.sql
--
-- Blast-radius audit query: surfaces members whose departure event precedes
-- their SSO revocation by more than :threshold_hours, or whose SSO has not
-- been revoked at all (sso_revoked_at IS NULL).
--
-- Related: docs/rca/TEAM-6-sso-deep-dive.md §6
--          docs/runbooks/sso-revocation-runbook.md §2
--
-- ── Parameters ──────────────────────────────────────────────────────────────
--
--   :threshold_hours  REAL   Minimum gap (hours) between departure and SSO
--                            revocation to flag. Use 0 to return every departed
--                            member regardless of gap size.
--
--   :account_id       TEXT   Restrict results to a single account.
--                            Pass NULL (or omit binding) to scan all accounts.
--
-- ── Target table: member_offboarding_events ─────────────────────────────────
--
-- This query runs against member_offboarding_events, a supplementary audit
-- table populated during the TEAM-6 investigation from TeamBoard application
-- logs and IdP audit logs. Expected schema:
--
--   CREATE TABLE member_offboarding_events (
--     member_id                 TEXT NOT NULL,
--     account_id                TEXT NOT NULL,
--     email                     TEXT NOT NULL,
--     departure_event_at        TEXT NOT NULL,  -- ISO-8601 UTC; from DELETE API log
--     sso_revoked_at            TEXT,           -- ISO-8601 UTC; NULL = not yet revoked
--     idp_provider              TEXT,           -- added by TEAM-8; NULL until then
--     offboarding_trigger_type  TEXT            -- added by TEAM-8; NULL until then
--   );
--
-- ── COALESCE notes ───────────────────────────────────────────────────────────
--
-- idp_provider and offboarding_trigger_type are the two audit-log columns
-- called out in the spec that TEAM-8 will add to the members table / events
-- table. Until TEAM-8 ships and the columns are backfilled, both columns are
-- NULL for every row. The COALESCE('UNKNOWN') fallbacks below make this query
-- safe to run against the pre-TEAM-8 schema without modification.
--
-- ACTION after TEAM-8 deploys: remove the two COALESCE wrappers and update
-- the follow-on tickets note in docs/rca/TEAM-6-followup-tickets.md.
--
-- ── Usage ────────────────────────────────────────────────────────────────────
--
--   sqlite3 data/team.db \
--     "SELECT * FROM member_offboarding_events LIMIT 0;" \
--     ".read scripts/audit-backfill-query.sql"
--
--   Or via a parameterised SQLite client (Python sqlite3, etc.) binding
--   :threshold_hours and :account_id before execution.
--

SELECT
    moe.member_id,
    moe.account_id,
    moe.email,
    moe.departure_event_at,
    moe.sso_revoked_at,

    -- gap_hours: hours between departure and SSO revocation.
    -- NULL means SSO has not yet been revoked — these rows are highest priority.
    CASE
        WHEN moe.sso_revoked_at IS NOT NULL THEN
            ROUND(
                ( JULIANDAY(moe.sso_revoked_at)
                - JULIANDAY(moe.departure_event_at) ) * 24.0,
                2
            )
        ELSE NULL
    END AS gap_hours,

    -- COALESCE: idp_provider column does not exist until TEAM-8 ships.
    -- Remove COALESCE once TEAM-8 is deployed and the column is backfilled.
    COALESCE(moe.idp_provider, 'UNKNOWN')             AS idp_provider,

    -- COALESCE: offboarding_trigger_type column does not exist until TEAM-8 ships.
    -- Remove COALESCE once TEAM-8 is deployed and the column is backfilled.
    COALESCE(moe.offboarding_trigger_type, 'UNKNOWN') AS offboarding_trigger_type,

    -- Convenience flag: 1 = SSO revocation has not happened yet (highest risk).
    CASE WHEN moe.sso_revoked_at IS NULL THEN 1 ELSE 0 END AS revocation_pending

FROM
    member_offboarding_events AS moe

WHERE
    -- Account filter: bind :account_id to a specific value to scope to one
    -- account, or bind NULL (/ omit) to scan all accounts.
    ( moe.account_id = :account_id OR :account_id IS NULL )

    AND (
        -- Case 1: SSO was never revoked at all — always include regardless of threshold.
        moe.sso_revoked_at IS NULL

        OR

        -- Case 2: SSO was eventually revoked, but the gap exceeded the threshold.
        ( JULIANDAY(moe.sso_revoked_at)
        - JULIANDAY(moe.departure_event_at) ) * 24.0 > :threshold_hours
    )

ORDER BY
    -- Un-revoked members first (revocation_pending DESC), then longest gap,
    -- then earliest departure within each group.
    revocation_pending      DESC,
    gap_hours               DESC NULLS FIRST,
    moe.departure_event_at  ASC;
