// ============================================================
// Business OS — Tenant Resolver
// 헌법: "SECURITY BY DEFAULT", "Multi-tenant: RLS"
// 요청 → tenant_id 추출 (하드코딩 제거)
// ============================================================

import { createClient } from '@supabase/supabase-js';

// --- 테넌트 캐시 (요청 간 공유 — 60초) ---
const tenantCache = new Map<string, { id: string; expires: number }>();

// --- Supabase 클라이언트 ---
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// --- 테넌트 리졸버 ---
// Phase 1: X-Tenant-Slug 헤더 또는 ?tenant= 쿼리에서 추출
// Phase 2: JWT 토큰에서 추출
export interface TenantContext {
  tenantId: string;
  slug: string;
  role: string;
  userId?: string;
}

export async function resolveTenant(request: {
  headers?: Record<string, string | null>;
  searchParams?: URLSearchParams;
}): Promise<TenantContext | null> {
  // 1. 헤더에서 slug 추출
  const slug =
    request.headers?.['x-tenant-slug'] ??
    request.searchParams?.get('tenant') ??
    'aibg'; // 기본값 (Phase 1)

  // 2. 캐시 확인
  const cached = tenantCache.get(slug);
  if (cached && cached.expires > Date.now()) {
    return {
      tenantId: cached.id,
      slug,
      role: 'admin', // Phase 2: JWT에서 추출
    };
  }

  // 3. DB에서 tenant_id 조회
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  // 4. 캐시 저장 (60초)
  tenantCache.set(slug, {
    id: data.id,
    expires: Date.now() + 60_000,
  });

  return {
    tenantId: data.id,
    slug,
    role: 'admin', // Phase 2: 실제 인증
  };
}
