// ============================================================
// Factory Bootstrap — 앱 시작 시 1회 실행
// Supabase Adapter 초기화 + Restaurant Plugin 등록
// ============================================================

import { initializeFactory } from '@aibg/core/handler';
import { SupabaseEntityStore, SupabaseTenantResolver } from '../../../packages/adapters/supabase';
import '../../../packages/plugins/restaurant'; // side-effect: registerEntity() 호출

let initialized = false;

export function ensureInitialized() {
  if (initialized) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceKey) {
    console.error('Factory Bootstrap: Missing Supabase env vars');
    return;
  }

  const entityStore = new SupabaseEntityStore(url, serviceKey);
  const tenantResolver = new SupabaseTenantResolver(url, serviceKey);

  initializeFactory({
    entityStore,
    tenantResolver,
    policyProvider: {
      getPermissionPolicy: () => ({
        rules: [
          { role: 'admin', resource: '*', actions: ['*'] },
          { role: 'admin', resource: 'menu', actions: ['read', 'create', 'update', 'delete'] },
          { role: 'admin', resource: 'reservations', actions: ['read', 'create', 'update', 'delete'] },
          { role: 'admin', resource: 'orders', actions: ['read', 'create', 'update', 'delete'] },
          { role: 'staff', resource: 'menu', actions: ['read', 'create'] },
          { role: 'staff', resource: 'reservations', actions: ['read', 'create'] },
          { role: 'customer', resource: 'menu', actions: ['read'] },
          { role: 'customer', resource: 'reservations', actions: ['create', 'read'] },
        ],
      }),
      getBusinessRules: () => [],
    },
  });

  initialized = true;
}
