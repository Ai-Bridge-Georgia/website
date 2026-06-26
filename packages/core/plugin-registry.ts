// ============================================================
// Business OS — Plugin Registry v2 (Build-time Registration)
// agy 권고: "서버리스 환경에서 메모리 싱글톤이 리셋됨"
// 해결책: 모든 플러그인을 빌드타임에 Next.js config로 등록
// ============================================================

import type { DomainPlugin } from './plugin-types';

// 모든 플러그인을 정적으로 import (빌드타임에 번들에 포함)
import { restaurantPlugin } from '../plugins/restaurant';
import { hotelPlugin } from '../plugins/hotel';
import { saasPlugin } from '../plugins/saas';

// --- Static Registry (빌드타임에 고정) ---
const PLUGINS: Record<string, DomainPlugin> = {
  [restaurantPlugin.id]: restaurantPlugin,
  [hotelPlugin.id]: hotelPlugin,
  [saasPlugin.id]: saasPlugin,
};

// --- API (불변, 서버리스 안전) ---
export function getPlugin(id: string): DomainPlugin | undefined {
  return PLUGINS[id];
}

export function loadPlugins(plugins: string[]): DomainPlugin[] {
  return plugins
    .map(id => PLUGINS[id])
    .filter((p): p is DomainPlugin => p !== undefined);
}

export function listPlugins(): DomainPlugin[] {
  return Object.values(PLUGINS);
}

// --- 향후: DB 기반 동적 플러그인 (Phase 3+) ---
// 마켓플레이스가 필요할 때:
// 1. 플러그인 메타데이터를 DB에서 조회
// 2. 정적 PLUGINS 맵에서 실제 코드를 찾음
// 3. 동적 import() 로 로드 (Edge Function 호환)
