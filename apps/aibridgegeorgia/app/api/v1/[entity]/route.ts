// ============================================================
// Business OS — Dynamic API Route (조립라인 입구)
// /api/v1/[entity] → 제네릭 CRUD 핸들러로 자동 분배
//
// 새 엔티티 추가 시: 이 파일 수정 ❌
// entity-registry.ts 에 등록만 하면 자동으로 API 생성됨
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleRead, handleCreate } from '@aibg/core/handler';
import { ensureInitialized } from '../../../../lib/bootstrap';

// Factory 초기화 (첫 API 호출 시 1회 실행)
ensureInitialized();

// --- GET /api/v1/[entity] → 목록 조회 ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;

  const result = await handleRead(entity, {
    headers: Object.fromEntries(request.headers),
    searchParams: new URL(request.url).searchParams,
  });

  return NextResponse.json(result.body, { status: result.status });
}

// --- POST /api/v1/[entity] → 생성 ---
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  const { entity } = await params;
  const body = await request.json();

  const result = await handleCreate(entity, {
    headers: Object.fromEntries(request.headers),
    searchParams: new URL(request.url).searchParams,
    body,
  });

  return NextResponse.json(result.body, { status: result.status });
}
