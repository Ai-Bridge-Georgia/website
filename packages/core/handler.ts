// ============================================================
// Business OS — Factory Core Handler
// 헌법: "The goal is Factory Independence"
//
// 이 파일은 Factory Core의 유일한 진입점입니다.
// 오직 interface만 사용합니다.
// Supabase / PostgreSQL / SQL / Next.js / 환경변수 / 도메인 — 전부 ❌
// ============================================================

import type {
  IEntityStore,
  ITenantResolver,
  IPolicyProvider,
  EntitySchemaMeta,
  FactoryEvent,
} from './boundary';
import { eventBus } from './event-bus';

// --- 의존성 주입 (외부에서 주입 — Core는 생성하지 않음) ---
let entityStore: IEntityStore | null = null;
let tenantResolver: ITenantResolver | null = null;
let policyProvider: IPolicyProvider | null = null;

// --- 엔티티 레지스트리 (플러그인이 등록) ---
const entityRegistry = new Map<string, EntitySchemaMeta>();

export function registerEntity(entity: EntitySchemaMeta): void {
  entityRegistry.set(entity.name, entity);
}

export function getEntity(name: string): EntitySchemaMeta | undefined {
  return entityRegistry.get(name);
}

export function listEntities(): EntitySchemaMeta[] {
  return Array.from(entityRegistry.values());
}

// --- 팩토리 초기화 (앱 부팅 시 1회 호출) ---
export function initializeFactory(deps: {
  entityStore: IEntityStore;
  tenantResolver: ITenantResolver;
  policyProvider: IPolicyProvider;
}): void {
  entityStore = deps.entityStore;
  tenantResolver = deps.tenantResolver;
  policyProvider = deps.policyProvider;
}

// --- 권한 확인 (Core는 정책 내용을 모름) ---
function checkPermission(
  role: string,
  resource: string,
  action: string,
): { allowed: boolean; reason?: string; fieldRestrictions?: string[] } {
  if (!policyProvider) return { allowed: true }; // 정책 없으면 통과 (개발 모드)

  const policy = policyProvider.getPermissionPolicy();
  const rule = policy.rules.find(
    (r) => r.role === role && r.resource === resource && r.actions.includes(action),
  );

  if (!rule) return { allowed: false, reason: `권한 없음: ${role}/${resource}/${action}` };
  return { allowed: true };
}

// --- 비즈니스 규칙 검증 (Core는 규칙 내용을 모름) ---
function evaluateRules(
  data: Record<string, unknown>,
): { passed: boolean; message?: string } {
  if (!policyProvider) return { passed: true };

  const rules = policyProvider.getBusinessRules();
  const sorted = [...rules].filter((r) => r.enabled).sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const rule of sorted) {
    // 룰 엔진 로직은 Rule Engine에 위임
    // Core는 "규칙이 있다면 검사하라"만 알 뿐, 내용은 모름
    // Phase: Rule Engine 인터페이스로 위임
  }

  return { passed: true };
}

// ============================================================
// API 응답 표준
// ============================================================
interface FactoryResponse {
  status: number;
  body: {
    data?: unknown;
    error?: { code: string; message: string };
    meta?: Record<string, unknown>;
  };
}

function ensureDeps(): boolean {
  return entityStore !== null && tenantResolver !== null;
}

// ============================================================
// READ
// ============================================================
export async function handleRead(
  entityName: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
  },
): Promise<FactoryResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}' 없음` } } };
  }

  if (!ensureDeps()) {
    return { status: 500, body: { error: { code: 'FACTORY_NOT_INITIALIZED', message: 'initializeFactory() 먼저 호출' } } };
  }

  const ctx = await tenantResolver!.resolve(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없음' } } };
  }

  const perm = checkPermission(ctx.role, entity.resource ?? entityName, 'read');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  const limit = Math.min(parseInt(request.searchParams.get('limit') ?? '50'), 200);
  const page = parseInt(request.searchParams.get('page') ?? '1');

  const filters: Record<string, unknown> = {};
  if (entity.filterable) {
    for (const field of entity.filterable) {
      const value = request.searchParams.get(field);
      if (value !== null) filters[field] = value;
    }
  }

  const result = await entityStore!.find(entity.table, {
    tenantId: ctx.tenantId,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
    sort: entity.defaultSort,
    pagination: { page, limit },
  });

  return {
    status: 200,
    body: {
      data: result.data,
      meta: { total: result.total, page, limit },
    },
  };
}

