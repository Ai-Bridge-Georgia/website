// ============================================================
// UI Review Engine — 13개 카테고리 정적 분석
// HTML/CSS/JSX 코드를 읽고 자동 평가
// ============================================================

import type { ReviewResult, CategoryScore, Issue } from './types';
import * as fs from 'fs';
import * as path from 'path';

// --- 코드 읽기 ---
function loadCode(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ============================================================
// 13개 카테고리 평가 함수
// ============================================================

// 1. Hierarchy (10%)
function checkHierarchy(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasH1 = /<h1|className="[^"]*display/.test(code);
  const hasH2 = /<h2/.test(code);
  const hasBody = /text-(?:base|body|16px|lg)/.test(code) || /font-size:\s*16px/.test(code);

  if (!hasH1) { issues.push({ type: 'missing-h1', severity: 'critical', detail: 'H1/Display 요소 없음' }); score -= 30; }
  if (!hasH2) { issues.push({ type: 'missing-h2', severity: 'warning', detail: 'H2 요소 없음 — 계층 구조 부족' }); score -= 10; }
  if (!hasBody) { issues.push({ type: 'missing-body', severity: 'warning', detail: '본문 텍스트 스타일 정의 없음' }); score -= 10; }

  // 단일 H1 확인
  const h1Count = (code.match(/<h1/g) || []).length;
  if (h1Count > 1) { issues.push({ type: 'multiple-h1', severity: 'warning', detail: `H1이 ${h1Count}개 — 1개만 권장` }); score -= 10; }

  return { name: 'Hierarchy', score: Math.max(0, score), weight: 0.10, issues };
}

// 2. Typography (8%)
function checkTypography(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasPretendard = /pretendard/i.test(code);
  const hasInter = /\binter\b/i.test(code);
  const hasFontSwap = /font-display:\s*swap/.test(code);
  const hasSystemFont = /\b(arial|roboto|georgia|times|helvetica)\b/i.test(code);
  const hasWordBreak = /keep-all|word-break/.test(code);

  if (!hasPretendard && !hasInter) { issues.push({ type: 'missing-font', severity: 'critical', detail: 'Pretendard/Inter 폰트 없음' }); score -= 30; }
  if (hasSystemFont) { issues.push({ type: 'system-font', severity: 'critical', detail: '시스템 폰트 사용 감지' }); score -= 25; }
  if (!hasFontSwap) { issues.push({ type: 'missing-font-swap', severity: 'info', detail: 'font-display: swap 권장' }); score -= 5; }
  if (!hasWordBreak && /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(code)) { issues.push({ type: 'missing-word-break', severity: 'warning', detail: '한국어 word-break: keep-all 권장' }); score -= 10; }

  return { name: 'Typography', score: Math.max(0, score), weight: 0.08, issues };
}

// 3. Spacing (8%)
function checkSpacing(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const has8px = /(?:p|m)-(?:2|4|6|8|12|16|24|32|48|64|96)/.test(code) || /(?:padding|margin):\s*(?:8|16|24|32|48|64|96)px/.test(code);
  const has96Section = /(?:py|mt|mb|pt|pb)-(?:24|32|48|64|96)/.test(code) || /(?:padding|margin).*:\s*96px/.test(code);
  const hasOddSpacing = /(?:p|m)-(?:3|5|7|9|11|13|17)/.test(code);

  if (!has8px) { issues.push({ type: 'missing-8px-grid', severity: 'warning', detail: '8px 기반 spacing 감지 안 됨' }); score -= 20; }
  if (!has96Section) { issues.push({ type: 'missing-section-gap', severity: 'warning', detail: '섹션 간격(96px) 감지 안 됨' }); score -= 10; }
  if (hasOddSpacing) { issues.push({ type: 'odd-spacing', severity: 'info', detail: '8px 배수가 아닌 spacing 감지' }); score -= 5; }

  return { name: 'Spacing', score: Math.max(0, score), weight: 0.08, issues };
}

