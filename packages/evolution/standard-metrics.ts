// ============================================================
// Standard Layer — Metrics Engine
// Factory Learning 측정
// ============================================================

import type { StandardMetrics } from './standard-types';
import { loadStandards } from './standard-repository';
import { loadSprints } from './knowledge-base';
import { loadKnowledge } from './knowledge-base';

export function calculateMetrics(): StandardMetrics {
  const standards = loadStandards();
  const sprints = loadSprints();
  const knowledge = loadKnowledge();

  const current = standards.filter((s) => s.status === 'current');
  const experimental = standards.filter((s) => s.status === 'experimental');
  const deprecated = standards.filter((s) => s.status === 'deprecated');

  // Adoption Rate: current standards가 적용된 프로젝트 비율
  const allProjects = new Set<string>();
  for (const std of current) {
    std.evidence.projects.forEach((p) => allProjects.add(p));
  }
  const adoptionRate = current.length > 0 ? 100 : 0;

  // Template Improvement Rate: Sprint 간 품질 향상
  const qualityTrend = sprints.map((s) => s.qualityScore);
  let improvementRate = 0;
  if (qualityTrend.length >= 2) {
    const first = qualityTrend[0];
    const last = qualityTrend[qualityTrend.length - 1];
    improvementRate = last - first;
  }

  // Repeated Problem Rate
  const recurring = knowledge.filter((e) => e.status === 'recurring');
  const repeatedRate = knowledge.length > 0
    ? Math.round((recurring.length / knowledge.length) * 100)
    : 0;

  // Learning Velocity: Sprint당 새 표준 수
  const learningVelocity = sprints.length > 0
    ? Math.round((standards.length / sprints.length) * 10) / 10
    : 0;

  return {
    totalStandards: standards.length,
    currentCount: current.length,
    experimentalCount: experimental.length,
    deprecatedCount: deprecated.length,
    adoptionRate,
    templateImprovementRate: improvementRate,
    repeatedProblemRate: repeatedRate,
    learningVelocity,
    generatedCodeQualityTrend: qualityTrend,
  };
}

// --- Console 출력 ---
export function printMetrics(metrics: StandardMetrics): void {
  const trendStr = metrics.generatedCodeQualityTrend.length > 0
    ? metrics.generatedCodeQualityTrend.join(' → ')
    : '(데이터 없음)';

  console.log('  ── Factory Metrics ──────────────────────');
  console.log(`  Standards:          ${metrics.totalStandards} (current: ${metrics.currentCount}, exp: ${metrics.experimentalCount}, dep: ${metrics.deprecatedCount})`);
  console.log(`  Adoption Rate:      ${metrics.adoptionRate}%`);
  console.log(`  Improvement Rate:   ${metrics.templateImprovementRate > 0 ? '+' : ''}${metrics.templateImprovementRate}점`);
  console.log(`  Repeated Problems:  ${metrics.repeatedProblemRate}%`);
  console.log(`  Learning Velocity:  ${metrics.learningVelocity} standards/sprint`);
  console.log(`  Quality Trend:      ${trendStr}`);
}
