// Canonical BambooHR department codes, as confirmed by People Ops on
// 2026-05-26 (see TEAM-4 comment thread). These codes supersede the
// outdated CSV attachment on that ticket, which no longer matches what
// BambooHR's API accepts.
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

export const DEPARTMENT_CODES: string[] = Object.keys(DEPARTMENTS);

export function isValidDepartmentCode(code: unknown): code is string {
  return typeof code === 'string' && Object.prototype.hasOwnProperty.call(DEPARTMENTS, code);
}

export function departmentName(code: string): string {
  return DEPARTMENTS[code] ?? code;
}

export function allowedCodesError(): string {
  return `Invalid department code. Allowed codes: ${DEPARTMENT_CODES.join(', ')}`;
}
