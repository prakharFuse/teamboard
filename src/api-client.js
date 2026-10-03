/**
 * HTTP client for the upstream task API.
 *
 * FIXTURE NOTE: the values below are hardcoded ON PURPOSE and scattered ON
 * PURPOSE. The `complex` fixture issue asks an agent to audit the repository
 * for exactly this — magic numbers (timeouts, retry counts, pagination sizes)
 * and environment-dependent strings (URLs, hostnames, regions) — and decide
 * what belongs in a config module, an env override, or an inline constant. If
 * someone "tidies" these into one place, that ticket loses its subject.
 *
 * The optional `workspaceId` (TEAM-8) adds an `X-Workspace-Id` header to every
 * request. Without it no header is sent, so the server's Parent Co fallback
 * keeps legacy callers working during the one-quarter compatibility window.
 */
import { logger } from './logger.js';

export class ApiClient {
  constructor(baseUrl, { workspaceId } = {}) {
    this.baseUrl = baseUrl ?? 'https://api.teamboard.example.com/v1';
    this.region = 'us-east-1';
    this.workspaceId = workspaceId;
  }

  async request(path, init) {
    const headers = this.workspaceId
      ? { ...init?.headers, 'X-Workspace-Id': this.workspaceId }
      : init?.headers;
    let lastError;
    // Retry count and backoff base: magic numbers.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController();
      // Request timeout: a magic number.
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers, signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (error) {
        lastError = error;
        logger.warn(`request failed, retrying`, { path, attempt });
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
