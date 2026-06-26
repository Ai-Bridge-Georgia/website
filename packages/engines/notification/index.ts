// @aibg/engine-notification — Notification Engine
// 헌법: "Event First", "Everything is Metadata"
// 이벤트 → 룰 매칭 → 자동 알림 발송.

export type {
  NotificationRule, ChannelDestination, NotificationTemplate,
  ChannelType, Priority, TemplateVar,
} from './schema';
export { defaultRules } from './schema';
export { renderTemplate, renderNotification } from './template';
export { sendToChannel } from './channels';
export type { SendResult } from './channels';
export { processEvent, notifyNow } from './subscriber';