// ============================================================
// CREATE
// ============================================================
export async function handleCreate(
  entityName: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
    body: Record<string, unknown>;
  },
): Promise<FactoryResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}' 없음` } } };
  }

  if (!ensureDeps()) {
    return { status: 500, body: { error: { code: 'FACTORY_NOT_INITIALIZED', message: 'initializeFactory() 먼저 호출' } } };
  }

  const ctx = await tenantResolver!.resolve(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없음' } } };
  }

  // 권한
  const perm = checkPermission(ctx.role, entity.resource ?? entityName, 'create');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  // 필수 필드
  if (entity.requiredFields) {
    const missing = entity.requiredFields.filter(
      (f) => request.body[f] === undefined || request.body[f] === '',
    );
    if (missing.length > 0) {
      return { status: 400, body: { error: { code: 'VALIDATION', message: `필수 필드 누락: ${missing.join(', ')}` } } };
    }
  }

  // 비즈니스 규칙
  const ruleResult = evaluateRules(request.body);
  if (!ruleResult.passed) {
    return { status: 422, body: { error: { code: 'RULE_VIOLATION', message: ruleResult.message ?? '규칙 위반' } } };
  }

  // DB (인터페이스만)
  const data = await entityStore!.insert(entity.table, request.body, ctx.tenantId);

  // 이벤트 (Event Bus — 순수 TS)
  await eventBus.emit({
    tenantId: ctx.tenantId,
    eventType: `${entity.name}.created`,
    entity: entity.table,
    entityId: data.id as string,
    payload: request.body,
    version: '1.0',
  });

  return { status: 201, body: { data } };
}

// ============================================================
// UPDATE
// ============================================================
export async function handleUpdate(
  entityName: string,
  id: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
    body: Record<string, unknown>;
  },
): Promise<FactoryResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}' 없음` } } };
  }

  if (!ensureDeps()) {
    return { status: 500, body: { error: { code: 'FACTORY_NOT_INITIALIZED', message: 'initializeFactory() 먼저 호출' } } };
  }

  const ctx = await tenantResolver!.resolve(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없음' } } };
  }

  const perm = checkPermission(ctx.role, entity.resource ?? entityName, 'update');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  const data = await entityStore!.update(entity.table, id, request.body, ctx.tenantId);

  await eventBus.emit({
    tenantId: ctx.tenantId,
    eventType: `${entity.name}.updated`,
    entity: entity.table,
    entityId: id,
    payload: request.body,
    version: '1.0',
  });

  return { status: 200, body: { data } };
}

// ============================================================
// DELETE
// ============================================================
export async function handleDelete(
  entityName: string,
  id: string,
  request: {
    headers?: Record<string, string | null>;
    searchParams: URLSearchParams;
  },
): Promise<FactoryResponse> {
  const entity = getEntity(entityName);
  if (!entity) {
    return { status: 404, body: { error: { code: 'NOT_FOUND', message: `엔티티 '${entityName}' 없음` } } };
  }

  if (!ensureDeps()) {
    return { status: 500, body: { error: { code: 'FACTORY_NOT_INITIALIZED', message: 'initializeFactory() 먼저 호출' } } };
  }

  const ctx = await tenantResolver!.resolve(request);
  if (!ctx) {
    return { status: 403, body: { error: { code: 'TENANT_ERROR', message: '테넌트를 찾을 수 없음' } } };
  }

  const perm = checkPermission(ctx.role, entity.resource ?? entityName, 'delete');
  if (!perm.allowed) {
    return { status: 403, body: { error: { code: 'FORBIDDEN', message: perm.reason ?? '권한 없음' } } };
  }

  await entityStore!.delete(entity.table, id, ctx.tenantId);

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
