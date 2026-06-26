// ============================================================
// Standard Layer — Template Injector
// 새 프로젝트 생성 시 Current Standards를 자동 적용
// 같은 문제를 두 번 다시 해결하지 않는다
// ============================================================

import type { PluginManifest, EntitySchemaMeta, FieldSchemaMeta } from '../core/boundary';
import { getCurrentStandards } from './standard-repository';
import type { Standard } from './standard-types';

// --- Standard 적용 결과 ---
export interface InjectionResult {
  appliedStandards: { id: string; title: string; what: string }[];
  skippedStandards: { id: string; reason: string }[];
  modifiedManifest: boolean;
}

// --- 매니페스트에 Standard 주입 ---
export function injectStandards(manifest: PluginManifest): { manifest: PluginManifest; result: InjectionResult } {
  const standards = getCurrentStandards();
  const applied: { id: string; title: string; what: string }[] = [];
  const skipped: { id: string; reason: string }[] = [];

  let modified = false;
  const newManifest: PluginManifest = {
    ...manifest,
    entities: [...manifest.entities],
    permissions: manifest.permissions ? [...manifest.permissions] : undefined,
  };

  for (const std of standards) {
    switch (std.category) {
      case 'permission-pattern': {
        // 기본 권한 매트릭스 주입 (permissions가 없으면)
        if (!newManifest.permissions || newManifest.permissions.length === 0) {
          const template = std.template as { permissions?: { role: string; resource: string; actions: string[] }[] };
          if (template.permissions) {
            // 엔티티 리소스에 맞게 확장
            const resources = newManifest.entities.map((e) => e.resource ?? e.name);
            newManifest.permissions = template.permissions.flatMap((p) =>
              p.resource === '*'
                ? resources.map((r) => ({ role: p.role, resource: r, actions: p.actions }))
                : [p],
            );
            modified = true;
            applied.push({ id: std.id, title: std.title, what: `기본 권한 ${resources.length * 4}개 규칙 적용` });
          }
        } else {
          skipped.push({ id: std.id, reason: '이미 권한 정의됨' });
        }
        break;
      }

      case 'entity-pattern': {
        // 표준 필드 확인 (id, tenant_id, created_at, updated_at은 이미 Core가 자동 추가)
        const template = std.template as { standardFields?: { name: string; type: string }[] };
        if (template.standardFields) {
          // Core가 이미 이 필드들을 자동 추가하므로, 중복 확인만
          skipped.push({ id: std.id, reason: 'Core가 자동 처리' });
        }
        break;
      }

      case 'validation-rule': {
        // 필수 필드 검증이 있는지 확인
        for (const entity of newManifest.entities) {
          if (!entity.requiredFields || entity.requiredFields.length === 0) {
            // name 필드가 있으면 필수로 승격
            if (entity.fields.some((f) => f.name === 'name')) {
              entity.requiredFields = ['name'];
              modified = true;
              applied.push({
                id: std.id,
                title: std.title,
                what: `${entity.name}.name → 필수 필드 승격`,
              });
            }
          }
        }
        break;
      }

      default:
        skipped.push({ id: std.id, reason: `카테고리 '${std.category}' 미지원` });
    }
  }

  return {
    manifest: newManifest,
    result: {
      appliedStandards: applied,
      skippedStandards: skipped,
      modifiedManifest: modified,
    },
  };
}

// --- Standard 요약 ---
export function getStandardSummary(): {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
} {
  const standards = getCurrentStandards();
  return {
    total: standards.length,
    byCategory: standards.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: { current: standards.length },
  };
}
