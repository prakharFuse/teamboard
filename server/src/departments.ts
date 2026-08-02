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

export function isValidDepartmentCode(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(DEPARTMENTS, code);
}

export function departmentName(code: string): string {
  return DEPARTMENTS[code] ?? code;
}
