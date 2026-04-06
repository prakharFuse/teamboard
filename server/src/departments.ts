export const DEPARTMENT_MAP: Record<string, string> = {
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

export const VALID_DEPT_CODES: string[] = Object.keys(DEPARTMENT_MAP);

export function isValidDeptCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENT_MAP, code);
}
