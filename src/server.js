/**
 * HTTP server wiring the members API into a node:http listener.
 */
import { createServer as createHttpServer } from 'node:http';
import { handleMembersRequest, sendJson } from './members-router.js';

// Default port when the caller doesn't specify one.
const DEFAULT_PORT = 3000;
// Bind to loopback only; this fixture never serves beyond localhost.
const LOOPBACK_HOST = '127.0.0.1';

export function createServer() {
  return createHttpServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host ?? LOOPBACK_HOST}`);
    if (handleMembersRequest(req, res, url)) return;
    sendJson(res, 404, { error: 'not_found' });
  });
}

export function startServer(port = DEFAULT_PORT, host = LOOPBACK_HOST) {
  const server = createServer();
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve(server));
  });
}
