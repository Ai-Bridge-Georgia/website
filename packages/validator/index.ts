// ============================================================
// Factory Validator — Main Entry (Validation Intelligence)
// 의존성: Manifest → Compiler → Artifacts → Validators
//         → Fix Engine → Impact → Report → Approval
//
// 사용법: npm run validate
// ============================================================

import type { PluginManifest } from '../core/boundary';
import { validateManifest } from './manifest-validator';
import { validateConsistency } from './consistency-validator';
import { validateDependencies } from './dependency-validator';
import { validateDryRun } from './dry-run-validator';
import { runGoldenTest } from './golden-test';
import { generateFixProposals } from './fix-engine';
import { generateReport, printReport } from './reporter';
import { compile } from '../compiler';
import * as fs from 'fs';
import * as path from 'path';

export function validate(
  manifests: PluginManifest[],
  options?: { goldenHash?: string },
) {
  // 1. Manifest 검증
  const manifestIssues = validateManifest(manifests);

  // 2. Compiler 실행
  const compilationResult = compile(manifests);

  // 3. Consistency 검증
  const consistencyIssues = validateConsistency(manifests, compilationResult);

  // 4. Dependency 검증
  const dependencyIssues = validateDependencies(manifests);

  // 5. Dry Run
  const dryRunResult = validateDryRun(manifests, compilationResult.migrations);

  // 6. Golden Test
  const goldenResult = runGoldenTest(manifests, options?.goldenHash);

  // 전체 Issue 수집
  const allIssues = [
    ...manifestIssues,
    ...consistencyIssues,
    ...dependencyIssues,
    ...dryRunResult.issues,
    ...(!goldenResult.passed && !goldenResult.isFirstRun
      ? [{
          id: `ISSUE-GOLDEN`,
          validator: 'golden-test',
          severity: 'error' as const,
          category: 'regression' as const,
          location: {},
          message: 'Golden test 실패 — 컴파일러 출력이 변경됨',
          evidence: goldenResult.message,
        }]
      : []),
  ];

  // 7. Fix Proposals
  const fixProposals = generateFixProposals(allIssues);

  // 8. Intelligence Report
  const entityCount = manifests.reduce((s, m) => s + m.entities.length, 0);
  const report = generateReport(
    allIssues,
    fixProposals,
    dryRunResult.result,
    manifests.length,
    entityCount,
  );

  // 출력
  printReport(report);

  // Golden hash 안내
  if (goldenResult.isFirstRun) {
    console.log(`  💡 Golden Hash: ${goldenResult.currentHash}`);
    console.log(`     다음 검증 시 회귀 감지에 사용됩니다.`);
  }
  console.log('');

  // JSON 리포트 저장
  const reportDir = path.resolve(process.cwd(), '.generated');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportDir, 'validation-report.json'),
    JSON.stringify({ ...report, goldenHash: goldenResult.currentHash }, null, 2),
  );

  return { report, goldenHash: goldenResult.currentHash };
}
