// ============================================================
// Self-Evolution Layer — Type Definitions
// ============================================================

// --- Quality Score ---
export interface QualityScore {
  overall: number;                    // 0-100
  dimensions: {
    manifestQuality: number;          // 매니페스트 정확성
    apiConsistency: number;           // Manifest ↔ OpenAPI 일치
    sqlSafety: number;                // SQL 위험도 (RLS/FK/트리거)
    dependencyHealth: number;         // FK/Workflow/참조 무결성
    regressionStability: number;      // Golden test 통과 여부
    configurationCompleteness: number; // 권한/폼/규칙 커버리지
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  trend?: 'up' | 'stable' | 'down' | 'first';
  delta?: number;                     // 이전 대비 변화
}

// --- Knowledge Entry ---
export interface KnowledgeEntry {
  id: string;
  sprint: number;
  timestamp: string;
  issueId: string;
  category: string;
  severity: string;
  message: string;
  status: 'discovered' | 'fix-proposed' | 'fix-approved' | 'fix-rejected' | 'resolved' | 'recurring';
  fixApplied?: string;
  occurrences: number;                // 반복 발생 횟수
  pattern?: string;                   // 패턴 시그니처
}

// --- Sprint Record ---
export interface SprintRecord {
  sprint: number;
  timestamp: string;
  qualityScore: number;
  grade: string;
  errors: number;
  warnings: number;
  fixProposals: number;
  fixesApplied: number;
  newIssues: number;
  resolvedIssues: number;
  recurringIssues: number;
  goldenHash: string;
  productionReady: boolean;
}

// --- Evolution Report ---
export interface EvolutionReport {
  sprint: number;
  timestamp: string;
  qualityScore: QualityScore;
  trend: {
    direction: 'up' | 'stable' | 'down' | 'first';
    delta: number;
    previousScore: number | null;
  };
  issues: {
    new: KnowledgeEntry[];
    resolved: KnowledgeEntry[];
    recurring: KnowledgeEntry[];
  };
  knowledgeGrowth: {
    totalEntries: number;
    totalPatterns: number;
    totalResolved: number;
  };
  regressionRisk: 'none' | 'low' | 'medium' | 'high';
  verdict: 'improving' | 'stable' | 'degrading' | 'insufficient-data';
  productionReady: boolean;
}
