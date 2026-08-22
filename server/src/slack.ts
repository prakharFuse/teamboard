const SLACK_TIMEOUT_MS = 5000;
const MAX_TEXT_LENGTH = 3000;

interface SlackPayload {
  text: string;
  blocks?: unknown[];
}

export async function postToSlack(payload: SlackPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not set; skipping Slack notification');
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS);
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Slack webhook responded with ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err: unknown) {
    console.error('Slack webhook request failed:', err instanceof Error ? err.message : err);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export interface FailureContext {
  operation: string;
  severity: string;
  environment: string;
  timestamp: string;
  error: string;
}

function escapeSlackText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(text: string, maxLength: number): string {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export async function notifyFailure(context: FailureContext): Promise<boolean> {
  try {
    const operation = truncate(escapeSlackText(context.operation), MAX_TEXT_LENGTH);
    const error = truncate(escapeSlackText(context.error), MAX_TEXT_LENGTH);
    const text = truncate(`:red_circle: *${operation}* failed in ${context.environment}`, MAX_TEXT_LENGTH);

    const payload: SlackPayload = {
      text,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `Failure: ${operation}`, emoji: true },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Operation:*\n${operation}` },
            { type: 'mrkdwn', text: `*Severity:*\n${context.severity}` },
            { type: 'mrkdwn', text: `*Environment:*\n${context.environment}` },
            { type: 'mrkdwn', text: `*Timestamp:*\n${context.timestamp}` },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Error:*\n\`\`\`${error}\`\`\`` },
        },
      ],
    };

    return await postToSlack(payload);
  } catch (err: unknown) {
    console.error('Failed to build/send Slack failure notification:', err instanceof Error ? err.message : err);
    return false;
  }
}
