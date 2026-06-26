// ============================================================
// Constitution Enforcement — Rule Interface
// 헌법: "Validator는 검증만 한다" (Article III 준수)
// 모든 Rule은 이 인터페이스를 구현한다.
// ============================================================

// --- Severity ---
export type Severity = 'critical' | 'warning';

// --- Rule Status ---
export type RuleStatus = 'pass' | 'block' | 'warn' | 'skip';

// --- Import Info (parseImports 결과) ---
export interface ImportInfo {
  source: string;       // '@supabase/supabase-js'
  isTypeOnly: boolean;  // import type { ... }
  file: string;         // 파일 경로
  line: number;         // 라인 번호
}

// --- Evidence ---
export interface Evidence {
  ruleId: string;
  status: RuleStatus;
  file?: string;
  line?: number;
  detail: string;
  suggestion?: string;
}

// --- Rule Interface (모든 Rule이 구현) ---
export interface EnforcementRule {
  id: string;           // 'E-01'
  article: string;      // 'I-1'
  description: string;  // 'Core에 Domain Import 금지'
  severity: Severity;
  evaluate(ctx: EnforcementContext): Evidence[];
}

// --- Read-Only Context (쓰기 ❌ 절대) ---
export interface EnforcementContext {
  // 파일 읽기 (Read-Only)
  readFile(relativePath: string): string;
  // 파일 목록 (Read-Only)
  listFiles(dir: string, pattern?: string): string[];
  // Import 파싱 (Read-Only)
  parseImports(relativePath: string): ImportInfo[];
}
