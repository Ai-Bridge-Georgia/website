// ============================================================
// Permission Engine — Schema Definition
// 헌법: "SECURITY BY DEFAULT", "Everything is Metadata"
// 헌법: "Everything is an Engine"
// 권한을 메타데이터로 정의 → 코드 없이 권한 관리
// ============================================================

// --- Actions ---
export type ActionType = 'read' | 'create' | 'update' | 'delete' | 'execute' | 'manage';

// --- Permission Policy ---
export interface PermissionPolicy {
  id: string;
  name: string;
  description?: string;
  // 리소스별 허용 액션
  rules: PermissionRule[];
}

// --- Permission Rule ---
export interface PermissionRule {
  role: string;                   // 'admin' | 'owner' | 'staff' | 'customer'
  resource: string;               // 'menu' | 'orders' | 'reservations' | 'settings'
  actions: ActionType[];          // ['read', 'create', 'update']
  // 조건부 권한 (ABAC — 속성 기반)
  condition?: {
    field: string;                // 'owner_id' | 'created_by'
    operator: 'eq_self' | 'eq_tenant' | 'neq';
    description?: string;
  };
  // 필드 수준 제한
  fieldRestrictions?: string[];   // staff는 'price' 필드 수정 불가 등
}

// --- Role Definition ---
export interface RoleDefinition {
  name: string;
  level: number;                  // 0=customer, 10=staff, 50=owner, 100=admin
  label: string;
  description: string;
}

// --- 기본 역할 (헌법: 프랜차이즈 4그룹) ---
export const defaultRoles: RoleDefinition[] = [
  { name: 'admin', level: 100, label: '플랫폼 관리자', description: '본사(AI Bridge Georgia). 전체 통제.' },
  { name: 'owner', level: 50, label: '매장 소유자', description: '가맹점주. 자기 매장 전체 관리.' },
  { name: 'staff', level: 10, label: '매장 직원', description: '알바/매니저. 주문/예약 처리.' },
  { name: 'customer', level: 0, label: '고객', description: '최종 소비자. 조회/주문/예약만.' },
];

// ============================================================
// 기본 권한 정책 — Restaurant (프랜차이즈 사용자 그룹 참조)
// ============================================================

export const restaurantPolicy: PermissionPolicy = {
  id: 'restaurant-default',
  name: '식당 기본 권한',
  description: '본사/점주/직원/고객 4그룹 권한 매트릭스',
  rules: [
    // --- menu (메뉴) ---
    { role: 'admin', resource: 'menu', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { role: 'owner', resource: 'menu', actions: ['read', 'create', 'update'] },
    { role: 'staff', resource: 'menu', actions: ['read', 'update'], fieldRestrictions: ['price'] },
    { role: 'customer', resource: 'menu', actions: ['read'] },

    // --- orders (주문) ---
    { role: 'admin', resource: 'orders', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { role: 'owner', resource: 'orders', actions: ['read', 'create', 'update', 'delete'] },
    { role: 'staff', resource: 'orders', actions: ['read', 'create', 'update'] },
    { role: 'customer', resource: 'orders', actions: ['read', 'create'], condition: { field: 'customer_id', operator: 'eq_self', description: '자신의 주문만 조회' } },

    // --- reservations (예약) ---
    { role: 'admin', resource: 'reservations', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { role: 'owner', resource: 'reservations', actions: ['read', 'create', 'update', 'delete'] },
    { role: 'staff', resource: 'reservations', actions: ['read', 'create', 'update'] },
    { role: 'customer', resource: 'reservations', actions: ['read', 'create', 'update', 'delete'], condition: { field: 'customer_id', operator: 'eq_self', description: '자신의 예약만 관리' } },

    // --- reviews (리뷰) ---
    { role: 'admin', resource: 'reviews', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { role: 'owner', resource: 'reviews', actions: ['read', 'update'] },  // 답글 작성
    { role: 'staff', resource: 'reviews', actions: ['read'] },
    { role: 'customer', resource: 'reviews', actions: ['read', 'create', 'delete'], condition: { field: 'customer_id', operator: 'eq_self', description: '자신의 리뷰만 관리' } },

    // --- dashboard (대시보드) ---
    { role: 'admin', resource: 'dashboard', actions: ['read', 'manage'] },
    { role: 'owner', resource: 'dashboard', actions: ['read'] },
    { role: 'staff', resource: 'dashboard', actions: ['read'] },
    // customer: dashboard 접근 ❌

    // --- settings (설정) ---
    { role: 'admin', resource: 'settings', actions: ['read', 'update', 'manage'] },
    { role: 'owner', resource: 'settings', actions: ['read', 'update'] },
    // staff/customer: settings 접근 ❌

    // --- users (사용자 관리) ---
    { role: 'admin', resource: 'users', actions: ['read', 'create', 'update', 'delete', 'manage'] },
    { role: 'owner', resource: 'users', actions: ['read', 'create', 'update'] },  // 직원 관리
    { role: 'staff', resource: 'users', actions: ['read'] },

    // --- analytics (분석) ---
    { role: 'admin', resource: 'analytics', actions: ['read', 'manage'] },
    { role: 'owner', resource: 'analytics', actions: ['read'] },
    { role: 'staff', resource: 'analytics', actions: ['read'] },
    // customer: analytics 접근 ❌

    // --- billing (결제) ---
    { role: 'admin', resource: 'billing', actions: ['read', 'update', 'manage'] },
    { role: 'owner', resource: 'billing', actions: ['read', 'update'] },
    // staff/customer: billing 접근 ❌
  ],
};

// ============================================================
// 권한 매트릭스 요약 (UI 표시용)
// ============================================================

export const permissionMatrix = {
  menu: {
    admin: ['전체 관리'],
    owner: ['조회', '생성', '수정'],
    staff: ['조회', '수정(가격 제외)'],
    customer: ['조회'],
  },
  orders: {
    admin: ['전체 관리'],
    owner: ['조회', '생성', '수정', '삭제'],
    staff: ['조회', '생성', '수정'],
    customer: ['조회(본인)', '주문'],
  },
  reservations: {
    admin: ['전체 관리'],
    owner: ['전체 관리'],
    staff: ['조회', '생성', '수정'],
    customer: ['본인 예약 관리'],
  },
  reviews: {
    admin: ['전체 관리'],
    owner: ['조회', '답글'],
    staff: ['조회'],
    customer: ['조회', '작성', '삭제(본인)'],
  },
  dashboard: {
    admin: ['전체 관리'],
    owner: ['조회'],
    staff: ['조회'],
    customer: ['❌'],
  },
  settings: {
    admin: ['전체 관리'],
    owner: ['조회', '수정'],
    staff: ['❌'],
    customer: ['❌'],
  },
  analytics: {
    admin: ['전체 관리'],
    owner: ['조회'],
    staff: ['조회'],
    customer: ['❌'],
  },
};
