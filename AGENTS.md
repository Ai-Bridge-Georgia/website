# AI Bridge Georgia — Backend Development Rules

## Tech Stack
- Frontend: Next.js 15 + Tailwind CSS 4
- Backend: Hono (Node.js) / Next.js API Routes
- Database: Supabase (PostgreSQL)
- ORM: Drizzle ORM
- Auth: Supabase Auth

## Critical Rules
1. 임의로 테이블 생성 금지 — 사장님 승인 필수
2. 기존 API 수정 시 영향도 분석 필수
3. DB Schema 먼저 확인 (Supabase Dashboard or API)
4. 코드 작성 전 구현 계획 제출
5. 테스트 코드 없이 종료 금지
6. RLS (Row Level Security) 모든 테이블 필수
7. .env 의 secrets 절대 GitHub push 금지

## 🚨 사장님 친필 규칙 #1 (절대 우선)

> **"기존 데이터/코드를 먼저 확인하고, 에러 수정 시 기존 것에서 찾아라."**

### AI 가 코드를 망가뜨리는 3단계 패턴 (절대 금지)
1. ❌ 에러 발생 → 기존 코드 읽지 않음 → 새 코드 생성 → 충돌 → 더 큰 에러
2. ❌ 기존 DB 데이터 확인 안 함 → 새 테이블/컬럼 생성 → 중복 → 데이터 꼬임
3. ❌ 기존 API endpoint 확인 안 함 → 새 endpoint 생성 → 라우팅 꼬임

### 올바른 습관 (반드시 준수)
1. ✅ **먼저 읽어라** — 기존 코드/DB/API 를 무조건 먼저 확인
2. ✅ **기존 것에서 수정하라** — 새로 만들지 말고 기존 것을 고쳐라
3. ✅ **변경 전 백업하라** — git commit 으로 되돌릴 수 있게
4. ✅ **작은 단위로 수정하라** — 한 번에 여러 파일 뜯어고치지 마라

### 코드 수정 전 체크리스트 (반드시 수행)
```
[ ] 기존 관련 파일 모두 읽었는가?
[ ] 기존 DB 스키마 확인했는가?
[ ] 기존 API endpoint 확인했는가?
[ ] 기존 데이터 형식 파악했는가?
[ ] 수정 범위가 최소화되었는가?
→ 위 5개 모두 ✅ 후에만 코드 작성 허용
```

## Workflow (SOP)
1. 요구사항 분석
2. 영향도 분석
3. 수정 파일 목록 작성
4. 구현 계획 작성
5. 위험 요소 식별
6. **사장님 승인 요청** ← 승인 전 절대 코딩 ❌
7. 코드 구현
8. 테스트
9. 문서 업데이트 (OpenAPI spec)

## 회사 헌장 준수
- **Think Different**: 영혼 없는 boilerplate ❌
- **Work Simple**: 복잡한 아키텍처 ❌, 단순하고 명확하게
- **Do Better, Think More**: 표준 이하 ❌, 깊이 생각
