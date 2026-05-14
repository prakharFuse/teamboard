export const VALID_DEPARTMENTS: readonly string[] = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Operations',
  'Finance',
  'HR',
  'Legal',
];

export function isValidDepartment(value: string): boolean {
  return VALID_DEPARTMENTS.includes(value);
}

export function departmentValidationError(value: string): string {
  return `Invalid department code "${value}". Allowed codes: ${VALID_DEPARTMENTS.join(', ')}`;
}
