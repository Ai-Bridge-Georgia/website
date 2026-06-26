// ============================================================
// Validation Intelligence — Reporter
// 전체 검증 결과를 사람이 읽을 수 있는 보고서로 생성
// ============================================================

import type { Issue, ValidationResult, ImpactReport } from './types';
import type { PatchProposal } from './fix-engine';
import type { DryRunResult } from './dry-run-validator';

export interface IntelligenceReport {
  timestamp: string;
  manifestCount: number;
  entityCount: number;

  // Summary
  summary: {
    errors: number;
    warnings: number;
    infos: number;
    total: number;
    passed: boolean;
  };

  // Dry Run
  dryRun: DryRunResult;

  // Issues by category
  issuesByCategory: Record<string, number>;

  // Fix proposals
  fixProposals: PatchProposal[];

  // Approval gate
  approvalRequired: {
    autoApplicable: PatchProposal[];
    manualReview: PatchProposal[];
  };

  // Production readiness
  productionReady: boolean;
  blockers: string[];
}

export function generateReport(
  issues: Issue[],
  proposals: PatchProposal[],
  dryRun: DryRunResult,
  manifestCount: number,
  entityCount: number,
): IntelligenceReport {
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const infos = issues.filter((i) => i.severity === 'info').length;

  const byCategory: Record<string, number> = {};
  for (const issue of issues) {
    byCategory[issue.category] = (byCategory[issue.category] ?? 0) + 1;
  }

  const autoApplicable = proposals.filter((p) => p.fix.autoApplicable);
  const manualReview = proposals.filter((p) => !p.fix.autoApplicable);

  const blockers: string[] = [];
  if (errors > 0) blockers.push(`${errors}개 에러 미해결`);
  proposals.filter((p) => p.impact.breakingChange).forEach((p) =>
    blockers.push(`Breaking change: ${p.fix.target}`),
  );

  return {
    timestamp: new Date().toISOString(),
    manifestCount,
    entityCount,
    summary: { errors, warnings, infos, total: issues.length, passed: errors === 0 },
    dryRun,
    issuesByCategory: byCategory,
    fixProposals: proposals,
    approvalRequired: { autoApplicable, manualReview },
    productionReady: errors === 0 && blockers.length === 0,
    blockers,
  };
}

// --- Console 출력 ---
export function printReport(report: IntelligenceReport): void {
  const status = report.productionReady ? '✅ YES' : '❌ NO';
  const passFail = report.summary.passed ? '✅ PASS' : '❌ FAIL';

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🧠 Factory Validation Intelligence Report');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log(`  Validation:        ${passFail}`);
  console.log(`  Production Ready:  ${status}`);
  console.log(`  Manifests:         ${report.manifestCount}`);
  console.log(`  Entities:          ${report.entityCount}`);
  console.log();
  console.log('  ── Summary ──────────────────────────────');
  console.log(`  Errors:            ${report.summary.errors}`);
  console.log(`  Warnings:          ${report.summary.warnings}`);
  console.log(`  Infos:             ${report.summary.infos}`);
  console.log();
  console.log('  ── Dry Run ──────────────────────────────');
  console.log(`  Tables:            ${report.dryRun.tablesCreated}`);
  console.log(`  APIs:              ${report.dryRun.apisCreated}`);
  console.log(`  Forms:             ${report.dryRun.formsCreated}`);
  console.log(`  Permissions:       ${report.dryRun.permissionRules}`);
  console.log(`  Migration:         ${report.dryRun.migrationLines} lines (${report.dryRun.migrationRisk} risk)`);
  console.log(`  Rollback:          ${report.dryRun.rollbackPossible ? '✅' : '❌'}`);
  console.log();
  if (report.blockers.length > 0) {
    console.log('  ── Blockers ─────────────────────────────');
    for (const b of report.blockers) console.log(`  🚫 ${b}`);
    console.log();
  }
  if (report.fixProposals.length > 0) {
    console.log('  ── Fix Proposals ────────────────────────');
    for (const p of report.fixProposals) {
      const risk = p.impact.estimatedRisk === 'high' ? '🔴' : p.impact.estimatedRisk === 'medium' ? '🟡' : '🟢';
      const auto = p.fix.autoApplicable ? '(auto)' : '(manual)';
      console.log(`  ${risk} [${p.severity}] ${p.fix.description} ${auto}`);
    }
    console.log();
  }
  console.log('═══════════════════════════════════════════════');
}
