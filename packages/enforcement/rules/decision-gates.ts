// ============================================================
// 7 Decision Gates — 각각 독립적인 Rule
// D-01 ~ D-07: 코드가 되기 전에 잘못된 결정을 차단
// ============================================================

import type { DecisionGate, Decision, GateResult } from '../decision-types';

// --- D-01: 삭제로 해결 가능한가? ---
export const D01_DeletionSufficient: DecisionGate = {
  id: 'D-01',
  title: '삭제로 해결 가능한가?',
  description: '코드를 추가하기 전에, 기존 코드를 삭제하는 것으로 해결되는지 확인',
  evaluate(d: Decision): GateResult {
    // 새 파일이 0개이고 삭제가 있는데 purpose가 "정리" 목적이면
    if (d.changes.filesToCreate.length === 0 &&
        d.changes.filesToDelete.length > 0 &&
        d.changes.filesToModify.length === 0) {
      return {
        gateId: 'D-01', verdict: 'pass',
        reason: '삭제 기반 변경 — 코드 증가 없음',
        evidence: `삭제 ${d.changes.filesToDelete.length}개`,
      };
    }

    // 새 파일이 3개 이상인데 purpose가 "중복 제거" 목적이면 의심
    if (d.changes.filesToCreate.length >= 3 &&
        d.purpose.toLowerCase().includes('중복') || d.purpose.toLowerCase().includes('duplicate')) {
      return {
        gateId: 'D-01', verdict: 'block',
        reason: '중복 제거 목적인데 새 파일 3+개 생성 — 삭제로 해결 가능한지 재검토',
        evidence: `생성 ${d.changes.filesToCreate.length}개 vs 삭제 ${d.changes.filesToDelete.length}개`,
      };
    }

    return {
      gateId: 'D-01', verdict: 'pass',
      reason: '삭제만으로는 해결 불가 — 새 구현 정당화됨',
      evidence: `새 파일 ${d.changes.filesToCreate.length}개`,
    };
  },
};

// --- D-02: 기존 Platform으로 해결 가능한가? ---
export const D02_PlatformSufficient: DecisionGate = {
  id: 'D-02',
  title: '기존 Platform으로 해결 가능한가?',
  description: '새 구현 전에 기존 Engine/Interface/Metadata로 해결 가능한지 확인',
  evaluate(d: Decision): GateResult {
    // alternatives가 비어있으면 위험
    if (d.alternatives.length === 0) {
      return {
        gateId: 'D-02', verdict: 'block',
        reason: '대안 검토 없음 — 기존 플랫폼으로 해결 가능한지 확인 필요',
        evidence: 'alternatives 배열이 비어있음',
      };
    }

    // "메타데이터로 해결"이 대안에 있지만 선택하지 않은 경우
    const hasMetadataAlt = d.alternatives.some(a =>
      a.includes('메타데이터') || a.includes('metadata') || a.includes('설정') || a.includes('config'),
    );
    if (hasMetadataAlt && !d.selectedApproach.includes('메타데이터')) {
      return {
        gateId: 'D-02', verdict: 'review-required',
        reason: '메타데이터/설정으로 해결 가능한 대안이 있음 — 왜 새 구현을 선택했는지 검토',
        evidence: `대안: ${d.alternatives.filter(a => a.includes('메타데이터') || a.includes('metadata')).join('; ')}`,
      };
    }

    return {
      gateId: 'D-02', verdict: 'pass',
      reason: '기존 플랫폼으로는 해결 불가 — 새 구현 정당화됨',
      evidence: `${d.alternatives.length}개 대안 검토됨`,
    };
  },
};

// --- D-03: 새 Dependency가 필요한가? ---
export const D03_DependencyCheck: DecisionGate = {
  id: 'D-03',
  title: '새 Dependency가 필요한가?',
  description: '새 의존성 추가 시 Architecture Review 필수',
  evaluate(d: Decision): GateResult {
    if (d.changes.newDependencies.length === 0) {
      return {
        gateId: 'D-03', verdict: 'pass',
        reason: '새 의존성 없음',
        evidence: '0 dependencies',
      };
    }

    // 의존성이 있지만 risk가 high면 더 엄격
    if (d.changes.newDependencies.length >= 3) {
      return {
        gateId: 'D-03', verdict: 'block',
        reason: `새 의존성 ${d.changes.newDependencies.length}개 — 과도한 의존성`,
        evidence: d.changes.newDependencies.join(', '),
      };
    }

    return {
      gateId: 'D-03', verdict: 'review-required',
      reason: `새 의존성 ${d.changes.newDependencies.length}개 — Architecture Review 필요`,
      evidence: d.changes.newDependencies.join(', '),
    };
  },
};

