export const ALLOWED_DEPARTMENTS = [
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

export type Department = (typeof ALLOWED_DEPARTMENTS)[number];

export function isValidDepartment(dept: string): dept is Department {
  return (ALLOWED_DEPARTMENTS as readonly string[]).includes(dept);
}
