// ============================================================
// Notification Engine — Channel Adapters
// 헌법: "API First", "Event First"
// 각 채널(Slack/Email/Push/In-App)의 실제 발송 로직
// ============================================================

import type { ChannelDestination } from './schema';
import { renderNotification } from './template';

// --- 발송 결과 ---
export interface SendResult {
  channel: string;
  success: boolean;
  error?: string;
}

// --- 환경변수 참조 해결 ---
function resolveEnvRef(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // 'env:VARIABLE_NAME' → process.env.VARIABLE_NAME
  if (value.startsWith('env:')) {
    return process.env[value.slice(4)] ?? '';
  }
  return value;
}

// --- Slack 발송 ---
async function sendSlack(
  dest: ChannelDestination,
  context: Record<string, unknown>,
): Promise<SendResult> {
  const webhookUrl = resolveEnvRef(dest.config?.webhookUrl);
  if (!webhookUrl) {
    return { channel: 'slack', success: false, error: 'SLACK_WEBHOOK_URL 미설정' };
  }

  const { title, body } = renderNotification(dest.template, context);

  // Slack Block Kit (마크다운)
  const payload = {
    channel: dest.config?.channel ?? '#general',
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*${title}*\n${body}` },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { channel: 'slack', success: true };
    } else {
      const text = await response.text();
      return { channel: 'slack', success: false, error: `Slack ${response.status}: ${text}` };
    }
  } catch (err) {
    return {
      channel: 'slack',
      success: false,
      error: err instanceof Error ? err.message : 'Slack 발송 실패',
    };
  }
}

// --- Email 발송 (Phase 2 — Resend/Supabase) ---
async function sendEmail(
  dest: ChannelDestination,
  context: Record<string, unknown>,
): Promise<SendResult> {
  const { title, body } = renderNotification(dest.template, context);
  // TODO: Resend API 또는 Supabase Edge Function
  // 현재: 콘솔 출력 (개발용)
  console.log(`[Email] To: ${resolveEnvRef(dest.config?.to)} | Subject: ${title} | Body: ${body}`);
  return { channel: 'email', success: true };
}

// --- In-App 발송 (DB 저장) ---
async function sendInApp(
  dest: ChannelDestination,
  context: Record<string, unknown>,
  tenantId?: string,
): Promise<SendResult> {
  const { title, body } = renderNotification(dest.template, context);

  // TODO: Supabase notifications 테이블에 INSERT
  // 현재: 콘솔 출력 (개발용)
  console.log(`[In-App] Tenant: ${tenantId} | Title: ${title} | Body: ${body}`);

  return { channel: 'in_app', success: true };
}

// --- Push 발송 (Phase 2 — FCM/Web Push) ---
async function sendPush(
  dest: ChannelDestination,
  context: Record<string, unknown>,
): Promise<SendResult> {
  const { title, body } = renderNotification(dest.template, context);
  // TODO: Firebase Cloud Messaging 또는 Web Push API
  console.log(`[Push] Topic: ${dest.config?.topic} | Title: ${title} | Body: ${body}`);
  return { channel: 'push', success: true };
}

// --- 통합 발송 ---
export async function sendToChannel(
  dest: ChannelDestination,
  context: Record<string, unknown>,
  tenantId?: string,
): Promise<SendResult> {
  switch (dest.type) {
    case 'slack': return sendSlack(dest, context);
    case 'email': return sendEmail(dest, context);
    case 'in_app': return sendInApp(dest, context, tenantId);
    case 'push': return sendPush(dest, context);
    default: return { channel: 'unknown', success: false, error: '알 수 없는 채널' };
  }
}
