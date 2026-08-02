// Canonical BambooHR department codes, confirmed by People Ops (TEAM-4).
// This is the authoritative list for validation, storage, and display.
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

export type DeptCode = keyof typeof DEPARTMENTS;

export const DEPT_CODES = Object.keys(DEPARTMENTS) as DeptCode[];

export function isValidDeptCode(value: unknown): value is DeptCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DEPARTMENTS, value);
}

export function deptName(code: DeptCode): string {
  return DEPARTMENTS[code];
}
