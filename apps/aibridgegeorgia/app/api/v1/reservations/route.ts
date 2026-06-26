// ============================================================
// Business OS — API Route: Reservations
// 헌법: "API First", "Event First"
// POST /api/v1/reservations → 예약 생성
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// --- POST: 예약 생성 ---
export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO Phase C:
  // 1. Rule Engine: 영업시간 / 최대 인원 검증
  // 2. Permission Engine: customer create 권한 확인
  // 3. Supabase INSERT (status: pending)
  // 4. Workflow Engine: reservation pending 상태 진입
  //    → onEnter: eventBus.emit('reservation.created')
  //    → Notification: Slack 알림
  //    → Audit: 감사 로그

  return NextResponse.json({
    data: {
      id: 'pending',
      status: 'pending',
      ...body,
    },
    message: 'Reservation created (Phase C에서 DB 연결)',
  }, { status: 201 });
}

// --- GET: 예약 목록 ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const date = searchParams.get('date');

  return NextResponse.json({
    data: [],
    meta: { total: 0, status, date },
    message: 'Reservations API — DB 연결 대기 중 (Phase C)',
  });
}
