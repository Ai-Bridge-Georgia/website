// ============================================================
// Factory Compiler CLI
// 실행: npm run compile
// 매니페스트를 읽어서 전체 아티팩트를 생성합니다.
// ============================================================

import { compileAndReport } from './index';
import { restaurantManifest } from '../plugins/restaurant';

// --- 등록된 매니페스트 (향후: 자동 스캔) ---
const manifests = [
  restaurantManifest,
  // hotelManifest,
  // saasManifest,
];

// --- 컴파일 실행 ---
compileAndReport(manifests);
