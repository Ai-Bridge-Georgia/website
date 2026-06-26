// ============================================================
// Factory Validator CLI
// 실행: npm run validate
// ============================================================

import { validate } from './index';
import { restaurantManifest } from '../plugins/restaurant';
import * as fs from 'fs';
import * as path from 'path';

// --- 기존 golden hash 읽기 ---
let goldenHash: string | undefined;
const goldenPath = path.resolve(process.cwd(), '.generated', 'validation-report.json');
if (fs.existsSync(goldenPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'));
    goldenHash = prev.goldenHash;
  } catch { /* ignore */ }
}

// --- 매니페스트 (향후: 자동 스캔) ---
const manifests = [restaurantManifest];

// --- 검증 실행 ---
const { report } = validate(manifests, { goldenHash });

// --- 종료 코드 (CI에서 사용) ---
if (!report.productionReady) {
  process.exit(1);
}
