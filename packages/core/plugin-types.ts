// ============================================================
// Business OS — Plugin System Interface
// 헌법: "Business modules must never modify the Core"
// 아키텍처: "인터페이스 + DI 패턴"
// ============================================================

import type { ComponentType } from 'react';

// --- Plugin Definition ---
export interface DomainPlugin {
  id: string;                     // plugin ID
  name: string;
  version: string;
  industry: string;
  modules: PluginModule[];
}

export interface PluginModule {
  id: string;                     // module ID
  name: string;
  routes?: RouteDefinition[];
  api?: ApiEndpoint[];
  components?: Record<string, ComponentType<any>>;
  schema?: TableSchema[];
}

export interface RouteDefinition {
  path: string;
  component: ComponentType<any>;
  authRequired?: boolean;
  role?: string;
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  handler: (req: ApiRequest) => Promise<ApiResponse>;
}

export interface ApiRequest {
  tenantId: string;
  userId?: string;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
}

// --- Plugin 주의사항 (agy 권고) ---
// 서버리스(Vercel) 환경에서는 메모리 싱글톤이 리셋됨.
// Phase 2에서 Plugin Registry를 빌드타임 등록 또는 DB 기반으로 전환 예정.

export interface ApiResponse {
  status: number;
  data?: unknown;
  error?: { code: string; message: string };
}

export interface TableSchema {
  name: string;
  columns: ColumnDef[];
}

export interface ColumnDef {
  name: string;
  type: 'uuid' | 'text' | 'integer' | 'boolean' | 'jsonb' | 'timestamptz' | 'numeric';
  nullable?: boolean;
  default?: string;
  references?: string;  // 'tenants(id)'
}

// --- Plugin Registry ---
class PluginRegistry {
  private plugins = new Map<string, DomainPlugin>();

  register(plugin: DomainPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  get(id: string): DomainPlugin | undefined {
    return this.plugins.get(id);
  }

  loadForConfig(config: { plugins: string[] }): DomainPlugin[] {
    return config.plugins
      .map(id => this.plugins.get(id))
      .filter((p): p is DomainPlugin => p !== undefined);
  }

  list(): DomainPlugin[] {
    return Array.from(this.plugins.values());
  }
}

export const pluginRegistry = new PluginRegistry();
