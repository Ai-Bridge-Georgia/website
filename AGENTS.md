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
