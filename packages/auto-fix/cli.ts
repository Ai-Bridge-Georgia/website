// ============================================================
// Auto Fix CLI — npm run auto-fix
// 생성된 3개 플랫폼 프로젝트를 자동 검사 + 수정
// ============================================================

import { runAutoFix, printAutoFixReport } from './pipeline';
import type { Platform } from './error-parser';
import type { GeneratedFile } from '../project-generator/interface';
import * as fs from 'fs';
import * as path from 'path';

console.log('');
console.log('═══════════════════════════════════════════════');
console.log('  🔧 Auto Fix Pipeline — Self-Healing');
console.log('═══════════════════════════════════════════════');
console.log();

const cwd = process.cwd();
const platforms: Platform[] = ['web', 'android', 'ios'];

for (const platform of platforms) {
  const projectDir = path.join(cwd, '.generated', 'projects', platform);

  if (!fs.existsSync(projectDir)) {
    console.log(`  ⏭️ ${platform}: project not found, skipping`);
    continue;
  }

  // Read all generated files
  const files: GeneratedFile[] = [];
  function readFiles(dir: string, baseDir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(baseDir, full);
      if (entry.isDirectory()) {
        readFiles(full, baseDir);
      } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.kt') || entry.name.endsWith('.swift') || entry.name.endsWith('.xml') || entry.name.endsWith('.json') || entry.name.endsWith('.kts') || entry.name.endsWith('.yml') || entry.name.endsWith('.css')) {
        files.push({ path: rel, content: fs.readFileSync(full, 'utf-8') });
      }
    }
  }
  readFiles(projectDir, projectDir);

  const result = runAutoFix(platform, projectDir, files);
  printAutoFixReport(result);
}

console.log('═══════════════════════════════════════════════');
