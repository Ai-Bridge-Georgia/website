// ============================================================
// Plugin Engine — 플러그인 생명주기 관리
// 헌법: "Business modules must never modify the Core"
// 헌법: "Build reusable engines"
// 도메인 플러그인의 로드/활성화/비활성화/관리
// ============================================================

import type { DomainPlugin, PluginModule } from '../../core/plugin-types';

// --- Plugin Status ---
export type PluginStatus = 'registered' | 'active' | 'inactive' | 'error';

// --- Plugin Instance ---
export interface PluginInstance {
  definition: DomainPlugin;
  status: PluginStatus;
  enabledFor: Set<string>;        // 활성화된 테넌트 ID 목록
  version: string;
  loadedAt: string;
  error?: string;
}

// --- Plugin Manager ---
class PluginManager {
  private plugins = new Map<string, PluginInstance>();

  // --- 등록 ---
  register(plugin: DomainPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`플러그인 '${plugin.id}'가 이미 등록되어 있습니다`);
      return;
    }
    this.plugins.set(plugin.id, {
      definition: plugin,
      status: 'registered',
      enabledFor: new Set(),
      version: plugin.version,
      loadedAt: new Date().toISOString(),
    });
  }

  // --- 활성화 (테넌트별) ---
  enable(tenantId: string, pluginId: string): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      console.error(`플러그인 '${pluginId}'를 찾을 수 없습니다`);
      return false;
    }
    instance.enabledFor.add(tenantId);
    instance.status = 'active';
    return true;
  }

  // --- 비활성화 (테넌트별) ---
  disable(tenantId: string, pluginId: string): boolean {
    const instance = this.plugins.get(pluginId);
    if (!instance) return false;
    instance.enabledFor.delete(tenantId);
    if (instance.enabledFor.size === 0) {
      instance.status = 'inactive';
    }
    return true;
  }

  // --- 조회 ---
  get(pluginId: string): PluginInstance | undefined {
    return this.plugins.get(pluginId);
  }

  // --- 전체 목록 ---
  list(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  // --- 테넌트별 활성 플러그인 ---
  getEnabledForTenant(tenantId: string): DomainPlugin[] {
    const result: DomainPlugin[] = [];
    for (const instance of this.plugins.values()) {
      if (instance.enabledFor.has(tenantId)) {
        result.push(instance.definition);
      }
    }
    return result;
  }

  // --- 테넌트별 활성 모듈 ---
  getModulesForTenant(tenantId: string, moduleIds?: string[]): PluginModule[] {
    const plugins = this.getEnabledForTenant(tenantId);
    const modules: PluginModule[] = [];
    for (const plugin of plugins) {
      for (const mod of plugin.modules) {
        if (!moduleIds || moduleIds.includes(mod.id)) {
          modules.push(mod);
        }
      }
    }
    return modules;
  }

  // --- 통계 ---
  getStats() {
    const all = this.list();
    return {
      total: all.length,
      active: all.filter((p) => p.status === 'active').length,
      inactive: all.filter((p) => p.status === 'inactive').length,
      byIndustry: all.reduce((acc, p) => {
        const industry = p.definition.industry;
        acc[industry] = (acc[industry] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // --- 제거 ---
  unregister(pluginId: string): boolean {
    return this.plugins.delete(pluginId);
  }
}

// --- 싱글톤 ---
export const pluginManager = new PluginManager();

// --- 초기화: 기본 플러그인 등록 ---
import { restaurantPlugin } from '../../plugins/restaurant';
import { hotelPlugin } from '../../plugins/hotel';
import { saasPlugin } from '../../plugins/saas';

pluginManager.register(restaurantPlugin);
pluginManager.register(hotelPlugin);
pluginManager.register(saasPlugin);
