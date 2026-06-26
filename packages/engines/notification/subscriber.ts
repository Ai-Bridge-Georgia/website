// ============================================================
// Notification Engine — Event Subscriber
// 헌법: "Event First"
// DomainEvent → Rule 매칭 → 자동 알림 발송
// ============================================================

import type { NotificationRule } from './schema';
import type { SendResult } from './channels';
import { sendToChannel } from './channels';

// --- Event Interface (core/DomainEvent 와 호환) ---
interface Event {
  id: string;
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

// --- 조건 검사 ---
function matchesCondition(
  condition: { field: string; operator: string; value: unknown } | undefined,
  payload: Record<string, unknown>,
): boolean {
  if (!condition) return true;

  const fieldValue = payload[condition.field];
  const target = condition.value;

  switch (condition.operator) {
    case 'eq': return fieldValue === target;
    case 'neq': return fieldValue !== target;
    case 'gt': return Number(fieldValue) > Number(target);
    case 'lt': return Number(fieldValue) < Number(target);
    case 'contains':
      return Array.isArray(fieldValue)
        ? fieldValue.includes(target)
        : String(fieldValue).includes(String(target));
    default: return false;
  }
}

// --- 이벤트 처리 ---
export async function processEvent(
  event: Event,
  rules: NotificationRule[],
): Promise<SendResult[]> {
  const results: SendResult[] = [];

  // 매칭되는 룰 찾기
  const matched = rules.filter(rule => {
    if (!rule.enabled) return false;
    if (rule.trigger.eventType !== event.eventType) return false;
    return matchesCondition(rule.trigger.condition, event.payload);
  });

  // 각 매칭 룰에 대해 알림 발송
  for (const rule of matched) {
    for (const channel of rule.channels) {
      // 텐넌트 정보 + 이벤트 payload를 합쳐서 context 구성
      const context = {
        ...event.payload,
        tenant_id: event.tenantId,
      };

      const result = await sendToChannel(channel, context, event.tenantId);
      results.push(result);
    }
  }

  return results;
}

// --- 간편 발송 (이벤트 없이 직접) ---
export async function notifyNow(
  channels: import('./schema').ChannelDestination[],
  context: Record<string, unknown>,
  tenantId?: string,
): Promise<SendResult[]> {
  const results: SendResult[] = [];
  for (const channel of channels) {
    const result = await sendToChannel(channel, context, tenantId);
    results.push(result);
  }
  return results;
}
