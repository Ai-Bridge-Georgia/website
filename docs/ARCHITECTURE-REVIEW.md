# Business OS — Architecture Review Briefing

> **목적**: 이 문서를 다른 AI(Claude Code, Antigravity, GPT 등)에게 전달하여 아키텍처를 점검받기 위한 전체 요약.
>
> **프로젝트**: AI Bridge Georgia — Business Operating System (소프트웨어 공장)
> **GitHub**: https://github.com/Ai-Bridge-Georgia/website
> **작성일**: 2026-06-26

---

## 1. 미션

SaaS를 만드는 것이 아니라, **SaaS를 만드는 공장(Business OS)**을 만든다.

- 80% Universal Core (재사용 가능한 핵심 부품)
- 20% Business Domain (산업별 플러그인)
- 새 고객이 오면 코딩이 아니라 **조립**으로 제품 제조

## 2. 7대 원칙 (헌법)

1. **Configuration over Customization** — 소스 코드 변경이 아닌 설정으로 해결
2. **Everything is Metadata** — 메뉴/폼/권한/리포트 전부 메타데이터
3. **Everything is an Engine** — 하드코딩 ❌, 재사용 가능한 엔진
4. **AI First** — AI는 기능이 아닌 OS의 일부
5. **API First** — 모든 기능은 API로 접근 가능
6. **Event First** — 모든 중요 액션은 도메인 이벤트 발생
7. **Security by Default** — 인증/권한/감사/암호화 기본

## 3. 기술 스택

| 계층 | 기술 | 비고 |
|---|---|---|
| Frontend | Next.js 15 + Tailwind CSS 4 | 사장님 취향 반영 |
| Backend | Supabase (PostgreSQL + RLS) | Multi-tenant |
| Monorepo | npm workspace + Turborepo | 빌드 캐싱 |
| Events (실시간) | Supabase Realtime | UI 소켓 |
| Events (비동기) | Inngest (예정) | 워크플로우 엔진 |
| Hosting | Vercel | CDN + 자동 HTTPS |
| Validation | Zod (예정) | JSON Schema |

## 4. Monorepo 구조

```
Ai-Bridge-Georgia/website/
├── packages/
│   ├── core/                    ← Universal Core (80%)
│   │   ├── index.ts             (8개 타입 정의)
│   │   ├── plugin-types.ts      (Plugin 인터페이스 + DI 패턴)
│   │   ├── supabase.ts          (export)
│   │   └── migrations/
│   │       └── 001_core_tables.sql  (8개 테이블 + RLS + 트리거)
│   ├── ui/                      ← 공유 UI (사장님 취향)
│   │   ├── tokens.ts            (Design Tokens — 제1계층 고정)
│   │   ├── Button.tsx           (사각 8-12px, 원형 ❌)
│   │   ├── Layout.tsx           (7섹션 구조, 96px 여백)
│   │   └── index.tsx
│   └── config/                  ← 템플릿 시스템
│       └── index.ts             (restaurant/hotel/saas 템플릿)
├── apps/
│   └── aibridgegeorgia/         ← 첫 제품
│       ├── app/                 (Next.js App Router)
│       ├── next.config.js
│       └── package.json
├── docs/                        ← 설계 문서 (8개)
├── .claude/skills/              ← 15개 Claude Skills
├── AGENTS.md                    ← 개발 헌법
├── turbo.json                   ← 빌드 캐싱 설정
├── pnpm-workspace.yaml          ← workspace 정의
└── package.json                 ← npm workspace 루트
```

## 5. DB 스키마 (8개 핵심 테이블)

### 테이블 목록

| # | 테이블 | 용도 | 주요 컬럼 |
|---|---|---|---|
| 1 | `tenants` | 멀티테넌트 루트 | id, slug, industry, plan, settings(JSONB) |
| 2 | `users` | 글로벌 사용자 | id, email, name |
| 3 | `tenant_users` | 테넌트-사용자 매핑 | tenant_id, user_id, role_id |
| 4 | `roles` | 역할 (RBAC) | tenant_id, name, level(0/10/50/100) |
| 5 | `permissions` | 권한 | role_id, resource, action |
| 6 | `metadata` | 동적 메타데이터 | tenant_id, entity_type, entity_id, key, value(JSONB) |
| 7 | `events` | 이벤트 버스 | tenant_id, event_type, payload(JSONB) |
| 8 | `audit_logs` | 감사 로그 | tenant_id, user_id, action, old/new_value(JSONB) |
| + | `notifications` | 알림 | tenant_id, type, status |
| + | `configurations` | 테넌트 설정 | tenant_id, category, key, value(JSONB) |

