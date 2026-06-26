// ============================================================
// Notification Engine — Schema Definition
// 헌법: "Event First", "Everything is Metadata"
// 도메인 이벤트 → 자동 알림 발송 (Slack/Email/Push/In-App)
// ============================================================

// --- Channels ---
export type ChannelType = 'slack' | 'email' | 'push' | 'in_app';

// --- Notification Priority ---
export type Priority = 'low' | 'normal' | 'high' | 'critical';

// --- Template Variable ---
export interface TemplateVar {
  key: string;          // 'customer_name'
  source: 'event' | 'tenant' | 'static';
  fallback?: string;
}

// --- Notification Rule (이벤트 → 알림 매핑) ---
export interface NotificationRule {
  id: string;
  name: string;

  // 트리거: 어떤 이벤트에 발동?
  trigger: {
    eventType: string;            // 'order.created', 'reservation.new'
    condition?: {                 // 조건부 발동
      field: string;              // 'status'
      operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains';
      value: unknown;
    };
  };

  // 발송: 어디로?
  channels: ChannelDestination[];

  // 대상: 누구에게?
  audience: 'tenant_owner' | 'tenant_staff' | 'customer' | 'all';

  // 우선순위
  priority: Priority;

  // 활성/비활성
  enabled: boolean;
}

// --- Channel Destination ---
export interface ChannelDestination {
  type: ChannelType;
  // 템플릿 (메타데이터)
  template: NotificationTemplate;
  // 채널별 설정
  config?: {
    // Slack
    webhookUrl?: string;          // 환경변수 참조: 'env:SLACK_WEBHOOK_URL'
    channel?: string;             // '#general'
    // Email
    to?: string;                  // 'env:OWNER_EMAIL'
    from?: string;
    subject?: string;
    // Push
    topic?: string;
    // In-App
    persistent?: boolean;
  };
}

// --- Notification Template ---
export interface NotificationTemplate {
  title: string;                  // 변수 치환: '{{customer_name}}님 예약 확정'
  body: string;                   // '{{date}} {{time}} {{party_size}}명'
  // 포맷
  format?: 'plain' | 'markdown' | 'html';
  // 다국어 (헌법: Localization)
  locale?: Record<string, { title: string; body: string }>;
}

// --- Rule Registry (메타데이터) ---
export const defaultRules: NotificationRule[] = [
  // 예: 새 주문 → Slack 알림 (점주)
  {
    id: 'order-created-slack',
    name: '새 주문 Slack 알림',
    trigger: {
      eventType: 'order.created',
    },
    channels: [{
      type: 'slack',
      template: {
        title: '🛎️ 새 주문 #{{order_id}}',
        body: '{{customer_name}} — {{order_type}} — {{total}}',
        format: 'markdown',
      },
      config: {
        webhookUrl: 'env:SLACK_WEBHOOK_URL',
        channel: '#orders',
      },
    }],
    audience: 'tenant_owner',
    priority: 'normal',
    enabled: true,
  },

  // 예: 새 예약 → Slack + In-App (점주)
  {
    id: 'reservation-new-slack',
    name: '새 예약 Slack + In-App',
    trigger: {
      eventType: 'reservation.created',
    },
    channels: [
      {
        type: 'slack',
        template: {
          title: '📅 새 예약',
          body: '{{customer_name}} — {{date}} {{time}} — {{party_size}}명',
          format: 'markdown',
        },
        config: {
          webhookUrl: 'env:SLACK_WEBHOOK_URL',
          channel: '#reservations',
        },
      },
      {
        type: 'in_app',
        template: {
          title: '새 예약: {{customer_name}}',
          body: '{{date}} {{time}} / {{party_size}}명',
        },
        config: { persistent: true },
      },
    ],
    audience: 'tenant_owner',
    priority: 'normal',
    enabled: true,
  },

  // 예: 부정 리뷰 → Slack (긴급)
  {
    id: 'review-negative-alert',
    name: '부정 리뷰 긴급 알림',
    trigger: {
      eventType: 'review.created',
      condition: { field: 'rating', operator: 'lt', value: 3 },
    },
    channels: [{
      type: 'slack',
      template: {
        title: '⚠️ 부정 리뷰 ({{rating}}점)',
        body: '{{customer_name}}: "{{content}}"',
        format: 'markdown',
      },
      config: {
        webhookUrl: 'env:SLACK_WEBHOOK_URL',
        channel: '#alerts',
      },
    }],
    audience: 'tenant_owner',
    priority: 'high',
    enabled: true,
  },

  // 예: 매출 목표 달성 → Slack (축하)
  {
    id: 'sales-goal-achieved',
    name: '매출 목표 달성',
    trigger: {
      eventType: 'analytics.goal_achieved',
    },
    channels: [{
      type: 'slack',
      template: {
        title: '🎉 목표 달성!',
        body: '오늘 매출 {{today_sales}} — 목표 {{target}} 달성!',
        format: 'markdown',
      },
      config: {
        webhookUrl: 'env:SLACK_WEBHOOK_URL',
        channel: '#general',
      },
    }],
    audience: 'tenant_owner',
    priority: 'normal',
    enabled: true,
  },
];
