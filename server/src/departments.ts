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

export const VALID_DEPT_CODES: readonly string[] = Object.keys(DEPARTMENT_CODES) as const;

export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENT_CODES, code);
}
