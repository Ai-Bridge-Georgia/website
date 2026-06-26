// ============================================================
// Audit Engine — Schema Definition
// 헌법: "Everything is audited", "SECURITY BY DEFAULT"
// 모든 액션을 자동으로 기록 → 추적 가능/책임 명확
// ============================================================

// --- Audit Action Types ---
export type AuditAction =
  | 'create'        // 생성
  | 'read'          // 조회 (선택적 — 민감 데이터만)
  | 'update'        // 수정
  | 'delete'        // 삭제
  | 'login'         // 로그인
  | 'logout'        // 로그아웃
  | 'export'        // 내보내기
  | 'import'        // 가져오기
  | 'config'        // 설정 변경
  | 'permission'    // 권한 변경
  | 'system';       // 시스템 액션

// --- Audit Severity ---
export type AuditSeverity = 'info' | 'warning' | 'critical';

// --- Audit Entry ---
export interface AuditEntry {
  id: string;
  tenantId: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  resource: string;               // 'menu' | 'orders' | 'settings'
  resourceId?: string;
  resourceName?: string;          // 사람이 읽을 수 있는 이름
  // 변경 내용
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  diff?: AuditDiff[];             // 필드별 변경 사항
  // 메타데이터
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  // 타임스탬프
  timestamp: string;
  // 추적 ID (연관 액션 그룹핑)
  traceId?: string;
}

// --- 변경 차이 (Diff) ---
export interface AuditDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  label?: string;                 // '가격' (UI 표시용)
}

// --- Audit Policy (어떤 액션을 기록할지) ---
export interface AuditPolicy {
  // 리소스별 기록 설정
  resources: AuditResourcePolicy[];
  // 민감 필드 (마스킹)
  sensitiveFields?: string[];     // ['password', 'credit_card', 'api_key']
  // 보관 기간 (일)
  retentionDays?: number;         // 기본: 365
}

export interface AuditResourcePolicy {
  resource: string;
  // 기록할 액션
  actions: AuditAction[];
  // read 기록 여부 (데이터 양 많음 → 선택적)
  logReads?: boolean;
  // 심각도 매핑
  severity?: Partial<Record<AuditAction, AuditSeverity>>;
}

// --- 기본 감사 정책 ---
export const defaultAuditPolicy: AuditPolicy = {
  resources: [
    {
      resource: 'menu',
      actions: ['create', 'update', 'delete', 'import'],
      severity: { create: 'info', update: 'info', delete: 'warning', import: 'info' },
    },
    {
      resource: 'orders',
      actions: ['create', 'update', 'delete', 'export'],
      logReads: false,
      severity: { delete: 'warning' },
    },
    {
      resource: 'reservations',
      actions: ['create', 'update', 'delete'],
      logReads: false,
    },
    {
      resource: 'settings',
      actions: ['update', 'config'],
      severity: { update: 'warning', config: 'critical' },
    },
    {
      resource: 'users',
      actions: ['create', 'update', 'delete', 'permission'],
      severity: { delete: 'critical', permission: 'critical' },
    },
    {
      resource: 'auth',
      actions: ['login', 'logout'],
      logReads: false,
    },
    {
      resource: 'billing',
      actions: ['update', 'export'],
      severity: { update: 'critical' },
    },
  ],
  sensitiveFields: ['password', 'credit_card', 'api_key', 'token', 'secret'],
  retentionDays: 365,
};

// --- 조회 필터 ---
export interface AuditFilter {
  tenantId?: string;
  userId?: string;
  action?: AuditAction;
  resource?: string;
  severity?: AuditSeverity;
  startDate?: string;
  endDate?: string;
  traceId?: string;
}

// --- 조회 결과 ---
export interface AuditQueryResult {
  entries: AuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}
