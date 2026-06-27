// ============================================================
// UI Pipeline — Pipeline (generate → review → fix → report)
// 전체 파이프라인을 하나로 연결
// ============================================================

import type { ReviewResult, FixSuggestion, PipelineResult } from './types';
import { reviewUI, printReview } from './review';
import { generateFixes, generateFixReport } from './fix';
import { loadPrompts, prepareOutputDir, summarizePrompt } from './generator';
import * as fs from 'fs';
import * as path from 'path';

// --- 단일 파일 검사 ---
export function reviewFile(filePath: string, brandColor?: string): PipelineResult {
  const review = reviewUI(filePath, brandColor);
  const fixes = generateFixes(review);

  printReview(review);

  return {
    review,
    fixes,
    productionReady: review.passed,
  };
}

// --- 디렉토리 전체 검사 ---
export function reviewDirectory(dir: string, brandColor?: string): PipelineResult[] {
  const results: PipelineResult[] = [];
  const files = fs.readdirSync(dir).filter((f) =>
    f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.html') || f.endsWith('.vue'),
  );

  for (const file of files) {
    const fullPath = path.join(dir, file);
    console.log(`\n  📄 Reviewing: ${file}`);
    const result = reviewFile(fullPath, brandColor);
    results.push(result);
  }

  return results;
}

// --- 전체 Pipeline 실행 ---
export function runPipeline(options: {
  promptDir: string;
  uiDir: string;
  reportDir: string;
  brandColor?: string;
}): void {
  console.log('═══════════════════════════════════════════════');
  console.log('  🎨 UI Generation Pipeline');
  console.log('═══════════════════════════════════════════════');
  console.log();

  // 1. Load Prompts
  console.log('  ── Step 1: Load Prompts ──────────────────');
  const prompts = loadPrompts(options.promptDir);
  for (const p of prompts) {
    const summary = summarizePrompt(p.content);
    console.log(`  📝 ${p.ai}: ${summary.layers} layers, ${(summary.size / 1024).toFixed(1)}KB`);
  }

  // 2. Check if UI exists
  console.log();
  console.log('  ── Step 2: Review Generated UI ───────────');

  prepareOutputDir(options.reportDir);

  let allResults: PipelineResult[] = [];

  if (fs.existsSync(options.uiDir)) {
    allResults = reviewDirectory(options.uiDir, options.brandColor);
  } else {
    // UI 파일이 없으면 기존 페이지 검사
    console.log('  ⚠️ .generated/ui/ 없음 — 기존 페이지 검색');
    const appDir = path.resolve(process.cwd(), 'apps/aibridgegeorgia/app');
    const pages: string[] = [];

    function findPages(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) findPages(path.join(dir, e.name));
        else if (e.name === 'page.tsx') pages.push(path.join(dir, e.name));
      }
    }

    if (fs.existsSync(appDir)) {
      findPages(appDir);
      for (const page of pages) {
        console.log(`\n  📄 Reviewing: ${path.relative(process.cwd(), page)}`);
        const result = reviewFile(page, options.brandColor);
        allResults.push(result);
      }
    }
  }

  // 3. Generate Reports
  console.log();
  console.log('  ── Step 3: Generate Reports ──────────────');

  // 통합 리포트
  const combinedReview = {
    timestamp: new Date().toISOString(),
    files: allResults.map((r) => ({
      file: r.review.file,
      score: r.review.totalScore,
      verdict: r.review.verdict,
    })),
    averageScore: allResults.length > 0
      ? Math.round(allResults.reduce((s, r) => s + r.review.totalScore, 0) / allResults.length)
      : 0,
    totalIssues: allResults.reduce((s, r) => s + r.fixes.length, 0),
    productionReady: allResults.length > 0 && allResults.every((r) => r.productionReady),
  };

  fs.writeFileSync(
    path.join(options.reportDir, 'ui-review.json'),
    JSON.stringify(combinedReview, null, 2),
  );
  console.log(`  ✅ ui-review.json 저장`);

  // Fix Suggestions (모든 fix 통합)
  const allFixes = allResults.flatMap((r) => r.fixes);
  const fixMd = generateFixReport(allFixes);
  fs.writeFileSync(path.join(options.reportDir, 'fix-suggestions.md'), fixMd);
  console.log(`  ✅ fix-suggestions.md 저장 (${allFixes.length}개 제안)`);

  // 4. 최종 판정
  console.log();
  console.log('  ── Pipeline Summary ──────────────────────');
  console.log(`  Files reviewed:   ${allResults.length}`);
  console.log(`  Average Score:    ${combinedReview.averageScore}/100`);
  console.log(`  Total Issues:     ${combinedReview.totalIssues}`);
  console.log(`  Production Ready: ${combinedReview.productionReady ? '✅ YES' : '❌ NO'}`);
  console.log();
  console.log('═══════════════════════════════════════════════');
}
