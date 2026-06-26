import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// GET /api/v1/health — 시스템 상태 + DB 연결 확인
// ============================================================

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';

  let dbStatus = 'not_configured';

  if (supabaseUrl && serviceKey) {
    try {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);

      dbStatus = error ? `error: ${error.message}` : 'connected';
    } catch {
      dbStatus = 'connection_failed';
    }
  }

  return NextResponse.json({
    status: 'ok',
    service: 'AI Bridge Georgia — Business OS',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    database: {
      url: supabaseUrl ? supabaseUrl.replace('https://', '').replace('.supabase.co', '') : 'N/A',
      status: dbStatus,
    },
    engines: [
      'form', 'dashboard', 'notification', 'workflow',
      'permission', 'rule', 'search', 'import-export',
      'audit', 'scheduling', 'report', 'ai',
      'integration', 'plugin',
    ],
  });
}
