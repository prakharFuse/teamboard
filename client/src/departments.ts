// Kept in sync with server/src/departments.ts.
// Canonical BambooHR department code -> display name map.
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

export function deptName(code: string): string {
  return DEPARTMENTS[code] ?? code;
}
