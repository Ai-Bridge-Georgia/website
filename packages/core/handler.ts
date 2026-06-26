// ============================================================
// Business OS — Generic CRUD Handler (조립라인)
// 헌법: "Everything is Metadata", "Configuration over Customization"
// 헌법: "API First", "Event First", "Security by Default"
//
// 이것이 공장의 "컨베이어 벨트"입니다.
// 모든 API 요청이 이 체인을 통과합니다:
//
// 요청 → 테넌트 리졸브 → 권한 확인 → 규칙 검증
//      → DB 작업 → 이벤트 발행 → 알림 → 감사 로그
//
// 새 엔티티 추가 시: entity-registry에 등록만 하면 끝.
// 코딩 ❌
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { resolveTenant, TenantContext } from './tenant-resolver';
import { getEntity, EntityDefinition } from './entity-registry';
import { eventBus } from './event-bus';
import { checkPermission, restaurantPolicy, defaultRoles } from '../engines/permission';
import { evaluateAllRules, defaultRules as businessRules } from '../engines/rule';

// --- API 응답 표준 ---
interface ApiResponse {
  status: number;
  body: {
    data?: unknown;
    error?: { code: string; message: string };
    meta?: Record<string, unknown>;
  };
}

// --- Supabase 클라이언트 ---
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// --- 필수 필드 검증 ---
function validateRequired(
  body: Record<string, unknown>,
  requiredFields: string[],
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter((f) => body[f] === undefined || body[f] === '');
  return { valid: missing.length === 0, missing };
}

// ============================================================
// READ (GET) — 조회
// ============================================================
export async function handleRead(
  entityName: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
  },
): Promise<ApiResponse> {
  // 1. 엔티티 조회
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}'를 찾을 수 없습니다` } } };
  }

  // 2. 테넌트 리졸브
  const ctx = await resolveTenant(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없습니다' } } };
  }

  // 3. 권한 확인 (Permission Engine)
  const perm = checkPermission(restaurantPolicy, ctx.role, entity.resource ?? entityName, 'read');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  // 4. DB 조회
  const supabase = getSupabase();
  const limit = Math.min(parseInt(request.searchParams.get('limit') ?? '50'), 200);
  const page = parseInt(request.searchParams.get('page') ?? '1');
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from(entity.table)
    .select('*', { count: 'exact' })
    .eq('tenant_id', ctx.tenantId)
    .range(from, to);

  // 정렬
  if (entity.defaultSort) {
    query = query.order(entity.defaultSort.column, { ascending: entity.defaultSort.ascending });
  }

  // 필터
  if (entity.filterable) {
    for (const field of entity.filterable) {
      const value = request.searchParams.get(field);
      if (value !== null) {
        query = query.eq(field, value);
      }
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return { status: 500, body: { error: { code: 'DB_ERROR', message: error.message } } };
  }

  return {
    status: 200,
    body: {
      data: data ?? [],
      meta: { total: count ?? 0, page, limit },
    },
  };
}

// ============================================================
// CREATE (POST) — 생성
// ============================================================
export async function handleCreate(
  entityName: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
    body: Record<string, unknown>;
  },
): Promise<ApiResponse> {
  // 1. 엔티티
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}'를 찾을 수 없습니다` } } };
  }

  // 2. 테넌트
  const ctx = await resolveTenant(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없습니다' } } };
  }

  // 3. 권한 (Permission Engine)
  const perm = checkPermission(restaurantPolicy, ctx.role, entity.resource ?? entityName, 'create');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  // 4. 필수 필드 검증
  if (entity.requiredFields) {
    const validation = validateRequired(request.body, entity.requiredFields);
    if (!validation.valid) {
      return { status: 400, body: { error: { code: 'VALIDATION', message: `필수 필드 누락: ${validation.missing.join(', ')}` } } };
    }
  }

  // 5. 비즈니스 규칙 검증 (Rule Engine)
  const ruleResult = evaluateAllRules(businessRules, {
    ...request.body,
    order_type: request.body.order_type ?? 'dine_in',
    order_total: request.body.total ?? request.body.price ?? 0,
    party_size: request.body.party_size ?? 1,
    current_time: new Date().toISOString(),
  });
  if (!ruleResult.allPassed) {
    const blocker = ruleResult.blockers[0];
    return { status: 422, body: { error: { code: 'RULE_VIOLATION', message: blocker.result.message ?? '비즈니스 규칙 위반' } } };
  }

  // 6. DB INSERT
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(entity.table)
    .insert({
      ...request.body,
      tenant_id: ctx.tenantId,
    })
    .select()
    .single();

  if (error) {
    return { status: 500, body: { error: { code: 'DB_ERROR', message: error.message } } };
  }

  // 7. 이벤트 발행 (Event Bus → Notification + Audit 자동)
  await eventBus.emit({
    tenantId: ctx.tenantId,
    eventType: `${entity.name}.created`,
    entity: entity.table,
    entityId: data.id,
    payload: { ...request.body, id: data.id },
    version: '1.0',
  });

  return { status: 201, body: { data } };
}

// ============================================================
// UPDATE (PATCH) — 수정
// ============================================================
export async function handleUpdate(
  entityName: string,
  id: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
    body: Record<string, unknown>;
  },
): Promise<ApiResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}'를 찾을 수 없습니다` } } };
  }

  const ctx = await resolveTenant(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없습니다' } } };
  }

  // 권한
  const perm = checkPermission(restaurantPolicy, ctx.role, entity.resource ?? entityName, 'update');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  // 기존 데이터 조회 (Diff용)
  const supabase = getSupabase();
  const { data: oldData } = await supabase
    .from(entity.table)
    .select('*')
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .single();

  if (!oldData) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: '데이터를 찾을 수 없습니다' } } };
  }

  // 업데이트 (필드 마스킹 적용)
  const maskedBody = perm.fieldRestrictions
    ? Object.fromEntries(Object.entries(request.body).filter(([k]) => !perm.fieldRestrictions!.includes(k)))
    : request.body;

  const { data, error } = await supabase
    .from(entity.table)
    .update(maskedBody)
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId)
    .select()
    .single();

  if (error) {
    return { status: 500, body: { error: { code: 'DB_ERROR', message: error.message } } };
  }

  // 이벤트
  await eventBus.emit({
    tenantId: ctx.tenantId,
    eventType: `${entity.name}.updated`,
    entity: entity.table,
    entityId: id,
    payload: { old: oldData, new: data },
    version: '1.0',
  });

  return { status: 200, body: { data } };
}

// ============================================================
// DELETE — 삭제
// ============================================================
export async function handleDelete(
  entityName: string,
  id: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
  },
): Promise<ApiResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}'를 찾을 수 없습니다` } } };
  }

  const ctx = await resolveTenant(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없습니다' } } };
  }

  // 권한
  const perm = checkPermission(restaurantPolicy, ctx.role, entity.resource ?? entityName, 'delete');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from(entity.table)
    .delete()
    .eq('id', id)
    .eq('tenant_id', ctx.tenantId);

  if (error) {
    return { status: 500, body: { error: { code: 'DB_ERROR', message: error.message } } };
  }

  // 이벤트
  await eventBus.emit({
    tenantId: ctx.tenantId,
    eventType: `${entity.name}.deleted`,
    entity: entity.table,
    entityId: id,
    payload: {},
    version: '1.0',
  });

  return { status: 204, body: {} };
}
