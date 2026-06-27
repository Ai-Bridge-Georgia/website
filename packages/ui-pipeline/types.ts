// ============================================================
// UI Pipeline — Type Definitions
// ============================================================

// --- Review Category ---
export interface CategoryScore {
  name: string;
  score: number;              // 0-100
  weight: number;             // 0-1 (전체 가중치)
  issues: Issue[];
}

export interface Issue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  location?: string;          // CSS selector or line
  detail: string;
  suggestion?: string;
}

// --- Review Result ---
export interface ReviewResult {
  timestamp: string;
  totalScore: number;         // 0-100 weighted
  passed: boolean;            // totalScore >= 90
  categories: CategoryScore[];
  issues: Issue[];
  verdict: 'PASS' | 'REVIEW' | 'REJECT';
  file: string;
}

// --- Fix Suggestion ---
export interface FixSuggestion {
  issue: Issue;
  category: string;
  priority: number;           // 1 = highest
  fixType: 'replace' | 'remove' | 'add';
  description: string;
  codeChange?: {
    find: string;
    replace: string;
  };
}

// --- Pipeline Result ---
export interface PipelineResult {
  review: ReviewResult;
  fixes: FixSuggestion[];
  productionReady: boolean;
}
