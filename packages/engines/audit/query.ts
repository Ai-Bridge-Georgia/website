// ============================================================
// Audit Engine — Query
// 헌법: "API First"
// 감사 로그 조회/필터/내보내기
// ============================================================

import type { AuditEntry, AuditFilter, AuditQueryResult } from './schema';

// --- 인메모리 저장소 (Phase 2: Supabase audit_logs 테이블) ---
const storage: AuditEntry[] = [];

// --- 저장 (Logger의 sink로 사용) ---
export async function saveAuditEntry(entry: AuditEntry): Promise<void> {
  storage.push(entry);
  // TODO Phase 2: Supabase INSERT
  // await supabase.from('audit_logs').insert(entry);
}

// --- 조회 ---
export function queryAuditLog(
  filter: AuditFilter,
  page = 1,
  pageSize = 20,
): AuditQueryResult {
  let results = [...storage];

  // 필터
  if (filter.tenantId) {
    results = results.filter((e) => e.tenantId === filter.tenantId);
  }
  if (filter.userId) {
    results = results.filter((e) => e.userId === filter.userId);
  }
  if (filter.action) {
    results = results.filter((e) => e.action === filter.action);
  }
  if (filter.resource) {
    results = results.filter((e) => e.resource === filter.resource);
  }
  if (filter.severity) {
    results = results.filter((e) => e.severity === filter.severity);
  }
  if (filter.startDate) {
    results = results.filter((e) => e.timestamp >= filter.startDate!);
  }
  if (filter.endDate) {
    results = results.filter((e) => e.timestamp <= filter.endDate!);
  }
  if (filter.traceId) {
    results = results.filter((e) => e.traceId === filter.traceId);
  }

  // 정렬 (최신순)
  results.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // 페이지네이션
  const from = (page - 1) * pageSize;
  const paged = results.slice(from, from + pageSize);

  return {
    entries: paged,
    total: results.length,
    page,
    pageSize,
  };
}

// --- 리소스별 액션 요약 (대시보드용) ---
export function getAuditSummary(tenantId: string): {
  totalActions: number;
  criticalCount: number;
  warningCount: number;
  byResource: Record<string, number>;
  byAction: Record<string, number>;
  recentCritical: AuditEntry[];
} {
  const tenantEntries = storage.filter((e) => e.tenantId === tenantId);

  const byResource: Record<string, number> = {};
  const byAction: Record<string, number> = {};

  for (const e of tenantEntries) {
    byResource[e.resource] = (byResource[e.resource] ?? 0) + 1;
    byAction[e.action] = (byAction[e.action] ?? 0) + 1;
  }

  return {
    totalActions: tenantEntries.length,
    criticalCount: tenantEntries.filter((e) => e.severity === 'critical').length,
    warningCount: tenantEntries.filter((e) => e.severity === 'warning').length,
    byResource,
    byAction,
    recentCritical: tenantEntries
      .filter((e) => e.severity === 'critical')
      .slice(-5)
      .reverse(),
  };
}

// --- 내보내기 (CSV) ---
export function exportAuditLog(
  tenantId: string,
  filter?: AuditFilter,
): string {
  const query = queryAuditLog({ ...filter, tenantId }, 1, 10000);
  const headers = ['timestamp', 'user', 'action', 'resource', 'severity', 'details'];

  const rows = query.entries.map((e) => [
    e.timestamp,
    e.userEmail ?? e.userId ?? 'system',
    e.action,
    e.resource,
    e.severity,
    e.diff ? e.diff.map((d) => `${d.field}: ${d.oldValue} → ${d.newValue}`).join('; ') : '',
  ]);

  return [headers, ...rows].map((r) => r.join(',')).join('\n');
}
