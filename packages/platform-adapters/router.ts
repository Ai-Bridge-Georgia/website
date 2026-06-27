// ============================================================
// Platform Router — Manifest의 platform에 따라 Adapter 선택
// Business Grammar는 이 Router만 안다.
// ============================================================

import type { PlatformAdapter } from './interface';
import { webAdapter } from './web/adapter';
import { androidAdapter } from './android/adapter';
import { iosAdapter } from './ios/adapter';

const adapters: Record<string, PlatformAdapter> = {
  web: webAdapter,
  android: androidAdapter,
  ios: iosAdapter,
  // flutter: flutterAdapter,   // 미래
  // 'react-native': rnAdapter, // 미래
  // desktop: desktopAdapter,   // 미래
  // kiosk: kioskAdapter,       // 미래
};

export function getAdapter(platform: string): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: "${platform}". Available: ${Object.keys(adapters).join(', ')}`);
  }
  return adapter;
}

export function getAvailablePlatforms(): string[] {
  return Object.keys(adapters);
}
