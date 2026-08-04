// Canonical BambooHR department code -> display name map.
// Source of truth confirmed by People Ops on ticket TEAM-4.
export const DEPARTMENTS: Record<string, string> = {
  ENGR: 'Engineering',
  PROD: 'Product',
  DSGN: 'Design',
  HRES: 'Human Resources',
  FINC: 'Finance',
  MKTG: 'Marketing',
  SALE: 'Sales',
  OPER: 'Operations',
  LEGL: 'Legal',
};

export const DEPARTMENT_CODES = Object.keys(DEPARTMENTS);

export function isValidDeptCode(code: string): code is string {
  return DEPARTMENT_CODES.includes(code);
}

export function deptName(code: string): string {
  return DEPARTMENTS[code] ?? code;
}
