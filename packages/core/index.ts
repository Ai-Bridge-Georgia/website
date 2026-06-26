// ============================================================
// Business OS — Universal Core Types
// 사장님 헌법: "80% Universal Core / 20% Business Domain"
// ============================================================

// --- Tenant ---
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  industry: Industry;
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'closed';
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export type Industry = 'restaurant' | 'hotel' | 'saas' | 'retail' | 'education' | 'healthcare';

export interface TenantSettings {
  languages: string[];
  currency: string;
  timezone: string;
}

// --- User ---
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  roleId: string;
  status: 'active' | 'invited' | 'suspended';
  createdAt: string;
}

// --- RBAC ---
export type RoleLevel = 0 | 10 | 50 | 100; // customer / staff / owner / admin

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  level: RoleLevel;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  roleId: string;
  resource: string;
  action: 'read' | 'create' | 'update' | 'delete';
}

// --- Metadata ---
export interface MetadataEntry {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  key: string;
  value: unknown;
}

// --- Events ---
export interface DomainEvent {
  id: string;
  tenantId: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

// --- Audit ---
export interface AuditLog {
  id: string;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// --- Notifications ---
export interface Notification {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'email' | 'slack' | 'push' | 'in_app';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'read' | 'failed';
  createdAt: string;
}

// --- Configurations ---
export interface Configuration {
  id: string;
  tenantId: string;
  category: 'theme' | 'modules' | 'features' | 'billing';
  key: string;
  value: unknown;
  updatedAt: string;
}

// --- Theme Config (제3계층 스킨) ---
export interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  font: 'Pretendard' | 'Inter' | 'SF Pro';
  logoLight: string;  // SVG 경로
  logoDark: string;   // SVG 경로
}

// --- Tenant Config (config.json) ---
export interface TenantConfig {
  tenant: {
    name: string;
    slug: string;
    domain?: string;
    industry: Industry;
  };
  theme: ThemeConfig;
  plugins: string[];
  modules: string[];
  features: Record<string, boolean | string[]>;
}
