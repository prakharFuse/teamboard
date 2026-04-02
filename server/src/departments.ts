// Canonical BambooHR department code → display name mapping.
// Source of truth for all dept_code validation in this service.
//
// NOTE: If these codes change, client/src/App.tsx must also be updated
// to keep its DEPT_MAP mirror in sync.
export const DEPT_MAP: Record<string, string> = {
  ENG: 'Engineering',
  PRD: 'Product',
  DSN: 'Design',
  MKT: 'Marketing',
  SLS: 'Sales',
  OPS: 'Operations',
  FIN: 'Finance',
  HR:  'HR',
  LEG: 'Legal',
};

// Derived list of valid codes — use this in route validation.
export const VALID_DEPT_CODES: string[] = Object.keys(DEPT_MAP);