### RLS 정책

- 모든 테이블에 `current_tenant_id()` 함수로 테넌트 격리
- `auth.uid()` → `tenant_users` → `tenant_id` 추출
- 정책: `USING (tenant_id = current_tenant_id())`

### 인덱스

- `tenants.slug` (UNIQUE)
- `tenant_users(tenant_id)`, `tenant_users(user_id)`
- `metadata(tenant_id, entity_type, entity_id)`
- `events(tenant_id, event_type, created_at DESC)`
- `audit_logs(tenant_id, created_at DESC)`

## 6. Plugin 시스템 (TypeScript 인터페이스 + DI)

```typescript
interface DomainPlugin {
  id: string;           // 'restaurant' | 'hotel' | 'saas'
  name: string;
  version: string;
  industry: string;
  modules: PluginModule[];
}

interface PluginModule {
  id: string;           // 'menu' | 'reservation' | 'orders'
  routes?: RouteDefinition[];
  api?: ApiEndpoint[];
  components?: Record<string, ComponentType>;
  schema?: TableSchema[];
}

// Registry (싱글톤)
class PluginRegistry {
  register(plugin: DomainPlugin): void;
  get(id: string): DomainPlugin | undefined;
  loadForConfig(config: { plugins: string[] }): DomainPlugin[];
}
```

## 7. Design Tokens (제1계층 고정)

| 토큰 | 값 | 비고 |
|---|---|---|
| spacing | 4/8/16/24/32/48/64/96px | 8px 기반 |
| radius.button | 8px (sm/md), 12px (lg) | 원형 ❌ |
| radius.card | 12px | |
| font.sans | Pretendard, Inter, SF Pro | 뻔한 것 ❌ |
| layout.maxWidth | 1200px | |
| layout.sectionGap | 96px | 사장님: 여백 |
| layout.lineHeight | 1.6 | |
| image.format | WebP | JPG/PNG ❌ |
| logo.format | SVG | PNG/JPG ❌ |

### AI 뻔한 디자인 금지
- ❌ gradient-text, ai-palette, glassmorphism 남용
- ❌ 원형 버튼
- ❌ "Boost your productivity" 카피

## 8. 3계층 스킨 시스템

| 계층 | 내용 | 변경 |
|---|---|---|
| **제1계층** (고정) | 8px 간격, 사각 버튼, 7섹션, Lighthouse 90+, WebP/SVG | ❌ 절대 불가 |
| **제2계층** (반고정) | 식당/호텔/SaaS/이커머스 산업별 레이아웃 | 플러그인 교체 |
| **제3계층** (가변) | 컬러, 로고, 폰트, 이미지, 텍스트 | config.json |

### config.json 예시 (새 클라이언트)

```json
{
  "tenant": { "name": "18 NARI", "industry": "restaurant" },
  "theme": { "primaryColor": "#003478", "font": "Pretendard" },
  "plugins": ["restaurant"],
  "modules": ["menu", "reservation"]
}
```

→ 이 JSON 하나로 새 사이트 제조.

## 9. 점검 요청 항목

다음 항목에 대해 리뷰 요청:

1. **DB 스키마**: 8개 테이블 구조가 Multi-tenant SaaS에 적합한가?
2. **RLS 정책**: `current_tenant_id()` 접근 방식의 보안성/성능
3. **Plugin 인터페이스**: DI 패턴이 확장 가능한가?
4. **Design Tokens**: 제1계층 고정값이 $10k 수준에 적합한가?
5. **Monorepo**: npm workspace + Turborepo 구조가 올바른가?
6. **확장성**: 1 → 10,000 테넌트 확장 시 병목 지점은?
7. **Event Bus**: Supabase Realtime + Inngest 하이브리드가 적절한가?

---

## 참조

- 헌법: `_shared/business-os-constitution.md`
- 아키텍처 결정: `_shared/architecture-decisions.md`
- 블루프린트: `_shared/blueprint-core-db.md`, `blueprint-monorepo-ui.md`, `blueprint-skin-system.md`
- AGENTS.md: `/opt/data/website/AGENTS.md`
