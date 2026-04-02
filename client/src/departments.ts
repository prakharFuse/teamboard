/**
 * BambooHR department codes — client-side constants.
 *
 * Intentionally decoupled from server/src/departments.ts: the server compiles
 * under NodeNext module resolution while this file is bundled by Vite.
 * Both files must stay in sync with the authoritative bamboohr-department-codes.csv
 * attachment on ticket TEAM-4. If BambooHR updates the canonical list, update
 * both this file and server/src/departments.ts together.
 *
 * Usage:
 *   import { DEPT_CODES } from './departments';
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

/** Ordered list of all valid dept_code keys (e.g. for populating <select> options). */
export const VALID_DEPT_CODES: string[] = Object.keys(DEPT_CODES);

/**
 * Returns true if `code` is one of the 9 BambooHR-accepted dept_codes.
 * Case-sensitive — BambooHR codes are always uppercase.
 */
export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPT_CODES, code);
}
