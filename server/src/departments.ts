/**
 * Canonical BambooHR department code registry.
 * Source: bamboohr-department-codes.csv (TEAM-4)
 *
 * These are the only valid dept_code values accepted by the BambooHR API.
 * All member records must store one of these codes in the `department` field.
 */

/** Maps each BambooHR dept_code to its human-readable display name. */
export const DEPARTMENT_CODES: Record<string, string> = {
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

/** Ordered list of all valid BambooHR dept_code keys. */
export const VALID_DEPT_CODES: string[] = Object.keys(DEPARTMENT_CODES);

/**
 * Returns true if `code` is a recognised BambooHR dept_code.
 * @param code - The dept_code value to validate.
 */
export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENT_CODES, code);
}

/**
 * Returns the display name for a given BambooHR dept_code,
 * or `undefined` if the code is not recognised.
 * @param code - The dept_code value to look up.
 */
export function getDeptName(code: string): string | undefined {
  return DEPARTMENT_CODES[code];
}
