// ============================================================
// Self-Evolution — Quality Score Engine
// 검증 결과 → 6개 지표 → 종합 점수 (0-100)
// ============================================================

import type { QualityScore } from './types';

// --- 입력 (Validator Report에서 추출) ---
export interface QualityInput {
  errors: number;
  warnings: number;
  infos: number;
  entityCount: number;
  manifestCount: number;
  permissionCount: number;
  migrationLines: number;
  migrationRisk: 'low' | 'medium' | 'high';
  rollbackPossible: boolean;
  goldenPassed: boolean;
  isFirstRun: boolean;
  // Consistency 상세
  consistencyErrors: number;
  dependencyErrors: number;
  manifestErrors: number;
}

// --- 점수 계산 (각 0-100, 가중치 적용) ---
export function calculateQualityScore(input: QualityInput): QualityScore {
  const dims = {
    // 1. Manifest Quality (에러가 없으면 100, 1개당 -20)
    manifestQuality: Math.max(0, 100 - input.manifestErrors * 20),

    // 2. API Consistency (일관성 에러가 없으면 100)
    apiConsistency: Math.max(0, 100 - input.consistencyErrors * 15),

    // 3. SQL Safety (low=100, medium=60, high=20 + rollback 가점)
    sqlSafety: (input.migrationRisk === 'low' ? 100
      : input.migrationRisk === 'medium' ? 60 : 20)
      + (input.rollbackPossible ? 0 : -10),

    // 4. Dependency Health (FK/Workflow 에러가 없으면 100)
    dependencyHealth: Math.max(0, 100 - input.dependencyErrors * 25),

    // 5. Regression Stability (Golden test 통과 = 100)
    regressionStability: input.goldenPassed ? 100 : 0,

    // 6. Configuration Completeness
    // (권한이 모든 엔티티를 커버하는지 — 간소화: 권한 수 / 엔티티 수)
    configurationCompleteness: input.entityCount > 0
      ? Math.min(100, Math.round((input.permissionCount / input.entityCount) * 25))
      : 0,
  };

  // 가중 평균
  const weights = {
    manifestQuality: 0.20,
    apiConsistency: 0.20,
    sqlSafety: 0.15,
    dependencyHealth: 0.15,
    regressionStability: 0.20,
    configurationCompleteness: 0.10,
  };

  const overall = Math.round(
    dims.manifestQuality * weights.manifestQuality +
    dims.apiConsistency * weights.apiConsistency +
    dims.sqlSafety * weights.sqlSafety +
    dims.dependencyHealth * weights.dependencyHealth +
    dims.regressionStability * weights.regressionStability +
    dims.configurationCompleteness * weights.configurationCompleteness,
  );

  const grade: QualityScore['grade'] =
    overall >= 90 ? 'A' :
    overall >= 80 ? 'B' :
    overall >= 70 ? 'C' :
    overall >= 60 ? 'D' : 'F';

  return {
    overall,
    dimensions: dims,
    grade,
    trend: 'first',
  };
}
