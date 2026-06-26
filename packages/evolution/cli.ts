// ============================================================
// Self-Evolution CLI
// 실행: npm run evolve
// validate → evolve 순서로 실행
// ============================================================

import { validate } from '../validator';
import { evolve } from './index';
import { restaurantManifest } from '../plugins/restaurant';
import * as fs from 'fs';
import * as path from 'path';

// 1. 먼저 Validation 실행
let goldenHash: string | undefined;
const goldenPath = path.resolve(process.cwd(), '.generated', 'validation-report.json');
if (fs.existsSync(goldenPath)) {
  try {
    const prev = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'));
    goldenHash = prev.goldenHash;
  } catch { /* ignore */ }
}

const manifests = [restaurantManifest];
const { report, goldenHash: currentHash } = validate(manifests, { goldenHash });

// 2. Evolution 실행
evolve({ ...report, goldenHash: currentHash });
