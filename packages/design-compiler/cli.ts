// ============================================================
// Design Compiler — Main Entry + CLI
// npm run design-compile
// ============================================================

import { compileAll } from './prompt-compiler';
import { defaultManifest } from './manifest';
import type { UIManifest } from './manifest';
import * as fs from 'fs';
import * as path from 'path';

// --- Manifest Loader (JSON/YAML 파일에서 읽기) ---
function loadManifest(): UIManifest {
  // ui-manifest.json 또는 ui-manifest.yaml 찾기
  const jsonPath = path.resolve(process.cwd(), 'ui-manifest.json');

  if (fs.existsSync(jsonPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      // 기본값과 병합
      return {
        ...defaultManifest,
        ...raw,
        brand: { ...defaultManifest.brand, ...raw.brand },
        dna: { ...defaultManifest.dna, ...raw.dna },
        target: { ...defaultManifest.target, ...raw.target },
        style: { ...defaultManifest.style, ...raw.style },
        tech: { ...defaultManifest.tech, ...raw.tech },
      };
    } catch (e) {
      console.error('⚠️ ui-manifest.json 파싱 실패, 기본값 사용');
    }
  }

  // 기본 manifest 사용
  return defaultManifest;
}

// --- 메인 실행 ---
const manifest = loadManifest();
const prompts = compileAll(manifest);

// --- 출력 디렉토리 ---
const outDir = path.resolve(process.cwd(), '.generated', 'prompts');
fs.mkdirSync(outDir, { recursive: true });

// --- 파일 저장 ---
for (const prompt of prompts) {
  const filename = `${prompt.ai}.prompt.md`;
  fs.writeFileSync(path.join(outDir, filename), prompt.content);
}

// --- 결과 출력 ---
console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  🎨 UI Prompt Compiler — Complete');
console.log('═══════════════════════════════════════════════');
console.log();
console.log(`  Brand:     ${manifest.brand.name}`);
console.log(`  Industry:  ${manifest.industry}`);
console.log(`  Screens:   ${manifest.screens.join(', ')}`);
console.log(`  Language:  ${manifest.brand.language}`);
console.log();
console.log('  ── Generated Prompts ──────────────────────');
for (const p of prompts) {
  const size = (p.content.length / 1024).toFixed(1);
  console.log(`  ✅ ${p.ai.padEnd(8)} ${size}KB  hash: ${p.hash}`);
}
console.log();
console.log(`  Output: ${outDir}/`);
console.log('═══════════════════════════════════════════════');
