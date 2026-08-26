export interface FailureContext {
  operation: string;
  error: unknown;
}

function escapeMrkdwn(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function postToSlack(payload: unknown): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL is not set; skipping Slack notification');
    return;
  }
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Slack notification failed (${res.status}): ${body}`);
  }
}

export async function notifyFailure(context: FailureContext): Promise<void> {
  const message = context.error instanceof Error ? context.error.message : String(context.error);
  const operation = escapeMrkdwn(context.operation);
  const errorMessage = escapeMrkdwn(message);
  const text = `Operation failed: ${operation} — ${errorMessage}`;

  const payload = {
    text,
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '🚨 Operation Failed' } },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Operation:*\n${operation}` },
          { type: 'mrkdwn', text: `*Error:*\n${errorMessage}` },
        ],
      },
    ],
  };

  try {
    await postToSlack(payload);
  } catch (err) {
    console.error('Failed to send Slack notification', err);
  }
}