// 4. Contrast (10%)
function checkContrast(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 매우 옅은 텍스트 색상 감지
  const hasLowContrast = /color:\s*(?:#(?:eee|ccc|ddd|f5f5f5|fafafa)\b|gray-200|gray-300)/i.test(code);
  const hasNamedColors = /color:\s*(?:red|blue|green|yellow|purple|orange)\b/i.test(code);

  if (hasLowContrast) { issues.push({ type: 'low-contrast', severity: 'critical', detail: '저대비 색상 감지 (WCAG AA 위험)' }); score -= 25; }
  if (hasNamedColors) { issues.push({ type: 'named-color', severity: 'warning', detail: 'CSS named color 사용 — named hex 권장' }); score -= 10; }

  return { name: 'Contrast', score: Math.max(0, score), weight: 0.10, issues };
}

// 5. Accessibility (10%)
function checkAccessibility(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const imgCount = (code.match(/<img/g) || []).length;
  const altCount = (code.match(/alt=/g) || []).length;
  const hasLabel = /<label|aria-label|htmlFor/.test(code);
  const hasSemantic = /<(?:main|nav|section|article|header|footer)/.test(code);
  const hasFocusVisible = /focus-visible|:focus|outline/.test(code);
  const hasDivButton = /<div(?:\s[^>]*)?onClick/.test(code);

  if (imgCount > 0 && altCount < imgCount) { issues.push({ type: 'missing-alt', severity: 'critical', detail: `이미지 ${imgCount}개 중 alt 없는 것 ${imgCount - altCount}개` }); score -= 20; }
  if (!hasSemantic) { issues.push({ type: 'missing-semantic-html', severity: 'warning', detail: '시맨틱 HTML 태그 없음' }); score -= 15; }
  if (!hasLabel) { issues.push({ type: 'missing-label', severity: 'warning', detail: '폼 label/aria-label 없음' }); score -= 10; }
  if (!hasFocusVisible) { issues.push({ type: 'missing-focus', severity: 'warning', detail: 'focus/outline 스타일 없음' }); score -= 10; }
  if (hasDivButton) { issues.push({ type: 'div-as-button', severity: 'warning', detail: '<div onClick> 감지 — <button> 사용 권장' }); score -= 15; }

  return { name: 'Accessibility', score: Math.max(0, score), weight: 0.10, issues };
}

// 6. Motion / Interaction (8%)
function checkMotion(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasTransition = /transition|duration|ease/.test(code);
  const hasHover = /hover:/.test(code) || /:hover/.test(code);
  const hasReducedMotion = /prefers-reduced-motion/.test(code);
  const hasDuration = /duration-(?:75|100|150|200|300|400|500|700)/.test(code) || /transition.*\d+(?:ms|s)/.test(code);
  const hasExcessiveMotion = /animation.*infinite|spin.*fast/.test(code);

  if (!hasTransition) { issues.push({ type: 'missing-transition', severity: 'info', detail: 'transition 정의 없음' }); score -= 10; }
  if (!hasHover) { issues.push({ type: 'missing-hover', severity: 'info', detail: 'hover 상태 없음' }); score -= 5; }
  if (!hasReducedMotion) { issues.push({ type: 'missing-reduced-motion', severity: 'warning', detail: 'prefers-reduced-motion 미디어 쿼리 없음' }); score -= 15; }
  if (hasExcessiveMotion) { issues.push({ type: 'excessive-motion', severity: 'warning', detail: '과도한 애니메이션 감지' }); score -= 20; }

  return { name: 'Motion', score: Math.max(0, score), weight: 0.08, issues };
}

// 7. Brand (5%)
function checkBrand(code: string, brandColor?: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  if (brandColor) {
    const hasBrand = code.toLowerCase().includes(brandColor.toLowerCase());
    if (!hasBrand) { issues.push({ type: 'missing-brand-color', severity: 'warning', detail: `브랜드 컬러(${brandColor}) 미사용` }); score -= 20; }
  }

  const hasConsistentRadius = /rounded-(?:lg|md|xl|8|10|12)/.test(code);
  if (!hasConsistentRadius) { issues.push({ type: 'missing-radius', severity: 'info', detail: '일관된 border-radius 정의 없음' }); score -= 10; }

  return { name: 'Brand', score: Math.max(0, score), weight: 0.05, issues };
}

// 8. Consistency (8%)
function checkConsistency(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 서로 다른 radius 값 너무 많은지
  const radii = new Set(code.match(/rounded-(?:none|sm|md|lg|xl|2xl|3xl|full)/g) || []);
  if (radii.size > 4) { issues.push({ type: 'too-many-radii', severity: 'warning', detail: `${radii.size}개 서로 다른 radius — 일관성 위험` }); score -= 15; }

  // 서로 다른 폰트 크기 너무 많은지
  const sizes = new Set(code.match(/text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)/g) || []);
  if (sizes.size > 6) { issues.push({ type: 'too-many-sizes', severity: 'info', detail: `${sizes.size}개 텍스트 크기 — 통일 권장` }); score -= 5; }

  return { name: 'Consistency', score: Math.max(0, score), weight: 0.08, issues };
}