// --- D-04: Business Workflow를 변경하는가? ---
export const D04_WorkflowCheck: DecisionGate = {
  id: 'D-04',
  title: 'Business Workflow를 변경하는가?',
  description: '워크플로우 변경 시 Workflow Review 필수',
  evaluate(d: Decision): GateResult {
    if (!d.changes.workflowChange) {
      return {
        gateId: 'D-04', verdict: 'pass',
        reason: '워크플로우 변경 없음',
        evidence: 'workflowChange: false',
      };
    }

    return {
      gateId: 'D-04', verdict: 'review-required',
      reason: '비즈니스 워크플로우 변경 — Workflow Review 필요',
      evidence: `selectedApproach: ${d.selectedApproach}`,
    };
  },
};

// --- D-05: Public API를 변경하는가? ---
export const D05_ApiCheck: DecisionGate = {
  id: 'D-05',
  title: 'Public API를 변경하는가?',
  description: 'API 변경 시 Compatibility Review 필수',
  evaluate(d: Decision): GateResult {
    if (!d.changes.publicApiChange) {
      return {
        gateId: 'D-05', verdict: 'pass',
        reason: 'API 변경 없음',
        evidence: 'publicApiChange: false',
      };
    }

    // Rollback plan이 없으면 BLOCK
    if (!d.rollbackPlan || d.rollbackPlan.length < 10) {
      return {
        gateId: 'D-05', verdict: 'block',
        reason: 'API 변경 + Rollback Plan 부족 — 비가역 위험',
        evidence: `rollbackPlan: "${d.rollbackPlan || '(empty)'}"`,
      };
    }

    return {
      gateId: 'D-05', verdict: 'review-required',
      reason: 'Public API 변경 — Compatibility Review 필요',
      evidence: `Rollback: ${d.rollbackPlan.slice(0, 60)}...`,
    };
  },
};

// --- D-06: Migration이 필요한가? ---
export const D06_MigrationCheck: DecisionGate = {
  id: 'D-06',
  title: 'Migration이 필요한가?',
  description: 'DB Migration 시 Rollback Plan 필수',
  evaluate(d: Decision): GateResult {
    if (!d.changes.migrationRequired) {
      return {
        gateId: 'D-06', verdict: 'pass',
        reason: 'Migration 불필요',
        evidence: 'migrationRequired: false',
      };
    }

    // Migration + Rollback 없음 = BLOCK
    if (!d.rollbackPlan || d.rollbackPlan.length < 10) {
      return {
        gateId: 'D-06', verdict: 'block',
        reason: 'Migration 필요하지만 Rollback Plan 없음 — 비가역 위험',
        evidence: `rollbackPlan: "${d.rollbackPlan || '(empty)'}"`,
      };
    }

    return {
      gateId: 'D-06', verdict: 'review-required',
      reason: 'Migration 필요 — Rollback Plan 확인됨',
      evidence: `Rollback: ${d.rollbackPlan.slice(0, 60)}...`,
    };
  },
};

// --- D-07: Mission에 기여하는가? ---
export const D07_MissionCheck: DecisionGate = {
  id: 'D-07',
  title: 'Mission에 기여하는가?',
  description: 'Factory Mission에 기여하지 않는 변경은 구현 금지',
  evaluate(d: Decision): GateResult {
    if (d.missionImpact === 'positive') {
      return {
        gateId: 'D-07', verdict: 'pass',
        reason: 'Mission에 긍정적 기여',
        evidence: d.missionReason,
      };
    }

    if (d.missionImpact === 'neutral') {
      return {
        gateId: 'D-07', verdict: 'review-required',
        reason: 'Mission 기여가 중립적 — 필요성 재검토',
        evidence: d.missionReason,
      };
    }

    // negative = BLOCK
    return {
      gateId: 'D-07', verdict: 'block',
      reason: 'Mission에 부정적 영향 — 구현 금지',
      evidence: d.missionReason,
    };
  },
};

// --- 모든 Gate ---
export const allDecisionGates: DecisionGate[] = [
  D01_DeletionSufficient,
  D02_PlatformSufficient,
  D03_DependencyCheck,
  D04_WorkflowCheck,
  D05_ApiCheck,
  D06_MigrationCheck,
  D07_MissionCheck,
];
