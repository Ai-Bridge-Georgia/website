# Database Rules — Supabase (PostgreSQL)

## 절대 규칙
1. RLS (Row Level Security) 없는 테이블 생성 금지
2. Service Role Key 프론트엔드 노출 금지
3. Migration 없이 프로덕션 DB 직접 수정 금지
4. 백업 확인: Supabase Dashboard → Database → Backups

## 테이블 명명 규칙
- 테이블: `snake_case` 복수형 (`reservations`, `menu_items`)
- 컬럼: `snake_case` (`created_at`, `user_id`)
- FK: `{table_singular}_id` (`reservation_id`)

## 필수 컬럼 (모든 테이블)
- `id` (uuid, default gen_random_uuid())
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, trigger 로 자동 갱신)

## 인덱스
- FK 컬럼에 자동 인덱스 ❌ → 수동 생성 필수
- 자주 조회되는 컬럼에 인덱스
- `EXPLAIN ANALYZE` 로 성능 확인
