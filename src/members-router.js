/**
 * HTTP routes for the members API.
 */
import { logger } from './logger.js';
import { countActiveMembers } from './members-store.js';
import { isAuthorized } from './auth.js';

export function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(payload);
}

export function handleMembersRequest(req, res, url) {
  if (!url.pathname.startsWith('/api/members')) return false;

  if (url.pathname !== '/api/members/count') {
    logger.debug('members request', { method: req.method, path: url.pathname, status: 404 });
    sendJson(res, 404, { error: 'not_found' });
    return true;
  }

  if (req.method !== 'GET') {
    logger.debug('members request', { method: req.method, path: url.pathname, status: 405 });
    sendJson(res, 405, { error: 'method_not_allowed' });
    return true;
  }

  if (!isAuthorized(req)) {
    logger.debug('members request', { method: req.method, path: url.pathname, status: 401 });
    sendJson(res, 401, { error: 'unauthorized' });
    return true;
  }

  logger.debug('members request', { method: req.method, path: url.pathname, status: 200 });
  sendJson(res, 200, { count: countActiveMembers() });
  return true;
}
