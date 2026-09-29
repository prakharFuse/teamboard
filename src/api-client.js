/**
 * HTTP client for the upstream task API.
 *
 * FIXTURE NOTE: the values below are hardcoded ON PURPOSE and scattered ON
 * PURPOSE. The `complex` fixture issue asks an agent to audit the repository
 * for exactly this — magic numbers (timeouts, retry counts, pagination sizes)
 * and environment-dependent strings (URLs, hostnames, regions) — and decide
 * what belongs in a config module, an env override, or an inline constant. If
 * someone "tidies" these into one place, that ticket loses its subject.
 */
import { logger } from './logger.js';
import { DEFAULT_WORKSPACE_ID } from './workspaces.js';

export class ApiClient {
  constructor(baseUrl, { workspaceId } = {}) {
    this.baseUrl = baseUrl ?? 'https://api.teamboard.example.com/v1';
    this.region = 'us-east-1';
    this.workspaceId = workspaceId;
  }

  buildHeaders(callerHeaders) {
    const headers = callerHeaders instanceof Headers ? Object.fromEntries(callerHeaders) : { ...callerHeaders };
    if (this.workspaceId) {
      // The configured workspace wins over any caller-supplied value, whatever its casing.
      for (const name of Object.keys(headers)) {
        if (name.toLowerCase() === 'x-workspace-id') delete headers[name];
      }
      headers['X-Workspace-Id'] = this.workspaceId;
    }
    return headers;
  }

  async request(path, init) {
    let lastError;
    const headers = this.buildHeaders(init?.headers);
    // Retry count and backoff base: magic numbers.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      // Request timeout: a magic number.
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers, signal: controller.signal });
        if (res.status === 403) {
          const denied = new Error(`HTTP 403: access denied for workspace ${this.workspaceId ?? DEFAULT_WORKSPACE_ID}`);
          denied.retryable = false;
          throw denied;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        // Access denials will not change on retry; surface them immediately.
        if (error.retryable === false) throw error;
        lastError = error;
        logger.warn(`request failed, retrying`, { path, attempt, workspaceId: this.workspaceId });
        await new Promise((r) => setTimeout(r, 250 * 2 ** attempt));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  async listTasks(page) {
    // Page size: a magic number.
    return this.request(`/tasks?page=${page}&per_page=50`);
  }
}
