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
] as const;

export function isValidDepartment(dept: unknown): dept is string {
  return typeof dept === 'string' && VALID_DEPARTMENTS.includes(dept);
}