// ============================================================
// Standard Layer — Promotion Engine
// Knowledge Base의 반복 패턴 → Standard 후보
// 승격 조건: 반복(N회) + 다중 프로젝트 + Regression 통과 + Quality 유지
// 절대 자동 적용 ❌ — 항상 Human Approval 필요
// ============================================================

import type { PromotionCandidate, PromotionCriteria, StandardCategory } from './standard-types';
import { loadKnowledge, createPattern } from './knowledge-base';
import { loadStandards, createStandard, getStandardById } from './standard-repository';

// --- 기본 승격 조건 ---
export const defaultCriteria: PromotionCriteria = {
  minOccurrences: 3,
  minProjects: 2,
  regressionMustPass: true,
  qualityMustNotDegrade: true,
  requiresHumanApproval: true,
};

// --- 카테고리 추론 (이슈 메시지에서) ---
function inferCategory(message: string, category: string): StandardCategory {
  if (category.includes('dependency') || message.includes('FK') || message.includes('reference')) {
    return 'entity-pattern';
  }
  if (category.includes('manifest') && message.includes('permission')) {
    return 'permission-pattern';
  }
  if (message.includes('workflow')) {
    return 'workflow-pattern';
  }
  if (message.includes('field') || message.includes('type') || message.includes('required')) {
    return 'validation-rule';
  }
  if (category.includes('consistency')) {
    return 'validation-rule';
  }
  return 'field-default';
}

// --- 승격 후보 생성 ---
export function findPromotionCandidates(
  criteria: PromotionCriteria = defaultCriteria,
): PromotionCandidate[] {
  const knowledge = loadKnowledge();
  const existingStandards = loadStandards();
  const existingPatterns = new Set(existingStandards.map((s) => s.pattern));

  // 패턴별 빈도 집계
  const patternGroups = new Map<string, {
    count: number;
    messages: string[];
    categories: string[];
    severities: string[];
  }>();

  for (const entry of knowledge) {
    if (!entry.pattern) continue;
    if (existingPatterns.has(entry.pattern)) continue;

    const existing = patternGroups.get(entry.pattern);
    if (existing) {
      existing.count++;
      existing.messages.push(entry.message);
      existing.categories.push(entry.category);
    } else {
      patternGroups.set(entry.pattern, {
        count: entry.occurrences,
        messages: [entry.message],
        categories: [entry.category],
        severities: [entry.severity],
      });
    }
  }

  // 후보 생성
  const candidates: PromotionCandidate[] = [];

  for (const [pattern, group] of patternGroups) {
    const category = inferCategory(group.messages[0], group.categories[0]);
    const occurrences = group.count;
    const projects = ['restaurant']; // Phase: 다중 프로젝트 추적
    const regressionPassed = true; // Phase: 실제 regression 결과 연동

    // 조건 검사
    const unmetReasons: string[] = [];
    if (occurrences < criteria.minOccurrences) {
      unmetReasons.push(`반복 횟수 부족: ${occurrences}/${criteria.minOccurrences}`);
    }
    if (projects.length < criteria.minProjects) {
      unmetReasons.push(`프로젝트 수 부족: ${projects.length}/${criteria.minProjects}`);
    }
    if (criteria.regressionMustPass && !regressionPassed) {
      unmetReasons.push('Regression 테스트 미통과');
    }

    const meetsCriteria = unmetReasons.length === 0;

    candidates.push({
      pattern,
      category,
      title: group.messages[0].slice(0, 60),
      description: `반복 ${occurrences}회 — ${group.categories[0]} 카테고리`,
      template: generateTemplate(category, group.messages[0]),
      evidence: {
        occurrences,
        projects,
        qualityImpact: [],
        regressionPassed,
      },
      meetsCriteria,
      unmetReasons,
    });
  }

  // 조건 충족 순 정렬
  return candidates.sort((a, b) => {
    if (a.meetsCriteria !== b.meetsCriteria) return a.meetsCriteria ? -1 : 1;
    return b.evidence.occurrences - a.evidence.occurrences;
  });
}

// --- 템플릿 자동 생성 ---
function generateTemplate(category: StandardCategory, message: string): Record<string, unknown> {
  switch (category) {
    case 'permission-pattern':
      return {
        permissions: [
          { role: 'admin', resource: '*', actions: ['read', 'create', 'update', 'delete'] },
          { role: 'owner', resource: '*', actions: ['read', 'create', 'update'] },
          { role: 'staff', resource: '*', actions: ['read'] },
          { role: 'customer', resource: '*', actions: ['read'] },
        ],
      };
    case 'entity-pattern':
      return {
        standardFields: [
          { name: 'id', type: 'uuid' },
          { name: 'tenant_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamptz' },
          { name: 'updated_at', type: 'timestamptz' },
        ],
      };
    case 'validation-rule':
      return {
        rule: { type: 'required', message: '필수 필드 검증 필요' },
      };
    default:
      return { note: message };
  }
}

// --- 후보를 실험 표준으로 등록 ---
export function promoteToExperimental(candidate: PromotionCandidate): string {
  const std = createStandard({
    category: candidate.category,
    title: candidate.title,
    description: candidate.description,
    pattern: candidate.pattern,
    template: candidate.template,
  });
  return std.id;
}

// --- 대기 중인 승격 후보 보고 ---
export function reportPromotionQueue(candidates: PromotionCandidate[]): void {
  const ready = candidates.filter((c) => c.meetsCriteria);
  const pending = candidates.filter((c) => !c.meetsCriteria);

  console.log('  ── Standard Promotion Queue ────────────');
  if (ready.length > 0) {
    console.log(`  ✅ 승격 준비 완료: ${ready.length}개`);
    for (const c of ready) {
      console.log(`     → [${c.category}] ${c.title} (${c.evidence.occurrences}회 반복)`);
    }
  }
  if (pending.length > 0) {
    console.log(`  ⏳ 조건 미충족: ${pending.length}개`);
    for (const c of pending.slice(0, 3)) {
      console.log(`     → [${c.category}] ${c.unmetReasons.join(', ')}`);
    }
  }
  if (ready.length === 0 && pending.length === 0) {
    console.log('     (승격 후보 없음 — Knowledge Base 축적 중)');
  }
}
