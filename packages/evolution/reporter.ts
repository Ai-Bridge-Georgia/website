// ============================================================
// Self-Evolution — Evolution Report Generator
// 매 Sprint 종료 후 자동 보고서
// ============================================================

import type { EvolutionReport, QualityScore, KnowledgeEntry } from './types';

export function buildEvolutionReport(params: {
  sprint: number;
  qualityScore: QualityScore;
  trend: { direction: 'up' | 'stable' | 'down' | 'first'; delta: number; previousScore: number | null };
  newIssues: KnowledgeEntry[];
  resolvedIssues: KnowledgeEntry[];
  recurringIssues: KnowledgeEntry[];
  knowledgeStats: { total: number; resolved: number; recurring: number; patterns: number };
  regressionRisk: 'none' | 'low' | 'medium' | 'high';
  productionReady: boolean;
}): EvolutionReport {
  // Verdict (최종 판정)
  let verdict: EvolutionReport['verdict'];
  if (params.trend.direction === 'first') {
    verdict = 'insufficient-data';
  } else if (params.trend.direction === 'up') {
    verdict = 'improving';
  } else if (params.trend.direction === 'down') {
    verdict = 'degrading';
  } else {
    verdict = params.recurringIssues.length === 0 ? 'stable' : 'stable';
  }

  return {
    sprint: params.sprint,
    timestamp: new Date().toISOString(),
    qualityScore: {
      ...params.qualityScore,
      trend: params.trend.direction,
      delta: params.trend.delta,
    },
    trend: params.trend,
    issues: {
      new: params.newIssues,
      resolved: params.resolvedIssues,
      recurring: params.recurringIssues,
    },
    knowledgeGrowth: {
      totalEntries: params.knowledgeStats.total,
      totalPatterns: params.knowledgeStats.patterns,
      totalResolved: params.knowledgeStats.resolved,
    },
    regressionRisk: params.regressionRisk,
    verdict,
    productionReady: params.productionReady,
  };
}

// --- Console 출력 ---
export function printEvolutionReport(report: EvolutionReport): void {
  const arrow = report.trend.direction === 'up' ? '📈'
    : report.trend.direction === 'down' ? '📉'
    : report.trend.direction === 'first' ? '🆕'
    : '➡️';

  const verdictEmoji = report.verdict === 'improving' ? '📈'
    : report.verdict === 'degrading' ? '⚠️'
    : report.verdict === 'stable' ? '✅'
    : '🔬';

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🧬 Factory Self-Evolution Report');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log(`  Sprint:         #${report.sprint}`);
  console.log(`  Quality Score:  ${report.qualityScore.overall}/100 (Grade ${report.qualityScore.grade})`);
  console.log(`  Trend:          ${arrow} ${report.trend.direction}${report.trend.delta !== 0 ? ` (${report.trend.delta > 0 ? '+' : ''}${report.trend.delta})` : ''}`);
  console.log(`  Verdict:        ${verdictEmoji} ${report.verdict}`);
  console.log();
  console.log('  ── Quality Dimensions ───────────────────');
  const d = report.qualityScore.dimensions;
  console.log(`  Manifest Quality:      ${d.manifestQuality}/100`);
  console.log(`  API Consistency:       ${d.apiConsistency}/100`);
  console.log(`  SQL Safety:            ${d.sqlSafety}/100`);
  console.log(`  Dependency Health:     ${d.dependencyHealth}/100`);
  console.log(`  Regression Stability:  ${d.regressionStability}/100`);
  console.log(`  Config Completeness:   ${d.configurationCompleteness}/100`);
  console.log();
  console.log('  ── Issues ───────────────────────────────');
  console.log(`  New:            ${report.issues.new.length}`);
  console.log(`  Resolved:       ${report.issues.resolved.length}`);
  console.log(`  Recurring:      ${report.issues.recurring.length}`);
  console.log();
  console.log('  ── Knowledge Base ───────────────────────');
  console.log(`  Total Entries:  ${report.knowledgeGrowth.totalEntries}`);
  console.log(`  Patterns:       ${report.knowledgeGrowth.totalPatterns}`);
  console.log(`  Resolved:       ${report.knowledgeGrowth.totalResolved}`);
  console.log();
  console.log(`  Regression Risk: ${report.regressionRisk}`);
  console.log(`  Production Ready: ${report.productionReady ? '✅ YES' : '❌ NO'}`);
  console.log('═══════════════════════════════════════════════');
  console.log();
}
