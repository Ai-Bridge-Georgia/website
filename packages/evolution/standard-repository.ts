// ============================================================
// Standard Layer — Repository
// 표준 저장/조회/상태 관리
// ============================================================

import type { Standard, StandardStatus } from './standard-types';
import * as fs from 'fs';
import * as path from 'path';

const KB_DIR = '.knowledge';
const STANDARD_FILE = path.join(KB_DIR, 'standards.json');

// --- 로드 ---
export function loadStandards(): Standard[] {
  try {
    const p = path.resolve(process.cwd(), STANDARD_FILE);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch { /* fresh */ }
  return [];
}

// --- 저장 ---
export function saveStandards(standards: Standard[]): void {
  const dir = path.resolve(process.cwd(), KB_DIR);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'standards.json'), JSON.stringify(standards, null, 2));
}

// --- 조회 ---
export function getStandardsByStatus(status: StandardStatus): Standard[] {
  return loadStandards().filter((s) => s.status === status);
}

export function getCurrentStandards(): Standard[] {
  return getStandardsByStatus('current');
}

export function getStandardById(id: string): Standard | undefined {
  return loadStandards().find((s) => s.id === id);
}

// --- 생성 ---
export function createStandard(data: {
  category: Standard['category'];
  title: string;
  description: string;
  pattern: string;
  template: Record<string, unknown>;
}): Standard {
  const standards = loadStandards();
  const id = `STD-${String(standards.length + 1).padStart(3, '0')}`;
  const now = new Date().toISOString();

  const standard: Standard = {
    id,
    category: data.category,
    status: 'experimental',
    title: data.title,
    description: data.description,
    pattern: data.pattern,
    template: data.template,
    promotedAt: null,
    promotedBy: null,
    evidence: {
      occurrences: 1,
      projects: [],
      sprints: [],
      qualityImpact: [],
      regressionPassed: false,
    },
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  standards.push(standard);
  saveStandards(standards);
  return standard;
}

// --- 승격 (experimental → current) ---
export function promoteStandard(id: string, approvedBy: string): Standard | null {
  const standards = loadStandards();
  const std = standards.find((s) => s.id === id);
  if (!std) return null;

  std.status = 'current';
  std.promotedAt = new Date().toISOString();
  std.promotedBy = approvedBy;
  std.updatedAt = new Date().toISOString();
  saveStandards(standards);
  return std;
}

// --- 폐기 (current → deprecated) ---
export function deprecateStandard(id: string, supersededBy?: string): Standard | null {
  const standards = loadStandards();
  const std = standards.find((s) => s.id === id);
  if (!std) return null;

  std.status = 'deprecated';
  std.supersededBy = supersededBy;
  std.updatedAt = new Date().toISOString();
  saveStandards(standards);
  return std;
}

// --- 증거 업데이트 ---
export function updateEvidence(id: string, evidence: Partial<Standard['evidence']>): void {
  const standards = loadStandards();
  const std = standards.find((s) => s.id === id);
  if (!std) return;
  std.evidence = { ...std.evidence, ...evidence };
  std.updatedAt = new Date().toISOString();
  saveStandards(standards);
}
