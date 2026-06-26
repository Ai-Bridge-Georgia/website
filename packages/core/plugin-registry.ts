// ============================================================
// Business OS — Plugin Registry (Factory Core)
// 플러그인을 import하지 않음 — 매니페스트만 등록
// ============================================================

import type { PluginManifest } from './boundary';

const manifests = new Map<string, PluginManifest>();

export function registerPlugin(manifest: PluginManifest): void {
  manifests.set(manifest.id, manifest);
}

export function getPlugin(id: string): PluginManifest | undefined {
  return manifests.get(id);
}

export function listPlugins(): PluginManifest[] {
  return Array.from(manifests.values());
}
