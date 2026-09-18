/**
 * HTTP client for the SSO provider's deprovisioning endpoint.
 *
 * Success is gated on `res.ok` alone — the provider returns an empty body
 * (204) on a successful termination, so calling `res.json()` here would turn
 * a successful deprovision into a false failure.
 */
import { logger } from './logger.js';

const BASE_URL = 'https://sso.teamboard.example.com/v1';

export class SsoClient {
  constructor({ fetchImpl = fetch, token = process.env.SSO_API_TOKEN } = {}) {
    this.fetchImpl = fetchImpl;
    this.token = token;
  }

  async deprovision(memberId) {
    if (!this.token) {
      throw new Error('Missing SSO_API_TOKEN');
    }

    logger.info('deprovisioning SSO access', { memberId });

    const res = await this.fetchImpl(`${BASE_URL}/members/${encodeURIComponent(memberId)}/terminate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}` },
    });

    if (!res.ok) {
      throw new Error(`SSO deprovision failed: HTTP ${res.status}`);
    }
  }
}
