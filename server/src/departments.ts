// IMPORTANT: this is the source of truth for allowed department values — see CLAUDE.md §Department Validation before editing.
// The client-side copy in client/src/App.tsx must mirror this list exactly.
// Any change to this list must be coordinated with People Ops and BambooHR first.
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

export type Department = typeof DEPARTMENTS[number];

export function isValidDepartment(value: string): value is Department {
  return (DEPARTMENTS as readonly string[]).includes(value);
}