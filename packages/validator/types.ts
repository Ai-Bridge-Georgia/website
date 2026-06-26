// ============================================================
// Validation Intelligence — Type Definitions
// 모든 검증 계층이 공유하는 구조화된 타입
// ============================================================

// --- Severity ---
export type Severity = 'error' | 'warning' | 'info';

// --- Issue Category ---
export type IssueCategory =
  | 'manifest'
  | 'artifact'
  | 'consistency'
  | 'dependency'
  | 'regression';

// --- Structured Issue (모든 validator가 생성) ---
export interface Issue {
  id: string;
  validator: string;
  severity: Severity;
  category: IssueCategory;
  location: {
    manifestId?: string;
    entityName?: string;
    fieldName?: string;
    artifactFile?: string;
    line?: number;
  };
  message: string;
  evidence: string;
  suggestedFix?: SuggestedFix;
  impact?: string;
}

// --- Suggested Fix (수정안 — 적용 ❌, 제안만) ---
export interface SuggestedFix {
  type: 'add-field' | 'remove-field' | 'change-type'
      | 'add-permission' | 'add-reference' | 'add-required'
      | 'fix-duplicate' | 'add-workflow';
  target: string;           // 'restaurant.menus.price'
  description: string;
  patch: {
    file: string;
    oldFragment?: string;
    newFragment: string;
  };
  autoApplicable: boolean;  // true = 위험 없이 자동 적용 가능
}

// --- Impact Analysis ---
export interface ImpactReport {
  affectedEntities: string[];
  affectedApis: string[];
  affectedForms: string[];
  affectedPermissions: string[];
  migrationImpact: 'none' | 'additive' | 'breaking';
  breakingChange: boolean;
  rollbackPossible: boolean;
  estimatedRisk: 'low' | 'medium' | 'high';
}

// --- Validation Result ---
export interface ValidationResult {
  timestamp: string;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    passed: boolean;
  };
  issues: Issue[];
  fixProposals: SuggestedFix[];
  impact?: ImpactReport;
  productionReady: boolean;
}

// --- Helper: Issue 생성 ---
let issueCounter = 0;
export function createIssue(
  validator: string,
  severity: Severity,
  category: IssueCategory,
  message: string,
  evidence: string,
  location: Issue['location'] = {},
  suggestedFix?: SuggestedFix,
): Issue {
  return {
    id: `ISSUE-${String(++issueCounter).padStart(4, '0')}`,
    validator,
    severity,
    category,
    location,
    message,
    evidence,
    suggestedFix,
    impact: severity === 'error' ? 'Production 차단' : severity === 'warning' ? '권장 수정' : '참고',
  };
}
