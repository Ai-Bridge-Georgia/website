// ============================================================
// Factory Compiler — Permission Matrix Generator
// Input:  PluginManifest[]
// Output: 권한 매트릭스 (JSON — 대시보드/문서화용)
// ============================================================

import type { PluginManifest } from '../core/boundary';

export function generatePermissionMatrix(manifests: PluginManifest[]): string {
  const matrix: Record<string, Record<string, string[]>> = {};

  for (const manifest of manifests) {
    if (!manifest.permissions) continue;

    for (const perm of manifest.permissions) {
      const resource = perm.resource;
      if (!matrix[resource]) matrix[resource] = {};

      if (!matrix[resource][perm.role]) {
        matrix[resource][perm.role] = [];
      }

      matrix[resource][perm.role].push(...perm.actions);
    }
  }

  // 중복 제거
  for (const resource of Object.keys(matrix)) {
    for (const role of Object.keys(matrix[resource])) {
      matrix[resource][role] = [...new Set(matrix[resource][role])];
    }
  }

  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    matrix,
  }, null, 2);
}
