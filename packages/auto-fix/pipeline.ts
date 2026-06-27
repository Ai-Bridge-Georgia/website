// ============================================================
// Auto Fix Pipeline — detect → fix → apply → verify → learn
// ============================================================

import { detectStaticIssues, type Platform, type ParsedError } from './error-parser';
import { generateFixes, applyFixes, type FixSuggestion, type ApplyResult } from './fix-engine';
import type { GeneratedFile } from '../project-generator/interface';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CONFIDENCE ENGINE (Step 4)
// ============================================================

export interface ConfidenceDecision {
  suggestion: FixSuggestion;
  verdict: 'auto-apply' | 'human-review' | 'suggest-only';
  reason: string;
}

export function evaluateConfidence(fixes: FixSuggestion[]): ConfidenceDecision[] {
  return fixes.map((fix) => {
    if (fix.confidence >= 95) {
      return { suggestion: fix, verdict: 'auto-apply', reason: `Confidence ${fix.confidence} ≥ 95` };
    } else if (fix.confidence >= 80) {
      return { suggestion: fix, verdict: 'human-review', reason: `Confidence ${fix.confidence} — requires human approval` };
    } else {
      return { suggestion: fix, verdict: 'suggest-only', reason: `Confidence ${fix.confidence} < 80 — suggestion only` };
    }
  });
}

// ============================================================
// REGRESSION CHECKER (Step 5)
// ============================================================

export interface RegressionResult {
  passed: boolean;
  beforeFileCount: number;
  afterFileCount: number;
  brokenFiles: string[];
}

export function checkRegression(beforeDir: string, afterDir: string): RegressionResult {
  function countFiles(dir: string): number {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    function walk(d: string) {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(d, entry.name));
        else count++;
      }
    }
    walk(dir);
    return count;
  }

  const before = countFiles(beforeDir);
  const after = countFiles(afterDir);

  // Check no files were deleted (regression)
  const brokenFiles: string[] = [];
  if (before > after) {
    brokenFiles.push('File count decreased — possible regression');
  }

  return {
    passed: brokenFiles.length === 0,
    beforeFileCount: before,
    afterFileCount: after,
    brokenFiles,
  };
}

// ============================================================
// LEARNING (Step 6) — Knowledge Base
// ============================================================

interface FixRecord {
  timestamp: string;
  platform: string;
  category: string;
  description: string;
  confidence: number;
  applied: boolean;
}

const knowledgeFile = path.resolve(process.cwd(), '.knowledge', 'auto-fix-history.json');

export function recordFixes(decisions: ConfidenceDecision[], applyResult: ApplyResult): void {
  const records: FixRecord[] = decisions.map((d, i) => ({
    timestamp: new Date().toISOString(),
    platform: d.suggestion.error.platform,
    category: d.suggestion.error.category,
    description: d.suggestion.description,
    confidence: d.suggestion.confidence,
    applied: applyResult.details[i]?.success ?? false,
  }));

  // Append to knowledge file
  let history: FixRecord[] = [];
  try {
    if (fs.existsSync(knowledgeFile)) {
      history = JSON.parse(fs.readFileSync(knowledgeFile, 'utf-8'));
    }
  } catch { /* empty */ }

  history.push(...records);

  fs.mkdirSync(path.dirname(knowledgeFile), { recursive: true });
  fs.writeFileSync(knowledgeFile, JSON.stringify(history, null, 2));
}

export function getRecurringFixes(): { category: string; count: number }[] {
  try {
    if (!fs.existsSync(knowledgeFile)) return [];
    const history: FixRecord[] = JSON.parse(fs.readFileSync(knowledgeFile, 'utf-8'));
    const counts = new Map<string, number>();
    for (const r of history) {
      const key = r.category;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  } catch {
    return [];
  }
}

// ============================================================
// FULL AUTO-FIX PIPELINE
// ============================================================

export interface AutoFixResult {
  platform: Platform;
  issuesFound: number;
  fixesGenerated: number;
  autoApplied: number;
  humanReview: number;
  suggestOnly: number;
  regression: RegressionResult | null;
  details: string[];
}

export function runAutoFix(
  platform: Platform,
  projectDir: string,
  files: GeneratedFile[],
): AutoFixResult {
  const details: string[] = [];

  // Step 1-2: Detect + Classify issues
  const fileContents = files.map(f => ({ path: f.path, content: f.content }));
  const issues = detectStaticIssues(platform, projectDir, fileContents);
  details.push(`Found ${issues.length} issues`);

  if (issues.length === 0) {
    return {
      platform, issuesFound: 0, fixesGenerated: 0,
      autoApplied: 0, humanReview: 0, suggestOnly: 0,
      regression: null, details: ['No issues found ✅'],
    };
  }

  for (const issue of issues) {
    details.push(`  🔍 [${issue.category}] ${issue.message}`);
  }

  // Step 3: Generate fixes
  const fixes = generateFixes(issues);
  details.push(`Generated ${fixes.length} fix suggestions`);

  // Step 4: Confidence evaluation
  const decisions = evaluateConfidence(fixes);
  const autoApply = decisions.filter(d => d.verdict === 'auto-apply');
  const humanReview = decisions.filter(d => d.verdict === 'human-review');
  const suggestOnly = decisions.filter(d => d.verdict === 'suggest-only');

  details.push(`  ✅ Auto-apply: ${autoApply.length} (confidence ≥ 95)`);
  details.push(`  ⚠️ Human review: ${humanReview.length} (confidence 80-94)`);
  details.push(`  📝 Suggest only: ${suggestOnly.length} (confidence < 80)`);

  // Step 5: Apply auto-apply fixes only
  const autoFixes = autoApply.map(d => d.suggestion);
  const applyResult = applyFixes(autoFixes, projectDir);

  for (const d of applyResult.details) {
    details.push(`  ${d.success ? '🔧' : '⏭️'} ${d.action}: ${d.file} ${d.reason ? `(${d.reason})` : ''}`);
  }

  // Step 6: Regression check
  const regression = checkRegression(projectDir, projectDir);

  // Step 7: Learning
  recordFixes(decisions, applyResult);

  return {
    platform,
    issuesFound: issues.length,
    fixesGenerated: fixes.length,
    autoApplied: applyResult.applied,
    humanReview: humanReview.length,
    suggestOnly: suggestOnly.length,
    regression,
    details,
  };
}

// ============================================================
// PRINT REPORT
// ============================================================

export function printAutoFixReport(result: AutoFixResult): void {
  console.log();
  console.log(`  ── Auto Fix: ${result.platform} ─────────────────`);
  for (const d of result.details) {
    console.log(`  ${d}`);
  }
  console.log();
  console.log(`  Issues found:    ${result.issuesFound}`);
  console.log(`  Fixes generated: ${result.fixesGenerated}`);
  console.log(`  Auto-applied:    ${result.autoApplied}`);
  console.log(`  Human review:    ${result.humanReview}`);
  console.log(`  Suggest only:    ${result.suggestOnly}`);
  console.log();
}
