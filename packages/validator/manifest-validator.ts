// ============================================================
// Validation Intelligence — Manifest Validator
// 매니페스트 자체의 정확성 검사
// ============================================================

import type { PluginManifest, EntitySchemaMeta, FieldSchemaMeta } from '../core/boundary';
import type { Issue, SuggestedFix } from './types';
import { createIssue } from './types';

export function validateManifest(manifests: PluginManifest[]): Issue[] {
  const issues: Issue[] = [];
  const validFieldTypes = ['text', 'number', 'boolean', 'uuid', 'jsonb', 'timestamptz', 'date', 'numeric'];
  const seenTables = new Map<string, string>(); // table → manifestId

  for (const manifest of manifests) {
    // --- Manifest ID ---
    if (!manifest.id) {
      issues.push(createIssue('manifest', 'error', 'manifest',
        'Manifest ID가 없습니다', `manifest: ${manifest.name}`,
        { manifestId: manifest.id },
      ));
    }

    // --- Entities 존재 ---
    if (!manifest.entities || manifest.entities.length === 0) {
      issues.push(createIssue('manifest', 'warning', 'manifest',
        '엔티티가 없습니다', `manifest: ${manifest.id}`,
        { manifestId: manifest.id },
      ));
      continue;
    }

    for (const entity of manifest.entities) {
      // --- Entity 이름 ---
      if (!entity.name || !entity.table) {
        issues.push(createIssue('manifest', 'error', 'manifest',
          `엔티티 name/table이 없습니다`, `entity: ${JSON.stringify(entity).slice(0, 100)}`,
          { manifestId: manifest.id, entityName: entity.name },
        ));
        continue;
      }

      // --- 테이블 중복 ---
      const prevOwner = seenTables.get(entity.table);
      if (prevOwner) {
        const fix: SuggestedFix = {
          type: 'fix-duplicate',
          target: `${manifest.id}.${entity.name}`,
          description: `테이블 '${entity.table}'이(가) ${prevOwner}에서 이미 사용 중`,
          patch: { file: '', newFragment: `table: '${entity.table}_${manifest.id}'` },
          autoApplicable: false,
        };
        issues.push(createIssue('manifest', 'error', 'manifest',
          '테이블 이름 충돌', `'${entity.table}' in ${manifest.id} vs ${prevOwner}`,
          { manifestId: manifest.id, entityName: entity.name },
          fix,
        ));
      } else {
        seenTables.set(entity.table, manifest.id);
      }

      // --- Fields ---
      if (!entity.fields || entity.fields.length === 0) {
        issues.push(createIssue('manifest', 'error', 'manifest',
          `필드가 없습니다: ${entity.name}`, '',
          { manifestId: manifest.id, entityName: entity.name },
        ));
        continue;
      }

      const fieldNames = new Set<string>();
      for (const field of entity.fields) {
        // 중복 필드
        if (fieldNames.has(field.name)) {
          issues.push(createIssue('manifest', 'error', 'manifest',
            `중복 필드: ${entity.name}.${field.name}`, '',
            { manifestId: manifest.id, entityName: entity.name, fieldName: field.name },
          ));
        }
        fieldNames.add(field.name);

        // 타입 검증
        if (!validFieldTypes.includes(field.type)) {
          const fix: SuggestedFix = {
            type: 'change-type',
            target: `${manifest.id}.${entity.name}.${field.name}`,
            description: `유효하지 않은 타입 '${field.type}'. 'text'로 변경 제안`,
            patch: { file: '', oldFragment: `type: '${field.type}'`, newFragment: `type: 'text'` },
            autoApplicable: false,
          };
          issues.push(createIssue('manifest', 'error', 'manifest',
            `잘못된 필드 타입: ${field.type}`, `${entity.name}.${field.name}`,
            { manifestId: manifest.id, entityName: entity.name, fieldName: field.name },
            fix,
          ));
        }
      }

      // --- Required Fields 검증 ---
      if (entity.requiredFields) {
        for (const reqField of entity.requiredFields) {
          if (!fieldNames.has(reqField)) {
            const fix: SuggestedFix = {
              type: 'add-field',
              target: `${manifest.id}.${entity.name}.${reqField}`,
              description: `필수 필드 '${reqField}'이(가) fields에 없습니다. 추가 필요`,
              patch: { file: '', newFragment: `{ name: '${reqField}', type: 'text' }` },
              autoApplicable: false,
            };
            issues.push(createIssue('manifest', 'error', 'manifest',
              `필수 필드가 fields에 없음: ${reqField}`, `${entity.name} — requiredFields에 있지만 fields에 없음`,
              { manifestId: manifest.id, entityName: entity.name, fieldName: reqField },
              fix,
            ));
          }
        }
      }

      // --- Filterable 검증 ---
      if (entity.filterable) {
        for (const filterField of entity.filterable) {
          if (!fieldNames.has(filterField)) {
            issues.push(createIssue('manifest', 'warning', 'manifest',
              `필터 필드가 fields에 없음: ${filterField}`, `${entity.name}`,
              { manifestId: manifest.id, entityName: entity.name, fieldName: filterField },
            ));
          }
        }
      }

      // --- Workflow 참조 ---
      if (entity.workflowId) {
        // workflowId가 manifest.workflowIds에 정의되어 있는지
        if (manifest.workflowIds && !manifest.workflowIds.includes(entity.workflowId)) {
          const fix: SuggestedFix = {
            type: 'add-workflow',
            target: `${manifest.id}`,
            description: `Workflow '${entity.workflowId}'을(를) manifest.workflowIds에 추가`,
            patch: { file: '', newFragment: `workflowIds: [..., '${entity.workflowId}']` },
            autoApplicable: false,
          };
          issues.push(createIssue('manifest', 'warning', 'dependency',
            `Workflow ID가 manifest에 정의되지 않음: ${entity.workflowId}`, `${entity.name}.workflowId`,
            { manifestId: manifest.id, entityName: entity.name },
            fix,
          ));
        }
      }
    }

    // --- Permission 검증 ---
    if (manifest.permissions) {
      const entityResources = new Set(manifest.entities.map((e) => e.resource ?? e.name));
      for (const perm of manifest.permissions) {
        if (!entityResources.has(perm.resource)) {
          issues.push(createIssue('manifest', 'warning', 'manifest',
            `Permission resource가 엔티티에 없음: ${perm.resource}`, '',
            { manifestId: manifest.id },
          ));
        }
      }
    } else {
      // 권한 누락
      const fix: SuggestedFix = {
        type: 'add-permission',
        target: manifest.id,
        description: `Manifest에 permissions가 없습니다. 기본 CRUD 권한 추가 제안`,
        patch: { file: '', newFragment: `permissions: [{ role: 'admin', resource: '*', actions: ['read','create','update','delete'] }]` },
        autoApplicable: true,
      };
      issues.push(createIssue('manifest', 'warning', 'manifest',
        '권한 정의 없음', `${manifest.id}에 permissions 필드가 없음`,
        { manifestId: manifest.id },
        fix,
      ));
    }
  }

  return issues;
}
