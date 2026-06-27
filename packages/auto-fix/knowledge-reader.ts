// ============================================================
// Adaptive Knowledge Reader — Knowledge Base → Generation Rules
// Generator가 같은 실수를 반복하지 않도록 학습
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// --- Knowledge Record (auto-fix-history.json 형식) ---
interface KnowledgeRecord {
  timestamp: string;
  platform: string;
  category: string;
  description: string;
  confidence: number;
  applied: boolean;
}

// --- Generation Rule (학습에서 파생) ---
export interface GenerationRule {
  id: string;
  source: string;            // 'knowledge' | 'baseline'
  platform: string | 'all';
  category: string;
  rule: string;              // 사람이 읽을 수 있는 규칙
  generatorAction: string;   // Generator가 수행할 구체적 액션
  recurrenceCount: number;   // 반복 횟수
}

// --- Knowledge 읽기 ---
function loadKnowledge(): KnowledgeRecord[] {
  const filePath = path.resolve(process.cwd(), '.knowledge', 'auto-fix-history.json');
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
}

// --- Knowledge → Rules 변환 ---
export function deriveRulesFromKnowledge(): GenerationRule[] {
  const records = loadKnowledge();
  if (records.length === 0) return getBaselineRules();

  // 카테고리+플랫폼별로 그룹화하여 반복 횟수 계산
  const grouped = new Map<string, { platform: string; category: string; description: string; count: number }>();

  for (const r of records) {
    const key = `${r.platform}:${r.category}:${r.description.slice(0, 40)}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(key, { platform: r.platform, category: r.category, description: r.description, count: 1 });
    }
  }

  // 각 그룹을 Rule로 변환
  const rules: GenerationRule[] = [];

  for (const [key, g] of grouped) {
    const action = knowledgeToAction(g.platform, g.category, g.description);
    if (action) {
      rules.push({
        id: `rule-${key.replace(/[^a-z0-9]/gi, '-')}`,
        source: 'knowledge',
        platform: g.platform as string,
        category: g.category,
        rule: action.rule,
        generatorAction: action.generatorAction,
        recurrenceCount: g.count,
      });
    }
  }

  // 기본 규칙도 추가 (Knowledge와 무관하게 항상 적용)
  rules.push(...getBaselineRules());

  return rules;
}

// --- Knowledge Category → Generator Action 매핑 ---
function knowledgeToAction(platform: string, category: string, description: string):
  { rule: string; generatorAction: string } | null {

  // 안전: description에서 핵심 패턴 추출
  const desc = description.toLowerCase();

  // --- Naming (iOS: homeView → HomeView) ---
  if (category === 'naming' && platform === 'ios') {
    return {
      rule: 'Swift view names MUST be PascalCase (HomeView, not homeView)',
      generatorAction: 'use_pascal_case_for_all_swift_views',
    };
  }

  // --- Theme (Android: KoreankitchenTheme missing) ---
  if (category === 'theme' && platform === 'android') {
    return {
      rule: 'Android project MUST include a Theme.kt file with Material 3 color scheme',
      generatorAction: 'generate_theme_file',
    };
  }

  // --- Missing AndroidManifest ---
  if (category === 'missing-file' && desc.includes('manifest')) {
    return {
      rule: 'Android project MUST include AndroidManifest.xml',
      generatorAction: 'generate_android_manifest',
    };
  }

  // --- Search missing (Android) ---
  if (category === 'ux-inconsistency' && desc.includes('search')) {
    return {
      rule: 'List screens MUST include search functionality on ALL platforms',
      generatorAction: 'add_search_to_list_screens',
    };
  }

  // --- Success state missing (Android) ---
  if (category === 'ux-inconsistency' && desc.includes('success')) {
    return {
      rule: 'Form screens MUST include success state on ALL platforms',
      generatorAction: 'add_success_state_to_forms',
    };
  }

  // --- API stub ---
  if (category === 'api-stub') {
    return {
      rule: 'Screens with API endpoints MUST include actual fetch/call, not TODO',
      generatorAction: 'generate_api_client_code',
    };
  }

  // --- Accessibility ---
  if (category === 'accessibility') {
    return {
      rule: 'All interactive elements MUST have accessibility labels',
      generatorAction: 'add_accessibility_labels',
    };
  }

  return null;
}

// --- 기본 규칙 (Knowledge 무관하게 항상 적용) ---
function getBaselineRules(): GenerationRule[] {
  return [
    {
      id: 'baseline-pascal-case',
      source: 'baseline',
      platform: 'ios',
      category: 'naming',
      rule: 'All Swift type names must be PascalCase',
      generatorAction: 'use_pascal_case_for_all_swift_views',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-android-theme',
      source: 'baseline',
      platform: 'android',
      category: 'theme',
      rule: 'Android project must generate Theme.kt',
      generatorAction: 'generate_theme_file',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-android-manifest',
      source: 'baseline',
      platform: 'android',
      category: 'missing-file',
      rule: 'Android project must generate AndroidManifest.xml',
      generatorAction: 'generate_android_manifest',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-search',
      source: 'baseline',
      platform: 'all',
      category: 'ux-inconsistency',
      rule: 'List screens must include search on all platforms',
      generatorAction: 'add_search_to_list_screens',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-success-state',
      source: 'baseline',
      platform: 'all',
      category: 'ux-inconsistency',
      rule: 'Form screens must include success state on all platforms',
      generatorAction: 'add_success_state_to_forms',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-a11y',
      source: 'baseline',
      platform: 'all',
      category: 'accessibility',
      rule: 'All interactive elements must have accessibility labels',
      generatorAction: 'add_accessibility_labels',
      recurrenceCount: 0,
    },
    {
      id: 'baseline-api',
      source: 'baseline',
      platform: 'all',
      category: 'api-stub',
      rule: 'API endpoints must have actual client code, not TODO stubs',
      generatorAction: 'generate_api_client_code',
      recurrenceCount: 0,
    },
  ];
}

// --- 규칙 요약 ---
export function getRulesForPlatform(platform: string): GenerationRule[] {
  const all = deriveRulesFromKnowledge();
  return all.filter(r => r.platform === platform || r.platform === 'all');
}

// --- Knowledge를 프롬프트 텍스트로 변환 ---
export function knowledgeToPromptText(platform: string): string {
  const rules = getRulesForPlatform(platform);
  if (rules.length === 0) return '';

  let text = '# Learned Rules (from previous generation errors)\n\n';
  text += 'These rules were derived from errors found in previous generations. Follow them strictly.\n\n';

  for (const r of rules) {
    const tag = r.source === 'knowledge' ? `[LEARNED: ${r.recurrenceCount}x]` : '[BASELINE]';
    text += `- ${tag} ${r.rule}\n`;
  }

  return text;
}
