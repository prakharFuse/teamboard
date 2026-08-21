import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy target mirrors the server's port config (see server/src/config.ts,
// the source of truth). We can't import that TS module directly here since
// this file runs standalone under Vite/Node, so the same TEAMBOARD_PORT /
// legacy PORT env vars and 4060 default are duplicated deliberately.
const apiTarget =
  process.env.TEAMBOARD_API_TARGET ??
  `http://localhost:${process.env.TEAMBOARD_PORT ?? process.env.PORT ?? 4060}`;

export default defineConfig({
  plugins: [react()],
  root: 'client',
  server: {
    proxy: {
      '/api': apiTarget,
    },
  },
});
