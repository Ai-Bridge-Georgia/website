// ============================================================
// Decision Constitution Protocol (DCP)
// 헌법: "잘못된 결정을 코드가 되기 전에 막는다"
//
// 코드를 작성하기 전에 Decision 객체를 생성하고
// 7개 Gate를 통과해야만 Code Generation이 허용된다.
// ============================================================

// --- Decision 객체 (AI가 변경을 계획할 때 생성) ---
export interface Decision {
  id: string;
  purpose: string;                    // 왜 이 변경이 필요한가?
  alternatives: string[];             // 다른 해결 방법은?
  selectedApproach: string;           // 왜 이 방법을 선택했는가?
  tradeoffs: string[];                // 포기한 것 / 얻은 것
  dependencies: string[];            // 새 의존성
  riskLevel: 'low' | 'medium' | 'high';
  rollbackPlan: string;              // 되돌리는 방법
  missionImpact: 'positive' | 'neutral' | 'negative';
  missionReason: string;             // Mission에 어떻게 기여하는가?

  // 변경 메타데이터
  changes: {
    filesToCreate: string[];
    filesToModify: string[];
    filesToDelete: string[];
    newDependencies: string[];
    publicApiChange: boolean;
    migrationRequired: boolean;
    workflowChange: boolean;
  };
}

// --- Gate 평가 결과 ---
export type GateVerdict = 'pass' | 'block' | 'review-required';

export interface GateResult {
  gateId: string;                     // 'D-01'
  verdict: GateVerdict;
  reason: string;
  evidence: string;
}

// --- 전체 Decision 평가 결과 ---
export interface DecisionResult {
  decisionId: string;
  passed: boolean;                    // 모든 Gate 통과?
  gates: GateResult[];
  blockedBy: string[];                // BLOCK한 Gate ID 목록
  reviewRequired: string[];           // Review 필요 Gate ID 목록
  allowCodeGeneration: boolean;
}

// --- Decision Gate 인터페이스 ---
export interface DecisionGate {
  id: string;                         // 'D-01'
  title: string;
  description: string;
  evaluate(decision: Decision): GateResult;
}
