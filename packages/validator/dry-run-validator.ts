// ============================================================
// Validation Intelligence — Dry Run Validator
// DB 적용 시뮬레이션 (실제 DB ❌)
// ============================================================

import type { PluginManifest } from '../core/boundary';
import type { Issue } from './types';
import { createIssue } from './types';

export interface DryRunResult {
  tablesCreated: number;
  apisCreated: number;
  formsCreated: number;
  permissionRules: number;
  migrationLines: number;
  migrationRisk: 'low' | 'medium' | 'high';
  rollbackPossible: boolean;
  warnings: string[];
}

export function validateDryRun(
  manifests: PluginManifest[],
  migrationSql: string,
): { result: DryRunResult; issues: Issue[] } {
  const issues: Issue[] = [];

  const entityCount = manifests.reduce((s, m) => s + m.entities.length, 0);
  const tablesCreated = entityCount;
  const apisCreated = entityCount * 4;
  const formsCreated = entityCount;
  const permissionRules = manifests.reduce((s, m) => s + (m.permissions?.length ?? 0), 0);
  const migrationLines = migrationSql.split('\n').length;

  // Risk 평가
  const hasBreaking = migrationSql.includes('DROP TABLE') || migrationSql.includes('ALTER TABLE') && migrationSql.includes('DROP COLUMN');
  const migrationRisk: DryRunResult['migrationRisk'] = hasBreaking ? 'high' : 'low';

  // Rollback — CREATE TABLE IF NOT EXISTS는 안전
  const rollbackPossible = !hasBreaking && migrationSql.includes('IF NOT EXISTS');

  // 경고
  const warnings: string[] = [];
  if (entityCount > 20) warnings.push(`${entityCount}개 테이블 — 대규모 마이그레이션`);
  if (migrationLines > 500) warnings.push(`${migrationLines}줄 SQL — 검토 권장`);

  return {
    result: {
      tablesCreated,
      apisCreated,
      formsCreated,
      permissionRules,
      migrationLines,
      migrationRisk,
      rollbackPossible,
      warnings,
    },
    issues,
  };
}
