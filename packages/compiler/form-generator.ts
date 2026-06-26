// ============================================================
// Factory Compiler — Form Metadata Generator
// Input:  EntitySchemaMeta[]
// Output: FormSchema[] (Form Engine이 렌더링)
//
// 매니페스트만 있으면 폼이 자동 생성됨.
// 코딩 없이 폼 추가.
// ============================================================

import type { EntitySchemaMeta, FieldSchemaMeta, PluginManifest } from '../core/boundary';

// --- 필드 타입 → 폼 필드 타입 ---
function toFormField(field: FieldSchemaMeta): {
  name: string; label: string; type: string; required?: boolean;
  placeholder?: string; width?: string;
} {
  const isRequired = !field.nullable && field.name !== 'id' && !field.name.endsWith('_id');

  let formType = 'text';
  switch (field.type) {
    case 'numeric': formType = 'number'; break;
    case 'boolean': formType = 'checkbox'; break;
    case 'timestamptz': formType = 'datetime'; break;
    case 'date': formType = 'date'; break;
    case 'jsonb': formType = 'textarea'; break;
    case 'uuid':
      formType = field.references ? 'select' : 'hidden';
      break;
  }

  return {
    name: field.name,
    label: field.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    type: formType,
    required: isRequired || undefined,
    width: 'full',
  };
}

// --- 엔티티 → 폼 스키마 ---
export function generateFormSchema(entity: EntitySchemaMeta): object {
  // id/tenant_id/created_at/updated_at 제외
  const userFields = entity.fields.filter(
    (f) => !['id', 'tenant_id', 'created_at', 'updated_at'].includes(f.name),
  );

  return {
    id: `${entity.name}-form`,
    title: `${entity.label} ${entity.requiredFields?.length ? '등록' : '조회'}`,
    fields: userFields.map(toFormField),
    submit: {
      label: '저장',
      method: 'POST' as const,
      endpoint: `/api/v1/${entity.name}`,
      onSuccess: 'message' as const,
      successMessage: `${entity.label}이(가) 저장되었습니다`,
    },
    layout: { columns: 2, gap: 'md' as const },
  };
}

// --- 전체 폼 메타데이터 생성 ---
export function generateAllForms(manifests: PluginManifest[]): string {
  const forms: object[] = [];
  for (const manifest of manifests) {
    for (const entity of manifest.entities) {
      forms.push(generateFormSchema(entity));
    }
  }
  return JSON.stringify(forms, null, 2);
}
