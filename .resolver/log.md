2026-08-26 · first-run · created .resolver
3915d5e6-4565-44ae-a571-911383c9fc9b: corrected knowledge/architecture.md — vite proxy now reads TEAMBOARD_HOST/TEAMBOARD_PORT (server/src/config.ts) instead of hardcoding localhost:4060
3915d5e6-4565-44ae-a571-911383c9fc9b: corrected knowledge/overview.md — port 4060 is now a config.ts default overridable via TEAMBOARD_PORT, not a hardcoded index.ts value
3915d5e6-4565-44ae-a571-911383c9fc9b: added fact to conventions/testing.md — config.test.ts tests loadConfig via explicit env args rather than mutating process.env
