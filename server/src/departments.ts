export const DEPARTMENTS: Array<{ code: string; name: string }> = [
  { code: 'Engineering', name: 'Engineering' },
  { code: 'Product', name: 'Product' },
  { code: 'Design', name: 'Design' },
  { code: 'Marketing', name: 'Marketing' },
  { code: 'Sales', name: 'Sales' },
  { code: 'Operations', name: 'Operations' },
  { code: 'Finance', name: 'Finance' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'Legal', name: 'Legal' },
]

export const VALID_DEPT_CODES: string[] = DEPARTMENTS.map(d => d.code)

export function isValidDeptCode(code: string): boolean {
  return VALID_DEPT_CODES.includes(code)
}
