// ============================================================
// Business OS — Supabase Client
// 헌법: "SECURITY BY DEFAULT", "API First"
// Multi-tenant + RLS 지원
// ============================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- 환경변수 ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ?? ''; // 서버 전용

// --- 클라이언트 (브라우저 — RLS 적용) ---
let browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return browserClient;
}

// --- 클라이언트 (서버 — Service Role, RLS 바이패스) ---
let serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (!serverClient) {
    if (!SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_SERVICE_KEY가 설정되지 않았습니다');
    }
    serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverClient;
}

// --- 클라이언트 (API 라우트 — 요청별 사용자 컨텍스트) ---
export function getApiClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// --- 테이블 이름 상수 ---
export const TABLES = {
  TENANTS: 'tenants',
  USERS: 'users',
  TENANT_USERS: 'tenant_users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  METADATA: 'metadata',
  EVENTS: 'events',
  AUDIT_LOGS: 'audit_logs',
  NOTIFICATIONS: 'notifications',
  CONFIGURATIONS: 'configurations',
  // Restaurant Plugin
  MENUS: 'menus',
  RESERVATIONS: 'reservations',
  ORDERS: 'orders',
} as const;

// --- 헬스체크 ---
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  url: string;
  error?: string;
}> {
  try {
    const client = getServerClient();
    const { error } = await client
      .from(TABLES.TENANTS)
      .select('id')
      .limit(1);

    return {
      connected: !error,
      url: SUPABASE_URL,
      error: error?.message,
    };
  } catch (err) {
    return {
      connected: false,
      url: SUPABASE_URL,
      error: err instanceof Error ? err.message : '연결 실패',
    };
  }
}
