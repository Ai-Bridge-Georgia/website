// ============================================================
// Business OS — API Route: Menus
// 헌법: "API First", "SECURITY BY DEFAULT"
// GET    /api/v1/menu          → 메뉴 목록 (tenant 격리)
// POST   /api/v1/menu          → 메뉴 생성 (owner 이상)
// PATCH  /api/v1/menu/:id      → 메뉴 수정
// DELETE /api/v1/menu/:id      → 메뉴 삭제 (owner 이상)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// --- GET: 메뉴 목록 ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const limit = parseInt(searchParams.get('limit') ?? '50');

  // TODO Phase C: Supabase에서 조회
  // const supabase = getApiClient(accessToken);
  // const { data, error } = await supabase
  //   .from('menus')
  //   .select('*')
  //   .eq('tenant_id', tenantId)
  //   .order('sort_order')
  //   .limit(limit);

  return NextResponse.json({
    data: [],
    meta: { total: 0, limit, category },
    message: 'Menu API — DB 연결 대기 중 (Phase C)',
  });
}

// --- POST: 메뉴 생성 ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO Phase C:
  // 1. Permission Engine: checkPermission(policy, role, 'menu', 'create')
  // 2. Rule Engine: validate menu data
  // 3. Supabase INSERT
  // 4. Audit Engine: createAuditEntry(...)
  // 5. Event Bus: emit('menu.created')

  return NextResponse.json({
    data: { id: 'pending', ...body },
    message: 'Menu created (Phase C에서 DB 연결)',
  }, { status: 201 });
}
