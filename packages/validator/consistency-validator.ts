// ============================================================
// Validation Intelligence — Consistency Validator
// Manifest ↔ Generated Artifacts 일치 검사 (가장 중요)
// ============================================================

import type { PluginManifest, EntitySchemaMeta } from '../core/boundary';
import type { Issue } from './types';
import { createIssue } from './types';
import type { CompilationResult } from '../compiler/index';

export function validateConsistency(
  manifests: PluginManifest[],
  artifacts: CompilationResult,
): Issue[] {
  const issues: Issue[] = [];

  // Parse artifacts
  let openapi: { paths?: Record<string, object>; components?: { schemas?: Record<string, object> } };
  let forms: object[];
  let permissions: { matrix?: Record<string, Record<string, string[]>> };

  try { openapi = JSON.parse(artifacts.openapi); } catch { return [createIssue('consistency', 'error', 'artifact', 'OpenAPI 파싱 실패', '', { artifactFile: 'openapi.json' })]; }
  try { forms = JSON.parse(artifacts.forms); } catch { return [createIssue('consistency', 'error', 'artifact', 'Forms 파싱 실패', '', { artifactFile: 'forms.json' })]; }
  try { permissions = JSON.parse(artifacts.permissions); } catch { return [createIssue('consistency', 'error', 'artifact', 'Permissions 파싱 실패', '', { artifactFile: 'permissions.json' })]; }

  for (const manifest of manifests) {
    for (const entity of manifest.entities) {
      // 1. OpenAPI schema에 엔티티가 있는가?
      if (openapi.components?.schemas && !openapi.components.schemas[entity.name]) {
        issues.push(createIssue('consistency', 'error', 'consistency',
          `OpenAPI에 엔티티 없음: ${entity.name}`, 'Schema에 정의되지 않음',
          { manifestId: manifest.id, entityName: entity.name, artifactFile: 'openapi.json' },
        ));
      }

      // 2. OpenAPI path에 엔티티가 있는가?
      const expectedPath = `/api/v1/${entity.name}`;
      if (openapi.paths && !openapi.paths[expectedPath]) {
        issues.push(createIssue('consistency', 'error', 'consistency',
          `OpenAPI에 경로 없음: ${expectedPath}`, '',
          { manifestId: manifest.id, entityName: entity.name, artifactFile: 'openapi.json' },
        ));
      }

      // 3. Form이 생성되었는가?
      const expectedFormId = `${entity.name}-form`;
      const formExists = (forms as Record<string, unknown>[]).some((f) => f.id === expectedFormId);
      if (!formExists) {
        issues.push(createIssue('consistency', 'error', 'consistency',
          `Form이 없음: ${expectedFormId}`, '',
          { manifestId: manifest.id, entityName: entity.name, artifactFile: 'forms.json' },
        ));
      }

      // 4. Permission matrix에 엔티티가 있는가?
      const resourceName = entity.resource ?? entity.name;
      if (manifest.permissions && manifest.permissions.length > 0) {
        if (permissions.matrix && !permissions.matrix[resourceName]) {
          issues.push(createIssue('consistency', 'warning', 'consistency',
            `Permission matrix에 없음: ${resourceName}`, '',
            { manifestId: manifest.id, entityName: entity.name, artifactFile: 'permissions.json' },
          ));
        }
      }

      // 5. Migration SQL에 CREATE TABLE이 있는가?
      if (!artifacts.migrations.includes(`CREATE TABLE IF NOT EXISTS ${entity.table}`)) {
        issues.push(createIssue('consistency', 'error', 'consistency',
          `Migration에 CREATE TABLE 없음: ${entity.table}`, '',
          { manifestId: manifest.id, entityName: entity.name, artifactFile: 'migration.sql' },
        ));
      }

      // 6. 필드 일치: Manifest fields vs OpenAPI schema properties
      if (openapi.components?.schemas?.[entity.name]) {
        const schemaProps = (openapi.components.schemas[entity.name] as { properties?: Record<string, unknown> }).properties ?? {};
        for (const field of entity.fields) {
          if (!schemaProps[field.name] && !['id', 'tenant_id', 'created_at', 'updated_at'].includes(field.name)) {
            issues.push(createIssue('consistency', 'warning', 'consistency',
              `필드 불일치: ${entity.name}.${field.name} (OpenAPI에 없음)`, '',
              { manifestId: manifest.id, entityName: entity.name, fieldName: field.name, artifactFile: 'openapi.json' },
            ));
          }
        }
      }
    }
  }

  return issues;
}
