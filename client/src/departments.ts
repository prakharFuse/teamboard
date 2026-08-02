export const DEPARTMENTS = {
  ENGR: 'Engineering',
  PROD: 'Product',
  DSGN: 'Design',
  HRES: 'Human Resources',
  FINC: 'Finance',
  MKTG: 'Marketing',
  SALE: 'Sales',
  OPER: 'Operations',
  LEGL: 'Legal',
} as const;

export type DeptCode = keyof typeof DEPARTMENTS;

export const DEPARTMENT_CODES = Object.keys(DEPARTMENTS) as DeptCode[];