// 9. Visual Rhythm (5%)
function checkVisualRhythm(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasGrid = /grid-cols|grid grid/.test(code);
  const hasFlex = /flex|justify-|items-/.test(code);
  const hasMaxWidth = /max-w-/.test(code) || /max-width/.test(code);

  if (!hasGrid && !hasFlex) { issues.push({ type: 'missing-layout', severity: 'warning', detail: 'Grid/Flex 레이아웃 없음' }); score -= 20; }
  if (!hasMaxWidth) { issues.push({ type: 'missing-max-width', severity: 'info', detail: '컨테이너 max-width 없음' }); score -= 10; }

  return { name: 'Visual Rhythm', score: Math.max(0, score), weight: 0.05, issues };
}

// 10. AI Smell (10%) — 가장 중요
function checkAISmell(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const patterns: { regex: RegExp; type: string; detail: string; severity: Issue['severity'] }[] = [
    { regex: /gradient.*background-clip.*text|background-clip:\s*text.*gradient/i, type: 'gradient-text', detail: 'gradient-text 감지 — AI 안티패턴', severity: 'critical' },
    { regex: /backdrop-blur/g, type: 'glassmorphism', detail: 'glassmorphism 사용 — 남용 위험', severity: 'warning' },
    { regex: /purple|violet|indigo|#7c3aed|#6366f1/i, type: 'ai-purple', detail: 'AI 기본 보라색 — 금지', severity: 'critical' },
    { regex: /boost|supercharge|unleash|elevate/i, type: 'ai-copy', detail: 'AI 기본 카피 단어 감지', severity: 'critical' },
    { regex: /#F4F1EA|#E2725B|terracotta|cream/i, type: 'cream-terracotta', detail: 'AI 크림+테라코타 패턴', severity: 'critical' },
    { regex: /rounded-full.*(?:btn|button)|border-radius:\s*50%.*(?:btn|button)/i, type: 'circular-button', detail: '원형 버튼 — 사장님 금지', severity: 'critical' },
    { regex: /01\.\s|02\.\s|03\.\s/g, type: 'meaningless-number', detail: '의미 없는 번호 매기기', severity: 'warning' },
    { regex: /lorem\s*ipsum/i, type: 'lorem-ipsum', detail: 'Lorem Ipsum 감지', severity: 'critical' },
  ];

  for (const p of patterns) {
    if (p.regex.test(code)) {
      issues.push({ type: p.type, severity: p.severity, detail: p.detail, suggestion: getAISuggestion(p.type) });
      if (p.severity === 'critical') score -= 25;
      else score -= 10;
    }
  }

  return { name: 'AI Smell', score: Math.max(0, score), weight: 0.10, issues };
}

function getAISuggestion(type: string): string {
  const map: Record<string, string> = {
    'gradient-text': 'gradient를 제거하고 단일 색상 사용',
    'glassmorphism': 'backdrop-blur 사용을 최소화',
    'ai-purple': '보라색 대신 named hex 팔레트 사용',
    'ai-copy': 'AI 카피 단어 대신 구체적이고 인간적인 문장 사용',
    'cream-terracotta': '흰색/검정 기본 팔레트로 변경',
    'circular-button': 'border-radius를 8-12px로 변경',
    'meaningless-number': '번호에 의미를 부여하거나 제거',
    'lorem-ipsum': '실제 콘텐츠로 교체',
  };
  return map[type] ?? '해당 패턴 제거';
}

// 11. Empty State (5%)
function checkEmptyState(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasEmpty = /empty|no\s*(?:data|results|items)|데이터가\s*었습니다|결과가\s*없/i.test(code);
  const hasLoading = /loading|skeleton|spinner|불러오는\s*중/i.test(code);

  if (!hasEmpty) { issues.push({ type: 'missing-empty-state', severity: 'warning', detail: '빈 상태(Empty State) 처리 없음' }); score -= 20; }
  if (!hasLoading) { issues.push({ type: 'missing-loading', severity: 'info', detail: '로딩 상태 처리 없음' }); score -= 10; }

  return { name: 'Empty State', score: Math.max(0, score), weight: 0.05, issues };
}

// 12. Responsive (5%)
function checkResponsive(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasMediaQuery = /@media|min-width|max-width|sm:|md:|lg:|xl:/.test(code);
  const hasViewport = /viewport/.test(code);
  const hasMobileTouch = /min-h-\[44|min-h-\[48|h-11|h-12/.test(code);

  if (!hasMediaQuery) { issues.push({ type: 'missing-responsive', severity: 'critical', detail: '반응형 미디어 쿼리 없음' }); score -= 25; }
  if (!hasMobileTouch) { issues.push({ type: 'small-touch-target', severity: 'warning', detail: '모바일 터치 타겟(44px+) 확인 필요' }); score -= 10; }

  return { name: 'Responsive', score: Math.max(0, score), weight: 0.05, issues };
}

// 13. UX (8%)
function checkUX(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  const hasErrorHandling = /catch|error|setError|에러|실패/i.test(code);
  const hasSubmitState = /submitting|loading|disabled/.test(code);
  const hasConfirmation = /confirm|확인/i.test(code);

  if (!hasErrorHandling) { issues.push({ type: 'missing-error-handling', severity: 'warning', detail: '에러 처리 로직 없음' }); score -= 15; }
  if (!hasSubmitState) { issues.push({ type: 'missing-submit-state', severity: 'info', detail: '제출 중 상태 처리 없음' }); score -= 10; }

  return { name: 'UX', score: Math.max(0, score), weight: 0.08, issues };
}

// ============================================================
// MAIN REVIEW
// ============================================================

export function reviewUI(filePath: string, brandColor?: string): ReviewResult {
  const code = loadCode(filePath);

  const categories: CategoryScore[] = [
    checkHierarchy(code),
    checkTypography(code),
    checkSpacing(code),
    checkContrast(code),
    checkAccessibility(code),
    checkMotion(code),
    checkBrand(code, brandColor),
    checkConsistency(code),
    checkVisualRhythm(code),
    checkAISmell(code),
    checkEmptyState(code),
    checkResponsive(code),
    checkUX(code),
  ];

  // 가중 평균
  const totalScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0),
  );

  const allIssues = categories.flatMap((c) => c.issues);

  const verdict: ReviewResult['verdict'] =
    totalScore >= 90 ? 'PASS' : totalScore >= 70 ? 'REVIEW' : 'REJECT';

  return {
    timestamp: new Date().toISOString(),
    totalScore,
    passed: totalScore >= 90,
    categories,
    issues: allIssues,
    verdict,
    file: path.basename(filePath),
  };
}

// --- Report 출력 ---
export function printReview(result: ReviewResult): void {
  const icon = result.verdict === 'PASS' ? '✅' : result.verdict === 'REVIEW' ? '⚠️' : '🔴';

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  🔍 UI Review Engine — Results');
  console.log('═══════════════════════════════════════════════');
  console.log();
  console.log(`  File:     ${result.file}`);
  console.log(`  Score:    ${result.totalScore}/100`);
  console.log(`  Verdict:  ${icon} ${result.verdict}`);
  console.log(`  Production: ${result.passed ? '✅ READY' : '❌ NOT READY'}`);
  console.log();
  console.log('  ── Categories ──────────────────────────────');

  for (const cat of result.categories) {
    const catIcon = cat.score >= 90 ? '✅' : cat.score >= 70 ? '⚠️' : '🔴';
    console.log(`  ${catIcon} ${cat.name.padEnd(20)} ${String(cat.score).padStart(3)}/100  (w: ${(cat.weight * 100).toFixed(0)}%)`);
    for (const issue of cat.issues) {
      const sev = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
      console.log(`     ${sev} ${issue.detail}`);
    }
  }

  console.log();
  console.log('═══════════════════════════════════════════════');
}
