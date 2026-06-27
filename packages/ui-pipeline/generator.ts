// ============================================================
// UI Pipeline — Generator (프롬프트를 읽어 UI 생성 지시)
// 실제 AI 호출은 외부에서 수행. 여기서는 "생성 준비"만.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// --- 프롬프트 읽기 ---
export function loadPrompts(promptDir: string): { ai: string; content: string }[] {
  const files = fs.readdirSync(promptDir).filter((f) => f.endsWith('.prompt.md'));
  return files.map((f) => ({
    ai: f.replace('.prompt.md', ''),
    content: fs.readFileSync(path.join(promptDir, f), 'utf-8'),
  }));
}

// --- 생성 결과 저장 디렉토리 준비 ---
export function prepareOutputDir(outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });
}

// --- 프롬프트 요약 (로그용) ---
export function summarizePrompt(content: string): { layers: number; size: number } {
  const layers = content.split('\n---\n').length;
  const size = content.length;
  return { layers, size };
}
