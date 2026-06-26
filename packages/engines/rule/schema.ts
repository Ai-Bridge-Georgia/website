// ============================================================
// Rule Engine — Schema Definition
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 헌법: "Everything is an Engine"
// 비즈니스 규칙을 메타데이터로 정의 → 코드 없이 규칙 관리
// ============================================================

// --- Rule Type ---
export type RuleType =
  | 'validation'    // 입력 검증 (최소 주문 금액, 예약 가능 시간)
  | 'pricing'       // 가격 계산 (할인, 시간대 요금, 세금)
  | 'availability'  // 가용성 (영업 시간, 예약 슬롯, 재고)
  | 'display'       // 표시 조건 (메뉴 노출 여부, 버튼 활성화)
  | 'limit';        // 제한 (최대 예약 인원, 일일 주문 한도)

// --- Rule Definition ---
export interface BusinessRule {
  id: string;
  name: string;
  type: RuleType;
  description?: string;
  enabled: boolean;

  // 조건 (모두 만족해야 발동)
  conditions: RuleCondition[];

  // 결과
  result: RuleResult;

  // 우선순위 (높을수록 먼저 평가)
  priority?: number;
}

// --- Condition ---
export interface RuleCondition {
  // 필드 비교
  field?: string;                // 'order_total', 'reservation_time', 'current_time'
  operator?: ConditionOperator;
  value?: unknown;

  // 시간 기반 (별도 — 시간은 특수 처리)
  timeCheck?: TimeCheck;

  // 요일 기반
  dayCheck?: DayCheck;

  // 논리 조합
  all?: RuleCondition[];         // AND
  any?: RuleCondition[];         // OR
  not?: RuleCondition;           // NOT
}

export type ConditionOperator =
  | 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte'
  | 'in' | 'not_in' | 'contains' | 'starts_with' | 'ends_with'
  | 'between';

// --- Time Check ---
export interface TimeCheck {
  type: 'within_range' | 'outside_range' | 'before' | 'after';
  startTime?: string;            // '09:00'
  endTime?: string;              // '22:00'
  compareTime?: string;          // 특정 시간과 비교
  // 동적 값
  dynamic?: 'now' | 'order_time' | 'reservation_time';
}

// --- Day Check ---
export interface DayCheck {
  type: 'is' | 'is_not';
  days: number[];                // 0=일, 1=월, 2=화, ... 6=토
}

// --- Result ---
export interface RuleResult {
  // 통과/거부
  pass: boolean;

  // 거부 시 메시지
  message?: string;              // '최소 주문 금액은 20 GEL 입니다'

  // 부가 결과
  actions?: RuleResultAction[];
}

export interface RuleResultAction {
  type: 'set_price' | 'apply_discount' | 'add_surcharge' | 'set_field' | 'block' | 'warn';
  target?: string;               // 필드명
  value?: unknown;               // 설정값
  // 할인
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
  // 계산 설명
  label?: string;                // '런치 타임 10% 할인'
}

// ============================================================
// 실제 비즈니스 규칙 정의
// ============================================================

// --- 최소 주문 금액 ---
export const minOrderRule: BusinessRule = {
  id: 'min-order-amount',
  name: '최소 주문 금액',
  type: 'validation',
  description: '배달 주문 시 최소 20 GEL',
  enabled: true,
  conditions: [
    { field: 'order_type', operator: 'eq', value: 'delivery' },
    { field: 'order_total', operator: 'lt', value: 20 },
  ],
  result: {
    pass: false,
    message: '배달 최소 주문 금액은 20 GEL 입니다',
    actions: [{ type: 'block', label: '최소 주문 금액 미달' }],
  },
  priority: 100,
};

// --- 영업 시간 ---
export const businessHoursRule: BusinessRule = {
  id: 'business-hours',
  name: '영업 시간',
  type: 'availability',
  description: '매일 11:00-22:00 영업',
  enabled: true,
  conditions: [
    {
      timeCheck: {
        type: 'outside_range',
        startTime: '11:00',
        endTime: '22:00',
        dynamic: 'now',
      },
    },
  ],
  result: {
    pass: false,
    message: '영업 시간(11:00-22:00)에만 주문할 수 있습니다',
    actions: [{ type: 'block', label: '영업 시간 외' }],
  },
  priority: 200,
};

// --- 런치 타임 할인 ---
export const lunchDiscountRule: BusinessRule = {
  id: 'lunch-discount',
  name: '런치 타임 할인',
  type: 'pricing',
  description: '평일 12:00-14:00 10% 할인',
  enabled: true,
  conditions: [
    {
      all: [
        { dayCheck: { type: 'is', days: [1, 2, 3, 4, 5] } }, // 월-금
        {
          timeCheck: {
            type: 'within_range',
            startTime: '12:00',
            endTime: '14:00',
            dynamic: 'order_time',
          },
        },
      ],
    },
  ],
  result: {
    pass: true,
    actions: [{
      type: 'apply_discount',
      discountType: 'percent',
      discountValue: 10,
      label: '런치 타임 10% 할인',
    }],
  },
  priority: 50,
};

// --- 최대 예약 인원 ---
export const maxPartySizeRule: BusinessRule = {
  id: 'max-party-size',
  name: '최대 예약 인원',
  type: 'limit',
  description: '한 번에 최대 20명까지 예약 가능',
  enabled: true,
  conditions: [
    { field: 'party_size', operator: 'gt', value: 20 },
  ],
  result: {
    pass: false,
    message: '최대 20명까지 예약 가능합니다. 20명 이상은 단체 문의해주세요',
    actions: [{ type: 'block' }],
  },
  priority: 100,
};

// --- 야간 할증 ---
export const lateNightSurchargeRule: BusinessRule = {
  id: 'late-night-surcharge',
  name: '야간 할증',
  type: 'pricing',
  description: '22:00 이후 주문 시 10% 할증',
  enabled: true,
  conditions: [
    {
      timeCheck: {
        type: 'after',
        compareTime: '22:00',
        dynamic: 'order_time',
      },
    },
  ],
  result: {
    pass: true,
    actions: [{
      type: 'add_surcharge',
      discountType: 'percent',
      discountValue: 10,
      label: '야간 할증 10%',
    }],
  },
  priority: 40,
};

// --- 모든 기본 규칙 ---
export const defaultRules: BusinessRule[] = [
  businessHoursRule,
  minOrderRule,
  lunchDiscountRule,
  maxPartySizeRule,
  lateNightSurchargeRule,
];
