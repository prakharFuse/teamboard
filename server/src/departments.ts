export const DEPARTMENTS = [
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

export type Department = (typeof DEPARTMENTS)[number];

export function isValidDepartment(dept: string): dept is Department {
  return (DEPARTMENTS as readonly string[]).includes(dept);
}

export const DEPARTMENTS_ERROR_MSG =
  `Invalid department. Allowed values: ${DEPARTMENTS.join(', ')}`;
