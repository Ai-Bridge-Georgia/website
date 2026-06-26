// ============================================================
// Workflow Engine — Schema Definition
// 헌법: "Everything is an Engine", "Everything is Metadata"
// 헌법: "Configuration over Customization"
// 상태 머신을 메타데이터로 정의 → 코드 없이 워크플로우 구축
// ============================================================

// --- State Definition ---
export interface WorkflowState {
  name: string;                  // 'pending' | 'confirmed' | 'cancelled'
  label: string;                 // '대기 중' | '확정' | '취소됨'
  color?: string;                // UI 표시용 ('#F59E0B')
  isInitial?: boolean;           // 시작 상태
  isFinal?: boolean;             // 종료 상태 (더 이상 전이 불가)
  // 진입/이탈 시 액션
  onEnter?: WorkflowAction[];
  onExit?: WorkflowAction[];
}

// --- Transition Definition ---
export interface WorkflowTransition {
  from: string;                  // 현재 상태
  to: string;                    // 전이할 상태
  event: string;                 // 트리거 이벤트 ('reservation.confirm')
  label?: string;                // UI 표시용 ('예약 확정')
  // 조건 (모두 만족해야 전이 가능)
  conditions?: WorkflowCondition[];
  // 전이 실행 전/후 액션
  before?: WorkflowAction[];
  after?: WorkflowAction[];
  // 권한
  roleRequired?: string;         // 'owner' | 'staff' | 'system'
}

// --- Condition ---
export interface WorkflowCondition {
  field: string;                 // 'party_size'
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
  message?: string;              // 조건 불만족 시 메시지
}

// --- Action ---
export type WorkflowAction =
  | { type: 'send_notification'; rule: string }    // Notification Engine 연동
  | { type: 'emit_event'; eventType: string; payload?: Record<string, unknown> }
  | { type: 'update_field'; field: string; value: unknown }
  | { type: 'webhook'; url: string; method?: 'POST' | 'PATCH' }
  | { type: 'delay'; duration: string }             // '5m', '1h', '1d'
  | { type: 'custom'; handler: string };            // 커스텀 핸들러 ID

// --- Workflow Definition ---
export interface WorkflowSchema {
  id: string;                    // 'reservation' | 'order' | 'review'
  name: string;                  // '예약 워크플로우'
  entity: string;                // 'reservation' (DB 테이블)
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

// --- Engine Context (실행 시 전달) ---
export interface WorkflowContext {
  tenantId: string;
  entityId: string;
  currentState: string;
  data: Record<string, unknown>; // 엔티티 데이터
  userId?: string;
  userRole?: string;
}

// --- 전이 결과 ---
export interface TransitionResult {
  success: boolean;
  fromState: string;
  toState: string;
  actions: { type: string; success: boolean; error?: string }[];
  error?: string;
}

// ============================================================
// 실제 워크플로우 정의 (메타데이터)
// ============================================================

// --- Reservation Workflow ---
export const reservationWorkflow: WorkflowSchema = {
  id: 'reservation',
  name: '예약 워크플로우',
  entity: 'reservations',
  states: [
    {
      name: 'pending', label: '대기 중', color: '#F59E0B', isInitial: true,
      onEnter: [{ type: 'send_notification', rule: 'reservation-new-slack' }],
    },
    {
      name: 'confirmed', label: '확정', color: '#16A34A',
      onEnter: [
        { type: 'emit_event', eventType: 'reservation.confirmed' },
        { type: 'send_notification', rule: 'reservation-confirmed' },
      ],
    },
    {
      name: 'seated', label: '착석 완료', color: '#3B82F6',
      onEnter: [{ type: 'emit_event', eventType: 'reservation.seated' }],
    },
    {
      name: 'completed', label: '식사 완료', color: '#A3A3A3',
      onEnter: [
        { type: 'emit_event', eventType: 'reservation.completed' },
        { type: 'send_notification', rule: 'review-request' },
      ],
      isFinal: true,
    },
    {
      name: 'cancelled', label: '취소됨', color: '#DC2626',
      onEnter: [{ type: 'emit_event', eventType: 'reservation.cancelled' }],
      isFinal: true,
    },
    {
      name: 'no_show', label: '노쇼', color: '#737373',
      onEnter: [{ type: 'emit_event', eventType: 'reservation.no_show' }],
      isFinal: true,
    },
  ],
  transitions: [
    {
      from: 'pending', to: 'confirmed', event: 'reservation.confirm',
      label: '예약 확정', roleRequired: 'owner',
    },
    {
      from: 'pending', to: 'cancelled', event: 'reservation.cancel',
      label: '예약 취소', roleRequired: 'owner',
    },
    {
      from: 'confirmed', to: 'seated', event: 'reservation.seat',
      label: '착석 처리', roleRequired: 'staff',
    },
    {
      from: 'confirmed', to: 'cancelled', event: 'reservation.cancel',
      label: '예약 취소', roleRequired: 'owner',
    },
    {
      from: 'seated', to: 'completed', event: 'reservation.complete',
      label: '식사 완료', roleRequired: 'staff',
    },
    {
      from: 'confirmed', to: 'no_show', event: 'reservation.no_show',
      label: '노쇽 처리',
      conditions: [{
        field: '_time_check', operator: 'eq', value: true,
        message: '예약 시간 30분 경과 후 노쇽 처리 가능',
      }],
      roleRequired: 'owner',
    },
  ],
};

// --- Order Workflow ---
export const orderWorkflow: WorkflowSchema = {
  id: 'order',
  name: '주문 워크플로우',
  entity: 'orders',
  states: [
    {
      name: 'pending', label: '접수 대기', color: '#F59E0B', isInitial: true,
      onEnter: [{ type: 'send_notification', rule: 'order-created-slack' }],
    },
    {
      name: 'accepted', label: '접수됨', color: '#3B82F6',
      onEnter: [{ type: 'emit_event', eventType: 'order.accepted' }],
    },
    {
      name: 'preparing', label: '준비 중', color: '#8B5CF6',
      onEnter: [{ type: 'emit_event', eventType: 'order.preparing' }],
    },
    {
      name: 'ready', label: '준비 완료', color: '#16A34A',
      onEnter: [{ type: 'emit_event', eventType: 'order.ready' }],
    },
    {
      name: 'served', label: '서빙/픽업 완료', color: '#A3A3A3',
      onEnter: [{ type: 'emit_event', eventType: 'order.served' }],
      isFinal: true,
    },
    {
      name: 'cancelled', label: '취소됨', color: '#DC2626',
      onEnter: [{ type: 'emit_event', eventType: 'order.cancelled' }],
      isFinal: true,
    },
  ],
  transitions: [
    { from: 'pending', to: 'accepted', event: 'order.accept', label: '주문 접수', roleRequired: 'staff' },
    { from: 'accepted', to: 'preparing', event: 'order.start_prepare', label: '조리 시작', roleRequired: 'staff' },
    { from: 'preparing', to: 'ready', event: 'order.mark_ready', label: '준비 완료', roleRequired: 'staff' },
    { from: 'ready', to: 'served', event: 'order.serve', label: '서빙 완료', roleRequired: 'staff' },
    { from: 'pending', to: 'cancelled', event: 'order.cancel', label: '주문 취소', roleRequired: 'owner' },
    { from: 'accepted', to: 'cancelled', event: 'order.cancel', label: '주문 취소', roleRequired: 'owner' },
  ],
};
