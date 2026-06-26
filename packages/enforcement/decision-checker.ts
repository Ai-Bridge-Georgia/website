// ============================================================
// Decision Checker — 7개 Gate 실행 + Code 허용/차단
// 헌법: "잘못된 결정을 코드가 되기 전에 막는다"
// ============================================================

import type { Decision, DecisionResult, GateResult } from './decision-types';
import { allDecisionGates } from './rules/decision-gates';

// --- Decision 평가 ---
export function evaluateDecision(decision: Decision): DecisionResult {
  const gateResults: GateResult[] = [];
  const blockedBy: string[] = [];
  const reviewRequired: string[] = [];

  for (const gate of allDecisionGates) {
    const result = gate.evaluate(decision);
    gateResults.push(result);

    if (result.verdict === 'block') {
      blockedBy.push(gate.id);
    } else if (result.verdict === 'review-required') {
      reviewRequired.push(gate.id);
    }
  }

  const passed = blockedBy.length === 0;
  const allowCodeGeneration = passed; // review-required는 허용 (경고만)

  return {
    decisionId: decision.id,
    passed,
    gates: gateResults,
    blockedBy,
    reviewRequired,
    allowCodeGeneration,
  };
}

// --- Report 출력 ---
export function printDecisionReport(result: DecisionResult): void {
  const verdict = result.allowCodeGeneration ? '✅ CODE ALLOWED' : '🔴 CODE BLOCKED';

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🧠 Decision Constitution Protocol (DCP)');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log(`  Decision:  ${result.decisionId}`);
  console.log(`  Verdict:   ${verdict}`);
  console.log(`  Passed:    ${result.passed ? '✅' : '❌'}`);
  console.log();

  for (const gate of result.gates) {
    const icon = gate.verdict === 'pass' ? '✅'
      : gate.verdict === 'block' ? '🔴'
      : '🟡';

    // gate ID로 title 찾기
    const gateDef = allDecisionGates.find(g => g.id === gate.gateId);
    const title = gateDef?.title ?? gate.gateId;

    console.log(`  ${icon} ${gate.gateId} ${title}`);
    console.log(`     ${gate.reason}`);
    if (gate.verdict !== 'pass') {
      console.log(`     Evidence: ${gate.evidence}`);
    }
  }

  if (result.blockedBy.length > 0) {
    console.log();
    console.log(`  🚫 Blocked by: ${result.blockedBy.join(', ')}`);
  }
  if (result.reviewRequired.length > 0) {
    console.log();
    console.log(`  ⚠️ Review required: ${result.reviewRequired.join(', ')}`);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
}
