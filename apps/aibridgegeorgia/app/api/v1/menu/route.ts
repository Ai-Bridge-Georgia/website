import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// GET /api/v1/menu → Supabase에서 실제 메뉴 조회
// POST /api/v1/menu → 메뉴 생성
// ============================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// --- GET: 메뉴 목록 ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  const supabase = getSupabase();

  let query = supabase
    .from('menus')
    .select('*')
    .order('sort_order')
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: data ?? [],
    meta: { total: count ?? data?.length ?? 0, limit, category },
  });
}

// --- POST: 메뉴 생성 ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 필수 필드 검증
  if (!body.name || !body.category || body.price === undefined) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'name, category, price는 필수입니다' } },
      { status: 400 },
    );
  }

  const supabase = getSupabase();

  // TODO: tenant_id를 요청에서 추출 (Phase D: 인증 미들웨어)
  // 임시: 첫 번째 테넌트 사용
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

  const { data, error } = await supabase
    .from('menus')
    .insert({
      tenant_id: tenant.id,
      category: body.category,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      image_url: body.image_url ?? null,
      is_available: body.is_available ?? true,
      sort_order: body.sort_order ?? 999,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}
