// ============================================================
// Self-Evolution — Knowledge Base
// 이슈/패턴/해결을 영구 저장하여 동일 실수 방지
// ============================================================

import type { KnowledgeEntry, SprintRecord } from './types';
import * as fs from 'fs';
import * as path from 'path';

// --- Knowledge Base 경로 ---
const KB_DIR = '.knowledge';
const KB_FILE = path.join(KB_DIR, 'knowledge-base.json');
const SPRINT_FILE = path.join(KB_DIR, 'sprint-history.json');

// --- 로드 ---
export function loadKnowledge(): KnowledgeEntry[] {
  try {
    const p = path.resolve(process.cwd(), KB_FILE);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* fresh start */ }
  return [];
}

export function loadSprints(): SprintRecord[] {
  try {
    const p = path.resolve(process.cwd(), SPRINT_FILE);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* fresh start */ }
  return [];
}

// --- 저장 ---
export function saveKnowledge(entries: KnowledgeEntry[]): void {
  const dir = path.resolve(process.cwd(), KB_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'knowledge-base.json'), JSON.stringify(entries, null, 2));
}

export function saveSprints(sprints: SprintRecord[]): void {
  const dir = path.resolve(process.cwd(), KB_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'sprint-history.json'), JSON.stringify(sprints, null, 2));
}

// --- 패턴 시그니처 생성 ---
export function createPattern(category: string, message: string): string {
  // 메시지에서 핵심 패턴 추출 (숫자/ID 제거)
  const cleaned = message
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/g, '<UUID>')
    .replace(/\d+/g, '<N>')
    .replace(/'/g, '')
    .slice(0, 80);
  return `${category}::${cleaned}`;
}

// --- 이슈 추가/업데이트 ---
export function recordIssues(
  existing: KnowledgeEntry[],
  newIssues: { issueId: string; category: string; severity: string; message: string }[],
  sprint: number,
): { added: KnowledgeEntry[]; recurring: KnowledgeEntry[] } {
  const result = [...existing];
  const added: KnowledgeEntry[] = [];
  const recurring: KnowledgeEntry[] = [];

  for (const issue of newIssues) {
    const pattern = createPattern(issue.category, issue.message);

    // 기존 패턴 검색
    const existingEntry = result.find((e) => e.pattern === pattern);
    if (existingEntry) {
      existingEntry.occurrences++;
      existingEntry.status = 'recurring';
      existingEntry.sprint = sprint;
      recurring.push(existingEntry);
    } else {
      const entry: KnowledgeEntry = {
        id: `KB-${String(result.length + 1).padStart(4, '0')}`,
        sprint,
        timestamp: new Date().toISOString(),
        issueId: issue.issueId,
        category: issue.category,
        severity: issue.severity,
        message: issue.message,
        status: 'discovered',
        occurrences: 1,
        pattern,
      };
      result.push(entry);
      added.push(entry);
    }
  }

  return { added, recurring };
}

// --- 통계 ---
export function getKnowledgeStats(entries: KnowledgeEntry[]): {
  total: number;
  resolved: number;
  recurring: number;
  patterns: number;
} {
  return {
    total: entries.length,
    resolved: entries.filter((e) => e.status === 'resolved').length,
    recurring: entries.filter((e) => e.status === 'recurring').length,
    patterns: new Set(entries.map((e) => e.pattern)).size,
  };
}
