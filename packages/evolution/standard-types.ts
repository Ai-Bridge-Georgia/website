// ============================================================
// Standard Layer — Type Definitions
// Factory가 프로젝트 경험을 표준으로 승격
// ============================================================

// --- Standard Category ---
export type StandardCategory =
  | 'entity-pattern'    // 엔티티 구조 패턴
  | 'permission-pattern' // 권한 매트릭스
  | 'workflow-pattern'   // 워크플로우 정의
  | 'validation-rule'    // 검증 규칙
  | 'ui-pattern'         // UI 컴포넌트 패턴
  | 'field-default';     // 필드 기본값/타입

// --- Standard Status ---
export type StandardStatus = 'experimental' | 'current' | 'deprecated';

// --- Standard Entry ---
export interface Standard {
  id: string;
  category: StandardCategory;
  status: StandardStatus;
  title: string;
  description: string;
  pattern: string;                    // 시그니처 (Knowledge와 공유)
  template: Record<string, unknown>;  // 실제 적용할 메타데이터
  // 승격 이력
  promotedAt: string | null;
  promotedBy: string | null;          // 'human' | 'auto-experimental'
  // 검증 이력
  evidence: {
    occurrences: number;              // Knowledge에서 반복 횟수
    projects: string[];               // 적용된 프로젝트
    sprints: number[];                // 적용된 Sprint
    qualityImpact: number[];          // 적용 후 품질 점수 변화
    regressionPassed: boolean;        // 회귀 테스트 통과
  };
  // 버전
  version: number;
  supersededBy?: string;              // deprecated 시 대체 표준 ID
  createdAt: string;
  updatedAt: string;
}

// --- Promotion Candidate ---
export interface PromotionCandidate {
  pattern: string;
  category: StandardCategory;
  title: string;
  description: string;
  template: Record<string, unknown>;
  evidence: {
    occurrences: number;
    projects: string[];
    qualityImpact: number[];
    regressionPassed: boolean;
  };
  meetsCriteria: boolean;
  unmetReasons: string[];
}

// --- Standard Metrics ---
export interface StandardMetrics {
  totalStandards: number;
  currentCount: number;
  experimentalCount: number;
  deprecatedCount: number;
  adoptionRate: number;               // current standards 적용률 (%)
  templateImprovementRate: number;    // 프로젝트 간 품질 향상률
  repeatedProblemRate: number;        // 반복 문제 비율 (%)
  learningVelocity: number;           // Sprint당 새 표준 승격 수
  generatedCodeQualityTrend: number[]; // Sprint별 평균 품질
}

// --- Promotion Criteria ---
export interface PromotionCriteria {
  minOccurrences: number;             // 기본 3
  minProjects: number;                // 기본 2
  regressionMustPass: boolean;        // 기본 true
  qualityMustNotDegrade: boolean;     // 기본 true
  requiresHumanApproval: boolean;     // 기본 true (절대 자동 ❌)
}
