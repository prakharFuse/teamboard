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
