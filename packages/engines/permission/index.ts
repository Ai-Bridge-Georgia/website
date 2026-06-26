// @aibg/engine-permission — Permission Engine
// 헌법: "SECURITY BY DEFAULT", "Everything is Metadata"
// 역할 기반(RBAC) + 속성 기반(ABAC) 권한 관리.

export type { ActionType, PermissionPolicy, PermissionRule, RoleDefinition } from './schema';
export { defaultRoles, restaurantPolicy, permissionMatrix } from './schema';
export {
  checkPermission, checkAll, getAccessibleResources,
  checkCondition, maskRestrictedFields,
} from './checker';
export type { PermissionCheck } from './checker';
