// ============================================================
// Common Review Rules — 모든 플랫폼에 적용되는 Business 규칙
// HTML/CSS/Tailwind 정규식 없음. 플랫폼 중립.
// ============================================================

import type { CategoryScore, Issue } from '../../ui-pipeline/types';

// 공통 평가: 코드 길이, 함수 구조, 복잡도 등 — 플랫폼 무관
export function checkHierarchyNeutral(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 모든 플랫폼에서 H1/H2/Body 계층은 존재 (Web: <h1>, Android: headline, iOS: .title)
  const hasDisplaySize = /56|48|40/.test(code);
  const hasBodySize = /16/.test(code);
  const hasHierarchy = hasDisplaySize && hasBodySize;

  if (!hasHierarchy) { issues.push({ type: 'missing-hierarchy', severity: 'warning', detail: '타이포그래피 계층(디스플레이/본문) 미감지' }); score -= 20; }

  return { name: 'Hierarchy (Common)', score: Math.max(0, score), weight: 0.08, issues };
}

export function checkContrastNeutral(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 색상 hex 감지 — 모든 플랫폼에서 색상 코드 사용
  const hasLowContrast = /#(?:eee|ccc|ddd|f5f5f5|fafafa)\b|Color\.gray\.opacity\(0\.[1-3]\)/i.test(code);
  if (hasLowContrast) { issues.push({ type: 'low-contrast', severity: 'critical', detail: '저대비 색상 (WCAG AA 위험)' }); score -= 25; }

  return { name: 'Contrast (Common)', score: Math.max(0, score), weight: 0.08, issues };
}

export function checkConsistencyNeutral(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 동일한 크기/색상이 너무 많이 반복되는지
  const sizeMatches = code.match(/(?:size:|font-size:|fontSize[=:]|\.sp|\.dp)\s*(\d+)/g) || [];
  const sizes = new Set(sizeMatches);
  if (sizes.size > 8) { issues.push({ type: 'too-many-sizes', severity: 'info', detail: `${sizes.size}개 서로 다른 크기 — 통일 권장` }); score -= 10; }

  return { name: 'Consistency (Common)', score: Math.max(0, score), weight: 0.06, issues };
}

export function checkAISmellNeutral(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // AI 안티패턴 — 모든 플랫폼 공통
  const patterns = [
    { regex: /boost|supercharge|unleash|elevate/i, type: 'ai-copy', detail: 'AI 카피 단어', severity: 'critical' as const },
    { regex: /purple|violet|indigo|#7c3aed|#6366f1/i, type: 'ai-purple', detail: 'AI 기본 보라색', severity: 'critical' as const },
    { regex: /lorem\s*ipsum/i, type: 'lorem-ipsum', detail: 'Lorem Ipsum', severity: 'critical' as const },
  ];

  for (const p of patterns) {
    if (p.regex.test(code)) {
      issues.push({ type: p.type, severity: p.severity, detail: p.detail });
      score -= p.severity === 'critical' ? 25 : 10;
    }
  }

  return { name: 'AI Smell (Common)', score: Math.max(0, score), weight: 0.10, issues };
}

export function checkCognitiveLoadNeutral(code: string): CategoryScore {
  const issues: Issue[] = [];
  let score = 100;

  // 버튼 수 — 모든 플랫폼에서 너무 많으면 인지 부하
  const buttonCount = (code.match(/Button\(|<button|buttonStyle/g) || []).length;
  if (buttonCount > 8) { issues.push({ type: 'too-many-buttons', severity: 'warning', detail: `버튼 ${buttonCount}개 (8개 이하 권장)` }); score -= 15; }

  return { name: 'Cognitive Load (Common)', score: Math.max(0, score), weight: 0.05, issues };
}

export const commonReviewFunctions = [
  checkHierarchyNeutral,
  checkContrastNeutral,
  checkConsistencyNeutral,
  checkAISmellNeutral,
  checkCognitiveLoadNeutral,
];
