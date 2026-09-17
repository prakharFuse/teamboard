/**
 * Bearer-token authorization guard for the members API.
 */
import { timingSafeEqual } from 'node:crypto';

const BEARER_PREFIX = 'Bearer ';

export function isAuthorized(req) {
  const header = req.headers?.authorization;
  if (typeof header !== 'string' || !header.startsWith(BEARER_PREFIX)) return false;

  const token = header.slice(BEARER_PREFIX.length);
  const expected = process.env.TEAMBOARD_API_TOKEN;
  if (!token || !expected) return false;

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expected);
  if (tokenBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(tokenBuffer, expectedBuffer);
}
