// ============================================================
// Self-Evolution + Standard CLI
// 실행: npm run evolve
//
// 파이프라인:
// 1. Validation (기존)
// 2. Quality Score (기존)
// 3. Knowledge Base (기존)
// 4. Regression History (기존)
// 5. Promotion Engine (NEW — Knowledge → Standard 후보)
// 6. Template Injector (NEW — Standard 적용 시뮬레이션)
// 7. Standard Metrics (NEW — 학습 측정)
// 8. Evolution Report (기존 + Standard 확장)
// ============================================================

import { validate } from '../validator';
import { evolve } from './index';
import { findPromotionCandidates, reportPromotionQueue } from './promotion-engine';
import { injectStandards } from './template-injector';
import { calculateMetrics, printMetrics } from './standard-metrics';
import { restaurantManifest } from '../plugins/restaurant';
import * as fs from 'fs';
import * as path from 'path';

// 1. Validation 실행
let goldenHash: string | undefined;
const goldenPath = path.resolve(process.cwd(), '.generated', 'validation-report.json');
if (fs.existsSync(goldenPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'));
    goldenHash = prev.goldenHash;
  } catch { /* ignore */ }
}

const manifests = [restaurantManifest];
const { report, goldenHash: currentHash } = validate(manifests, { goldenHash });

// 2. Evolution 실행 (Quality + Knowledge + Regression)
evolve({ ...report, goldenHash: currentHash });

// 3. Standard Promotion (Knowledge → Standard 후보)
console.log('');
const candidates = findPromotionCandidates();
reportPromotionQueue(candidates);

// 4. Template Injection 시뮬레이션 (Standard 적용)
const injection = injectStandards(restaurantManifest);
if (injection.result.appliedStandards.length > 0) {
  console.log('  ── Standard Injection ───────────────────');
  for (const a of injection.result.appliedStandards) {
    console.log(`  ✅ ${a.id}: ${a.what}`);
  }
}

// 5. Metrics
const metrics = calculateMetrics();
printMetrics(metrics);

// 6. 최종 결론
console.log('');
console.log('  ── Success Criteria ─────────────────────');
const sprintHistory = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), '.knowledge', 'sprint-history.json'), 'utf-8').trim() || '[]',
);

if (sprintHistory.length >= 2) {
  const projA = sprintHistory[0];
  const projB = sprintHistory[sprintHistory.length - 1];
  const fewerErrors = projB.errors <= projA.errors;
  const higherQuality = projB.qualityScore >= projA.qualityScore;
  const fewerIssues = projB.newIssues <= projA.newIssues;

  console.log(`  Project A (Sprint #${projA.sprint}): ${projA.errors} errors, ${projA.qualityScore} quality`);
  console.log(`  Project B (Sprint #${projB.sprint}): ${projB.errors} errors, ${projB.qualityScore} quality`);
  console.log(`  더 적은 수정:     ${fewerErrors ? '✅' : '❌'}`);
  console.log(`  더 높은 품질:     ${higherQuality ? '✅' : '❌'}`);
  console.log(`  더 적은 이슈:     ${fewerIssues ? '✅' : '❌'}`);

  if (fewerErrors && higherQuality && fewerIssues) {
    console.log('');
    console.log('  🎯 증명됨: Factory가 프로젝트 경험을 통해 향상되고 있음');
  } else {
    console.log('');
    console.log('  ⚠️ 미검증: 추가 Sprint 데이터 필요');
  }
} else {
  console.log('  🔬 미검증: 비교를 위해 2개 이상의 Sprint 필요');
}

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  🏭 Factory = Engineering Organization');
console.log('  (프로젝트 경험 → 표준 → 더 나은 코드 생성)');
console.log('═══════════════════════════════════════════════');
