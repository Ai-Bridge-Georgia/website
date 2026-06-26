// ============================================================
// E-01: Core에 Domain Import 금지
// 헌법 Article I-1: "Core는 Domain을 모른다"
//
// Core 파일에서 외부 패키지를 import하는 것을 검사한다.
// 허용: react (타입 전용)
// 차단: 그 외 모든 외부 패키지 (@supabase, next, express 등)
//
// 상대 경로 import (./ 또는 ../)는 Core 내부이므로 허용.
// ============================================================

import type { EnforcementRule, EnforcementContext, Evidence, ImportInfo } from '../types';

// --- 허용된 패키지 ---
const ALLOWED_PACKAGES = ['react'];

// --- Rule 구현 ---
export const E01_NoDomainInCore: EnforcementRule = {
  id: 'E-01',
  article: 'I-1',
  description: 'Core에 Domain/Infrastructure/Framework Import 금지',
  severity: 'critical',

  evaluate(ctx: EnforcementContext): Evidence[] {
    // Core 디렉토리의 모든 TS 파일
    const coreFiles = ctx.listFiles('packages/core', '.ts');

    const violations: Evidence[] = [];
    let checked = 0;

    for (const file of coreFiles) {
      const fullPath = `packages/core/${file}`;
      const imports = ctx.parseImports(fullPath);
      checked++;

      for (const imp of imports) {
        // 상대 경로 (./ ../)는 Core 내부 → 허용
        if (imp.source.startsWith('.')) continue;

        // 허용된 패키지인가?
        if (ALLOWED_PACKAGES.includes(imp.source)) continue;

        // 외부 패키지 → 위반!
        violations.push({
          ruleId: 'E-01',
          status: 'block',
          file: fullPath,
          line: imp.line,
          detail: `외부 패키지 import 감지: '${imp.source}'${imp.isTypeOnly ? ' (type)' : ''}`,
          suggestion: `Core에서 '${imp.source}'을(를) 제거하고 Interface를 통해 주입하세요.`,
        });
      }
    }

    // 위반이 없으면 PASS
    if (violations.length === 0) {
      return [{
        ruleId: 'E-01',
        status: 'pass',
        detail: `Core 검사 완료: ${checked}개 파일, 외부 패키지 import 0건`,
      }];
    }

    return violations;
  },
};
