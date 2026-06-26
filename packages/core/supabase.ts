// ============================================================
// Business OS — Supabase Client
// 헌법: "SECURITY BY DEFAULT — Everything is authenticated"
// 아키텍처: "Multi-tenant: Supabase RLS"
// ============================================================

export { pluginRegistry } from './plugin-types';
export type {
  DomainPlugin, PluginModule, RouteDefinition, ApiEndpoint,
  ApiRequest, ApiResponse, TableSchema, ColumnDef,
} from './plugin-types';
export type {
  Tenant, TenantUser, User, Role, Permission,
  MetadataEntry, DomainEvent, AuditLog, Notification,
  Configuration, ThemeConfig, TenantConfig,
  Industry, RoleLevel, TenantSettings,
} from './index';
