// ============================================================
// Factory Validator — Phase 7: Golden Manifest Test
// 책임: 컴파일러 수정 시 출력 변화 감지 (회귀 테스트)
// 의존성: 고정된 Expected Output
// 위험: silent regression — 컴파일러 수정이 알려지지 않은 변경을 만듦
// ============================================================

import type { PluginManifest } from '../core/boundary';
import { compile } from '../compiler';
import * as crypto from 'crypto';

// --- Golden Test 해시 계산 ---
function computeHash(artifacts: { migrations: string; openapi: string; forms: string; permissions: string }): string {
  const combined = artifacts.migrations + artifacts.openapi + artifacts.forms + artifacts.permissions;
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
}

// --- Golden Test 실행 ---
export interface GoldenTestResult {
  passed: boolean;
  currentHash: string;
  expectedHash: string | null;
  isFirstRun: boolean;
  message: string;
}

export function runGoldenTest(
  manifests: PluginManifest[],
  expectedHash?: string | null,
): GoldenTestResult {
  const result = compile(manifests);
  const currentHash = computeHash(result);

  if (!expectedHash) {
    return {
      passed: true,
      currentHash,
      expectedHash: null,
      isFirstRun: true,
      message: `첫 실행 — 이 해시를 golden 값으로 저장하세요: ${currentHash}`,
    };
  }

  if (currentHash === expectedHash) {
    return {
      passed: true,
      currentHash,
      expectedHash,
      isFirstRun: false,
      message: '출력이 golden 값과 일치함',
    };
  }

  return {
    passed: false,
    currentHash,
    expectedHash,
    isFirstRun: false,
    message: `출력이 golden 값과 다름!\n  Expected: ${expectedHash}\n  Current:  ${currentHash}\n  컴파일러가 수정되었거나 매니페스트가 변경됨`,
  };
}
