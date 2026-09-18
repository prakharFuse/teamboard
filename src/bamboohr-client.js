/**
 * HTTP client for the BambooHR directory API.
 *
 * Unlike src/api-client.js, this client fails fast on 401/403 instead of
 * retrying them — retrying an auth failure only wastes the full backoff
 * budget before surfacing the same error, and masks expired-credential
 * incidents behind several seconds of pointless delay.
 */
import { logger } from './logger.js';

const BASE_URL = 'https://api.bamboohr.example.com/v1';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 250;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class BambooHrClient {
  constructor({ fetchImpl = fetch, apiKey = process.env.BAMBOOHR_API_KEY } = {}) {
    this.fetchImpl = fetchImpl;
    this.apiKey = apiKey;
  }

  async request(path, init = {}) {
    if (!this.apiKey) {
      throw new Error('Missing BAMBOOHR_API_KEY');
    }

    let lastError;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res;
      try {
        res = await this.fetchImpl(`${BASE_URL}${path}`, {
          ...init,
          signal: controller.signal,
          headers: { ...(init.headers ?? {}), Authorization: `Bearer ${this.apiKey}` },
        });
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        logger.warn('request failed, retrying', { path, attempt });
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, BACKOFF_BASE_MS * 2 ** attempt));
        }
        continue;
      }
      clearTimeout(timer);

      if (res.status === 401 || res.status === 403) {
        throw new Error(`BambooHR request failed: HTTP ${res.status}`);
      }
      if (!res.ok) {
        lastError = new Error(`BambooHR request failed: HTTP ${res.status}`);
        logger.warn('request failed, retrying', { path, attempt });
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((resolve) => setTimeout(resolve, BACKOFF_BASE_MS * 2 ** attempt));
        }
        continue;
      }

      return await res.json();
    }
    throw lastError;
  }

  async fetchDirectory({ since } = {}) {
    const query = since ? `?since=${encodeURIComponent(since)}` : '';
    return this.request(`/directory${query}`, { method: 'GET' });
  }
}

export function mapEmployee(raw) {
  const invalid = [];
  if (typeof raw?.id !== 'string' || raw.id.length === 0) invalid.push('id');
  if (typeof raw?.workEmail !== 'string' || !EMAIL_RE.test(raw.workEmail)) invalid.push('workEmail');
  if (typeof raw?.role !== 'string' || raw.role.length === 0) invalid.push('role');

  if (invalid.length > 0) {
    throw new Error(`invalid BambooHR record: ${invalid.join(', ')}`);
  }

  return { externalId: raw.id, email: raw.workEmail, role: raw.role };
}
