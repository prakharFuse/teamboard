// NOTE: This file is intentionally duplicated from server/src/departments.ts.
// The client and server are separate TypeScript projects (bundler vs NodeNext
// module resolution) with no shared-code infrastructure, so the array is kept
// in sync manually. If you update one, update the other.

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