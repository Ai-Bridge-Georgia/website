import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// GET  /api/v1/orders → 주문 목록
// POST /api/v1/orders → 주문 생성 + Slack 알림
// ============================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// --- GET: 주문 목록 ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  const supabase = getSupabase();

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
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

// --- POST: 주문 생성 ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'items 배열이 필요합니다' } },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // 테넌트
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

  // 총액 계산 (메뉴 가격 × 수량)
  const menuIds = body.items.map((item: { menu_id?: string; name?: string }) => item.menu_id).filter(Boolean);
  let total = 0;

  if (menuIds.length > 0) {
    const { data: menus } = await supabase
      .from('menus')
      .select('id, price')
      .in('id', menuIds);

    if (menus) {
      total = body.items.reduce((sum: number, item: { menu_id?: string; quantity?: number }) => {
        const menu = menus.find((m: { id: string }) => m.id === item.menu_id);
        return sum + (menu ? menu.price * (item.quantity ?? 1) : 0);
      }, 0);
    }
  }

  // INSERT
  const { data, error } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenant.id,
      order_type: body.order_type ?? 'dine_in',
      status: 'pending',
      total,
      items: body.items,
      customer_info: body.customer_info ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  // Slack 알림
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
              text: `*🛎️ 새 주문 #${data.id.slice(0, 8)}*\n${data.order_type} — ${total} ₾ — ${body.items.length}개 메뉴`,
            },
          }],
        }),
      });
    } catch {
      // 조용히
    }
  }

  // 감사 로그
  await supabase.from('audit_logs').insert({
    tenant_id: tenant.id,
    action: 'create',
    resource: 'orders',
    resource_id: data.id,
    new_value: { total, order_type: data.order_type },
  });

  return NextResponse.json({ data }, { status: 201 });
}
