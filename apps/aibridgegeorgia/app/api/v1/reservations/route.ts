import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// GET  /api/v1/reservations → 예약 목록 조회
// POST /api/v1/reservations → 예약 생성 + Slack 알림
// ============================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// --- GET: 예약 목록 ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const supabase = getSupabase();

  let query = supabase
    .from('reservations')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: data?.length ?? 0, limit, status },
  });
}

// --- POST: 예약 생성 + Slack 알림 ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 필수 필드 검증
  if (!body.customer_name || !body.date || !body.party_size) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'customer_name, date, party_size는 필수입니다' } },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // 테넌트 조회
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'aibg')
    .single();

  if (!tenant) {
    return NextResponse.json(
      { error: { code: 'TENANT_NOT_FOUND', message: '테넌트를 찾을 수 없습니다' } },
      { status: 404 },
    );
  }

  // DB INSERT
  const { data, error } = await supabase
    .from('reservations')
    .insert({
      tenant_id: tenant.id,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone ?? null,
      customer_email: body.customer_email ?? null,
      date: body.date,
      party_size: body.party_size,
      status: 'pending',
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  // Slack 알림 (비동기 — 실패해도 응답에 영향 ❌)
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: [
                `*📅 새 예약*`,
                `${data.customer_name} — ${data.date.slice(0, 16).replace('T', ' ')} — ${data.party_size}명`,
                body.notes ? `메모: ${body.notes}` : '',
              ].filter(Boolean).join('\n'),
            },
          }],
        }),
      });
    } catch {
      // Slack 실패는 조용히
    }
  }

  // 감사 로그 (간소화 — Phase D에서 Audit Engine으로 이동)
  await supabase.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'create',
    resource: 'reservations',
    resource_id: data.id,
    new_value: { customer_name: data.customer_name, party_size: data.party_size },
  });

  return NextResponse.json({ data }, { status: 201 });
}
