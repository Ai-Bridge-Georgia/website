// ============================================================
// Business OS — Dynamic API Route (개별 항목)
// /api/v1/[entity]/[id] → 수정 / 삭제
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate, handleDelete } from '@aibg/core/handler';
import { ensureInitialized } from '../../../../../lib/bootstrap';

ensureInitialized();

// --- PATCH /api/v1/[entity]/[id] → 수정 ---
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity, id } = await params;
  const body = await request.json();

  const result = await handleUpdate(entity, id, {
    headers: Object.fromEntries(request.headers),
    searchParams: new URL(request.url).searchParams,
    body,
  });

  return NextResponse.json(result.body, { status: result.status });
}

// --- DELETE /api/v1/[entity]/[id] → 삭제 ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string; id: string }> },
) {
  const { entity, id } = await params;

  const result = await handleDelete(entity, id, {
    headers: Object.fromEntries(request.headers),
    searchParams: new URL(request.url).searchParams,
  });

  return NextResponse.json(result.body, { status: result.status });
}
