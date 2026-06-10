/**
 * Unit tests for the enforceRetentionPolicy service function.
 * Run by CI alongside the rest of the test suite (`pnpm test`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enforceRetentionPolicy, RetentionPolicyViolationError } from './retention.js';

test('enforceRetentionPolicy(null) does not throw', () => {
  assert.doesNotThrow(() => enforceRetentionPolicy(null));
});

test('enforceRetentionPolicy throws RetentionPolicyViolationError when deactivation is within 7 years', () => {
  // 2024-01-01 is only ~2.5 years before the reference date of 2026-06-10
  assert.throws(
    () => enforceRetentionPolicy('2024-01-01', new Date('2026-06-10')),
    (err: unknown) => {
      assert.ok(
        err instanceof RetentionPolicyViolationError,
        `expected RetentionPolicyViolationError, got ${err}`,
      );
      return true;
    },
  );
});

test('enforceRetentionPolicy does not throw when deactivation is older than 7 years', () => {
  // 2010-01-01 is ~16 years before the reference date of 2026-06-10
  assert.doesNotThrow(
    () => enforceRetentionPolicy('2010-01-01', new Date('2026-06-10')),
  );
});
