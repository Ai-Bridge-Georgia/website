// ============================================================
// Validation Intelligence — Dependency Validator
// FK / Workflow / Permission / Circular 참조 검사
// ============================================================

import type { PluginManifest } from '../core/boundary';
import type { Issue, SuggestedFix } from './types';
import { createIssue } from './types';

export function validateDependencies(manifests: PluginManifest[]): Issue[] {
  const issues: Issue[] = [];

  // --- 모든 테이블 수집 ---
  const allTables = new Set<string>();
  for (const m of manifests) {
    for (const e of m.entities) {
      allTables.add(e.table);
    }
  }

  for (const manifest of manifests) {
    for (const entity of manifest.entities) {
      // 1. FK 참조 검증
      for (const field of entity.fields) {
        if (field.references) {
          // 'tenants(id)' → 'tenants'
          const refTable = field.references.split('(')[0];
          if (!allTables.has(refTable) && refTable !== 'tenants') {
            const fix: SuggestedFix = {
              type: 'add-reference',
              target: `${manifest.id}.${entity.name}.${field.name}`,
              description: `참조 테이블 '${refTable}'이(가) 존재하지 않음`,
              patch: { file: '', newFragment: `references: '${refTable}(id)'` },
              autoApplicable: false,
            };
            issues.push(createIssue('dependency', 'error', 'dependency',
              `Broken FK: ${entity.name}.${field.name} → ${refTable}`, '',
              { manifestId: manifest.id, entityName: entity.name, fieldName: field.name },
              fix,
            ));
          }
        }
      }

      // 2. Workflow 존재 검증
      if (entity.workflowId) {
        const allWorkflowIds = new Set<string>();
        for (const m of manifests) {
          m.workflowIds?.forEach((w) => allWorkflowIds.add(w));
        }
        if (!allWorkflowIds.has(entity.workflowId)) {
          issues.push(createIssue('dependency', 'warning', 'dependency',
            `Workflow가 정의되지 않음: ${entity.workflowId}`, `${entity.name}.workflowId`,
            { manifestId: manifest.id, entityName: entity.name },
          ));
        }
      }
    }

    // 3. Permission resource ↔ Entity resource 일치
    if (manifest.permissions) {
      const entityResources = new Set(manifest.entities.map((e) => e.resource ?? e.name));
      for (const perm of manifest.permissions) {
        if (!entityResources.has(perm.resource) && perm.resource !== '*') {
          issues.push(createIssue('dependency', 'warning', 'dependency',
            `Permission resource가 엔티티와 불일치: ${perm.resource}`, '',
            { manifestId: manifest.id },
          ));
        }
      }
    }
  }

  // 4. Circular FK 검증 (간단)
  const fkGraph = new Map<string, Set<string>>();
  for (const m of manifests) {
    for (const e of m.entities) {
      if (!fkGraph.has(e.table)) fkGraph.set(e.table, new Set());
      for (const f of e.fields) {
        if (f.references) {
          const ref = f.references.split('(')[0];
          if (ref !== 'tenants') fkGraph.get(e.table)!.add(ref);
        }
      }
    }
  }

  for (const [table, refs] of fkGraph) {
    for (const ref of refs) {
      if (fkGraph.get(ref)?.has(table)) {
        issues.push(createIssue('dependency', 'warning', 'dependency',
          `순환 참조 가능: ${table} ↔ ${ref}`, '',
          { entityName: table },
        ));
      }
    }
  }

  return issues;
}
