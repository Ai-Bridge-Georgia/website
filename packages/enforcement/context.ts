// ============================================================
// Constitution Enforcement — Read-Only Context
// 헌법: "Enforcement는 읽기만 한다"
// 쓰기/mutation 절대 ❌
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import type { EnforcementContext, ImportInfo } from './types';

// --- 허용된 외부 패키지 (Core에 import 가능한 것) ---
const CORE_ALLOWED_IMPORTS = [
  'react',           // 타입 전용 허용
];

// --- Read-Only Context 구현 ---
export function createContext(rootDir: string): EnforcementContext {
  const root = path.resolve(rootDir);

  return {
    // --- 파일 읽기 ---
    readFile(relativePath: string): string {
      const full = path.join(root, relativePath);
      try {
        return fs.readFileSync(full, 'utf-8');
      } catch {
        return '';
      }
    },

    // --- 파일 목록 ---
    listFiles(dir: string, pattern?: string): string[] {
      const fullDir = path.join(root, dir);
      try {
        const entries = fs.readdirSync(fullDir, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            // 재귀적으로 .ts/.tsx 파일 찾기
            const subDir = path.join(dir, entry.name);
            const subFiles = this.listFiles(subDir, pattern);
            files.push(...subFiles.map((f) => path.join(entry.name, f)));
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            if (!pattern || entry.name.includes(pattern)) {
              files.push(entry.name);
            }
          }
        }
        return files;
      } catch {
        return [];
      }
    },

    // --- Import 파싱 ---
    parseImports(relativePath: string): ImportInfo[] {
      const content = this.readFile(relativePath);
      const imports: ImportInfo[] = [];
      const lines = content.split('\n');

      // import 문 정규식
      // import { X } from '...'
      // import type { X } from '...'
      // import X from '...'
      const importRegex = /^import\s+(?:type\s+)?(?:\{[^}]+\}|\* as \w+|\w+)\s+from\s+['"]([^'"]+)['"]/;
      // 여러 줄 import 처리 (import { ... } 가 같은 줄에 from이 없을 때만)
      const multiLineStartRegex = /^import\s+(?:type\s+)?\{(?!.*from\s+['"])/;

      let inMultiLine = false;
      let multiLineStart = 0;
      let isMultiLineType = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (inMultiLine) {
          if (line.includes('from ')) {
            const match = line.match(/from\s+['"]([^'"]+)['"]/);
            if (match) {
              imports.push({
                source: match[1],
                isTypeOnly: isMultiLineType,
                file: relativePath,
                line: multiLineStart + 1,
              });
            }
            inMultiLine = false;
          }
          continue;
        }

        if (multiLineStartRegex.test(line)) {
          inMultiLine = true;
          multiLineStart = i;
          isMultiLineType = line.startsWith('import type');
          continue;
        }

        const match = line.match(importRegex);
        if (match) {
          imports.push({
            source: match[1],
            isTypeOnly: line.startsWith('import type'),
            file: relativePath,
            line: i + 1,
          });
        }
      }

      return imports;
    },
  };
}
