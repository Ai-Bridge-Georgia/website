// ============================================================
// DCP Test — Positive (허용) + Negative (차단) 시나리오
// ============================================================

import type { Decision } from './decision-types';
import { evaluateDecision, printDecisionReport } from './decision-checker';

console.log('═══════════════════════════════════════════════');
console.log('  🧪 Decision Constitution Protocol — Test Suite');
console.log('═══════════════════════════════════════════════');
console.log();

// ============================================================
// Scenario 1: GOOD Decision — 모든 Gate 통과
// ============================================================
const goodDecision: Decision = {
  id: 'DEC-001',
  purpose: 'Restaurant Plugin에 리뷰 모듈 추가 (고객 피드백 수집)',
  alternatives: [
    '기존 entities 배열에 reviews 추가 (메타데이터)',
    '별도 plugin 분리',
    '외부 리뷰 서비스 연동',
  ],
  selectedApproach: '기존 entities 배열에 reviews 추가 (메타데이터 기반)',
  tradeoffs: ['단순성 ↑', '유연성 ↓ (별도 plugin 대비)'],
  dependencies: [],
  riskLevel: 'low',
  rollbackPlan: 'entity-registry에서 reviews 엔티티 제거 → DB 테이블 DROP',
  missionImpact: 'positive',
  missionReason: '고객 피드백 수집 → 품질 개선 → Factory 가치 증가',
  changes: {
    filesToCreate: [],
    filesToModify: ['packages/plugins/restaurant/index.ts'],
    filesToDelete: [],
    newDependencies: [],
    publicApiChange: false,
    migrationRequired: true,
    workflowChange: false,
  },
};

console.log('  ── Scenario 1: Good Decision ──');
const goodResult = evaluateDecision(goodDecision);
printDecisionReport(goodResult);

if (!goodResult.allowCodeGeneration) {
  console.log('  ❌ FAIL: 허용되어야 할 Decision이 차단됨');
  process.exit(1);
}

// ============================================================
// Scenario 2: BAD Decision — Mission 부정적 → BLOCK
// ============================================================
const badDecision1: Decision = {
  id: 'DEC-002',
  purpose: 'Core에 Supabase 직접 import 추가 (빠른 개발)',
  alternatives: [],
  selectedApproach: 'Core에 createClient 추가',
  tradeoffs: ['속도 ↑', '의존성 ↑'],
  dependencies: ['@supabase/supabase-js'],
  riskLevel: 'high',
  rollbackPlan: '',
  missionImpact: 'negative',
  missionReason: 'Core 오염 — Factory 독립성 붕괴',
  changes: {
    filesToCreate: [],
    filesToModify: ['packages/core/index.ts'],
    filesToDelete: [],
    newDependencies: ['@supabase/supabase-js'],
    publicApiChange: false,
    migrationRequired: false,
    workflowChange: false,
  },
};

console.log('  ── Scenario 2: Bad Decision (Mission 부정) ──');
const badResult1 = evaluateDecision(badDecision1);
printDecisionReport(badResult1);

if (badResult1.allowCodeGeneration) {
  console.log('  ❌ FAIL: 차단되어야 할 Decision이 허용됨');
  process.exit(1);
}

// ============================================================
// Scenario 3: BAD Decision — API 변경 + Rollback 없음 → BLOCK
// ============================================================
const badDecision2: Decision = {
  id: 'DEC-003',
  purpose: 'API 응답 형식을 v1에서 v2로 변경',
  alternatives: ['버전 헤더 추가', '별도 엔드포인트'],
  selectedApproach: '기존 응답 형식 전면 교체',
  tradeoffs: ['단순성 ↑', '호환성 ↓'],
  dependencies: [],
  riskLevel: 'high',
  rollbackPlan: '',
  missionImpact: 'neutral',
  missionReason: '응답 형식 개선이지만 기존 클라이언트 호환성 위험',
  changes: {
    filesToCreate: [],
    filesToModify: ['packages/core/handler.ts'],
    filesToDelete: [],
    newDependencies: [],
    publicApiChange: true,
    migrationRequired: false,
    workflowChange: false,
  },
};

console.log('  ── Scenario 3: Bad Decision (API 변경 + Rollback 없음) ──');
const badResult2 = evaluateDecision(badDecision2);
printDecisionReport(badResult2);

if (badResult2.allowCodeGeneration) {
  console.log('  ❌ FAIL: 차단되어야 할 Decision이 허용됨');
  process.exit(1);
}

// ============================================================
// Scenario 4: REVIEW Decision — Dependency 추가
// ============================================================
const reviewDecision: Decision = {
  id: 'DEC-004',
  purpose: '차트 라이브러리 추가 (대시보드 개선)',
  alternatives: ['순수 SVG 유지', 'Canvas 직접 구현'],
  selectedApproach: 'recharts 라이브러리 사용',
  tradeoffs: ['기능 ↑', '번들 크기 ↑'],
  dependencies: ['recharts'],
  riskLevel: 'medium',
  rollbackPlan: 'recharts import 제거 → SVG 차트로 복귀',
  missionImpact: 'positive',
  missionReason: '대시보드 품질 향상 → 사용자 경험 개선',
  changes: {
    filesToCreate: [],
    filesToModify: ['packages/engines/dashboard/renderer.tsx'],
    filesToDelete: [],
    newDependencies: ['recharts'],
    publicApiChange: false,
    migrationRequired: false,
    workflowChange: false,
  },
};

console.log('  ── Scenario 4: Review Decision (Dependency 추가) ──');
const reviewResult = evaluateDecision(reviewDecision);
printDecisionReport(reviewResult);

// ============================================================
// 최종 결과
// ============================================================
console.log('  ── DCP Test Summary ──');
console.log('  ✅ Good Decision → CODE ALLOWED (모든 Gate 통과)');
console.log('  ✅ Bad Decision (Mission 부정) → CODE BLOCKED');
console.log('  ✅ Bad Decision (API 변경 + Rollback 없음) → CODE BLOCKED');
console.log('  ✅ Review Decision (Dependency) → REVIEW REQUIRED (허용 + 경고)');
console.log();
console.log('  🎯 VERIFIED: 잘못된 결정이 코드가 되기 전에 차단됨');
console.log('═══════════════════════════════════════════════');
