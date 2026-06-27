// ============================================================
// Fix Engine — Issue → FixSuggestion 생성
// 90점 미만 시 수정 제안 자동 생성
// ============================================================

import type { ReviewResult, FixSuggestion, Issue } from './types';

// --- Priority 계산 ---
function getPriority(severity: string): number {
  if (severity === 'critical') return 1;
  if (severity === 'warning') return 2;
  return 3;
}

// --- Fix Type 추론 ---
function inferFixType(type: string): 'replace' | 'remove' | 'add' {
  if (type.includes('missing')) return 'add';
  if (type.includes('remove') || type.includes('excessive') || type.includes('system-font') || type.includes('gradient-text') || type.includes('ai-purple') || type.includes('lorem-ipsum')) return 'remove';
  return 'replace';
}

// --- Code Change 제안 ---
function generateCodeChange(issue: Issue): { find: string; replace: string } | undefined {
  const map: Record<string, { find: string; replace: string }> = {
    'gradient-text': { find: 'background-clip: text', replace: '/* 제거: 단일 색상 사용 */' },
    'ai-purple': { find: 'purple', replace: '#111827' },
    'circular-button': { find: 'rounded-full', replace: 'rounded-lg' },
    'system-font': { find: 'font-family: Arial', replace: "font-family: 'Pretendard', sans-serif" },
    'lorem-ipsum': { find: 'Lorem ipsum', replace: '실제 콘텐츠를 입력하세요' },
    'div-as-button': { find: '<div onClick', replace: '<button onClick' },
    'missing-font-swap': { find: "@import url('https://cdn...", replace: "@import url(...); font-display: swap;" },
  };
  return map[issue.type];
}

// --- Issue → FixSuggestion 변환 ---
export function generateFixes(review: ReviewResult): FixSuggestion[] {
  if (review.passed) return []; // 90점 이상 = 수정 불필요

  const fixes: FixSuggestion[] = [];

  for (const cat of review.categories) {
    for (const issue of cat.issues) {
      const fix: FixSuggestion = {
        issue,
        category: cat.name,
        priority: getPriority(issue.severity),
        fixType: inferFixType(issue.type),
        description: issue.suggestion ?? `${cat.name}: ${issue.detail}`,
        codeChange: generateCodeChange(issue),
      };
      fixes.push(fix);
    }
  }

  // Priority 순 정렬 (critical 먼저)
  return fixes.sort((a, b) => a.priority - b.priority);
}

// --- Markdown 리포트 생성 ---
export function generateFixReport(fixes: FixSuggestion[]): string {
  if (fixes.length === 0) {
    return '# UI Fix Suggestions\n\n✅ 수정이 필요하지 않습니다. (Score ≥ 90)\n';
  }

  let md = '# UI Fix Suggestions\n\n';
  md += `> 총 ${fixes.length}개 수정 제안 (우선순위 순)\n\n`;

  const critical = fixes.filter((f) => f.priority === 1);
  const warning = fixes.filter((f) => f.priority === 2);
  const info = fixes.filter((f) => f.priority === 3);

  if (critical.length > 0) {
    md += `## 🔴 Critical (${critical.length})\n\n`;
    for (const f of critical) {
      md += `- **[${f.category}]** ${f.description}\n`;
      if (f.codeChange) {
        md += `  - Find: \`${f.codeChange.find}\`\n`;
        md += `  - Replace: \`${f.codeChange.replace}\`\n`;
      }
      md += '\n';
    }
  }

  if (warning.length > 0) {
    md += `## 🟡 Warning (${warning.length})\n\n`;
    for (const f of warning) {
      md += `- **[${f.category}]** ${f.description}\n`;
      md += '\n';
    }
  }

  if (info.length > 0) {
    md += `## 🔵 Info (${info.length})\n\n`;
    for (const f of info) {
      md += `- **[${f.category}]** ${f.description}\n`;
    }
  }

  return md;
}
