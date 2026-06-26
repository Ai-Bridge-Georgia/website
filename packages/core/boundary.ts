// ============================================================
// Business OS — Factory Core Boundary Specification
// CANONICAL — 이 파일은 Factory Core의 경계를 정의합니다.
// 경계 밖의 것은 절대 Core에 들어올 수 없습니다.
// ============================================================

// 허용된 Core 의존성 (전부):
// 1. TypeScript 타입 시스템
// 2. 순수 함수
// 3. Core 내부 인터페이스

// 절대 금지:
// ❌ Supabase / PostgreSQL / SQL
// ❌ Next.js / Express / Hono
// ❌ 환경변수 직접 참조
// ❌ Restaurant / Hotel / SaaS / 특정 도메인
// ❌ 외부 패키지 (react 제외 — 타입 전용)

// ============================================================
// 1. Entity Store Interface (DB 추상화)
// ============================================================

export interface IEntityStore {
  find(
    table: string,
    options: {
      tenantId: string;
      filters?: Record<string, unknown>;
      sort?: { column: string; ascending: boolean };
      pagination?: { page: number; limit: number };
    },
  ): Promise<{ data: Record<string, unknown>[]; total: number }>;

  findById(
    table: string,
    id: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null>;

  insert(
    table: string,
    data: Record<string, unknown>,
    tenantId: string,
  ): Promise<Record<string, unknown>>;

  update(
    table: string,
    id: string,
    data: Record<string, unknown>,
    tenantId: string,
  ): Promise<Record<string, unknown>>;

  delete(
    table: string,
    id: string,
    tenantId: string,
  ): Promise<void>;

  executeRaw?(sql: string): Promise<unknown>;
}

// ============================================================
// 2. Policy Provider Interface (권한/규칙 추상화)
// ============================================================

export interface IPolicyProvider {
  getPermissionPolicy(): {
    rules: { role: string; resource: string; actions: string[]; condition?: unknown }[];
  };
  getBusinessRules(): {
    id: string;
    type: string;
    conditions: unknown[];
    result: { pass: boolean; message?: string; actions?: unknown[] };
    enabled: boolean;
    priority?: number;
  }[];
}

// ============================================================
// 3. Plugin Manifest (플러그인이 자기 자신을 설명)
// ============================================================

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  industry: string;

  // 엔티티 스키마 (메타데이터 — DDL의 원천)
  entities: EntitySchemaMeta[];

  // 권한 정책
  permissions?: { role: string; resource: string; actions: string[] }[];

  // 비즈니스 규칙 ID (규칙 본체는 별도)
  ruleIds?: string[];

  // 워크플로우 ID
  workflowIds?: string[];

  // 알림 규칙 ID
  notificationRuleIds?: string[];
}

export interface EntitySchemaMeta {
  name: string;
  table: string;
  label: string;
  fields: FieldSchemaMeta[];
  defaultSort?: { column: string; ascending: boolean };
  filterable?: string[];
  requiredFields?: string[];
  resource?: string;
  workflowId?: string;
}

export interface FieldSchemaMeta {
  name: string;
  type: 'text' | 'number' | 'boolean' | 'uuid' | 'jsonb' | 'timestamptz' | 'date' | 'numeric';
  nullable?: boolean;
  default?: string;
  references?: string;
}

// ============================================================
// 4. Plugin Loader (매니페스트 → 레지스트리 자동 등록)
// ============================================================

export interface PluginLoaderConfig {
  manifests: PluginManifest[];
  // 플러그인 코드는 별도 로드 (lazy import)
}

// ============================================================
// 5. Tenant Resolver Interface
// ============================================================

export interface ITenantResolver {
  resolve(request: {
    headers?: Record<string, string | null>;
    searchParams?: URLSearchParams;
  }): Promise<{
    tenantId: string;
    slug: string;
    role: string;
    userId?: string;
  } | null>;
}

// ============================================================
// 6. Factory Core Public API
// ============================================================

export interface FactoryCore {
  entityStore: IEntityStore;
  tenantResolver: ITenantResolver;
  policyProvider: IPolicyProvider;

  // 엔티티 조회 (런타임 — 플러그인에서 등록)
  getEntity(name: string): EntitySchemaMeta | undefined;
  getEntities(): EntitySchemaMeta[];
  registerEntity(entity: EntitySchemaMeta): void;

  // 플러그인
  registerPlugin(manifest: PluginManifest): void;
  getPlugins(): PluginManifest[];

  // 이벤트 버스
  emit(event: FactoryEvent): Promise<void>;
  on(eventType: string, handler: (event: FactoryEvent) => Promise<void>): void;
}

export interface FactoryEvent {
  tenantId: string;
  eventType: string;
  entity?: string;
  entityId?: string;
  payload: Record<string, unknown>;
  version: string;
}
