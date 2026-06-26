// ============================================================
// Audit Engine — Logger
// 헌법: "Everything is audited"
// 모든 액션을 자동으로 감사 로그에 기록
// ============================================================

import type {
  AuditEntry, AuditAction, AuditPolicy,
  AuditResourcePolicy, AuditDiff, AuditSeverity,
} from './schema';
import { defaultAuditPolicy } from './schema';

// --- 민감 필드 마스킹 ---
function maskSensitive(
  data: Record<string, unknown> | undefined,
  sensitiveFields: string[],
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const masked = { ...data };
  for (const field of sensitiveFields) {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  }
  return masked;
}

// --- Diff 계산 (oldValue vs newValue) ---
export function computeDiff(
  oldVal: Record<string, unknown> | undefined,
  newVal: Record<string, unknown> | undefined,
): AuditDiff[] {
  const diffs: AuditDiff[] = [];
  if (!oldVal && !newVal) return diffs;

  const allKeys = new Set([
    ...Object.keys(oldVal ?? {}),
    ...Object.keys(newVal ?? {}),
  ]);

  for (const key of allKeys) {
    const ov = oldVal?.[key];
    const nv = newVal?.[key];

    // 깊은 비교 (JSON 직렬화)
    if (JSON.stringify(ov) !== JSON.stringify(nv)) {
      diffs.push({
        field: key,
        oldValue: ov,
        newValue: nv,
      });
    }
  }

  return diffs;
}

// --- 기록 여부 확인 ---
function shouldLog(
  action: AuditAction,
  resource: string,
  policy: AuditPolicy,
): boolean {
  const resourcePolicy = policy.resources.find(
    (r) => r.resource === resource || r.resource === 'all',
  );
  if (!resourcePolicy) return false;

  if (action === 'read') {
    return resourcePolicy.logReads ?? false;
  }

  return resourcePolicy.actions.includes(action);
}

// --- 심각도 결정 ---
function resolveSeverity(
  action: AuditAction,
  resource: string,
  policy: AuditPolicy,
): AuditSeverity {
  const resourcePolicy = policy.resources.find(
    (r) => r.resource === resource || r.resource === 'all',
  );
  const actionSeverity = resourcePolicy?.severity?.[action];
  if (actionSeverity) return actionSeverity;

  // 기본 심각도
  if (action === 'delete' || action === 'permission') return 'warning';
  if (action === 'config') return 'critical';
  return 'info';
}

// --- 감사 로그 생성 ---
export function createAuditEntry(
  params: {
    tenantId: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    action: AuditAction;
    resource: string;
    resourceId?: string;
    resourceName?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    traceId?: string;
  },
  policy: AuditPolicy = defaultAuditPolicy,
): AuditEntry | null {
  // 기록 여부
  if (!shouldLog(params.action, params.resource, policy)) {
    return null;
  }

  // 마스킹
  const oldValue = maskSensitive(params.oldValue, policy.sensitiveFields ?? []);
  const newValue = maskSensitive(params.newValue, policy.sensitiveFields ?? []);

  // Diff 계산
  const diff = params.action === 'update'
    ? computeDiff(oldValue, newValue)
    : undefined;

  return {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tenantId: params.tenantId,
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    oldValue,
    newValue,
    diff,
    severity: resolveSeverity(params.action, params.resource, policy),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    timestamp: new Date().toISOString(),
    traceId: params.traceId,
  };
}

// --- 간편 로거 (래퍼) ---
export class AuditLogger {
  constructor(
    private tenantId: string,
    private policy: AuditPolicy = defaultAuditPolicy,
    private sink?: (entry: AuditEntry) => Promise<void>,
  ) {}

  async log(
    action: AuditAction,
    resource: string,
    options?: {
      userId?: string;
      userEmail?: string;
      userRole?: string;
      resourceId?: string;
      resourceName?: string;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      ipAddress?: string;
    },
  ): Promise<AuditEntry | null> {
    const entry = createAuditEntry(
      { ...options, tenantId: this.tenantId, action, resource } as any,
      this.policy,
    );

    if (entry && this.sink) {
      await this.sink(entry);
    }

    return entry;
  }

  // CRUD 헬퍼
  onCreate(resource: string, data: Record<string, unknown>, userId?: string) {
    return this.log('create', resource, { newValue: data, userId });
  }
  onUpdate(resource: string, oldData: Record<string, unknown>, newData: Record<string, unknown>, userId?: string) {
    return this.log('update', resource, { oldValue: oldData, newValue: newData, userId });
  }
  onDelete(resource: string, data: Record<string, unknown>, userId?: string) {
    return this.log('delete', resource, { oldValue: data, userId });
  }
  onLogin(userId: string, email: string, ipAddress?: string) {
    return this.log('login', 'auth', { userId, userEmail: email, ipAddress });
  }
  onLogout(userId: string) {
    return this.log('logout', 'auth', { userId });
  }
  onConfigChange(resource: string, oldData: Record<string, unknown>, newData: Record<string, unknown>) {
    return this.log('config', resource, { oldValue: oldData, newValue: newData });
  }
}
