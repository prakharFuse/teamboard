/**
 * BambooHR department codes — single source of truth.
 *
 * Derived from the authoritative bamboohr-department-codes.csv attachment on
 * ticket TEAM-4. If BambooHR updates the canonical list, update this file
 * first and adjust any seed/test data accordingly.
 *
 * Usage:
 *   import { DEPT_CODES, VALID_DEPT_CODES, isValidDeptCode } from '../departments.js';
 */

/** Maps every accepted BambooHR dept_code to its human-readable display name. */
export const DEPT_CODES: Record<string, string> = {
  ENG: 'Engineering',
  PRD: 'Product',
  DSN: 'Design',
  MKT: 'Marketing',
  SLS: 'Sales',
  OPS: 'Operations',
  FIN: 'Finance',
  HR: 'HR',
  LEG: 'Legal',
};

/** Ordered list of all valid dept_code keys (e.g. for validation error messages). */
export const VALID_DEPT_CODES: string[] = Object.keys(DEPT_CODES);

/**
 * Returns true if `code` is one of the 9 BambooHR-accepted dept_codes.
 * Case-sensitive — BambooHR codes are always uppercase.
 */
export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPT_CODES, code);
}
