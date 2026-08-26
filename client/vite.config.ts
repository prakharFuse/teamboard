import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy target defaults mirror server/src/config.ts (the canonical source of
// truth for TeamBoard runtime config). Keep TEAMBOARD_HOST / TEAMBOARD_PORT
// (with legacy PORT fallback) and their defaults in sync with that module.
const apiHost = process.env.TEAMBOARD_HOST ?? 'localhost';
const apiPort = process.env.TEAMBOARD_PORT ?? process.env.PORT ?? '4060';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  server: {
    proxy: {
      '/api': `http://${apiHost}:${apiPort}`,
    },
  },
});
