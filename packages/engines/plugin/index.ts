// ============================================================
// Plugin Engine — 플러그인 생명주기 관리
// 헌법: "Business modules must never modify the Core"
// 플러그인 코드를 직접 import하지 않음 — 매니페스트만 관리
// ============================================================

import type { PluginManifest, EntitySchemaMeta } from '../../core/boundary';

export type PluginStatus = 'registered' | 'active' | 'inactive' | 'error';

export interface PluginInstance {
  manifest: PluginManifest;
  status: PluginStatus;
  enabledFor: Set<string>;
  loadedAt: string;
}

class PluginManager {
  private plugins = new Map<string, PluginInstance>();

  register(manifest: PluginManifest): void {
    if (this.plugins.has(manifest.id)) return;
    this.plugins.set(manifest.id, {
      manifest,
      status: 'registered',
      enabledFor: new Set(),
      loadedAt: new Date().toISOString(),
    });
  }

  enable(tenantId: string, pluginId: string): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) return false;
    instance.enabledFor.add(tenantId);
    instance.status = 'active';
    return true;
  }

  disable(tenantId: string, pluginId: string): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) return false;
    instance.enabledFor.delete(tenantId);
    if (instance.enabledFor.size === 0) instance.status = 'inactive';
    return true;
  }

  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  list(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getEnabledForTenant(tenantId: string): PluginManifest[] {
    const result: PluginManifest[] = [];
    for (const instance of this.plugins.values()) {
      if (instance.enabledFor.has(tenantId)) {
        result.push(instance.manifest);
      }
    }
    return result;
  }

  getEntitiesForTenant(tenantId: string): EntitySchemaMeta[] {
    const plugins = this.getEnabledForTenant(tenantId);
    return plugins.flatMap((p) => p.entities);
  }

  getStats() {
    const all = this.list();
    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      byIndustry: all.reduce((acc, p) => {
        acc[p.manifest.industry] = (acc[p.manifest.industry] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const pluginManager = new PluginManager();

// --- 플러그인 import 시 자동 등록 ---
// (플러그인이 스스로 manifest를 export하면 loader가 등록)
// Core는 어떤 플러그인이 있는지 모름
