// ============================================================
// Constitution Enforcement — Checker (실행기)
// 모든 Rule을 실행하고 결과를 취합한다.
// 로직 ❌ — Rule 실행만 한다.
// ============================================================

import type { EnforcementRule, EnforcementContext, Evidence } from './types';
import { createContext } from './context';
import { E01_NoDomainInCore } from './rules/e01-no-domain-in-core';

// --- Rule 레지스트리 ---
const rules: EnforcementRule[] = [
  E01_NoDomainInCore,
  // E02_NoInfraInCore,      // 다음 Sprint
  // E03_NoFrameworkInCore,  // 다음 Sprint
  // ...
];

// --- 메인 실행 ---
export function enforce(rootDir: string): {
  passed: boolean;
  results: Evidence[];
  blocked: number;
  warnings: number;
  passedRules: number;
} {
  const ctx = createContext(rootDir);
  const allResults: Evidence[] = [];
  let blocked = 0;
  let warnings = 0;
  let passedRules = 0;

  for (const rule of rules) {
    const results = rule.evaluate(ctx);
    for (const result of results) {
      allResults.push(result);
      if (result.status === 'block') blocked++;
      else if (result.status === 'warn') warnings++;
      else if (result.status === 'pass') passedRules++;
    }
  }

  return {
    passed: blocked === 0,
    results: allResults,
    blocked,
    warnings,
    passedRules,
  };
}

// --- Report 출력 ---
export function printEnforcementReport(result: ReturnType<typeof enforce>): void {
  const verdict = result.passed ? '✅ PASS' : '🔴 BLOCKED';

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🛡️  Constitution Enforcement Report');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log(`  Verdict:     ${verdict}`);
  console.log(`  Rules Run:   ${rules.length}`);
  console.log(`  Passed:      ${result.passedRules}`);
  console.log(`  Blocked:     ${result.blocked}`);
  console.log(`  Warnings:    ${result.warnings}`);
  console.log();

  for (const e of result.results) {
    const icon = e.status === 'pass' ? '✅' : e.status === 'block' ? '🔴' : e.status === 'warn' ? '🟡' : '⏭️';
    console.log(`  ${icon} ${e.ruleId}  ${e.detail}`);
    if (e.file) console.log(`     📄 ${e.file}:${e.line ?? '?'}`);
    if (e.suggestion) console.log(`     💡 ${e.suggestion}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
}
