/**
 * Slack incoming-webhook notifier for failed operations.
 *
 * Reads the webhook URL from TEAMBOARD_SLACK_WEBHOOK_URL, shapes a Slack
 * message payload (plain `text` fallback plus mrkdwn `blocks`) and POSTs it.
 * `notifyFailure` is the entry point other code should call: it is a silent
 * no-op when the variable is unset and never throws.
 *
 * FIXTURE NOTE: this file is the Slack-notifier fixture's deliverable. The
 * request timeout and the message length limits are inline constants on
 * purpose, matching the rest of the repo's hardcoded config.
 */
import { logger } from './logger.js';

export const SLACK_WEBHOOK_ENV = 'TEAMBOARD_SLACK_WEBHOOK_URL';

/**
 * @typedef {object} FailureContext
 * @property {string} operation Name of the operation that failed.
 * @property {unknown} [error] The error or value that was thrown.
 * @property {Record<string, string|number|boolean>} [details] Extra key/value context.
 */

export function getWebhookUrl(env = process.env) {
  const value = env[SLACK_WEBHOOK_ENV]?.trim();
  return value ? value : undefined;
}

function truncate(value, max) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function escapeSlack(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clean(value, max) {
  return escapeSlack(truncate(value, max));
}

/**
 * @param {FailureContext} context
 * @returns {{ text: string, blocks: object[] }}
 */
export function buildFailurePayload(context) {
  const { operation, error, details } = context;
  const rawMessage = error === undefined
    ? 'unknown error'
    : error instanceof Error ? error.message : String(error);
  const message = clean(rawMessage, 500);
  const op = escapeSlack(String(operation));

  const blocks = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `:rotating_light: *${op}* failed\n${message}` },
    },
  ];

  const entries = Object.entries(details ?? {}).slice(0, 10);
  if (entries.length > 0) {
    blocks.push({
      type: 'section',
      fields: entries.map(([key, value]) => ({
        type: 'mrkdwn',
        text: `*${clean(key, 50)}*\n${clean(String(value), 300)}`,
      })),
    });
  }

  return { text: `teamboard: ${op} failed: ${message}`, blocks };
}

export async function postSlackMessage(
  payload,
  { webhookUrl = getWebhookUrl(), fetchImpl = globalThis.fetch } = {},
) {
  if (!webhookUrl) throw new Error(`${SLACK_WEBHOOK_ENV} is not set`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetchImpl(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Slack webhook responded ${res.status}: ${body}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @param {FailureContext} context
 * @param {{ webhookUrl?: string, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<boolean>} true when posted, false when unconfigured or failed.
 */
export async function notifyFailure(context, options = {}) {
  const webhookUrl = options.webhookUrl ?? getWebhookUrl();
  if (!webhookUrl) return false;
  try {
    await postSlackMessage(buildFailurePayload(context), { ...options, webhookUrl });
    return true;
  } catch (error) {
    // Never log the URL: fetch's TypeError message can contain it.
    const reason = error instanceof Error && error.message.startsWith('Slack webhook responded')
      ? error.message
      : error?.name ?? 'Error';
    logger.warn('slack notification failed', { operation: context?.operation, reason });
    return false;
  }
}
