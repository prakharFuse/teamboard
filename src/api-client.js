/**
 * HTTP client for the upstream task API.
 *
 * FIXTURE NOTE: the timeout, retry count, backoff base, page size, base URL and
 * region used to be scattered magic numbers and strings in this file (the
 * subject of the `complex` config-audit fixture). They now come from
 * src/config.js; env overrides are applied by index.js, not here.
 */
import { DEFAULTS } from './config.js';
import { logger } from './logger.js';

export class ApiClient {
  /**
   * Programmatic options are trusted and not validated; only env input is
   * validated (by loadConfig in src/config.js).
   *
   * @param {Partial<import('./config.js').ApiConfig>} [options]
   */
  constructor(options = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULTS.api.baseUrl;
    this.region = options.region ?? DEFAULTS.api.region;
    this.timeoutMs = options.timeoutMs ?? DEFAULTS.api.timeoutMs;
    this.maxAttempts = options.maxAttempts ?? DEFAULTS.api.maxAttempts;
    this.backoffBaseMs = options.backoffBaseMs ?? DEFAULTS.api.backoffBaseMs;
    this.pageSize = options.pageSize ?? DEFAULTS.api.pageSize;
  }

  async request(path, init) {
    let lastError;
    // Retry count: config (api.maxAttempts).
    for (let attempt = 0; attempt < this.maxAttempts; attempt += 1) {
      const controller = new AbortController();
      // Request timeout: config (api.timeoutMs).
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const res = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        lastError = error;
        logger.warn(`request failed, retrying`, { path, attempt });
        // Backoff base is config (api.backoffBaseMs); the `2 **` doubling is the
        // algorithm, not a tunable.
        await new Promise((r) => setTimeout(r, this.backoffBaseMs * 2 ** attempt));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  async listTasks(page) {
    // Page size: config (api.pageSize).
    return this.request(`/tasks?page=${page}&per_page=${this.pageSize}`);
  }
}
