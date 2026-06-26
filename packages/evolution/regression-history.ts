// ============================================================
// Self-Evolution — Regression History
// Sprint 간 품질 추이 저장 + 분석
// ============================================================

import type { SprintRecord, QualityScore } from './types';
import { loadSprints, saveSprints } from './knowledge-base';

// --- Sprint 기록 추가 ---
export function recordSprint(
  data: {
    qualityScore: QualityScore;
    errors: number;
    warnings: number;
    fixProposals: number;
    newIssues: number;
    resolvedIssues: number;
    recurringIssues: number;
    goldenHash: string;
    productionReady: boolean;
  },
): SprintRecord {
  const history = loadSprints();
  const sprint = history.length + 1;

  const record: SprintRecord = {
    sprint,
    timestamp: new Date().toISOString(),
    qualityScore: data.qualityScore.overall,
    grade: data.qualityScore.grade,
    errors: data.errors,
    warnings: data.warnings,
    fixProposals: data.fixProposals,
    fixesApplied: 0, // Phase 5: Approval Gate에서 업데이트
    newIssues: data.newIssues,
    resolvedIssues: data.resolvedIssues,
    recurringIssues: data.recurringIssues,
    goldenHash: data.goldenHash,
    productionReady: data.productionReady,
  };

  history.push(record);
  saveSprints(history);

  return record;
}

// --- 품질 추이 분석 ---
export function analyzeTrend(): {
  direction: 'up' | 'stable' | 'down' | 'first';
  delta: number;
  previousScore: number | null;
  history: SprintRecord[];
} {
  const history = loadSprints();

  if (history.length < 2) {
    return {
      direction: 'first',
      delta: 0,
      previousScore: history.length === 1 ? history[0].qualityScore : null,
      history,
    };
  }

  const current = history[history.length - 1].qualityScore;
  const previous = history[history.length - 2].qualityScore;
  const delta = current - previous;

  const direction: 'up' | 'stable' | 'down' =
    delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable';

  return { direction, delta, previousScore: previous, history };
}

// --- 회귀 위험 평가 ---
export function assessRegressionRisk(): 'none' | 'low' | 'medium' | 'high' {
  const trend = analyzeTrend();

  if (trend.direction === 'first') return 'none';
  if (trend.direction === 'down') {
    if (trend.delta < -10) return 'high';
    if (trend.delta < -5) return 'medium';
    return 'low';
  }

  // recurring 이슈가 늘어나는지 확인
  const history = trend.history;
  if (history.length >= 2) {
    const recurringDelta =
      history[history.length - 1].recurringIssues -
      history[history.length - 2].recurringIssues;
    if (recurringDelta > 2) return 'medium';
  }

  return 'none';
}
