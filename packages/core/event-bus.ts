// ============================================================
// Business OS — Event Bus
// 헌법: "Event First — 모든 중요 액션은 도메인 이벤트를 발생시킨다"
// 엔진 간 런타임 연결의 핵심.
// Workflow → EventBus → Notification/Audit/Dashboard
// ============================================================

// --- Event Definition ---
export interface SystemEvent {
  id: string;
  tenantId: string;
  eventType: string;               // 'order.created' | 'reservation.confirmed'
  entity?: string;                 // 'orders' | 'reservations'
  entityId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  version: string;                 // 스키마 버전 (agy 권고)
}

// --- Event Handler ---
export type EventHandler = (event: SystemEvent) => Promise<void>;

// --- Subscription ---
interface Subscription {
  id: string;
  eventType: string;               // '*' = 모든 이벤트
  handler: EventHandler;
  priority?: number;               // 높을수록 먼저 (기본: 0)
}

// --- Event Bus (싱글톤) ---
class EventBusImpl {
  private subscriptions: Subscription[] = [];
  private history: SystemEvent[] = [];     // 최근 이벤트 (디버깅용)
  private maxHistory = 100;

  // --- 구독 ---
  on(eventType: string, handler: EventHandler, priority = 0): () => void {
    const sub: Subscription = {
      id: `${eventType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      handler,
      priority,
    };
    this.subscriptions.push(sub);
    this.subscriptions.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // 구독 해제 함수 반환
    return () => {
      this.subscriptions = this.subscriptions.filter((s) => s.id !== sub.id);
    };
  }

  // --- 발행 ---
  async emit(event: Omit<SystemEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: SystemEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
    };

    // 히스토리 저장
    this.history.unshift(fullEvent);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    // 매칭되는 핸들러 실행
    const matching = this.subscriptions.filter(
      (s) => s.eventType === event.eventType || s.eventType === '*',
    );

    // 병렬 실행 + 에러 격리 (한 핸들러 실패가 다른 핸들러에 영향 ❌)
    const results = await Promise.allSettled(
      matching.map((sub) => sub.handler(fullEvent)),
    );

    // 실패한 핸들러 로깅 (조용히)
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(
          `[EventBus] 핸들러 실패: ${matching[i].eventType}`,
          result.reason,
        );
      }
    });
  }

  // --- 동기 발행 (테스트용) ---
  emitSync(event: Omit<SystemEvent, 'id' | 'timestamp'>): SystemEvent {
    const fullEvent: SystemEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp: new Date().toISOString(),
    };

    this.history.unshift(fullEvent);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }

    return fullEvent;
  }

  // --- 히스토리 조회 (디버깅) ---
  getHistory(tenantId?: string, limit = 20): SystemEvent[] {
    const filtered = tenantId
      ? this.history.filter((e) => e.tenantId === tenantId)
      : this.history;
    return filtered.slice(0, limit);
  }

  // --- 구독 목록 (디버깅) ---
  getSubscriptions(): { eventType: string; count: number }[] {
    const grouped: Record<string, number> = {};
    for (const sub of this.subscriptions) {
      grouped[sub.eventType] = (grouped[sub.eventType] ?? 0) + 1;
    }
    return Object.entries(grouped).map(([eventType, count]) => ({ eventType, count }));
  }

  // --- 초기화 (테스트용) ---
  clear(): void {
    this.subscriptions = [];
    this.history = [];
  }
}

// --- 싱글톤 export ---
export const eventBus = new EventBusImpl();

// ============================================================
// 미리 정의된 이벤트 타입 (문서화)
// ============================================================

export const EVENT_TYPES = {
  // 예약
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CONFIRMED: 'reservation.confirmed',
  RESERVATION_SEATED: 'reservation.seated',
  RESERVATION_COMPLETED: 'reservation.completed',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_NO_SHOW: 'reservation.no_show',

  // 주문
  ORDER_CREATED: 'order.created',
  ORDER_ACCEPTED: 'order.accepted',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_SERVED: 'order.served',
  ORDER_CANCELLED: 'order.cancelled',

  // 메뉴
  MENU_CREATED: 'menu.created',
  MENU_UPDATED: 'menu.updated',
  MENU_DELETED: 'menu.deleted',

  // 리뷰
  REVIEW_CREATED: 'review.created',
  REVIEW_REPLIED: 'review.replied',

  // 분석
  GOAL_ACHIEVED: 'analytics.goal_achieved',

  // 시스템
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  CONFIG_CHANGED: 'config.changed',
} as const;

// ============================================================
// 엔진 연결 — Event Bus를 통한 엔진 간 런타임 통신
// ============================================================

// (엔진 import 제거 — DI 패턴으로 외부에서 주입)

// 엔진 연결은 런타임에 주입 (DI) — 순환 의존 방지
// Phase B: event-bus.ts는 코어에 있으므로 엔진을 직접 import하지 않음
// 대신, initializeEngineConnections() 함수에서 외부에서 연결

export function initializeEngineConnections(deps: {
  notifyProcessEvents?: (event: { id: string; tenantId: string; eventType: string; payload: Record<string, unknown> }) => Promise<unknown>;
  createAudit?: (params: Record<string, unknown>) => unknown;
}) {
  // Notification Engine 연결
  if (deps.notifyProcessEvents) {
    eventBus.on('*', async (event) => {
      try {
        await deps.notifyProcessEvents!({
          id: event.id,
          tenantId: event.tenantId,
          eventType: event.eventType,
          payload: event.payload,
        });
      } catch {
        // 조용히 실패
      }
    }, -10);
  }

  // Audit Engine 연결
  if (deps.createAudit) {
    eventBus.on('*', async (event) => {
      try {
        deps.createAudit!({
          tenantId: event.tenantId,
          action: event.eventType.split('.')[1] || 'system',
          resource: event.entity || event.eventType.split('.')[0],
          resourceId: event.entityId,
          newValue: event.payload,
        });
      } catch {
        // 조용히 실패
      }
    }, -20);
  }
}
