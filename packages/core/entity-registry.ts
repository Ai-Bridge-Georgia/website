// ============================================================
// Business OS — Entity Registry
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 엔티티명 → DB 테이블 + 권한 + 검증 규칙 매핑
// 새 도메인 추가 시: 이 레지스트리에 등록만 하면 됨 (코딩 ❌)
// ============================================================

export interface EntityDefinition {
  name: string;                     // 'menus' (URL에 사용)
  table: string;                    // 'menus' (DB 테이블)
  label: string;                    // '메뉴' (UI)
  // 기본 검색/정렬
  defaultSort?: { column: string; ascending: boolean };
  // 필터링 가능한 컬럼
  filterable?: string[];
  // 생성/수정 시 필수 필드
  requiredFields?: string[];
  // 권한 리소스명
  resource?: string;                // Permission Engine에서 사용
}

// --- 엔티티 레지스트리 ---
const entities = new Map<string, EntityDefinition>();

export function registerEntity(def: EntityDefinition): void {
  entities.set(def.name, def);
}

export function getEntity(name: string): EntityDefinition | undefined {
  return entities.get(name);
}

export function listEntities(): EntityDefinition[] {
  return Array.from(entities.values());
}

// ============================================================
// Restaurant Plugin — 엔티티 등록
// ============================================================
registerEntity({
  name: 'menus',
  table: 'menus',
  label: '메뉴',
  defaultSort: { column: 'sort_order', ascending: true },
  filterable: ['category', 'is_available'],
  requiredFields: ['name', 'category', 'price'],
  resource: 'menu',
});

registerEntity({
  name: 'reservations',
  table: 'reservations',
  label: '예약',
  defaultSort: { column: 'date', ascending: false },
  filterable: ['status', 'date'],
  requiredFields: ['customer_name', 'date', 'party_size'],
  resource: 'reservations',
});

registerEntity({
  name: 'orders',
  table: 'orders',
  label: '주문',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['status', 'order_type'],
  requiredFields: ['items'],
  resource: 'orders',
});

// ============================================================
// Hotel Plugin — 엔티티 등록
// ============================================================
registerEntity({
  name: 'rooms',
  table: 'rooms',
  label: '객실',
  defaultSort: { column: 'price_per_night', ascending: true },
  filterable: ['room_type', 'is_available'],
  requiredFields: ['name', 'room_type', 'price_per_night'],
  resource: 'rooms',
});

registerEntity({
  name: 'bookings',
  table: 'bookings',
  label: '예약',
  defaultSort: { column: 'check_in', ascending: false },
  filterable: ['status', 'room_id'],
  requiredFields: ['room_id', 'guest_name', 'check_in', 'check_out'],
  resource: 'bookings',
});

// ============================================================
// SaaS Plugin — 엔티티 등록
// ============================================================
registerEntity({
  name: 'pricing-plans',
  table: 'pricing_plans',
  label: '요금제',
  defaultSort: { column: 'sort_order', ascending: true },
  filterable: ['billing_cycle'],
  requiredFields: ['plan_name', 'price'],
  resource: 'pricing',
});

// ============================================================
// Manufacturing Test — 3개 새 엔티티 (코딩 없이 추가)
// ============================================================
registerEntity({
  name: 'customers',
  table: 'customers',
  label: '고객',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['status', 'company'],
  requiredFields: ['name'],
  resource: 'customers',
});

registerEntity({
  name: 'invoices',
  table: 'invoices',
  label: '청구서',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['status', 'customer_id'],
  requiredFields: ['invoice_number', 'amount'],
  resource: 'billing',
});

registerEntity({
  name: 'employees',
  table: 'employees',
  label: '직원',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['department', 'status', 'position'],
  requiredFields: ['name', 'position'],
  resource: 'users',
});

// ============================================================
// Universal Core 엔티티
// ============================================================
registerEntity({
  name: 'tenants',
  table: 'tenants',
  label: '테넌트',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['industry', 'status', 'plan'],
  requiredFields: ['name', 'slug'],
  resource: 'tenants',
});

registerEntity({
  name: 'audit-logs',
  table: 'audit_logs',
  label: '감사 로그',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['action', 'resource', 'severity'],
  resource: 'audit',
});

registerEntity({
  name: 'notifications',
  table: 'notifications',
  label: '알림',
  defaultSort: { column: 'created_at', ascending: false },
  filterable: ['status', 'type'],
  resource: 'notifications',
});
