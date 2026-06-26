// ============================================================
// Business OS — API Route: Orders
// 헌법: "API First", "Event First"
// GET  /api/v1/orders     → 주문 목록
// POST /api/v1/orders     → 주문 생성
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '20');

  return NextResponse.json({
    data: [],
    meta: { total: 0, limit, status },
    message: 'Orders API — DB 연결 대기 중 (Phase C)',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO Phase C:
  // 1. Rule Engine: 최소 주문 금액 / 영업 시간 검증
  // 2. Permission Engine: customer create 권한
  // 3. Supabase INSERT (status: pending)
  // 4. Workflow Engine: order pending → accepted → preparing → ready → served
  // 5. Event Bus: emit('order.created')
  //    → Notification: Slack #orders 알림

  return NextResponse.json({
    data: { id: 'pending', status: 'pending', ...body },
    message: 'Order created (Phase C에서 DB 연결)',
  }, { status: 201 });
}
