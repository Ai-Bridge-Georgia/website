// ============================================================
// Permission Engine — Checker
// 헌법: "SECURITY BY DEFAULT"
// role + resource + action → boolean (허용/거부)
// 모든 API 요청과 UI 렌더링 전에 검사
// ============================================================

import type {
  PermissionPolicy, PermissionRule, ActionType,
  RoleDefinition,
} from './schema';
import { defaultRoles } from './schema';

// --- 역할 레벨 ---
function getRoleLevel(role: string, roles: RoleDefinition[] = defaultRoles): number {
  const def = roles.find((r) => r.name === role);
  return def?.level ?? -1;  // 알 수 없는 역할 = 권한 없음
}

// --- 룰 매칭 ---
function findRule(
  policy: PermissionPolicy,
  role: string,
  resource: string,
  action: ActionType,
): PermissionRule | null {
  // 정확한 매칭
  const exact = policy.rules.find(
    (r) => r.role === role && r.resource === resource && r.actions.includes(action),
  );
  if (exact) return exact;

  // 상위 역할 상속 (admin > owner > staff > customer)
  // 예: staff가 'menu:read'를 가지면, owner도 자동으로 가짐
  const roleLevel = getRoleLevel(role);
  if (roleLevel > 0) {
    // 더 낮은 역할의 권한을 상속
    for (const r of defaultRoles) {
      if (r.level < roleLevel) {
        const inherited = policy.rules.find(
          (rule) => rule.role === r.name && rule.resource === resource && rule.actions.includes(action),
        );
        if (inherited) return inherited;
      }
    }
  }

  return null;
}

// --- 권한 검사 ---
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
  condition?: { field: string; operator: string; description?: string };
  fieldRestrictions?: string[];
}

export function checkPermission(
  policy: PermissionPolicy,
  role: string,
  resource: string,
  action: ActionType,
): PermissionCheck {
  const rule = findRule(policy, role, resource, action);

  if (!rule) {
    return {
      allowed: false,
      reason: `역할 '${role}'는 리소스 '${resource}'에 대해 '${action}' 권한이 없습니다`,
    };
  }

  return {
    allowed: true,
    condition: rule.condition,
    fieldRestrictions: rule.fieldRestrictions,
  };
}

// --- 다중 권한 검사 (모두 만족해야 true) ---
export function checkAll(
  policy: PermissionPolicy,
  role: string,
  checks: { resource: string; action: ActionType }[],
): boolean {
  return checks.every((c) =>
    checkPermission(policy, role, c.resource, c.action).allowed,
  );
}

// --- 사용자가 접근 가능한 리소스 목록 ---
export function getAccessibleResources(
  policy: PermissionPolicy,
  role: string,
  action: ActionType = 'read',
): string[] {
  const resources = new Set<string>();

  for (const rule of policy.rules) {
    if (rule.actions.includes(action)) {
      // 정확한 역할 매칭
      if (rule.role === role) {
        resources.add(rule.resource);
        continue;
      }
      // 상위 역할 상속
      const ruleLevel = getRoleLevel(rule.role);
      const userLevel = getRoleLevel(role);
      if (userLevel >= ruleLevel) {
        resources.add(rule.resource);
      }
    }
  }

  return Array.from(resources);
}

// --- ABAC: 속성 기반 조건 검사 ---
export function checkCondition(
  check: PermissionCheck,
  entity: Record<string, unknown>,
  userId: string,
  tenantId: string,
): boolean {
  if (!check.condition) return true;

  const { field, operator } = check.condition;

  switch (operator) {
    case 'eq_self':
      return entity[field] === userId;
    case 'eq_tenant':
      return entity['tenant_id'] === tenantId;
    case 'neq':
      return entity[field] !== userId;
    default:
      return true;
  }
}

// --- 필드 마스킹 (staff가 price 수정 불가 등) ---
export function maskRestrictedFields(
  policy: PermissionPolicy,
  role: string,
  resource: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const rule = policy.rules.find(
    (r) => r.role === role && r.resource === resource && r.actions.includes('update'),
  );

  if (!rule?.fieldRestrictions?.length) return data;

  const masked = { ...data };
  for (const field of rule.fieldRestrictions) {
    if (field in masked) {
      delete masked[field];  // 제한된 필드 제거
    }
  }

  return masked;
}
