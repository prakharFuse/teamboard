---
name: module-system
description: ESM + NodeNext import rules for the server — why relative imports end in .js
type: convention
scope:
  - server/**
updated: '2026-08-21'
captured_sha: 3829eea37ba432ad6350c950990797e1623c05c5
sources:
  - server/tsconfig.json
  - server/src/index.ts
  - server/src/routes/members.ts
sources_sha256:
  server/src/index.ts: 6c2c286cd087d1bbf54d47cbab8b0ee3aa1e86795a2a1a615588e18f9541762b
  server/src/routes/members.ts: 6586b863330c5cbd58a48dd778b13bcd6f62eb660f776d5cc0344c3ccc672f37
  server/tsconfig.json: c03a42191f0418edbd3bf5fd54fef37ed91be7c0412042a354650ea7e46413c7
---

`server/tsconfig.json` sets `"module": "NodeNext"` / `"moduleResolution": "NodeNext"` and
`package.json` sets `"type": "module"`. Under this combination, relative imports in `.ts` files
must use the compiled `.js` extension, not `.ts` and not extensionless:

```ts
import membersRouter from './routes/members.js';  // correct — matches index.ts, members.ts
```

This isn't a stylistic choice — `tsc` will fail to resolve extensionless relative imports under
`NodeNext`, and the client (`client/tsconfig.json` uses `"moduleResolution": "bundler"`) has no
such restriction, so don't carry this rule over to `client/src`.
